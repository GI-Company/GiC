import type { Metadata } from 'next';
import ResearchIndexPage from '@/components/enterprise/ResearchIndexPage';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research questions, experiments, measured results, and technical evidence from Global Intent Company.',
  alternates: { canonical: '/research' },
};

export default function ResearchPage() {
  return <ResearchIndexPage />;
}
