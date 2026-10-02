import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectDossierPage from '@/components/enterprise/ProjectDossierPage';
import { RESEARCH_NODES } from '@/lib/research-data';
import { NODE_ID_TO_SLUG, SLUG_TO_NODE_ID } from '@/lib/spatial-router';

const domain = 'virtual_lab' as const;

export function generateStaticParams() {
  return RESEARCH_NODES
    .filter((node) => node.domain === domain)
    .map((node) => ({ slug: NODE_ID_TO_SLUG[node.id] || node.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const nodeId = SLUG_TO_NODE_ID[slug] || slug;
  const node = RESEARCH_NODES.find((item) => item.id === nodeId && item.domain === domain);
  if (!node) return {};
  return {
    title: node.name,
    description: node.summary,
    alternates: { canonical: `/virtual-lab/${slug}` },
  };
}

export default async function VirtualLabProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nodeId = SLUG_TO_NODE_ID[slug] || slug;
  const node = RESEARCH_NODES.find((item) => item.id === nodeId && item.domain === domain);
  if (!node) notFound();
  return <ProjectDossierPage nodeId={node.id} expectedDomain={domain} />;
}
