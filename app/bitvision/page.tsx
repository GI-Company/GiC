import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingShell from '@/components/landing/MarketingShell';
import BitVisionSection from '@/components/landing/BitVisionSection';

export const metadata: Metadata = {
  title: 'BitVision Research',
  description: 'BitVision learning-model research and the BitVision-Cell v0.2 live ONNX checkpoint demonstration.',
  alternates: { canonical: '/bitvision' },
};

export default function BitVisionPage() {
  return (
    <MarketingShell>
      <section className="bg-slate-950 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-cyan-300">BitVision research program</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Learning systems built around measurable decisions.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">Explore BitVision self-play research and run the BitVision-Cell policy directly in your browser. Public demonstrations document results and limitations separately from architectural goals.</p>
          <Link href="/virtual-lab/bitvision-cell" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200">Open BitVision-Cell dashboard <ArrowRight size={16} /></Link>
        </div>
      </section>
      <BitVisionSection />
    </MarketingShell>
  );
}
