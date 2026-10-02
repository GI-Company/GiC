'use client';

import { Building2, Cloud, Eye, ShieldCheck } from 'lucide-react';

export default function ProblemSection() {
  const items = [
    { icon: Cloud, title: 'Hosted by default', text: 'Many hosted AI products place model execution on infrastructure controlled by a third party.' },
    { icon: Eye, title: 'Limited observability', text: 'Operators often see an API response, not the model runtime, readiness state, or execution environment behind it.' },
    { icon: Building2, title: 'Operational dependency', text: 'Application availability, pricing, model access, and data handling can depend on an external provider.' },
  ];
  return (
    <section id="the-problem" className="border-b border-slate-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-blue-700">Why private AI infrastructure</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">AI ownership is an infrastructure problem, not just a model choice.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">GIC is exploring what changes when the model, runtime, network boundary, and user experience are designed around operator control from the beginning.</p>
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p className="text-sm leading-6 text-slate-700"><strong className="text-slate-950">Design objective:</strong> make private deployment, authentication, readiness, and evidence first-class system properties rather than afterthoughts.</p></div>
            </div>
          </div>
          <div className="grid gap-4">
            {items.map(({icon:Icon,title,text})=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon className="h-5 w-5"/></span><div><h3 className="font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div></div></article>)}
          </div>
        </div>
      </div>
    </section>
  );
}
