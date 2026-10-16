import type { Metadata } from 'next';
import IntentMiniStudio from '@/components/intent/IntentMiniStudio';
import { intentCheckpoint } from '@/lib/intent-models';

export const metadata: Metadata = {
  title: 'LooseMouth Mini | INTENT-F Research Studio',
  description: 'Try INTENT Foundation RLSE-v2, an experimental 187.3M parameter language model trained from scratch, with live recurrent-search telemetry.',
  alternates: { canonical: '/intent/mini' },
};

export default async function IntentMiniPage({ searchParams }: {
  searchParams: Promise<{ checkpoint?: string | string[] }>;
}) {
  const params = await searchParams;
  return <IntentMiniStudio checkpoint={intentCheckpoint(params.checkpoint)} />;
}
