'use client';
import { useState } from 'react';
import { createEvidenceLedger, verifyEvidenceLedger, type EvidenceLedger } from '@/lib/virtual-lab-ledger';
const examples = [
  { id: 'pristine', label: 'Unchanged bundle' }, { id: 'artifact', label: 'Alter artifact bytes' },
  { id: 'genesis', label: 'Alter genesis link' }, { id: 'missing', label: 'Remove an artifact' },
] as const;
export default function EvidenceLedgerPanel({ entries }: { entries: unknown[] }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyEvidenceLedger>> | null>(null);
  const [bundle, setBundle] = useState<EvidenceLedger | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function examine(id: typeof examples[number]['id']) {
    setBusy(true); setError('');
    try {
      const value = await createEvidenceLedger([{ state: 'SIMULATED', kind: 'Demonstration', input: { synthesis: 1.2 } }, { state: 'SIMULATED', kind: 'Demonstration note', text: 'Checksum integrity is not source authentication.' }]);
      if (id === 'artifact') value.artifacts[0].content += ' ';
      if (id === 'genesis') value.events[0].previousHash = 'tampered';
      if (id === 'missing') value.artifacts.pop();
      setBundle(value); setResult(await verifyEvidenceLedger(value));
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function importLedger(file?: File) {
    if (!file) return;
    setBusy(true); setError(''); setResult(null); setBundle(null);
    try {
      if (file.size > 2000000) throw new Error('Select a JSON ledger no larger than 2 MB.');
      const value = JSON.parse(await file.text()), verified = await verifyEvidenceLedger(value);
      setResult(verified); if (verified.valid) setBundle(value);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function exportLedger() {
    setBusy(true); setError('');
    try {
      const value = await createEvidenceLedger(entries);
      const serialized = JSON.stringify(value, null, 2);
      if (new Blob([serialized]).size > 2000000) throw new Error('Ledger exceeds the 2 MB export/import limit; clear the session or export fewer entries.');
      setBundle(value); setResult(await verifyEvidenceLedger(value));
      const url = URL.createObjectURL(new Blob([serialized], { type: 'application/json' })), a = document.createElement('a');
      a.href = url; a.download = 'gic-evidence-ledger.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100">
    <h4 className="font-semibold">Evidence ledger &amp; tamper checks</h4><p className="text-sm leading-6 text-slate-300">Calculate SHA-256 hashes over actual artifact bytes and event links. These portable browser ledgers are unsigned JSON, not authenticated .vlab archives.</p>
    <div className="grid gap-2 sm:grid-cols-2">{examples.map(example => <button disabled={busy} key={example.id} onClick={() => void examine(example.id)} type="button" className="rounded-lg border border-slate-600 px-3 py-3 text-left text-sm hover:bg-slate-800 disabled:opacity-50">{example.label}</button>)}</div>
    <div className="space-y-3 rounded-lg bg-slate-900 p-3"><button type="button" disabled={busy || !entries.length} onClick={() => void exportLedger()} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">Export session as hash-linked ledger ({entries.length} entries)</button><label className="block text-sm">Verify a saved ledger<input type="file" disabled={busy} accept=".json,application/json" onChange={e => void importLedger(e.target.files?.[0])} className="mt-2 block w-full text-xs"/></label></div>
    {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
    {result && <div role="status" className={'rounded-lg border p-4 text-sm ' + (result.valid ? 'border-emerald-600 bg-emerald-950 text-emerald-100' : 'border-rose-600 bg-rose-950 text-rose-100')}><strong className="font-mono">{result.code}</strong><p className="mt-2">{result.message}</p></div>}
    {bundle && <details className="rounded-lg border border-slate-700 p-3"><summary className="cursor-pointer text-sm">Inspect artifacts, chain and root</summary><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all text-[11px]">{JSON.stringify(bundle, null, 2)}</pre></details>}
    <p className="text-xs leading-5 text-slate-400">A party can rewrite a ledger and recompute all its hashes. Source authentication requires independent trusted signatures; this tool makes no signature or hardware-provenance claim.</p>
  </section>;
}
