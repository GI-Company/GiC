import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import LandingFooterCTA from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Contact Global Intent Company',
  description: 'Contact Global Intent Company about research, private AI infrastructure, Virtual Lab, technical evaluation, or collaboration without leaving the site.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <MarketingShell showFooter={false}>
      <section className="bg-slate-950 px-4 pt-10 text-white sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-blue-300">Direct contact</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Contact Global Intent Company.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">Reach out about research, private AI systems, partnerships, or technical evaluation using the on-site form or the direct email link.</p>
        </div>
      </section>
      <LandingFooterCTA />
    </MarketingShell>
  );
}
