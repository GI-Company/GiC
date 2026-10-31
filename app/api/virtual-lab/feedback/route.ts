import { NextRequest,NextResponse } from 'next/server';
import { SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase-public';
import { user,consumeWorkbenchQuota } from '@/lib/workbench-access';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
  if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return error('Cross-origin request rejected.',403);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return error('Expected JSON.',415);
  const me=await user(req);if(!me?.id)return error('Sign in first.',401);
  try {
    const raw=await req.text();if(raw.length>5000)return error('Feedback is too long.',413);
    const data=JSON.parse(raw) as Record<string,unknown>;
    if(!data||typeof data!=='object'||Array.isArray(data))return error('Invalid feedback.',400);
    const category=data.category,details=data.details,release=data.release_version;
    if(!['bug','installation','usability','feature'].includes(String(category)))return error('Invalid category.',400);
    if(typeof details!=='string'||details.trim().length<15||details.length>3000)return error('Enter 15–3000 characters of feedback.',400);
    if(typeof release!=='string'||release.length>80||!/^[-a-zA-Z0-9_.+]+$/.test(release))return error('Invalid release version.',400);
    const quota=await consumeWorkbenchQuota('vlab-beta-feedback:'+me.id);
    if(!quota.configured)return error('Feedback service is being configured.',503);
    if(!quota.allowed)return error('Feedback limit reached for this hour.',429);
    const token=req.headers.get('authorization')!.slice(7);
    const response=await fetch(new URL('/rest/v1/virtual_lab_beta_feedback',SUPABASE_URL),{
      method:'POST',
      headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({user_id:me.id,release_version:release,category,details:details.trim()}),
      cache:'no-store',signal:AbortSignal.timeout(7000),
    });
    if(!response.ok)return error('Feedback could not be stored. Please try again later.',503);
    return NextResponse.json({received:true},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch{return error('Feedback service unavailable.',503);}
}
