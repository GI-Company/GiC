import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'BitVision-Cell Live Inference | Global Intent Company',
  description:
    'Run BitVision-Cell v0.2 checkpoint 500 live in the browser against a synthetic tissue/pathogen simulator.',
};

export default function BitVisionCellPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold">BitVision-Cell v0.2</p>
          <p className="text-xs text-slate-400">Checkpoint 500 • 8.75M parameters • browser-local inference</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/virtual-lab"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            Virtual Lab
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            GIC
          </Link>
        </div>
      </div>

      <iframe
        src="/bitvision-cell-live.html"
        title="BitVision-Cell v0.2 live checkpoint inference"
        className="block h-[calc(100vh-65px)] min-h-[720px] w-full border-0 bg-slate-950"
        allow="cross-origin-isolated; fullscreen"
      />
    </main>
  );
}
