import { NextRequest,NextResponse } from 'next/server';
import { user } from '@/lib/workbench-access';
import { vlabEntitlement } from '@/lib/virtual-lab-billing';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
  if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});
  const u=await user(req);if(!u?.id)return NextResponse.json({error:'Sign in first.'},{status:401});
  try {
    const e=await vlabEntitlement(u.id);
    if(!e?.stripe_customer_id)return NextResponse.json({error:'No VirtualLab billing account exists yet.'},{status:404});
    const key=process.env.STRIPE_SECRET_KEY;if(!key)return NextResponse.json({error:'Billing unavailable.'},{status:503});
    const params=new URLSearchParams({customer:e.stripe_customer_id,return_url:'https://www.globalintentcompany.space/virtual-lab/plans'});
    const response=await fetch('https://api.stripe.com/v1/billing_portal/sessions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/x-www-form-urlencoded'},body:params,cache:'no-store',signal:AbortSignal.timeout(9000)});
    const data=await response.json() as {url?:string};if(!response.ok||!data.url)return NextResponse.json({error:'Billing portal unavailable.'},{status:503});
    return NextResponse.json({url:data.url},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Billing portal unavailable.'},{status:503});}
}
