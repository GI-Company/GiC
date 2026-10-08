import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingShell from '@/components/landing/MarketingShell';
import IntentModelsSection from '@/components/landing/IntentModelsSection';

export const metadata: Metadata = {
  title: 'INTENT Model Research',
  description: 'INTENT recurrent language-model research, inference experimentation, and the LooseMouth interface at Global Intent Company.',
  alternates: { canonical: '/models' },
};

export default function ModelsPage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">Model research</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">INTENT language-model architectures.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Follow the work on recurrent language models, training, inference, and systems designed to be controlled by their operators.</p>
        </div>
      </section>
      <IntentModelsSection />
      <section className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Looking for BitVision decision-model research?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">BitVision has its own research overview and live browser-local Cell demonstration.</p>
          </div>
          <Link href="/bitvision" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Explore BitVision <ArrowRight size={16} /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
