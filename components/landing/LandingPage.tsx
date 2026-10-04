import React from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import ProblemSection from '@/components/landing/ProblemSection';
import StackArchitectureSection from '@/components/landing/StackArchitectureSection';
import IntentModelsSection from '@/components/landing/IntentModelsSection';
import PLMHSection from '@/components/landing/PLMHSection';
import PLMNSection from '@/components/landing/PLMNSection';
import ResearchEngineSection from '@/components/landing/ResearchEngineSection';
import PrinciplesSection from '@/components/landing/PrinciplesSection';
import CompanyFounderSection from '@/components/landing/CompanyFounderSection';
import ApparelSection from '@/components/landing/ApparelSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';
import LandingAuthRedirect from '@/components/landing/LandingAuthRedirect';

export default function LandingPage() {
  return (
    <div className="enterprise-site min-h-screen bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-950">
      <LandingAuthRedirect />
      <LandingNav />
      <main>
        <LandingHero />
        <ProblemSection />
        <StackArchitectureSection />
        <IntentModelsSection />
        <PLMHSection />
        <PLMNSection />
        <ResearchEngineSection />
        <PrinciplesSection />
        <CompanyFounderSection />
        <ApparelSection />
      </main>
      <LandingFooterCTA />
    </div>
  );
}
