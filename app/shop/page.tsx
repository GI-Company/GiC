import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import ApparelSection from '@/components/landing/ApparelSection';

export const metadata: Metadata = {
  title: 'Global Intent Company Shop',
  description: 'Support Global Intent Company through research merchandise and apparel.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">GIC merchandise</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">The Global Intent Company shop.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Browse GIC apparel and support ongoing independent model and infrastructure research.</p>
        </div>
      </section>
      <ApparelSection />
    </MarketingShell>
  );
}
