'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';

type LooseMouthModel = 'standard' | 'mini';

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
  const router = useRouter();
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
          router.push(next === 'mini' ? '/intent?mini=1' : '/intent');
        }}
        className={`min-h-11 min-w-0 rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm outline-none transition hover:border-blue-600 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 ${compact ? 'max-w-full w-full sm:w-auto' : 'w-full'}`}
      >
        <option value="standard">LooseMouth · Fast / Medium / Enhanced</option>
        <option value="mini">LooseMouth Mini · INTENT-F RLSE-v2 (187.3M)</option>
      </select>
      {selected === 'mini' && <span className="text-xs font-semibold text-amber-800">Experimental · hosted on Hugging Face</span>}
    </div>
  );
}
