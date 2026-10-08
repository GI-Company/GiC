import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import ProblemSection from '@/components/landing/ProblemSection';
import StackArchitectureSection from '@/components/landing/StackArchitectureSection';
import PLMHSection from '@/components/landing/PLMHSection';
import PLMNSection from '@/components/landing/PLMNSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Technology',
  description: 'Private AI infrastructure, model networking, and technical architecture from Global Intent Company.',
  alternates: { canonical: '/technology' },
};

export default function TechnologyPage() {
  return (
    <div className="enterprise-site bg-white text-slate-950">
      <LandingNav />
      <main className="pt-[4.5rem]">
        <div className="min-h-[calc(100dvh-4.5rem)]"><ProblemSection /></div>
        <div className="min-h-[100dvh]"><StackArchitectureSection /></div>
        <div className="min-h-[100dvh]"><PLMHSection /></div>
        <div className="min-h-[100dvh]"><PLMNSection /></div>
      </main>
      <LandingFooterCTA />
    </div>
  );
}
