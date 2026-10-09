import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement, consumeWorkbenchQuota } from '@/lib/workbench-access';
import { evidenceBundle, validateProposal, experimentReport } from '@/lib/virtual-lab-demo';
import { runWorkbenchAgent } from '@/lib/virtual-lab-agent';
export const runtime = 'nodejs';
const headers = { 'Cache-Control':'no-store' };
const fail = (error:string,status:number) => NextResponse.json({error},{status,headers});
async function access(req:NextRequest) {
  const me=await user(req);
  if (!me?.id) return {error:fail('Sign in to access the Virtual Lab demo.',401)};
  const tier=await entitlement(me.id);
  if (!tier) return {error:fail('Subscription access could not be verified. Try again shortly.',503)};
  if (tier==='free') return {error:fail('The Virtual Lab demo requires an active Paid or Enhanced subscription.',403)};
  return {me,tier};
}
export async function GET(req:NextRequest) {
  const check=await access(req);
  if (check.error) return check.error;
  return NextResponse.json({authorized:true,tier:check.tier,provider:'groq',ai_available:Boolean(process.env.GROQ_API)},{headers});
}
export async function POST(req:NextRequest) {
  if (req.headers.get('origin') && req.headers.get('origin')!==req.nextUrl.origin) return fail('Cross-origin request rejected.',403);
  if (!req.headers.get('content-type')?.startsWith('application/json')) return fail('Expected JSON.',415);
  const check=await access(req);
  if (check.error || !check.me) return check.error!;
  try {
    const text=await req.text();
    if (text.length>24000) return fail('Request is too large.',413);
    const body=JSON.parse(text) as Record<string,unknown>;
    if (!body || typeof body!=='object' || Array.isArray(body)) return fail('Invalid request.',400);
    const protocol=validateProposal(body.protocol);
    if (body.action!=='run' && body.action!=='agent') return fail('Unsupported lab action.',400);
    const quota=await consumeWorkbenchQuota(`${body.action==='run'?'lab-run':'lab-agent'}:${check.me.id}`);
    if (!quota.configured) return fail('Lab access is being configured.',503);
    if (!quota.allowed) return fail('Lab action limit reached. Try again after the hourly reset.',429);
    if (body.action==='run') {
      const bundle=await evidenceBundle(protocol);
      return NextResponse.json({bundle,report:experimentReport(protocol,bundle.payload.runs)},{headers});
    }
    const key=process.env.GROQ_API;
    if (!key) return fail('AI assistance is not configured. You can still approve and run the reference experiment.',503);
    if (typeof body.goal!=='string' || !body.goal.trim() || body.goal.length>4000) return fail('Use an AI brief of 1–4000 characters.',400);
    try {
      const agent=await runWorkbenchAgent({goal:body.goal,context:{protocol,approved:body.approved===true},key,model:check.tier==='enhanced'?'openai/gpt-oss-120b':'openai/gpt-oss-20b',signal:req.signal});
      return NextResponse.json(agent,{headers});
    } catch { return fail('AI assistance is temporarily unavailable. Your approved protocol and outputs are unchanged.',503); }
  } catch(cause) {
    return fail(cause instanceof Error ? cause.message : 'Lab request failed.',400);
  }
}
