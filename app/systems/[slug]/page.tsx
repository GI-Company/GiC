import React from 'react';
import SpatialResearchApp from '@/components/SpatialResearchApp';
import { SLUG_TO_NODE_ID } from '@/lib/spatial-router';

export function generateStaticParams() {
  return [
    { slug: 'kernos' },
    { slug: 'acmk' },
    { slug: 'aetheros' },
    { slug: 'kb' },
  ];
}

export default async function SystemsProjectPage({
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
      initialDomain="systems_research"
      initialNodeId={nodeId}
      initialSection={sp.section || null}
    />
  );
}
