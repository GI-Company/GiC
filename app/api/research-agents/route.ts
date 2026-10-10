import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement, consumeWorkbenchQuota } from '@/lib/workbench-access';
import { getResearchAgent, type ResearchAgentTier } from '@/lib/research-agent-registry';

export const runtime = 'nodejs';
const noStore = { 'Cache-Control': 'no-store' };
const error = (message:string,status:number)=>NextResponse.json({error:message},{status,headers:noStore});
type Turn = {role:'user'|'assistant';content:string};
const MAX_TURNS=12;
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
 if(!req.headers.get('content-type')?.startsWith('application/json'))return error('Expected JSON.',415);
 const me=await user(req);if(!me?.id)return error('Sign in to use research assistants.',401);
 const tier=await entitlement(me.id);if(!tier)return error('Membership verification unavailable.',503);
 if(tier==='free')return error('Research assistants require an active Paid or Enhanced membership.',403);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>48000)return error('Request too large.',413);body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))return error('Invalid request.',400);}catch{return error('Invalid JSON.',400);}
 const agent=getResearchAgent(body.agent,tier as ResearchAgentTier);
 if(!agent)return error('Unknown or unavailable research assistant.',400);
 const turns=parseTurns(body.messages);if(!turns)return error('Provide 1–12 valid conversation turns ending in a user message.',400);
 if(agent.provider==='gemini'&&!process.env.GEMINI_API_KEY)return error('Gemini is not configured.',503);
 if(agent.provider==='groq'&&!process.env.GROQ_API)return error('Groq is not configured.',503);
 const quota=await consumeWorkbenchQuota(`research-agent:${me.id}`);
 if(!quota.configured)return error('Usage limits are not configured.',503);
 if(!quota.allowed)return error('Research assistant usage limit reached. Try again after the hourly reset.',429);
 try{
  const timeout=AbortSignal.timeout(30000);
  const signal=AbortSignal.any([req.signal,timeout]);
  const answer=agent.provider==='gemini'?await gemini(turns,agent.instructions,signal):await groq(turns,agent.instructions,signal);
  return NextResponse.json({answer,agent:agent.id,provider:agent.provider,externalInference:true,quota:{remaining:quota.remaining,resetAt:quota.resetAt}},{headers:noStore});
 }catch{return error('The research assistant is temporarily unavailable. Your quota may have been consumed; please retry later.',503);}
}
