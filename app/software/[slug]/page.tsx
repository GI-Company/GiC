import React from 'react';
import SpatialResearchApp from '@/components/SpatialResearchApp';
import { SLUG_TO_NODE_ID } from '@/lib/spatial-router';

export function generateStaticParams() {
  return [
    { slug: 'quantumology' },
    { slug: 'ggslots' },
    { slug: 'resume-builder' },
    { slug: 'resumebuilder' },
  ];
}

export default async function SoftwareProjectPage({
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
      initialDomain="shipped_software"
      initialNodeId={nodeId}
      initialSection={sp.section || null}
    />
  );
}
