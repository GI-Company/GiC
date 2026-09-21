import React from 'react';
import SpatialResearchApp from '@/components/SpatialResearchApp';
import { SLUG_TO_NODE_ID } from '@/lib/spatial-router';

export function generateStaticParams() {
  return [
    { slug: 'sensor-node' },
    { slug: 'core' },
    { slug: 'virtual-lab' },
    { slug: 'evidence-vault' },
  ];
}

export default async function VirtualLabProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ section?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const nodeId = SLUG_TO_NODE_ID[slug] || slug;

  return (
    <SpatialResearchApp
      initialDomain="virtual_lab"
      initialNodeId={nodeId}
      initialSection={sp.section || null}
    />
  );
}
