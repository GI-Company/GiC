'use client';

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
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
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
      </main>
      <LandingFooterCTA />
    </div>
  );
}
