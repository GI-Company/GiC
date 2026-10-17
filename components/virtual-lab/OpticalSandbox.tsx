'use client';
import { useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { simulateOpticalFrame, type OpticalFrame, type OpticalSettings } from '@/lib/virtual-lab-optics';
import { contentHash } from '@/lib/virtual-lab-ledger';
import { canonicalJson } from '@/lib/virtual-lab-demo';
import { validateOpticalSettings } from '@/lib/virtual-lab-optics';
import ShareLabSettings from './ShareLabSettings';
import { trackConversion } from '@/lib/conversion-events';
const presets = [
  { name: 'Low illumination', settings: { exposure: 10, laser: 15, gain: 1 } },
  { name: 'Reference exposure', settings: { exposure: 25, laser: 65, gain: 1 } },
  { name: 'Saturation stress test', settings: { exposure: 100, laser: 100, gain: 8 } },
];
export default function OpticalSandbox({ onEvidence, initialSettings }: { onEvidence: (value: unknown) => void; initialSettings?: OpticalSettings }) {
  const [settings, setSettings] = useState<OpticalSettings>(() => initialSettings ? validateOpticalSettings(initialSettings) : { exposure: 25, laser: 65, gain: 1 });
  const [frames, setFrames] = useState<Array<{ frame: OpticalFrame; hash: string }>>([]), [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const capture = frames[selected], stale = capture && canonicalJson(capture.frame.settings) !== canonicalJson(settings);
  async function generate() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const frame = simulateOpticalFrame(settings, (frames.at(-1)?.frame.frame_id || 0) + 1);
      const hash = await contentHash(canonicalJson(frame));
      setFrames(previous => [...previous.slice(-7), { frame, hash }]); setSelected(Math.min(frames.length, 7));
      onEvidence({ frame_id: frame.frame_id, settings: frame.settings, statistics: frame.statistics, sha256: hash, state: 'SIMULATED' });
      trackConversion('gic_run_completed', { tool: 'optics' });
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  function exportPacket() {
    if (!capture) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ packet: capture.frame, sha256: capture.hash }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `simulated-optics-frame-${capture.frame.frame_id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="space-y-5 rounded-2xl border border-slate-700 bg-slate-950 p-5 text-slate-100">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Instrument cockpit · synthetic mode</p><h3 className="mt-2 text-xl font-semibold">Optical acquisition sandbox</h3><p className="mt-2 text-sm leading-6 text-slate-300">Explore how exposure, illumination, and gain affect an assumed Gaussian intensity field. Controls generate local simulated frames; they do not send hardware commands.</p></header>
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="space-y-4"><div className="space-y-2">{presets.map(p => <button key={p.name} type="button" disabled={busy} onClick={() => setSettings({ ...p.settings })} className="block w-full rounded-lg border border-slate-600 px-3 py-2 text-left text-sm hover:bg-slate-800">{p.name}</button>)}</div>
        {([{ key: 'exposure', label: 'Exposure', min: 1, max: 100, unit: 'ms' }, { key: 'laser', label: 'Illumination', min: 0, max: 100, unit: '%' }, { key: 'gain', label: 'Gain', min: 1, max: 8, unit: '×' }] as const).map(field => <label key={field.key} className="block rounded-lg bg-slate-900 p-3 text-sm"><span className="flex justify-between gap-3">{field.label}<output className="font-mono text-sky-300">{settings[field.key]} {field.unit}</output></span><input type="range" disabled={busy} aria-label={field.label} min={field.min} max={field.max} step={1} value={settings[field.key]} onChange={e => setSettings({ ...settings, [field.key]: Number(e.target.value) })} className="mt-3 w-full accent-sky-400"/></label>)}
        <button type="button" disabled={busy} onClick={() => void generate()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-400 p-3 font-semibold text-slate-950 disabled:opacity-50"><Camera size={17}/>{busy ? 'Generating…' : 'Generate simulated frame'}</button>
        <ShareLabSettings value={{ tool: 'optics', settings }}/>
        {frames.length > 0 && <label className="block text-sm">Session frames<select value={selected} onChange={e => setSelected(Number(e.target.value))} className="mt-2 block w-full rounded-lg border border-slate-600 bg-slate-900 p-2">{frames.map((f, i) => <option key={f.frame.frame_id} value={i}>SIM frame #{f.frame.frame_id}</option>)}</select></label>}
      </div>
      <div className="min-w-0 space-y-4">
        {error && <p role="alert" className="text-rose-200">{error}</p>}
        {stale && <p role="status" className="rounded-lg bg-amber-950 p-3 text-sm text-amber-100">Settings changed. The displayed frame is the prior simulation; generate another frame to apply them.</p>}
        {capture ? <><figure className="rounded-xl border border-slate-700 bg-black p-3"><svg role="img" aria-label={`Synthetic grayscale optical frame ${capture.frame.frame_id}`} viewBox="0 0 64 48" className="mx-auto max-h-96 w-full" style={{ imageRendering: 'pixelated' }}>{capture.frame.pixels.map((value, i) => <rect key={i} x={i % 64} y={Math.floor(i / 64)} width={1} height={1} fill={`rgb(${value},${value},${value})`}/>)}</svg><figcaption className="mt-3 text-xs text-sky-300">SIMULATED · 64 × 48 pixels · frame #{capture.frame.frame_id}</figcaption></figure>
          <div className="grid grid-cols-3 gap-2">{[['Mean intensity', capture.frame.statistics.mean.toFixed(2)], ['Peak intensity', String(capture.frame.statistics.max)], ['Saturated pixels', String(capture.frame.statistics.saturated)]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-mono">{value}</p></div>)}</div>
          <details className="rounded-xl border border-slate-700 p-3"><summary className="cursor-pointer text-sm font-semibold">Inspect packet and pixel data</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[11px] text-slate-300">{JSON.stringify(capture.frame, null, 2)}</pre></details><p className="break-all font-mono text-[11px] text-slate-400">SHA-256 {capture.hash}</p><button type="button" onClick={exportPacket} className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm"><Download size={15}/>Export simulated packet</button>
        </> : <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-600 p-8 text-center text-sm text-slate-400">No frame has been generated. Review the controls and generate a synthetic frame.</div>}
      </div>
    </div>
    <p className="text-xs leading-6 text-slate-400">No camera connection, instrument ACK, signed session, biological sample, or calibration is inferred. Use Instrument analysis to inspect your own numeric files with UNKNOWN provenance.</p>
  </section>;
}
