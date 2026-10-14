'use client';

import React from 'react';
import { trackConversion } from '@/lib/conversion-events';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FlaskConical, Network, Sparkles, ArrowUpRight } from 'lucide-react';

const pillars = [
  {
    title: 'INTENT',
    eyebrow: 'Private AI',
    description: 'Language-model research and privately operated conversational AI, including LooseMouth.',
    href: '/intent',
    icon: Sparkles,
  },
  {
    title: 'PLM Infrastructure',
    eyebrow: 'Private Infrastructure',
    description: 'Authenticated infrastructure for discovering, verifying, and operating privately hosted models.',
    href: '/infrastructure',
    icon: Network,
  },
  {
    title: 'Virtual Lab',
    eyebrow: 'Scientific Computing',
    description: 'Evidence-oriented simulation, instrumentation, and reproducible scientific experimentation.',
    href: '/virtual-lab',
    icon: FlaskConical,
  },
];

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-24 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.08),transparent_32%),linear-gradient(to_bottom,#ffffff,#f8fafc)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Independent AI &amp; systems engineering
          </div>

          <h1 className="mt-5 max-w-5xl text-4xl sm:mt-8 font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl leading-[1.02]">
            Private AI. Owned infrastructure. Verifiable systems.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:mt-7 sm:text-xl sm:leading-8">
            Global Intent Company develops language models, private AI infrastructure, and scientific computing systems designed to provide direct control over models, compute, and data.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/intent" onClick={() => trackConversion('gic_cta_clicked', { action: 'try_free', placement: 'home' })} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Try LooseMouth free <ArrowRight size={16} /></Link>
            <Link href="/pricing" onClick={() => trackConversion('gic_cta_clicked', { action: 'view_plans', placement: 'home' })} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">Compare plans <ArrowRight size={16} /></Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">5 guest messages · No account or payment card needed to try.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">Want to save conversations and use your own workspace?</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Create a free account, or compare Paid and Enhanced workspaces for research assistants, reports and applets.</p>
            </div>
            <Link href="/intent" onClick={() => trackConversion('gic_cta_clicked', { action: 'create_account', placement: 'home_account_strip' })} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Create free account <ArrowUpRight size={15} /></Link>
            <Link href="/pricing" onClick={() => trackConversion('gic_cta_clicked', { action: 'view_paid_workspaces', placement: 'home_account_strip' })} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Explore workspaces <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-8 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="font-semibold text-slate-950">Try LooseMouth: chat and web-assisted research.</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Get an answer before creating an account. Paid adds reusable reports; Enhanced adds interactive applets. Current hosted inference uses Groq while GIC develops its own models and infrastructure.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <Link href="/technology" className="hover:text-blue-700">Explore technology</Link>
            <Link href="/research" className="hover:text-blue-700">View research</Link>
            <Link href="/pricing#fund-research" className="hover:text-blue-700">Fund AI research &amp; development</Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {['Private deployment', 'Evidence-led R&D', 'Inspectable architecture'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">See the research in action</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Explore a live BitVision-Cell experiment</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Inspect the browser-based research demonstration before deciding whether to create an account or support development.</p>
            </div>
            <Link href="/virtual-lab/bitvision-cell" onClick={() => trackConversion('gic_cta_clicked', { action: 'open_bitvision_demo', placement: 'home_featured_demo' })} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Launch live demo <ArrowUpRight size={16} /></Link>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pillars.map(({ title, eyebrow, description, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <h2 className="mt-8 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
