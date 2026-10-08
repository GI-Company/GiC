import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import PrinciplesSection from '@/components/landing/PrinciplesSection';
import CompanyFounderSection from '@/components/landing/CompanyFounderSection';
import CompanyVisionSection from '@/components/landing/CompanyVisionSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Company',
  description: 'Global Intent Company mission, founder, principles, vision, and contact information.',
  alternates: { canonical: '/company' },
};

export default function CompanyPage() {
  return (
    <div className="enterprise-site bg-white text-slate-950">
      <LandingNav />
      <main className="pt-[4.5rem]">
        <div className="min-h-[calc(100dvh-4.5rem)]"><PrinciplesSection /></div>
        <div className="min-h-[100dvh]"><CompanyFounderSection /></div>
        <div className="min-h-[100dvh]"><CompanyVisionSection /></div>
      </main>
      <LandingFooterCTA />
    </div>
  );
}
