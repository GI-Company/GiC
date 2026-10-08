import type { Metadata } from 'next';
import Link from 'next/link';
import BitVisionCellEmbed from '@/components/virtual-lab/BitVisionCellEmbed';

export const metadata: Metadata = {
  title: 'BitVision-Cell Live Inference | Global Intent Company',
  description: 'Run BitVision-Cell v0.2 checkpoint 500 in your browser and inspect its complete measurement dashboard, policy actions, and episode trajectory.',
  alternates: { canonical: '/virtual-lab/bitvision-cell' },
};

export default function BitVisionCellPage() {
  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-sm font-semibold">BitVision-Cell v0.2</h1>
          <p className="text-xs text-slate-400">Checkpoint 500 · 8.75M parameters · browser-local inference</p>
        </div>
        <nav aria-label="BitVision-Cell navigation" className="flex flex-wrap items-center gap-2">
          <Link href="/bitvision" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">BitVision research</Link>
          <Link href="/virtual-lab" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">Virtual Lab</Link>
          <Link href="/" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">GIC</Link>
        </nav>
      </header>
      <BitVisionCellEmbed />
    </main>
  );
}
