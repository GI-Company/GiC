'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { checkoutAccessToken } from '@/lib/checkout-intent';

type Plan = { id: 'researcher'|'laboratory'; name: string; description: string; price: string|null; available: boolean; features: string[] };
const features: Record<'researcher'|'laboratory',string[]> = {
  researcher: ['Access to the current web simulation workbench', 'Evidence and report exports in the existing demo', 'Desktop beta releases when published', 'Beta feedback channel'],
  laboratory: ['All current Researcher capabilities', 'Dedicated laboratory workflow discovery', 'Priority review of beta feedback', 'Future team and private deployment features require separate validation'],
};
export default function VirtualLabPlans() {
  const [plans,setPlans]=useState<Plan[]>([
    {id:'researcher',name:'Researcher',description:'Individual research workflows',price:null,available:false,features:features.researcher},
    {id:'laboratory',name:'Laboratory',description:'Laboratory evaluation and feedback',price:null,available:false,features:features.laboratory},
  ]);
  const [busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
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
  return <div className="mt-9 space-y-6" data-ph-mask="true">
    <div className="grid gap-5 md:grid-cols-2">
      {plans.map(p=><section key={p.id} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-semibold">{p.name}</h2><p className="mt-2 text-sm text-slate-600">{p.description}</p>
        <p className="mt-6 text-3xl font-semibold">{p.price||'Pricing pending'}<span className="text-sm font-normal text-slate-500">{p.price?' / month':''}</span></p>
        <p className="mt-2 text-xs text-slate-500">The displayed price comes from the configured Stripe recurring price. No checkout is offered until the plan is configured.</p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">{p.features.map(f=><li key={f} className="flex gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span><span>{f}</span></li>)}</ul>
        <button type="button" disabled={!p.available||busy!==null} onClick={()=>void checkout(p.id)} className="mt-8 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy===p.id?'Opening Stripe…':p.available?'Subscribe with Stripe':'Not yet available'}</button>
      </section>)}
    </div>
    {error&&<p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{error} <Link href="/intent?signin=1" className="underline">Sign in</Link></p>}
    <p className="text-sm text-slate-600">Existing GIC plans remain unchanged. Beta features are experimental, and payment does not establish scientific validation or a service-level agreement.</p>
  </div>;
}
