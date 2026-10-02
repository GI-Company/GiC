import React from 'react';
import type { Metadata } from 'next';
import SpatialResearchApp from '@/components/SpatialResearchApp';

export const metadata: Metadata = {
  title: 'Software',
  description: 'Shipped software and product engineering from Global Intent Company.',
  alternates: { canonical: '/software' },
};

export default function SoftwareDomainPage() {
  return <SpatialResearchApp initialDomain="shipped_software" />;
}
