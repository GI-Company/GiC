import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import PLMHSection from '@/components/landing/PLMHSection';
import PLMNSection from '@/components/landing/PLMNSection';

export const metadata: Metadata = {
  title: 'Private AI Infrastructure',
  description: 'PLMH and PLMN: operator-managed private AI hubs, connected model nodes, authentication, readiness, and inference.',
  alternates: { canonical: '/infrastructure' },
};

export default function InfrastructurePage() {
  return (
    <MarketingShell>
      <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-700">Private model infrastructure</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">PLM hubs and nodes.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">The infrastructure layer of GIC: operator-hosted model execution, device identities, network boundaries, and verifiable connections.</p>
        </div>
      </section>
      <PLMHSection />
      <PLMNSection />
    </MarketingShell>
  );
}
