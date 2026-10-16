'use client';

import { useId } from 'react';

import { modelDestination, type LooseMouthModel } from '@/lib/intent-models';

/**
 * Selects the available LooseMouth experience without confusing hosted
 * Fast/Medium/Enhanced service modes with independently trained INTENT models.
 * Add new INTENT checkpoints here only after their test routes are deployed.
 */
export default function LooseMouthModelPicker({
  selected,
  compact = false,
}: {
  selected: LooseMouthModel;
  compact?: boolean;
}) {
  const id = useId();

  return (
    <div className={compact
      ? 'flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'
      : 'flex w-full min-w-0 flex-col gap-2'
    }>
      <label htmlFor={id} className="shrink-0 text-sm font-semibold text-slate-800">
        LooseMouth models
      </label>
      <select
        id={id}
        name="loosemouth-model"
        value={selected}
        onChange={(event) => {
          const next = event.currentTarget.value as LooseMouthModel;
          if (next === selected) return;
          window.location.assign(modelDestination(next));
        }}
        className={`min-h-11 min-w-0 rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm outline-none transition hover:border-blue-600 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 ${compact ? 'max-w-full w-full sm:w-auto' : 'w-full'}`}
      >
        <option value="standard">LooseMouth · Gemini (Fast / Medium / Enhanced)</option>
        <option value="mini">INTENT RLSE-v2 · Facts-500</option>
        <option value="sft1000">INTENT RLSE-v2 · SFT-1000</option>
      </select>
      {selected !== 'standard' && <span className="text-xs font-semibold text-amber-800">Experimental · hosted on Hugging Face</span>}
    </div>
  );
}
