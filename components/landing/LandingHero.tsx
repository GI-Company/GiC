'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Code2, FlaskConical, Cpu } from 'lucide-react';
import { trackConversion } from '@/lib/conversion-events';
import { ENTRY_PROMPT_KEY, saveEntryPrompt } from '@/lib/product-onboarding';
const examples = {
  standard: ['Explain this algorithm’s time complexity.', 'Outline an engineering validation plan.', 'Compare two approaches to local model serving.'],
  facts500: ['The capital of France is', 'Plants convert sunlight into', 'A protein is'],
};
export default function LandingHero() {
  const router = useRouter();
  const [model, setModel] = useState<'standard' | 'facts500'>('standard');
  const [prompt, setPrompt] = useState(''), [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  function launch(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      if (prompt.trim()) saveEntryPrompt(sessionStorage, model, prompt);
      else { try { sessionStorage.removeItem(ENTRY_PROMPT_KEY); } catch { /* An empty draft needs no storage. */ } }
      trackConversion('gic_tool_opened', { tool: model === 'standard' ? 'gemini' : 'facts500', placement: 'home' });
      startTransition(() => router.push(model === 'standard' ? '/intent' : '/intent/mini?checkpoint=facts500'));
    } catch { setError('Your browser could not keep the draft. Open the workspace below and paste your prompt there.'); }
  }
  return <section className="relative overflow-hidden border-b border-slate-200 bg-white pb-14 pt-28 sm:pb-20 sm:pt-36">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.08),transparent_40%)]" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Global Intent Company · Independent AI &amp; systems engineering</p>
      <div className="mt-6 grid gap-9 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl">Try the tools.<br/><span className="text-blue-700">Inspect the research.</span><br/>Build on the evidence.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Chat and research with LooseMouth, test GIC&apos;s experimental language models, or run a learning-system experiment in your browser.</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">LooseMouth uses Google Gemini. GIC&apos;s own model checkpoints run separately on Hugging Face. Private model infrastructure is an ongoing research program.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/intent?signup=1" onClick={() => trackConversion('gic_cta_clicked', { action: 'create_account', placement: 'home' })} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Create free account <ArrowRight size={16}/></Link>
            <Link href="/pricing" onClick={() => trackConversion('gic_cta_clicked', { action: 'view_plans', placement: 'home' })} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">Compare plans</Link>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Try chat before signing up. Create an account to save conversations.</p>
          <Link href="/developers" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 underline underline-offset-4"><Code2 size={17}/>Developer quickstart and reproducible examples</Link>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Start with a question</h2>
          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Choose a model to try">
            {(['standard', 'facts500'] as const).map(id => <button key={id} type="button" aria-pressed={model === id} onClick={() => { setModel(id); setPrompt(''); setError(''); }} className={`min-h-14 rounded-lg border px-3 py-2 text-left text-xs font-semibold ${model === id ? 'border-blue-700 bg-white text-blue-800 ring-1 ring-blue-700' : 'border-slate-300 text-slate-600 hover:bg-white'}`}>{id === 'standard' ? 'LooseMouth · Gemini' : 'INTENT Mini · Facts-500'}<span className="mt-1 block font-normal">{id === 'standard' ? 'General chat & research' : 'Experimental GIC checkpoint'}</span></button>)}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">{model === 'standard' ? '5 guest messages. No account or payment card needed to try.' : 'No login required. 8 requests per hour; shared ZeroGPU quota applies. This small research model can give incorrect answers.'}</p>
          <form onSubmit={launch} className="ph-no-capture mt-4" data-ph-no-capture="true">
            <label htmlFor="home-prompt" className="text-sm font-semibold">Your starting prompt</label>
            <textarea id="home-prompt" maxLength={8000} rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={examples[model][0]} data-ph-mask="true" className="mt-2 block w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6"/>
            <button disabled={pending} type="submit" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{pending ? 'Opening…' : model === 'standard' ? 'Open LooseMouth with this draft' : 'Open INTENT Mini with this draft'}<ArrowRight size={16}/></button>
          </form>
          <p className="mt-2 text-xs leading-5 text-slate-500">Your draft stays in this browser tab for up to 10 minutes. Review it in the workspace before sending.</p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Example prompts">{examples[model].map(text => <button type="button" key={text} onClick={() => setPrompt(text)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 hover:border-blue-300">{text}</button>)}</div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error} <Link className="underline" href={model === 'standard' ? '/intent' : '/intent/mini'}>Open workspace</Link></p>}
        </div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/virtual-lab/bitvision-cell" onClick={() => trackConversion('gic_tool_opened', { tool: 'bitvision', placement: 'home' })} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400"><Cpu className="mt-1 shrink-0 text-blue-700" size={24}/><div><h2 className="font-semibold">Run BitVision Cell <span className="ml-2 text-xs font-medium text-blue-700">Free · no login</span></h2><p className="mt-2 text-sm leading-6 text-slate-600">Download the checkpoint, then run inference locally with WebGPU or WASM. Inspect actions and episode trajectories.</p></div><ArrowRight className="ml-auto mt-1 shrink-0" size={18}/></Link>
        <Link href="/virtual-lab/demo" onClick={() => trackConversion('gic_tool_opened', { tool: 'virtual_lab', placement: 'home' })} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400"><FlaskConical className="mt-1 shrink-0 text-blue-700" size={24}/><div><h2 className="font-semibold">Explore the Virtual Lab <span className="ml-2 text-xs font-medium text-slate-500">Paid / Enhanced</span></h2><p className="mt-2 text-sm leading-6 text-slate-600">Review assumed kinetics, generate synthetic optics, and export evidence. An active subscription is required.</p></div><ArrowRight className="ml-auto mt-1 shrink-0" size={18}/></Link>
      </div>
    </div>
  </section>;
}
