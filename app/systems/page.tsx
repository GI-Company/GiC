import type { Metadata } from 'next';
import SystemsIndexPage from '@/components/enterprise/SystemsIndexPage';

export const metadata: Metadata = {
  title: 'Systems',
  description: 'Private AI infrastructure, runtimes, protocols, verification, and systems architecture from Global Intent Company.',
  alternates: { canonical: '/systems' },
};

export default function SystemsPage() {
  return <SystemsIndexPage />;
}
