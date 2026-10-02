import type { Metadata } from 'next';
import EnterpriseResearchLog from '@/components/enterprise/EnterpriseResearchLog';

export const metadata: Metadata = {
  title: 'Research Logs & Chronology',
  description: 'Chronological timeline of research questions, source implementations, experiments, results, null results, and iterations from Global Intent Company.',
  alternates: { canonical: '/research/log' },
};

export default function ResearchLogPage() {
  return <EnterpriseResearchLog />;
}
