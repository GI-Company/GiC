import React from 'react';
import type { Metadata } from 'next';
import SpatialResearchApp from '@/components/SpatialResearchApp';

export const metadata: Metadata = {
  title: 'Systems',
  description: 'Systems research and engineering across private AI infrastructure, runtimes, protocols, and computing architecture.',
  alternates: { canonical: '/systems' },
};

export default function SystemsDomainPage() {
  return <SpatialResearchApp initialDomain="systems_research" />;
}
