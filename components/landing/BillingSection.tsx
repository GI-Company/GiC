'use client';

import { ArrowRight, Check, Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkoutAccessToken, checkoutPlan, signupForPlan, type CheckoutPlan } from '@/lib/checkout-intent';
import { trackConversion } from '@/lib/conversion-events';

const FUND_URL = 'https://donate.stripe.com/7sYbIT44lghs0D88JS1sQ02';
const tiers = [
  {
    name: 'Free', plan: null, price: '$0', cadence: '',
    description: 'Try chat and web-assisted research, then keep your conversations with a free account.',
    features: ['5 guest messages to try it', '20 requests per hour with a free account', 'Saved conversations after signing in'],
    action: 'Create free account',
  },
  {
    name: 'Paid', plan: 'paid' as const, price: '$4.99', cadence: '/ month',
    description: 'For regular research and reusable reports. Eligible new subscribers get 30 days free, then $4.99/month.',
    features: ['100 requests per hour', 'Agent report workbench and exports', 'Virtual Lab online demo', 'Saved conversations', 'Optional usage analytics and session replay'],
    action: 'Start Paid trial',
  },
  {
    name: 'Enhanced Workspace', plan: 'enhanced' as const, price: '$14.99', cadence: '/ month',
    description: 'For deeper research and interactive tools. Eligible new subscribers get 30 days free, then $14.99/month.',
    features: ['300 requests per hour', 'Enhanced model access', 'Agent reports and interactive applets', 'Virtual Lab online demo', 'Optional usage analytics and session replay'],
    action: 'Start Enhanced trial', featured: true,
  },
];

export default function BillingSection() {
  const router = useRouter();
  const [busy, setBusy] = useState<CheckoutPlan | null>(null);
  const [selected, setSelected] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState('');
  const [signInNeeded, setSignInNeeded] = useState(false);
  const [manageNeeded, setManageNeeded] = useState(false);
  useEffect(() => { setSelected(checkoutPlan(new URLSearchParams(window.location.search).get('plan'))); }, []);

  async function subscribe(plan: CheckoutPlan) {
    if (busy) return;
    setBusy(plan); setSelected(plan); setError(''); setSignInNeeded(false); setManageNeeded(false);
    trackConversion('gic_plan_selected', { plan, placement: 'pricing' });
    try {
      const token = await checkoutAccessToken();
      if (!token) { router.push(signupForPlan(plan)); return; }
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: plan }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (response.status === 401) {
        setSignInNeeded(true);
        throw new Error('Sign in again to continue with your selected plan.');
      }
      if (response.status === 409) setManageNeeded(true);
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is temporarily unavailable. Please try again.');
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') throw new Error('Checkout is temporarily unavailable.');
      trackConversion('gic_checkout_started', { plan });
      window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout is temporarily unavailable. Please try again.');
      trackConversion('gic_checkout_failed', { plan, reason: 'checkout_unavailable' });
    } finally { setBusy(null); }
  }

  return (
    <section id="plans" className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">LooseMouth plans</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">Start free. Upgrade when your work needs more.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">Use chat for questions and web research, Paid for reusable reports, or Enhanced for reports and interactive applets. Stripe handles subscription checkout. Eligible trials renew at the listed monthly price; manage or cancel your subscription from the workspace.</p>
          <Link href="/intent" onClick={() => trackConversion('gic_cta_clicked', { action: 'try_free', placement: 'pricing' })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 underline underline-offset-4">Try the guest workspace first <ArrowRight size={15} /></Link>
        </div>
        {selected && <p role="status" className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{selected === 'paid' ? 'Paid' : 'Enhanced'} selected. Continue below to review the price and trial eligibility in Stripe.</p>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{error}</p>
          {selected && signInNeeded && <Link href={signupForPlan(selected)} className="mt-2 inline-block font-semibold underline">Sign in or create an account</Link>}
          {manageNeeded && <Link href="/intent" className="mt-2 inline-block font-semibold underline">Open workspace to manage your subscription</Link>}
        </div>}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => <article key={tier.name} className={`flex flex-col rounded-2xl border bg-white p-7 ${selected === tier.plan && selected ? 'border-blue-600 ring-2 ring-blue-200' : tier.featured ? 'border-blue-600 shadow-lg' : 'border-slate-200'}`}>
            <h3 className="text-sm font-semibold text-slate-950">{tier.name}</h3>
            <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-semibold tracking-tight text-slate-950">{tier.price}</span><span className="text-sm text-slate-500">{tier.cadence}</span></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{tier.description}</p>
            <ul className="mb-8 mt-6 space-y-3">{tier.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />{feature}</li>)}</ul>
            {tier.plan ? <button type="button" disabled={busy !== null} onClick={() => void subscribe(tier.plan!)} className={`mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60 ${tier.featured ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-950 hover:bg-slate-50'}`}>{busy === tier.plan ? 'Opening checkout…' : tier.action}<ArrowRight size={16} /></button> : <Link href="/intent?signup=1" onClick={() => trackConversion('gic_cta_clicked', { action: 'create_account', placement: 'pricing' })} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">{tier.action}<ArrowRight size={16} /></Link>}
          </article>)}
        </div>
        <div id="fund-research" className="mt-8 flex flex-col gap-6 rounded-2xl bg-slate-950 p-7 text-white sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl"><div className="flex items-center gap-2 text-blue-300"><Heart size={20} /><span className="text-sm font-semibold">Fund the research</span></div><h3 className="mt-3 text-2xl font-semibold">Support Global Intent Company without a subscription.</h3><p className="mt-3 text-sm leading-6 text-slate-300">Make a one-time contribution toward INTENT, BitVision, Virtual Lab, PLM, edge AI and scientific-instrumentation R&amp;D. Contributions do not provide equity, ownership, investment returns or securities.</p></div>
          <a href={FUND_URL} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">Fund the research <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}
