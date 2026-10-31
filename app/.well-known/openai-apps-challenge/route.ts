import { NextResponse } from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// Token is provided by OpenAI's plugin submission portal, never hard-coded into source.
export async function GET(){
 const token=process.env.VLAB_OPENAI_APPS_CHALLENGE_TOKEN;
 if(!token||token.includes('\n')||token.includes('\r')||token.length>2048)return new NextResponse(null,{status:404});
 return new NextResponse(token,{status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}
