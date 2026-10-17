'use client';
import { useState } from 'react';
import { inferenceExamples, miniRequest } from '@/lib/product-onboarding';
import type { IntentCheckpoint } from '@/lib/intent-models';
import { trackConversion } from '@/lib/conversion-events';

export default function InferenceExamples({ checkpoint = 'facts500', message, temperature, topK, maxTokens }: {
  checkpoint?: IntentCheckpoint; message?: string; temperature?: number; topK?: number; maxTokens?: number;
}) {
  const [language, setLanguage] = useState<'curl' | 'python'>('curl');
  const [notice, setNotice] = useState('');
  const examples = inferenceExamples(miniRequest(checkpoint, message?.trim() || undefined, temperature, topK, maxTokens));
  async function copy() {
    try { await navigator.clipboard.writeText(examples[language]); setNotice('Copied.'); trackConversion('gic_example_copied', { tool: checkpoint, format: language }); }
    catch { setNotice('Clipboard access is unavailable. Select and copy the code below.'); }
  }
  return <details className="ph-no-capture mt-5 min-w-0 rounded-xl border border-slate-300 bg-white p-4 text-slate-950" data-ph-mask="true" data-ph-no-capture="true">
    <summary className="cursor-pointer text-sm font-semibold">Use this model from cURL or Python</summary>
    <p className="mt-3 text-xs leading-6 text-slate-600">Calls GIC&apos;s public research endpoint. No token is included. Your prompt and output go through Vercel and Hugging Face. The same 8 requests per IP per hour and shared ZeroGPU quota apply.</p>
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example language">{(['curl', 'python'] as const).map(id => <button type="button" key={id} aria-pressed={language === id} onClick={() => { setLanguage(id); setNotice(''); }} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold ${language === id ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-300'}`}>{id === 'curl' ? 'cURL' : 'Python'}</button>)}<button type="button" onClick={() => void copy()} className="min-h-10 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Copy {language === 'curl' ? 'cURL' : 'Python'}</button></div>
    <p role="status" className="mt-2 text-xs text-slate-600">{notice}</p>
    <pre className="mt-3 max-h-96 max-w-full overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{examples[language]}</code></pre>
    <p className="mt-3 text-xs leading-5 text-slate-600">Responses are newline-delimited JSON. Each text field replaces the prior output. Check error events and the final done flag; HTTP 200 alone does not mean generation succeeded. Python uses only its standard library.</p>
  </details>;
}
