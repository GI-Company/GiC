import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import BillingSection from '@/components/landing/BillingSection';

export const metadata: Metadata = {
  title: 'LooseMouth Plans & Research Support',
  description: 'Compare Free, Paid, and Enhanced LooseMouth access and support private AI research from Global Intent Company.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">Plans and access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Choose the LooseMouth workspace that fits your work.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Compare access levels, trial terms, and ways to support ongoing GIC research.</p>
        </div>
      </section>
      <BillingSection />
    </MarketingShell>
  );
}
