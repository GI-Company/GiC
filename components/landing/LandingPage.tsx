import MarketingShell from '@/components/landing/MarketingShell';
import LandingAuthRedirect from '@/components/landing/LandingAuthRedirect';
import LandingHero from '@/components/landing/LandingHero';
import LandingDirectory from '@/components/landing/LandingDirectory';

export default function LandingPage() {
  return (
    <MarketingShell home>
      <LandingAuthRedirect />
      <LandingHero />
      <LandingDirectory />
    </MarketingShell>
  );
}
