import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import BillingSection from '@/components/landing/BillingSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description: 'LooseMouth Free, Paid, and Enhanced workspace plans plus support for Global Intent Company research.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <div className="enterprise-site bg-white text-slate-950">
      <LandingNav />
      <main className="min-h-[100dvh] pt-[4.5rem]">
        <BillingSection />
      </main>
      <LandingFooterCTA />
    </div>
  );
}
