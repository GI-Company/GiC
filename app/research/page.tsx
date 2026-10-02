import React from 'react';
import type { Metadata } from 'next';
import SpatialResearchApp from '@/components/SpatialResearchApp';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Machine-learning research, experiments, measured results, and technical evidence from Global Intent Company.',
  alternates: { canonical: '/research' },
};

export default function ResearchDomainPage() {
  return <SpatialResearchApp initialDomain="machine_learning" />;
}
