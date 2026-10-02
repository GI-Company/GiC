'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, Cpu, MessageSquareText } from 'lucide-react';

export default function IntentModelsSection() {
  return (
    <section id="intent-models" className="border-b border-slate-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-700">INTENT model family</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Model research that can be inspected, measured, and deployed.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">INTENT is GIC's model-development program, spanning compact experimental architectures and the public LooseMouth research interface.</p>
          </div>
          <Link href="/intent" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">Try LooseMouth <ArrowRight className="h-4 w-4"/></Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            [Boxes,'Architecture research','Explore parameter efficiency, training behavior, reasoning supervision, and model scaling under constrained compute.'],
            [Cpu,'Local execution','Investigate runtimes and model formats intended for operator-controlled hardware rather than mandatory remote inference.'],
            [MessageSquareText,'LooseMouth','A public research interface that demonstrates GIC-operated inference while clearly distinguishing native INTENT models from enhanced open-model serving.'],
          ].map(([Icon,title,text]:any)=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><Icon className="h-5 w-5 text-blue-700"/><h3 className="mt-7 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}
        </div>
      </div>
    </section>
  );
}
