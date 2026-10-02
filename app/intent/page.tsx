import type { Metadata } from 'next';
import IntentClient from '@/components/intent/IntentClient';

export const metadata: Metadata = {
  title: 'INTENT & LooseMouth',
  description: 'Explore the INTENT model family and talk to LooseMouth, Global Intent Company’s public research inference interface.',
  alternates: { canonical: '/intent' },
  openGraph: {
    title: 'INTENT & LooseMouth',
    description: 'Explore the INTENT model family and Global Intent Company’s public research inference interface.',
    url: '/intent',
  },
};

export default function IntentPage() {
  return <IntentClient />;
}
