'use client';

import { ArrowRight, Check, Heart } from 'lucide-react';
import { useState } from 'react';

const PAID_URL = 'https://buy.stripe.com/14A4gr1Wdd5gfy2f8g1sQ00';
const ENHANCED_URL = 'https://buy.stripe.com/28EcMX30h3uG0D88JS1sQ01';
const FUND_URL = 'https://donate.stripe.com/7sYbIT44lghs0D88JS1sQ02';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    cadence: '',
    description: 'Create a free account to explore LooseMouth and the public Global Intent research ecosystem.',
    features: ['Authenticated LooseMouth access', 'Saved conversations', 'Standard usage boundary'],
    href: '/intent',
    action: 'Create free account',
  },
  {
    name: 'Paid',
    price: '$4.99',
    cadence: '/ month',
    description: 'First 30 days free, then $4.99/month. For people who use LooseMouth regularly and need a larger inference allowance.',
    features: ['Higher LooseMouth rate limits', 'Saved conversations', 'Standard workspace access'],
    href: PAID_URL,
    action: 'Choose Paid',
  },
  {
    name: 'Enhanced Workspace',
    price: '$14.99',
    cadence: '/ month',
    description: 'First 30 days free, then $14.99/month. Full workspace access for deeper research, building and artifact workflows.',
    features: ['Highest account rate limits', 'Full LooseMouth workspace', 'Reports and applet workflows'],
    href: ENHANCED_URL,
    action: 'Unlock Enhanced',
    featured: true,
  },
];

export default function BillingSection() {
  const [busy,setBusy]=useState<string|null>(null);
  async function subscribe(tier:'paid'|'enhanced'){
    const raw=localStorage.getItem('gic-loosemouth-session');
    if(!raw){window.location.href='/intent';return;}
    let token='';try{token=JSON.parse(raw).access_token||'';}catch{}
    if(!token){window.location.href='/intent';return;}
    setBusy(tier);
    try{const res=await fetch('/api/billing/checkout',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({tier})});const data=await res.json();if(!res.ok||!data.url)throw new Error(data.error||'Checkout unavailable');window.location.href=data.url;}catch(e){alert(e instanceof Error?e.message:'Checkout unavailable');setBusy(null);}
  }
  return (
    <section id="plans" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">Access & support</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Use LooseMouth. Expand the workspace. Fund the research.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">Subscriptions support continued private-AI infrastructure and research while providing expanded product access. Payments are securely processed by Stripe.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className={`rounded-2xl border p-7 ${tier.featured ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-200 bg-white'}`}>
              <p className="text-sm font-semibold text-slate-950">{tier.name}</p>
              <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-semibold tracking-tight text-slate-950">{tier.price}</span><span className="text-sm text-slate-500">{tier.cadence}</span></div>
              <p className="mt-4 min-h-14 text-sm leading-6 text-slate-600">{tier.description}</p>
              <div className="mt-6 space-y-3">{tier.features.map((feature) => <p key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />{feature}</p>)}</div>
              {tier.name==='Paid'||tier.name==='Enhanced Workspace'?<button type="button" disabled={busy!==null} onClick={()=>subscribe(tier.name==='Paid'?'paid':'enhanced')} className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${tier.featured?'bg-blue-600 text-white hover:bg-blue-700':'border border-slate-300 text-slate-950 hover:bg-slate-50'}`}>{busy===(tier.name==='Paid'?'paid':'enhanced')?'Opening checkout…':tier.action}<ArrowRight className="h-4 w-4" /></button>:<a href={tier.href} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">{tier.action}<ArrowRight className="h-4 w-4" /></a>}
            </article>
          ))}
        </div>
        <div id="fund-research" className="mt-8 flex flex-col gap-6 rounded-2xl bg-slate-950 p-7 text-white sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl"><div className="flex items-center gap-2 text-blue-300"><Heart className="h-5 w-5" /><span className="text-sm font-semibold">Fund the research</span></div><h3 className="mt-3 text-2xl font-semibold">Support Global Intent Company without a subscription.</h3><p className="mt-3 text-sm leading-6 text-slate-300">Make a one-time contribution toward INTENT, BitVision, Virtual Lab, PLM, edge AI and scientific-instrumentation R&D. Contributions are support payments and do not provide equity, ownership, investment returns or securities.</p></div>
          <a href={FUND_URL} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">Fund the research <ArrowRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}
