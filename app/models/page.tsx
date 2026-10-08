import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';
import IntentModelsSection from '@/components/landing/IntentModelsSection';
import BitVisionSection from '@/components/landing/BitVisionSection';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Models',
  description: 'INTENT language models and BitVision research from Global Intent Company.',
  alternates: { canonical: '/models' },
};

export default function ModelsPage() {
  return (
    <div className="enterprise-site bg-white text-slate-950">
      <LandingNav />
      <main className="pt-[4.5rem]">
        <div className="min-h-[calc(100dvh-4.5rem)]"><IntentModelsSection /></div>
        <div className="min-h-[100dvh]"><BitVisionSection /></div>
      </main>
      <LandingFooterCTA />
    </div>
  );
}
