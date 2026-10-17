'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { INTENT_CHECKPOINTS, type IntentCheckpoint } from '@/lib/intent-models';
import { takeEntryPrompt } from '@/lib/product-onboarding';
import { trackConversion } from '@/lib/conversion-events';
import InferenceExamples from './InferenceExamples';

export default function IntentMiniChat({ checkpoint }: { checkpoint: IntentCheckpoint }) {
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(9);
  const [topK, setTopK] = useState(80);
  const [maxTokens, setMaxTokens] = useState(96);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [runSettings, setRunSettings] = useState({ temperature: 9, topK: 80, maxTokens: 96 });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    try { const draft = takeEntryPrompt(sessionStorage, checkpoint); if (draft) setPrompt(current => current || draft); }
    catch { /* Storage restrictions must not block inference. */ }
  }, [checkpoint]);
  useEffect(() => () => { active.current?.abort(); }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (active.current || !prompt.trim()) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(''); setAnswer(''); setSubmitted(prompt.trim()); setCopyStatus(''); setRunSettings({ temperature, topK, maxTokens }); setStatus('Connecting…');
    try {
      const response = await fetch('/api/intent/mini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, checkpoint, temperature, topK, maxTokens }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Inference could not start. Please try again.');
      }
      if (!response.body) throw new Error('Streaming is unavailable.');
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let pending = '', finished = false;
      try {
        while (true) {
          const chunk = await reader.read();
          pending += decoder.decode(chunk.value, { stream: !chunk.done });
          let end: number;
          while ((end = pending.indexOf('\n')) !== -1) {
            const line = pending.slice(0, end); pending = pending.slice(end + 1);
            if (!line.trim()) continue;
            const result = JSON.parse(line) as { error?: string; text?: string; done?: boolean; status?: string };
            if (result.error) throw new Error(result.error);
            if (typeof result.text === 'string') { setAnswer(result.text); setStatus('Streaming…'); }
            else if (result.status) setStatus('Waiting for a GPU…');
            if (result.done) { finished = true; setStatus('Complete'); trackConversion('gic_run_completed', { tool: checkpoint }); }
          }
          if (chunk.done) break;
        }
        if (!finished) throw new Error('The stream ended before completion. Please try again.');
      } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
    } catch (cause) {
      if (controller.signal.aborted) setStatus('Stream stopped');
      else { setError(cause instanceof Error ? cause.message : 'Inference failed.'); setStatus('Unable to complete'); }
    } finally { active.current = null; setBusy(false); }
  }

  async function exportMarkdown() {
    try {
      await navigator.clipboard.writeText(`# GIC INTENT ${INTENT_CHECKPOINTS[checkpoint].label}\n\nExperimental model output; independently verify claims.\n\n## Prompt\n\n${submitted}\n\n## Output\n\n${answer}\n\nTemperature: ${runSettings.temperature}; top-K: ${runSettings.topK}; max new tokens: ${runSettings.maxTokens}.\n\nGenerated via Global Intent Company · https://www.globalintentcompany.space/intent/mini?checkpoint=${checkpoint}`);
      setCopyStatus('Markdown copied.'); trackConversion('gic_result_exported', { tool: checkpoint, format: 'markdown' });
    } catch { setCopyStatus('Clipboard unavailable. Select and copy the output.'); }
  }
  return <div className="ph-no-capture p-4 sm:p-6" data-ph-mask="true" data-ph-no-capture="true">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-semibold">{INTENT_CHECKPOINTS[checkpoint].label} · Streaming inference</p>
      <p role="status" className="text-slate-600">{status}</p>
    </div>
    <p className="mt-2 text-xs leading-5 text-slate-600">Each prompt is an independent generation. Up to 8 requests per hour; shared Hugging Face GPU availability applies.</p>
    <form onSubmit={generate} className="mt-5 space-y-4">
      <fieldset disabled={busy} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <legend className="sr-only">Generation settings</legend>
        <label className="text-sm font-medium">Temperature
          <input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" type="number" min="0" max="10" step="0.05" required value={temperature} onChange={e => setTemperature(e.target.valueAsNumber)} />
        </label>
        <label className="text-sm font-medium">Top-K
          <input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" type="number" min="1" max="100" required value={topK} onChange={e => setTopK(e.target.valueAsNumber)} />
        </label>
        <label className="text-sm font-medium">Maximum new tokens
          <input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" type="number" min="1" max="128" required value={maxTokens} onChange={e => setMaxTokens(e.target.valueAsNumber)} />
        </label>
      </fieldset>
      <label className="block text-sm font-medium" htmlFor="mini-prompt">Your prompt</label>
      <textarea id="mini-prompt" required maxLength={8000} rows={4} value={prompt} disabled={busy} onChange={e => setPrompt(e.target.value)} placeholder="Ask the model a question…" className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm disabled:opacity-70" />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || !prompt.trim()} className="min-h-11 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">Generate</button>
        {busy ? <button type="button" onClick={() => active.current?.abort()} className="min-h-11 rounded-lg border border-slate-400 px-5 text-sm font-semibold">Stop stream</button> : <button type="button" onClick={() => { setAnswer(''); setSubmitted(''); setError(''); setStatus('Ready'); }} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm">Clear output</button>}
      </div>
    </form>
    {error ? <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}
    {submitted ? <section aria-label="Model response" aria-busy={busy} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="whitespace-pre-wrap break-words text-sm font-medium">{submitted}</p>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{answer || (busy ? 'Waiting for the model…' : 'No text returned.')}</p>
      {answer && !busy && status === 'Complete' ? <button type="button" onClick={() => void exportMarkdown()} className="mt-4 min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold">Copy result as Markdown</button> : null}
      <p role="status" className="mt-2 text-xs text-slate-600">{copyStatus}</p>
    </section> : null}
    <p className="mt-4 text-xs leading-5 text-slate-500">Stopping closes your stream. A GPU task already running may still finish on Hugging Face.</p>
    <InferenceExamples checkpoint={checkpoint} message={prompt} temperature={temperature} topK={topK} maxTokens={maxTokens}/>
  </div>;
}
