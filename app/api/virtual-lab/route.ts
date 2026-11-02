import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement, consumeWorkbenchQuota } from '@/lib/workbench-access';
import { vlabEntitlement, isActiveVirtualLab } from '@/lib/virtual-lab-billing';
import { evidenceBundle, validateProposal, experimentReport } from '@/lib/virtual-lab-demo';
import { validateRhoProtocol, rhoEvidence } from '@/lib/virtual-lab-rhodopsin';
import { runWorkbenchAgent } from '@/lib/virtual-lab-agent';
import { geminiModelForMode, getGeminiKey } from '@/lib/gemini-provider';
export const runtime = 'nodejs';
const headers = { 'Cache-Control':'no-store' };
const fail = (error:string,status:number) => NextResponse.json({error},{status,headers});
async function access(req:NextRequest) {
  const me=await user(req);
  if (!me?.id) return {error:fail('Sign in to access the Virtual Lab demo.',401)};
  // Preserve existing GIC Paid/Enhanced access while adding separate VirtualLab subscriptions.
  const legacyTier=await entitlement(me.id);
  // A separate active VirtualLab subscription can upgrade a legacy paid user
  // without modifying their original GIC subscription or Stripe customer.
  // Keep the legacy Enhanced AI model entitlement independently.
  try{
    const vlab=await vlabEntitlement(me.id);
    if(isActiveVirtualLab(vlab))return {
      me,tier:vlab!.tier,aiTier:legacyTier==='enhanced'?'enhanced':vlab!.tier,
    };
  }catch{
    // If the separate billing store is unavailable, existing paid users
    // retain their verified GIC access; unknown users fail closed.
    if(legacyTier!=='paid'&&legacyTier!=='enhanced')
      return {error:fail('Subscription access could not be verified. Try again shortly.',503)};
  }
  if(legacyTier==='paid'||legacyTier==='enhanced')return {me,tier:legacyTier,aiTier:legacyTier};
  if(!legacyTier)return {error:fail('Subscription access could not be verified. Try again shortly.',503)};
  return {error:fail('The VirtualLab workbench requires an active VirtualLab or qualifying existing GIC subscription.',403)};
}
export async function GET(req:NextRequest) {
  const check=await access(req);
  if (check.error) return check.error;
  return NextResponse.json({authorized:true,tier:check.tier,provider:'gemini',ai_available:Boolean(getGeminiKey())},{headers});
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
    if (body.action==='rho_run') {
      const protocol=validateRhoProtocol(body.protocol);
      const quota=await consumeWorkbenchQuota(`lab-run:${check.me.id}`);
      if (!quota.configured) return fail('Lab access is being configured.',503);
      if (!quota.allowed) return fail('Lab action limit reached. Try again after the hourly reset.',429);
      return NextResponse.json({bundle:await rhoEvidence(protocol)},{headers});
    }
    const protocol=validateProposal(body.protocol);
    if (body.action!=='run' && body.action!=='agent') return fail('Unsupported lab action.',400);
    const quota=await consumeWorkbenchQuota(`${body.action==='run'?'lab-run':'lab-agent'}:${check.me.id}`);
    if (!quota.configured) return fail('Lab access is being configured.',503);
    if (!quota.allowed) return fail('Lab action limit reached. Try again after the hourly reset.',429);
    if (body.action==='run') {
      const bundle=await evidenceBundle(protocol);
      return NextResponse.json({bundle,report:experimentReport(protocol,bundle.payload.runs)},{headers});
    }
    const key=getGeminiKey();
    if (!key) return fail('AI assistance is not configured. You can still approve and run the reference experiment.',503);
    if (typeof body.goal!=='string' || !body.goal.trim() || body.goal.length>4000) return fail('Use an AI brief of 1–4000 characters.',400);
    try {
      const agent=await runWorkbenchAgent({goal:body.goal,context:{protocol,approved:body.approved===true},key,model:geminiModelForMode(check.aiTier==='enhanced'?'enhanced':'medium'),signal:req.signal});
      return NextResponse.json(agent,{headers});
    } catch { return fail('AI assistance is temporarily unavailable. Your approved protocol and outputs are unchanged.',503); }
  } catch(cause) {
    return fail(cause instanceof Error ? cause.message : 'Lab request failed.',400);
  }
}
