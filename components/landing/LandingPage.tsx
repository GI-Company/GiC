'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.get('access_token') && params.get('refresh_token')) {
      window.location.replace(`/intent${window.location.search}${hash}`);
    }
  }, []);

  return (
    <div className="enterprise-site min-h-screen bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-950">
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
