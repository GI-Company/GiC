export type IntentCheckpoint = 'facts500' | 'sft1000';
export type LooseMouthModel = 'standard' | 'mini' | 'sft1000';

export function intentCheckpoint(value: unknown): IntentCheckpoint {
  return value === 'sft1000' ? 'sft1000' : 'facts500';
}

export function modelDestination(model: LooseMouthModel): string {
  if (model === 'standard') return '/intent';
  return `/intent?mini=1&checkpoint=${model === 'sft1000' ? 'sft1000' : 'facts500'}`;
}

export const INTENT_CHECKPOINTS = {
  facts500: {
    label: 'Facts-500',
    lineage: '10,000 pretraining steps, SFT-v2 step 750, then 500 facts fine-tuning updates.',
  },
  sft1000: {
    label: 'SFT-1000',
    lineage: '10,000 pretraining steps followed by 1,000 ChatML supervised fine-tuning steps.',
  },
} as const;
