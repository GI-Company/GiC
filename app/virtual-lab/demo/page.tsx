import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import VirtualLabAccess from '@/components/virtual-lab/VirtualLabAccess';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'VirtualLab Research Studio — Scientific Workspace',
  description: 'Explore VirtualLab Free, Researcher and Laboratory workspaces with scientific simulations, evidence review and desktop-inspired navigation inside Global Intent Company.',
  alternates: { canonical: '/virtual-lab/demo' },
};

export default function VirtualLabDemoPage() {
  return <MarketingShell>
    <VirtualLabAccess privateReaderEnabled={process.env.VLAB_RESEARCH_READER_ENABLED === 'true'}/>
  </MarketingShell>;
}
