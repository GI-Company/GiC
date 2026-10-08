import React from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingAuthRedirect from '@/components/landing/LandingAuthRedirect';

export default function LandingPage() {
  return (
    <div className="enterprise-site min-h-[100dvh] bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-950">
      <LandingAuthRedirect />
      <LandingNav />
      <main className="min-h-[100dvh]">
        <LandingHero />
      </main>
    </div>
  );
}
