import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import ApparelSection from '@/components/landing/ApparelSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Global Intent Company apparel and merchandise.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <div className="enterprise-site bg-white text-slate-950">
      <LandingNav />
      <main className="min-h-[100dvh] pt-[4.5rem]">
        <ApparelSection />
      </main>
      <LandingFooterCTA />
    </div>
  );
}
