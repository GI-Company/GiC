import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import CompanyFounderSection from '@/components/landing/CompanyFounderSection';
import CompanyVisionSection from '@/components/landing/CompanyVisionSection';
import PrinciplesSection from '@/components/landing/PrinciplesSection';

export const metadata: Metadata = {
  title: 'Company & Mission',
  description: 'The founder, vision, values, and research direction of Global Intent Company.',
  alternates: { canonical: '/company' },
};

export default function CompanyPage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">About Global Intent Company</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Independent AI research and systems engineering.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">The people, objectives, and operating principles behind GIC’s research and private-AI infrastructure development.</p>
        </div>
      </section>
      <CompanyFounderSection />
      <CompanyVisionSection />
      <PrinciplesSection />
    </MarketingShell>
  );
}
