'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useIntentPwa } from '@/components/intent/IntentPwaProvider';

export default function IntentPwaControls({ compact = false }: { compact?: boolean }) {
  const {
    installed,
    installAvailable,
    iosInstallHint,
    updateAvailable,
    install,
    applyUpdate,
    checkForUpdate,
  } = useIntentPwa();

  if (installed && !updateAvailable && compact) {
    return (
      <button
        type="button"
        onClick={() => void checkForUpdate()}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      >
        <RefreshCw size={14} /> Check update
      </button>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'rounded-xl border border-slate-200 bg-slate-50 p-4'}>
      {updateAvailable ? (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={15} /> Update LooseMouth
        </button>
      ) : installAvailable ? (
        <button
          type="button"
          onClick={() => void install()}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Download size={15} /> Install chat app
        </button>
      ) : iosInstallHint ? (
        <p className="text-xs leading-5 text-slate-600">
          On iPhone or iPad, use Share → Add to Home Screen. The Home Screen app opens LooseMouth in standalone mode without Safari chrome.
        </p>
      ) : installed ? (
        <p className="text-xs font-medium text-emerald-700">LooseMouth is installed.</p>
      ) : (
        <p className="text-xs leading-5 text-slate-500">
          Install becomes available when your browser supports app installation.
        </p>
      )}
    </div>
  );
}
