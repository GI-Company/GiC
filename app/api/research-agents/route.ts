import { createHash } from 'node:crypto';
import { SUPABASE_URL } from '@/lib/supabase-public';
import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement, consumeWorkbenchQuota } from '@/lib/workbench-access';
import { getResearchAgent, type ResearchAgentTier } from '@/lib/research-agent-registry';
import { routeIntent } from '@/lib/intent-r-orchestrator';

export const runtime = 'nodejs';
const noStore = { 'Cache-Control': 'no-store' };
const error = (message:string,status:number)=>NextResponse.json({error:message},{status,headers:noStore});
type Turn = {role:'user'|'assistant';content:string};
const MAX_TURNS=12;
const MAX_BODY_BYTES=48_000;
class OversizedBodyError extends Error {}
async function readBoundedBody(req:NextRequest):Promise<string>{
 const declared=Number(req.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>MAX_BODY_BYTES)throw new OversizedBodyError();
 if(!req.body)return '';
 const reader=req.body.getReader();const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BODY_BYTES)throw new OversizedBodyError();chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
function parseTurns(value:unknown):Turn[]|null {
 if(!Array.isArray(value)||value.length<1||value.length>MAX_TURNS)return null;
 const turns:Turn[]=[];
 for(const v of value){
  if(!v||typeof v!=='object'||Array.isArray(v))return null;
  const t=v as Record<string,unknown>;
  if((t.role!=='user'&&t.role!=='assistant')||typeof t.content!=='string'||!t.content.trim()||t.content.length>4000)return null;
  turns.push({role:t.role,content:t.content});
 }
 if(turns[turns.length-1].role!=='user')return null;
 return turns;
}
async function groq(messages:Turn[],instructions:string,signal:AbortSignal){
 const key=process.env.GROQ_API;
 if(!key)throw new Error('Provider not configured');
 const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{
  method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
  body:JSON.stringify({model:process.env.GIC_GROQ_AGENT_MODEL||'openai/gpt-oss-20b',messages:[{role:'system',content:instructions},...messages],temperature:0.25,max_completion_tokens:1024}),
  cache:'no-store',signal
 });
 if(!response.ok)throw new Error('Provider unavailable');
 const result=await response.json() as {choices?:Array<{message?:{content?:string}}>};
 const answer=result.choices?.[0]?.message?.content;
 if(!answer)throw new Error('Empty provider response');
 return answer.slice(0,12000);
}
async function gemini(messages:Turn[],instructions:string,signal:AbortSignal){
 const key=process.env.GEMINI_API_KEY;
 if(!key)throw new Error('Provider not configured');
 const model=process.env.GIC_GEMINI_AGENT_MODEL||'gemini-2.5-flash';
 if(!/^[a-zA-Z0-9._-]{1,80}$/.test(model))throw new Error('Invalid model configuration');
 const contents=messages.map(t=>({role:t.role==='assistant'?'model':'user',parts:[{text:t.content}]}));
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
  method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
  body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents,generationConfig:{temperature:0.25,maxOutputTokens:1024}}),
  cache:'no-store',signal
 });
 if(!response.ok)throw new Error('Provider unavailable');
 const result=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;
 const answer=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
 if(!answer)throw new Error('Empty provider response');
 return answer.slice(0,12000);
}
export async function GET(req:NextRequest){
 const me=await user(req);if(!me?.id)return error('Sign in to use research assistants.',401);
 const tier=await entitlement(me.id);if(!tier)return error('Membership verification unavailable.',503);
 if(tier==='free')return error('Research assistants require an active Paid or Enhanced membership.',403);
 return NextResponse.json({agents:['intent_r','bitvision','plm'].map(id=>{const a=getResearchAgent(id,tier as ResearchAgentTier)!;return {id:a.id,label:a.label,description:a.description,provider:a.provider};}),externalInference:true},{headers:noStore});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return error('Cross-origin request rejected.',403);
 if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return error('Expected JSON.',415);
 const me=await user(req);if(!me?.id)return error('Sign in to use research assistants.',401);
 const tier=await entitlement(me.id);if(!tier)return error('Membership verification unavailable.',503);
 if(tier==='free')return error('Research assistants require an active Paid or Enhanced membership.',403);
 let body:Record<string,unknown>;
 try{const raw=await readBoundedBody(req);body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))return error('Invalid request.',400);}catch(cause){return cause instanceof OversizedBodyError?error('Request too large.',413):error('Invalid JSON.',400);}
 const turns=parseTurns(body.messages);if(!turns)return error('Provide 1–12 valid conversation turns ending in a user message.',400);
 const routing=routeIntent(turns[turns.length-1].content,tier as ResearchAgentTier,body.agent);
 if(!routing)return error('Unknown or unavailable research assistant.',400);
 const agent=getResearchAgent(routing.agent,tier as ResearchAgentTier)!;
 if(agent.provider==='gemini'&&!process.env.GEMINI_API_KEY)return error('Gemini is not configured.',503);
 if(agent.provider==='groq'&&!process.env.GROQ_API)return error('Groq is not configured.',503);
 const idempotencyKey=req.headers.get('idempotency-key');
 if(!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey))return error('Idempotency-Key UUID header required.',400);
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)return error('Request deduplication unavailable.',503);
 const hash=createHash('sha256').update(JSON.stringify({agent:body.agent,messages:turns})).digest('hex');
 const headers={apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
 let claim:{state:string;response?:Record<string,unknown>};
 try{
  const result=await fetch(new URL('/rest/v1/rpc/claim_research_agent_request',SUPABASE_URL),{
   method:'POST',headers,body:JSON.stringify({p_user_id:me.id,p_request_key:idempotencyKey,p_payload_hash:hash}),cache:'no-store',signal:AbortSignal.timeout(5000)
  });
  if(!result.ok)throw new Error('claim failed');
  claim=await result.json() as typeof claim;
 }catch{return error('Request deduplication unavailable.',503);}
 if(claim.state==='completed'&&claim.response)return NextResponse.json(claim.response,{headers:noStore});
 if(claim.state==='conflict')return error('Idempotency key reused for different request.',409);
 if(claim.state!=='claimed')return error('Request already processing or previously failed; retry later with a new key only if needed.',409);
 const complete=async(status:'completed'|'failed',response?:Record<string,unknown>)=>{
  try{await fetch(new URL('/rest/v1/research_agent_requests',SUPABASE_URL)+`?user_id=eq.${encodeURIComponent(me.id)}&request_key=eq.${encodeURIComponent(idempotencyKey)}&status=eq.pending`,{
   method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({status,response:response||null}),cache:'no-store',signal:AbortSignal.timeout(5000)
  });}catch{}
 };
 const quota=await consumeWorkbenchQuota(me.id);
 if(!quota.configured){await complete('failed');return error('Usage limits are not configured.',503);}
 if(!quota.allowed){await complete('failed');return error('Research assistant usage limit reached. Try again after the hourly reset.',429);}
 try{
  const timeout=AbortSignal.timeout(30000);
  const signal=AbortSignal.any([req.signal,timeout]);
  const answer=agent.provider==='gemini'?await gemini(turns,agent.instructions,signal):await groq(turns,agent.instructions,signal);
  const result={answer,agent:agent.id,routing,provider:agent.provider,externalInference:true,quota:{remaining:quota.remaining,resetAt:quota.resetAt}};
  await complete('completed',result);
  return NextResponse.json(result,{headers:noStore});
 }catch{await complete('failed');return error('The research assistant is temporarily unavailable. Your quota may have been consumed; please retry later.',503);}
}
