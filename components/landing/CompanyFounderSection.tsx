'use client';

import { ArrowUpRight, Building2, Github, UserRound } from 'lucide-react';

export default function CompanyFounderSection() {
  return (
    <section id="company" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-blue-700">Company</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Independent research translated into working systems.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Global Intent Company is a founder-led AI and systems engineering company. Current work centers on private language-model infrastructure, the INTENT model family, and Virtual Lab scientific computing.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Building2 className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">Focused development</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Research, model development, infrastructure, and product work are developed under one technical program rather than presented as disconnected experiments.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><UserRound className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">Founder-led</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Founded by Cory Tortorici, with architecture, implementation, experimentation, and research direction developed as an integrated engineering effort.</p>
            </article>
            <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:col-span-2">
              <div className="flex items-center justify-between"><Github className="h-5 w-5" /><ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <h3 className="mt-8 text-lg font-semibold">Inspect the source organization</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Public repositories provide direct provenance for research, systems, models, and shipped software.</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
