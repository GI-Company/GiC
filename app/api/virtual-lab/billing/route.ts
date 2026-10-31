import { NextRequest,NextResponse } from 'next/server';
import { user } from '@/lib/workbench-access';
import { VLAB_PLANS, type VirtualLabPlan, stripePrice, vlabEntitlement, existingGicCustomer, isActiveVirtualLab } from '@/lib/virtual-lab-billing';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
export async function GET(){
  const results=await Promise.all((['researcher','laboratory'] as VirtualLabPlan[]).map(async id=>{
    const config=VLAB_PLANS[id],verified=await stripePrice(id);
    const formatted=verified?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(verified.unit_amount/100):null;
    return {id,name:config.name,description:config.description,price:formatted,available:Boolean(verified)};
  }));
  return NextResponse.json({plans:results},{headers:noStore});
}
export async function POST(req:NextRequest){
  if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return fail('Cross-origin request rejected.',403);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return fail('Expected JSON.',415);
  const me=await user(req);if(!me?.id)return fail('Sign in first.',401);
  try{
    const text=await req.text();if(text.length>512)return fail('Invalid request size.',413);
    const data=JSON.parse(text) as {tier?:unknown};
    if(!data||!['researcher','laboratory'].includes(String(data.tier)))return fail('Unknown plan.',400);
    const tier=data.tier as VirtualLabPlan,price=await stripePrice(tier);
    if(!price)return fail('VirtualLab billing is not enabled for this plan yet.',503);
    const existing=await vlabEntitlement(me.id);
    if(isActiveVirtualLab(existing))return fail('Your VirtualLab subscription is already active. Manage the current subscription instead.',409);
    const key=process.env.STRIPE_SECRET_KEY;if(!key)return fail('Billing is not configured.',503);
    const customer=existing?.stripe_customer_id||await existingGicCustomer(me.id);
    const url=new URL(req.url);
    if(!['globalintentcompany.space','www.globalintentcompany.space','localhost','127.0.0.1'].includes(url.hostname))return fail('Invalid checkout host.',403);
    const origin=url.origin;
    const params=new URLSearchParams();
    params.set('mode','subscription');params.set('line_items[0][price]',price.id);params.set('line_items[0][quantity]','1');
    params.set('client_reference_id',me.id);
    if(customer)params.set('customer',customer);
    params.set('success_url',origin+'/virtual-lab/plans?checkout=success');
    params.set('cancel_url',origin+'/virtual-lab/plans?checkout=cancelled');
    // VirtualLab metadata is deliberately distinct from LooseMouth's webhook metadata.
    params.set('metadata[vlab_user_id]',me.id);
    params.set('metadata[vlab_plan]',tier);
    params.set('subscription_data[metadata][vlab_user_id]',me.id);
    params.set('subscription_data[metadata][vlab_plan]',tier);
    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/x-www-form-urlencoded'},body:params,cache:'no-store',signal:AbortSignal.timeout(10000)});
    const result=await r.json() as {url?:string;error?:{message?:string}};
    if(!r.ok||!result.url)return fail(result.error?.message||'Stripe checkout unavailable.',502);
    return NextResponse.json({url:result.url},{headers:noStore});
  }catch{return fail('VirtualLab billing is not ready. Please try later.',503);}
}
