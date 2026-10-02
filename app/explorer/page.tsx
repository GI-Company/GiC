import type { Metadata } from 'next';
import SpatialResearchApp from '@/components/SpatialResearchApp';
import { RESEARCH_DOMAINS, RESEARCH_NODES, ResearchDomain } from '@/lib/research-data';

export const metadata: Metadata = {
  title: 'Technical Research Explorer',
  description: 'Interactive technical research environment for Global Intent Company projects, experiments, simulators, and evidence.',
  robots: { index: false, follow: true },
};

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams?: Promise<{ domain?: string; node?: string; section?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const requestedDomain = params.domain as ResearchDomain | undefined;
  const domain = requestedDomain && RESEARCH_DOMAINS.some((item) => item.id === requestedDomain)
    ? requestedDomain
    : null;
  const node = params.node && RESEARCH_NODES.some((item) => item.id === params.node)
    ? params.node
    : null;

  return (
    <SpatialResearchApp
      initialDomain={node ? RESEARCH_NODES.find((item) => item.id === node)?.domain || domain : domain}
      initialNodeId={node}
      initialSection={params.section || null}
    />
  );
}
