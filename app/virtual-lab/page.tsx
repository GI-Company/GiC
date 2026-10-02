import React from 'react';
import type { Metadata } from 'next';
import SpatialResearchApp from '@/components/SpatialResearchApp';

export const metadata: Metadata = {
  title: 'Virtual Lab',
  description: 'Scientific computing, instrumentation, simulation, evidence packaging, and reproducible research workflows from Global Intent Company.',
  alternates: { canonical: '/virtual-lab' },
};

export default function VirtualLabDomainPage() {
  return <SpatialResearchApp initialDomain="virtual_lab" />;
}
