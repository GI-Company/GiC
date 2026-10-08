import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FlaskConical, Network, Sparkles } from 'lucide-react';

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
    <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.08),transparent_32%),linear-gradient(to_bottom,#ffffff,#f8fafc)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Independent AI &amp; systems engineering
          </div>

          <h1 className="mt-8 max-w-5xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl leading-[1.02]">
            Private AI. Owned infrastructure. Verifiable systems.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Global Intent Company develops language models, private AI infrastructure, and scientific computing systems designed to provide direct control over models, compute, and data.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/technology" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Explore our technology <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/research" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
              View research <ArrowRight className="h-4 w-4" />
            </Link>
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

        <div className="mt-16 grid gap-5 md:grid-cols-3">
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
