import { SUPABASE_URL } from '@/lib/supabase-public';

export type VirtualLabPlan = 'researcher'|'laboratory';
export const VLAB_PLANS: Record<VirtualLabPlan,{name:string;description:string;priceId:string}> = {
  researcher:{name:'Researcher',description:'Individual research workflows',priceId:process.env.VLAB_STRIPE_RESEARCHER_PRICE_ID||''},
  laboratory:{name:'Laboratory',description:'Laboratory evaluation and feedback',priceId:process.env.VLAB_STRIPE_LABORATORY_PRICE_ID||''},
};
const LEGACY_PRICES=new Set(['price_1UO1qp0ULZCgUuKWA1vgyIOj','price_1UO1qr0ULZCgUuKWTJpXtg6S']);
export function priceFor(plan:VirtualLabPlan) {
  const id=VLAB_PLANS[plan].priceId;
  if(!/^price_[A-Za-z0-9]+$/.test(id)||LEGACY_PRICES.has(id)) return null;
  if(VLAB_PLANS.researcher.priceId===VLAB_PLANS.laboratory.priceId)return null;
  return id;
}
export async function stripePrice(plan:VirtualLabPlan){
  const id=priceFor(plan),key=process.env.STRIPE_SECRET_KEY;
  if(!id||!key)return null;
  try {
    const response=await fetch('https://api.stripe.com/v1/prices/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(7000)});
    if(!response.ok)return null;
    const price=await response.json() as {id:string;active?:boolean;currency?:string;unit_amount?:number;recurring?:{interval?:string;usage_type?:string}};
    if(price.id!==id||!price.active||price.recurring?.interval!=='month'||price.recurring?.usage_type!=='licensed'||price.currency!=='usd'||!Number.isSafeInteger(price.unit_amount)||!price.unit_amount||price.unit_amount<1)return null;
    return price as typeof price & {unit_amount:number;currency:'usd'};
  }catch{return null;}
}
function serviceKey(){return process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';}
export async function vlabEntitlement(userId:string){
  const key=serviceKey();
  if(!key)throw new Error('VirtualLab entitlement store unavailable');
  const url=new URL('/rest/v1/virtual_lab_billing_entitlements',SUPABASE_URL);
  url.searchParams.set('select','user_id,tier,subscription_status,stripe_customer_id,stripe_subscription_id,trial_started_at,trial_end');
  url.searchParams.set('user_id','eq.'+userId);url.searchParams.set('limit','1');
  const r=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw new Error('VirtualLab entitlement lookup unavailable');
  const rows=await r.json() as Array<{user_id:string;tier:VirtualLabPlan;subscription_status:string;stripe_customer_id:string|null;stripe_subscription_id:string|null;trial_started_at:string|null;trial_end:string|null}>;
  return rows[0]||null;
}
export async function existingGicCustomer(userId:string){
  const key=serviceKey();if(!key)return null;
  const url=new URL('/rest/v1/loosemouth_billing_entitlements',SUPABASE_URL);
  url.searchParams.set('select','stripe_customer_id');url.searchParams.set('user_id','eq.'+userId);url.searchParams.set('limit','1');
  const r=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!r.ok)return null;
  const rows=await r.json() as Array<{stripe_customer_id:string|null}>;
  return rows[0]?.stripe_customer_id||null;
}
export function isActiveVirtualLab(row:{subscription_status:string}|null){return row!==null&&['active','trialing'].includes(row.subscription_status);}
