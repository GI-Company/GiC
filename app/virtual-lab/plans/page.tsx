import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import VirtualLabPlans from '@/components/virtual-lab/VirtualLabPlans';

export const metadata: Metadata = {
  title: 'VirtualLab Subscriptions',
  description: 'Two VirtualLab-specific subscription options for research workflows, independent from LooseMouth.',
  alternates: { canonical: '/virtual-lab/plans' },
};

export default function PlansPage() {
  return <MarketingShell><section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">VirtualLab / Access</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Researcher or Laboratory</h1>
    <p className="mt-4 max-w-3xl text-slate-600">VirtualLab subscriptions are separate from GIC's general LooseMouth plans. Checkout is hosted by Stripe. Only tested capabilities are offered today; team collaboration, instrument integrations and INTENT research validation remain future work.</p>
    <VirtualLabPlans/>
  </section></MarketingShell>;
}
