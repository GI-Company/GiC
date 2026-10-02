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
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Global Intent Company — INTENT & LooseMouth' }],
  },
};

export default function IntentPage() {
  return <IntentClient />;
}
