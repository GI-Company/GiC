import React from 'react';
import SpatialResearchApp from '@/components/SpatialResearchApp';
import { SLUG_TO_NODE_ID } from '@/lib/spatial-router';

export function generateStaticParams() {
  return [
    { slug: 'tinycoherent' },
    { slug: 'cortex-ms' },
    { slug: 'bnlm' },
    { slug: 'cortex' },
    { slug: 'physiological-model' },
  ];
}

export default async function ResearchProjectPage({
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
      initialDomain="machine_learning"
      initialNodeId={nodeId}
      initialSection={sp.section || null}
    />
  );
}
