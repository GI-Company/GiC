import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';
export const runtime='nodejs';
const GROQ_BASE='https://api.groq.com/openai/v1';
async function user(req:NextRequest){const a=req.headers.get('authorization');if(!a?.startsWith('Bearer '))return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:a},cache:'no-store'});if(!r.ok)return null;return await r.json() as {id?:string};}
function extractJson(text:string){const fenced=text.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/i)?.[1]||text;return JSON.parse(fenced.trim()) as Record<string,unknown>;}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});
 const me=await user(req); if(!me?.id)return NextResponse.json({error:'Sign in to use the LooseMouth Workbench.'},{status:401});
 const body=await req.json() as {kind?:string;prompt?:string;current?:unknown};
 const kind=body.kind==='applet'?'applet':'report'; const prompt=typeof body.prompt==='string'?body.prompt.trim().slice(0,12000):'';
 if(!prompt)return NextResponse.json({error:'Describe what you want LooseMouth to build.'},{status:400});
 const key=process.env.GROQ_API;if(!key)return NextResponse.json({error:'Workbench generation is not configured.'},{status:503});
 const instruction=kind==='report'
 ? 'Return ONLY valid JSON: {"title":"...","markdown":"..."}. Create a polished original report in Markdown with useful headings, tables where appropriate, and a Sources section only when sources were actually supplied. Do not wrap JSON in markdown fences.'
 : 'Return ONLY valid JSON: {"title":"...","files":[{"path":"index.html","content":"..."},{"path":"style.css","content":"..."},{"path":"app.js","content":"..."}]}. Build a self-contained browser applet. It must work without packages, CDNs, remote scripts, cookies, localStorage, network requests, forms that navigate, popups, or parent/top access. Use semantic accessible HTML. Keep JavaScript browser-only. Do not wrap JSON in markdown fences.';
 const context=body.current? `\nExisting artifact to revise:\n${JSON.stringify(body.current).slice(0,18000)}`:'';
 const upstream=await fetch(`${GROQ_BASE}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'openai/gpt-oss-120b',messages:[{role:'system',content:instruction},{role:'user',content:prompt+context}],temperature:0.35,max_completion_tokens:kind==='applet'?5000:4000}),signal:AbortSignal.timeout(90000),cache:'no-store'});
 const data=await upstream.json() as {choices?:Array<{message?:{content?:string}}>;error?:{message?:string}}; if(!upstream.ok)return NextResponse.json({error:data.error?.message||'Workbench generation failed.'},{status:upstream.status});
 try{const artifact=extractJson(data.choices?.[0]?.message?.content||'');return NextResponse.json({kind,artifact});}catch{return NextResponse.json({error:'LooseMouth returned an invalid artifact. Try again.'},{status:502});}
}
