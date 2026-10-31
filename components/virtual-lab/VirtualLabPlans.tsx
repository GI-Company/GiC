'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { checkoutAccessToken } from '@/lib/checkout-intent';

type Plan = { id: 'researcher'|'laboratory'; name: string; description: string; price: string|null; proposedPrice?: string; trialDays?: number; available: boolean; features: string[] };
const features: Record<'researcher'|'laboratory',string[]> = {
  researcher: ['Access to the current web simulation workbench', 'Evidence and report exports in the existing demo', 'Desktop beta releases when published', 'Beta feedback channel'],
  laboratory: ['All current Researcher capabilities', 'Dedicated laboratory workflow discovery', 'Priority review of beta feedback', 'Future team and private deployment features require separate validation'],
};
export default function VirtualLabPlans() {
  const [plans,setPlans]=useState<Plan[]>([
    {id:'researcher',name:'Researcher',description:'Individual research workflows',price:null,proposedPrice:'$9.99',trialDays:7,available:false,features:features.researcher},
    {id:'laboratory',name:'Laboratory',description:'Laboratory evaluation and feedback',price:null,proposedPrice:'$29.99',trialDays:7,available:false,features:features.laboratory},
  ]);
  const [busy,setBusy]=useState<string|null>(null),[error,setError]=useState(''),[subscription,setSubscription]=useState<string|null>(null),[trialUsed,setTrialUsed]=useState(false);
  useEffect(()=>{let live=true;fetch('/api/virtual-lab/billing',{cache:'no-store'}).then(r=>r.json()).then((data:{plans?:Plan[]})=>{if(live&&Array.isArray(data.plans))setPlans(data.plans.map(p=>({...p,features:features[p.id]})));}).catch(()=>{});return()=>{live=false}},[]);
  async function checkout(tier:string) {
    setBusy(tier);setError('');
    try {
      const token=await checkoutAccessToken();
      if(!token){setError('Sign in to your GIC account first, then return to this page.');return;}
      const response=await fetch('/api/virtual-lab/billing',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({tier})});
      const body=await response.json();
      if(!response.ok||!body.url)throw new Error(body.error||'Checkout is unavailable.');
      window.location.assign(body.url);
    } catch(e){setError(e instanceof Error?e.message:'Checkout is unavailable.');}
    finally{setBusy(null);}
  }
  useEffect(()=>{let live=true;checkoutAccessToken().then(async token=>{if(!token)return;const response=await fetch('/api/virtual-lab/billing/status',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!response.ok)return;const data=await response.json() as {active?:boolean;tier?:string;trialUsed?:boolean};if(live){if(data.active)setSubscription(data.tier||'active');setTrialUsed(Boolean(data.trialUsed));}}).catch(()=>{});return()=>{live=false}},[]);
  async function portal(){
    setBusy('portal');setError('');
    try{
      const token=await checkoutAccessToken();if(!token)throw new Error('Sign in to manage billing.');
      const response=await fetch('/api/virtual-lab/billing/portal',{method:'POST',headers:{Authorization:'Bearer '+token}});
      const data=await response.json();if(!response.ok||!data.url)throw new Error(data.error||'Billing portal unavailable.');
      window.location.assign(data.url);
    }catch(e){setError(e instanceof Error?e.message:'Unable to open billing portal.');}
    finally{setBusy(null);}
  }
  return <div className="mt-9 space-y-6" data-ph-mask="true">
    <div className="grid gap-5 md:grid-cols-3">
      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
        <h2 className="text-2xl font-semibold">Free</h2><p className="mt-2 text-sm text-slate-600">Try the scientific workflow and approved public example data.</p>
        <p className="mt-6 text-3xl font-semibold">$0<span className="text-sm font-normal text-slate-500"> / forever</span></p>
        <p className="mt-2 text-xs text-slate-500">No account, trial or payment method required.</p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">{['Run a deterministic browser simulation','Compare results and inspect assumptions','Download an evidence JSON file and Markdown report','Verify a SHA-256 digest locally','Use public demo tools through an MCP client after connection testing'].map(f=><li key={f} className="flex gap-2"><span className="text-emerald-600" aria-hidden="true">✓</span><span>{f}</span></li>)}</ul>
        <Link href="/virtual-lab/free" className="mt-8 block rounded-xl bg-cyan-700 px-5 py-3 text-center text-sm font-semibold text-white">Open free demo</Link>
      </section>
      {plans.map(p=><section key={p.id} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-semibold">{p.name}</h2><p className="mt-2 text-sm text-slate-600">{p.description}</p>
        <p className="mt-6 text-3xl font-semibold">{p.price||(p.proposedPrice?p.proposedPrice+'*':'Pricing pending')}<span className="text-sm font-normal text-slate-500">{p.price?' / month':''}</span></p>
        <p className="mt-2 text-sm font-semibold text-blue-800">7-day free trial for eligible new VirtualLab subscribers</p><p className="mt-2 text-xs text-slate-500">{p.price?'Stripe-verified monthly recurring price. Trial converts to this amount unless cancelled.': '* Proposed introductory monthly pricing; not active until Stripe is configured. No charges today.'}</p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">{p.features.map(f=><li key={f} className="flex gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span><span>{f}</span></li>)}</ul>
        <button type="button" disabled={!p.available||busy!==null} onClick={()=>void checkout(p.id)} className="mt-8 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy===p.id?'Opening Stripe…':p.available?(trialUsed?'Subscribe with Stripe':'Start 7-day trial'):'Not yet available'}</button>
      </section>)}
    </div>
    {subscription&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm"><strong>VirtualLab subscription: {subscription}</strong><button type="button" disabled={busy!==null} onClick={()=>void portal()} className="ml-4 rounded-lg border border-emerald-700 px-3 py-2 font-semibold text-emerald-900 disabled:opacity-50">Manage subscription</button></div>}
    {error&&<p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{error} <Link href="/intent?signin=1" className="underline">Sign in</Link></p>}
    <p className="text-sm text-slate-600">Trial eligibility is checked at checkout. A payment method is required for paid subscriptions. Trials convert to recurring monthly billing unless cancelled before the trial ends; taxes may apply. Existing GIC plans remain unchanged. Beta features are experimental, and payment does not establish scientific validation or a service-level agreement.</p>
  </div>;
}
