import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_URL } from '@/lib/supabase-public';
import { VLAB_PLANS } from '@/lib/virtual-lab-billing';
export const runtime = 'nodejs';

function secretKey() { return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; }
function signed(raw: string, header: string, secret: string) {
  const kv = header.split(',').map(s => s.trim().split('=', 2));
  const timestamp = kv.find(([key]) => key === 't')?.[1];
  const signatures = kv.filter(([key]) => key === 'v1').map(([,value]) => value).filter(Boolean);
  if (!timestamp || !/^[0-9]+$/.test(timestamp) || Math.abs(Date.now()/1000 - Number(timestamp)) > 300 || !signatures.length) return false;
  const expected = createHmac('sha256', secret).update(timestamp + '.' + raw).digest();
  return signatures.some(s => {
    try {
      if (!/^[a-f0-9]{64}$/i.test(s)) return false;
      const actual = Buffer.from(s,'hex');
      return actual.length === expected.length && timingSafeEqual(actual,expected);
    } catch { return false; }
  });
}
async function rest(path:string,params?:Record<string,string>,method='GET',body?:unknown) {
  const key=secretKey();if(!key)throw new Error('Database secret unavailable');
  const url=new URL(path,SUPABASE_URL);
  for(const [k,v] of Object.entries(params||{}))url.searchParams.set(k,v);
  const response=await fetch(url,{
    method,headers:{apikey:key,Authorization:'Bearer '+key,...(method!=='GET'?{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}:{})},
    body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(8000),
  });
  if(!response.ok)throw new Error('VirtualLab database operation failed');
  return method==='GET'?response.json():null;
}
export async function POST(req:NextRequest) {
  const webhookSecret=process.env.VLAB_STRIPE_WEBHOOK_SECRET,stripeSecret=process.env.STRIPE_SECRET_KEY;
  if(!webhookSecret||!stripeSecret||!secretKey())return NextResponse.json({error:'Not configured'},{status:503});
  try {
    const raw=await req.text();
    if(raw.length>300000)return NextResponse.json({error:'Event too large'},{status:413});
    if(!signed(raw,req.headers.get('stripe-signature')||'',webhookSecret))return NextResponse.json({error:'Invalid signature'},{status:400});
    const event=JSON.parse(raw) as {id?:string;type?:string;data?:{object?:Record<string,unknown>}};
    if(!event.id||!event.type||!event.data?.object)return NextResponse.json({error:'Invalid event'},{status:400});
    const seen=await rest('/rest/v1/virtual_lab_stripe_events',{select:'stripe_event_id',stripe_event_id:'eq.'+event.id,limit:'1'}) as unknown[];
    if(seen.length)return NextResponse.json({received:true,duplicate:true});
    const obj=event.data.object;
    const meta=(obj.metadata||{}) as Record<string,string>;
    let subscriptionId:string|undefined;
    if(event.type==='checkout.session.completed'&&obj.mode==='subscription'&&meta.vlab_user_id)subscriptionId=typeof obj.subscription==='string'?obj.subscription:undefined;
    if(event.type.startsWith('customer.subscription.')&&meta.vlab_user_id)subscriptionId=typeof obj.id==='string'?obj.id:undefined;
    if(subscriptionId){
      const response=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(subscriptionId),{headers:{Authorization:'Bearer '+stripeSecret},cache:'no-store',signal:AbortSignal.timeout(9000)});
      if(!response.ok)throw new Error('Stripe subscription lookup failed');
      const sub=await response.json() as {id:string;status:string;customer:string;metadata?:Record<string,string>;items?:{data?:Array<{price?:{id?:string};current_period_end?:number}>};cancel_at_period_end?:boolean};
      const userId=sub.metadata?.vlab_user_id,plan=sub.metadata?.vlab_plan;
      if(userId&&/^[a-f0-9-]{36}$/i.test(userId)&&(plan==='researcher'||plan==='laboratory')&&
         sub.items?.data?.[0]?.price?.id===VLAB_PLANS[plan].priceId&&sub.items.data.length===1&&typeof sub.customer==='string'){
        const current=await rest('/rest/v1/virtual_lab_billing_entitlements',{select:'stripe_subscription_id',user_id:'eq.'+userId,limit:'1'}) as Array<{stripe_subscription_id?:string}>;
        // Never let a delayed event from a different subscription overwrite the current entitlement.
        if(!current[0]?.stripe_subscription_id||current[0].stripe_subscription_id===sub.id){
          const tier=['active','trialing'].includes(sub.status)?plan:'inactive';
          const periodEnd=sub.items.data[0].current_period_end;
          await rest('/rest/v1/virtual_lab_billing_entitlements',{on_conflict:'user_id'},'POST',{
            user_id:userId,tier,subscription_status:sub.status,stripe_customer_id:sub.customer,stripe_subscription_id:sub.id,
            current_period_end:periodEnd?new Date(periodEnd*1000).toISOString():null,
            cancel_at_period_end:Boolean(sub.cancel_at_period_end),updated_at:new Date().toISOString(),
          });
        }
      }
    }
    await rest('/rest/v1/virtual_lab_stripe_events',{on_conflict:'stripe_event_id'},'POST',{stripe_event_id:event.id,event_type:event.type});
    return NextResponse.json({received:true});
  }catch{return NextResponse.json({error:'Webhook processing failed'},{status:500});}
}
