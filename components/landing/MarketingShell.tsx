import type { ReactNode } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import MarketingFooter from '@/components/landing/MarketingFooter';

export default function MarketingShell({
  children,
  home = false,
  showFooter = true,
}: {
  children: ReactNode;
  home?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className="enterprise-site min-h-screen min-w-0 bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-950">
      <LandingNav />
      <main className={home ? 'min-w-0' : 'min-w-0 pt-[72px]'}>
        {children}
      </main>
      {showFooter && <MarketingFooter />}
    </div>
  );
}
