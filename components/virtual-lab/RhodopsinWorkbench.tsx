'use client';
import { useState } from 'react';
import { Download, Play, RotateCcw } from 'lucide-react';
import { RHO_BOUNDS, RHO_LIMITATIONS, RHO_PRESETS, validateRhoProtocol, type RhoProtocol, type rhoEvidence } from '@/lib/virtual-lab-rhodopsin';
import { canonicalJson } from '@/lib/virtual-lab-demo';
import ShareLabSettings from './ShareLabSettings';
import { trackConversion } from '@/lib/conversion-events';
type Bundle = Awaited<ReturnType<typeof rhoEvidence>>;
const fields = ['synthesis', 'defect', 'chaperone', 'clearance'] as const;
const series = [{ key: 'nascent', label: 'Nascent pool', color: '#38bdf8' }, { key: 'aggregate', label: 'Aggregate pool', color: '#fb7185' }, { key: 'mature', label: 'Mature pool', color: '#34d399' }, { key: 'stress', label: 'Stress proxy', color: '#c084fc' }] as const;
export default function RhodopsinWorkbench({ accessToken, onEvidence, initialSettings }: { accessToken: string; onEvidence: (value: unknown) => void; initialSettings?: RhoProtocol }) {
  const [protocol, setProtocol] = useState<RhoProtocol>(() => initialSettings ? validateRhoProtocol(initialSettings) : { ...RHO_PRESETS.p23h.protocol });
  const [approval, setApproval] = useState<string | null>(null), [bundle, setBundle] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const current = canonicalJson(protocol), approved = approval === current;
  const stale = bundle && canonicalJson(bundle.payload.result.protocol) !== current;
  const result = bundle?.payload.result, peak = Math.max(1, ...(result?.points.flatMap(p => series.map(s => p[s.key])) || []));
  function edit(next: RhoProtocol) { setProtocol(next); setApproval(null); setError(''); }
  async function run() {
    if (!approved || busy) return;
    setBusy(true); setError('');
    try {
      const selected = validateRhoProtocol(protocol);
      const response = await fetch('/api/virtual-lab', { method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rho_run', protocol: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Simulation unavailable.');
      setBundle(data.bundle); onEvidence(data.bundle);
      trackConversion('gic_run_completed', { tool: 'rho' });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Simulation failed.'); }
    finally { setBusy(false); }
  }
  function exportResult() {
    if (!bundle) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'rhodopsin-model-evidence.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="space-y-5 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 sm:p-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-sky-300">RHO model · assumptions → approval → calculation</p><h3 className="mt-2 text-xl font-semibold">Folding, aggregation &amp; stress</h3><p className="mt-2 text-sm leading-6 text-slate-300">Explore the prototype&apos;s four-state equations with a bounded RK4 solver. The stress proxy is a model state, not a viability score.</p></header>
    <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{Object.entries(RHO_PRESETS).map(([id, preset]) => <button key={id} type="button" disabled={busy} onClick={() => edit({ ...preset.protocol })} className="rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50">{preset.label}</button>)}</div>
        {fields.map(key => <label key={key} className="block rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm"><span className="flex justify-between gap-3"><strong>{RHO_BOUNDS[key].label}</strong><output className="font-mono text-sky-300">{protocol[key].toFixed(2)}</output></span><input disabled={busy} type="range" aria-label={RHO_BOUNDS[key].label} min={RHO_BOUNDS[key].min} max={RHO_BOUNDS[key].max} step={RHO_BOUNDS[key].step} value={protocol[key]} onChange={e => edit({ ...protocol, [key]: Number(e.target.value) })} className="mt-3 w-full accent-sky-400"/><span className="mt-1 block text-xs text-slate-400">{RHO_BOUNDS[key].unit} · MODEL_ASSUMPTION</span></label>)}
        <label className="block text-sm font-semibold">Duration (hours)<input disabled={busy} type="number" min={1} max={72} value={protocol.duration} onChange={e => edit({ ...protocol, duration: Number(e.target.value) })} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 p-2"/></label>
        <label className="flex items-start gap-2 rounded-lg bg-slate-900 p-3 text-sm"><input disabled={busy} type="checkbox" checked={approved} onChange={e => { try { validateRhoProtocol(protocol); setApproval(e.target.checked ? current : null); setError(''); } catch (cause) { setError((cause as Error).message); } }} className="mt-1"/><span>I reviewed these assumed rates and approve this simulation.</span></label>
        <button type="button" disabled={!approved || busy} onClick={() => void run()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40"><Play size={16}/>{busy ? 'Calculating…' : 'Run approved RHO model'}</button>
        <button type="button" disabled={busy} onClick={() => edit({ ...RHO_PRESETS.p23h.protocol })} className="flex items-center gap-2 text-xs text-slate-300"><RotateCcw size={14}/>Reset assumptions</button>
        <ShareLabSettings value={{ tool: 'rho', settings: protocol }}/>
      </div>
      <div className="min-w-0 space-y-4">
        {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950 p-3 text-sm text-rose-100">{error}</p>}
        {stale && <p role="status" className="rounded-lg border border-amber-600 bg-amber-950 p-3 text-sm text-amber-100">Previous approved results are shown. Edited settings have not run.</p>}
        {result ? <><div className="grid grid-cols-2 gap-3">{[['Mature pool fraction', (100 * result.matureFraction).toFixed(1) + '%'], ['Aggregate pool fraction', (100 * result.aggregateFraction).toFixed(1) + '%'], ['Assumed clearance half-life', result.clearanceHalfLife.toFixed(2) + ' h'], ['Final stress proxy', result.points.at(-1)!.stress.toFixed(3)]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-mono text-xl">{value}</p></div>)}</div>
          <figure className="rounded-xl border border-slate-700 bg-slate-900 p-3"><svg viewBox="0 0 700 300" className="w-full" role="img" aria-label="Simulated nascent, aggregate, mature and stress trajectories">{[0, .5, 1].map(v => <g key={v}><line x1={50} x2={675} y1={250 - v * 220} y2={250 - v * 220} stroke="#334155"/><text x={44} y={254 - v * 220} textAnchor="end" fill="#cbd5e1" fontSize={12}>{(peak * v).toFixed(1)}</text></g>)}{series.map(s => <polyline key={s.key} fill="none" stroke={s.color} strokeWidth={2.4} points={result.points.map(p => `${50 + p.time / result.protocol.duration * 625},${250 - p[s.key] / peak * 220}`).join(' ')}/>)}<text x={50} y={280} fill="#cbd5e1" fontSize={12}>0 h</text><text x={675} y={280} textAnchor="end" fill="#cbd5e1" fontSize={12}>{result.protocol.duration} h</text></svg><figcaption className="flex flex-wrap gap-3 text-xs">{series.map(s => <span key={s.key} style={{ color: s.color }}>{s.label}</span>)}</figcaption></figure>
          <div className="rounded-xl bg-slate-900 p-4 text-xs leading-6"><strong className="text-emerald-300">SIMULATED · RK4 · 2,400 steps</strong><p>Model initials: nascent 1, aggregate 0.1, mature 0.2, stress 0.05. Output and complete assumptions are bound into the exported checksum.</p><p className="mt-2 break-all font-mono text-slate-400">SHA-256 {bundle!.sha256}</p><button type="button" onClick={exportResult} className="mt-3 flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2"><Download size={15}/>Export model evidence</button></div></> : <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-600 p-8 text-center text-sm text-slate-400">Choose a scenario, review its assumptions, and approve execution to plot computed trajectories.</div>}
      </div>
    </div>
    <details className="rounded-xl border border-slate-700 p-4 text-xs leading-6 text-slate-300"><summary className="cursor-pointer font-semibold">Equations and limitations</summary><pre className="mt-3 overflow-auto">{'dN/dt = synthesis − (fold + misfold + 0.1 clearance) N\ndA/dt = misfold N − clearance A\ndM/dt = fold N − 0.08 M\ndS/dt = 0.25 A − 0.3 S\nfold = 0.45(1 − effectiveDefect)\nmisfold = 0.38 effectiveDefect\neffectiveDefect = defect (1 − 0.72 chaperone)'}</pre><p className="mt-3">{RHO_LIMITATIONS}</p></details>
  </section>;
}
