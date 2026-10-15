import type { Metadata } from 'next';
import IntentMiniStudio from '@/components/intent/IntentMiniStudio';

export const metadata: Metadata = {
  title: 'LooseMouth Mini | INTENT-F Research Studio',
  description: 'Try INTENT Foundation RLSE-v2, an experimental 187.3M parameter language model trained from scratch, with live recurrent-search telemetry.',
  alternates: { canonical: '/intent/mini' },
};

export default function IntentMiniPage() {
  return <IntentMiniStudio />;
}
