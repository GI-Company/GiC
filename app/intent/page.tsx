import type { Metadata } from 'next';
import IntentAuthGate from '@/components/intent/IntentAuthGate';

export const metadata: Metadata = {
  title: 'INTENT & LooseMouth',
  description: 'Explore the INTENT model family and talk to LooseMouth, Global Intent Company’s authenticated public research inference interface.',
  alternates: { canonical: '/intent' },
  openGraph: {
    title: 'INTENT & LooseMouth',
    description: 'Explore the INTENT model family and Global Intent Company’s authenticated public research inference interface.',
    url: '/intent',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Global Intent Company — INTENT & LooseMouth' }],
  },
};

export default function IntentPage() {
  return <IntentAuthGate />;
}
