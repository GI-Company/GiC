import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import ProblemSection from '@/components/landing/ProblemSection';
import StackArchitectureSection from '@/components/landing/StackArchitectureSection';
import ResearchEngineSection from '@/components/landing/ResearchEngineSection';

export const metadata: Metadata = {
  title: 'Technology & Architecture',
  description: 'Explore Global Intent Company’s private AI architecture, model execution boundaries, research evidence, and systems engineering.',
  alternates: { canonical: '/technology' },
};

export default function TechnologyPage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">GIC technology</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Private AI architecture, from models to infrastructure.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Learn how GIC approaches model execution, system boundaries, verification, and evidence-led engineering.</p>
        </div>
      </section>
      <ProblemSection />
      <StackArchitectureSection />
      <ResearchEngineSection />
    </MarketingShell>
  );
}
