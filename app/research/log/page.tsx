import React from 'react';
import SpatialResearchApp from '@/components/SpatialResearchApp';

export const metadata = {
  title: 'Research Logs & Chronology | Global Intent Company',
  description: 'Chronological timeline of research questions, source code implementations, controlled experiments, null results, and founder research logs.',
};

export default function ResearchLogPage() {
  return (
    <SpatialResearchApp initialActiveTab="research-log" />
  );
}
