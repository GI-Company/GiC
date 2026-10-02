'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp, Globe2, RotateCcw, ImagePlus, X } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import BrandLoader from '@/components/BrandLoader';

type Source = { title: string; snippet: string; date: string; url: string };
type Turn = { role: 'user' | 'assistant'; text: string; imageName?: string; sources?: Source[]; warning?: string | null };
type ChatResponse = { session_id: string; answer: string; sources: Source[]; warning: string | null; mode: string };

const suggestions = [
  'Why do plants need sunlight?',
  'What is the capital of France?',
  'What is the latest NASA news?',
];

export default function IntentClient() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [model, setModel] = useState<'gemma4' | 'native'>('native');
  const [gemmaAvailable, setGemmaAvailable] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [enhancedSearch, setEnhancedSearch] = useState(false);
  const [enhancedMaxTokens, setEnhancedMaxTokens] = useState(160);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function refreshAvailability() {
      try {
        const response = await fetch('/api/intent', { cache: 'no-store' });
        const data: { models?: string[]; enhancedSearch?: boolean; enhancedMaxTokens?: number } | null = response.ok ? await response.json() : null;
        if (!active) return;
        const enhanced = data?.models?.includes('gemma4') === true;
        setGemmaAvailable(enhanced);
        setNativeAvailable(data?.models?.includes('native') === true);
        setEnhancedSearch(data?.enhancedSearch === true);
        setEnhancedMaxTokens(data?.enhancedMaxTokens === 512 ? 512 : 160);
        if (!hasSentRef.current) setModel(enhanced ? 'gemma4' : 'native');
      } catch {
        if (!active) return;
        setGemmaAvailable(false);
        setNativeAvailable(false);
      } finally {
        if (active) setAvailabilityChecked(true);
      }
    }
    void refreshAvailability();
    const interval = window.setInterval(() => void refreshAvailability(), 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || !availabilityChecked || (model === 'gemma4' ? !gemmaAvailable : !nativeAvailable)) return;
    hasSentRef.current = true;
    setTurns((current) => [...current, { role: 'user', text, imageName: image?.name }]);
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const maxTokens = model === 'gemma4' && enhancedMaxTokens === 512 ? 320 : 100;
      const body = image ? new FormData() : JSON.stringify({ message: text, model, session_id: sessionId, search, max_tokens: maxTokens });
      if (body instanceof FormData && image) {
        body.set('message', text);
        body.set('model', model);
        body.set('image', image);
        if (sessionId) body.set('session_id', sessionId);
        body.set('max_tokens', String(maxTokens));
      }
      const response = await fetch('/api/intent', {
        method: 'POST',
        ...(image ? {} : { headers: { 'Content-Type': 'application/json' } }),
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed.');
      const answer = data as ChatResponse;
      setSessionId(answer.session_id);
      setImage(null);
      setTurns((current) => [...current, {
        role: 'assistant', text: answer.answer, sources: answer.sources, warning: answer.warning,
      }]);
    } catch (cause) {
      setTurns((current) => current.slice(0, -1));
      setMessage(text);
      setError(cause instanceof Error ? cause.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  function onMessageKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function newChat() {
    hasSentRef.current = false;
    setTurns([]);
    setSessionId(null);
    setMessage('');
    setImage(null);
    setError('');
    textareaRef.current?.focus();
  }

  function switchModel(next: 'gemma4' | 'native') {
    if (busy || next === model || (next === 'gemma4' ? !gemmaAvailable : !nativeAvailable)) return;
    hasSentRef.current = false;
    setModel(next);
    setSearch(false);
    setImage(null);
    setTurns([]);
    setSessionId(null);
    setError('');
  }

  return (
    <main className="min-h-screen bg-[#090e1b] px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition hover:text-sky-100 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
              <span aria-hidden="true">←</span> Global Intent Company
            </Link>
            <div className="mt-3 flex items-center gap-3 sm:gap-5">
              <Image src="/images/loosemouth-model-logo.png" alt="LooseMouth model logo" width={1456} height={1080} priority sizes="(max-width: 640px) 112px, 160px" className="h-auto w-28 shrink-0 sm:w-40" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">INTENT model family</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Talk to LooseMouth</h1>
                  <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">Research preview</span>
                </div>
              </div>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Choose a LooseMouth model and start a conversation.
            </p>
          </div>
          <button type="button" onClick={newChat} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
            <RotateCcw aria-hidden="true" size={16} /> New chat
          </button>
        </header>

        <section aria-label="LooseMouth chat" className="relative isolate overflow-hidden rounded-[1.5rem] border border-sky-200/15 bg-[#0d172b] shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.16),transparent_60%)]" />
            <Image src="/images/intent-chat-art.png" alt="" fill priority sizes="(max-width: 768px) 100vw, 1024px" className="object-contain object-top opacity-[0.58]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d172b]/5 via-[#0d172b]/20 to-[#0d172b]/75" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#101d34]/75 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.7)]" />
              <span className="text-sm font-semibold tracking-wide">LooseMouth</span>
            </div>
            <span className="text-xs text-slate-300">{model === 'gemma4' ? `Image understanding${enhancedSearch ? ' · web search' : ''}` : 'Native INTENT model · web search'}</span>
          </div>

          <div ref={transcriptRef} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" className="relative z-10 h-[min(58vh,640px)] min-h-[420px] space-y-5 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
            {turns.length === 0 && (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-end pb-2 text-center">
                <div className="rounded-2xl border border-sky-200/20 bg-[#12243d]/70 px-5 py-5 shadow-lg backdrop-blur-[2px] sm:px-8">
                  <p className="text-xl font-semibold text-white sm:text-2xl">What would you like to explore?</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">Ask a question, or try one of these to get started.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => { setMessage(suggestion); textareaRef.current?.focus(); }} className="rounded-full border border-sky-200/25 bg-sky-200/10 px-3 py-2 text-left text-sm text-sky-100 transition hover:border-sky-200/55 hover:bg-sky-200/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {turns.map((turn, index) => (
              <article key={index} className={`max-w-[95%] rounded-2xl border px-4 py-4 shadow-md sm:max-w-[85%] sm:px-5 ${turn.role === 'user' ? 'ml-auto border-sky-200/20 bg-[#244165] text-white' : 'mr-auto border-white/15 bg-[#17243a] text-slate-100'}`}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-sky-200">{turn.role === 'user' ? 'You' : 'LooseMouth'}</p>
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 sm:text-base">{turn.text}</p>
                {turn.imageName && <p className="mt-2 text-xs text-sky-200">Image attached: {turn.imageName}</p>}
                {turn.sources && turn.sources.length > 0 && (
                  <div className="mt-4 border-t border-white/15 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">Sources to check</p>
                    <ul className="space-y-3">{turn.sources.map((source, sourceIndex) => (
                      <li key={sourceIndex} className="text-sm leading-6 text-slate-200">
                        {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-200 underline decoration-sky-300/50 underline-offset-2 hover:text-white">[{sourceIndex + 1}] {source.title || source.url}</a> : <span>[{sourceIndex + 1}] {source.title}</span>}
                        {source.date && <span className="ml-2 text-xs text-slate-300">{source.date}</span>}
                        {source.snippet && <p className="mt-1 text-sm text-slate-300">{source.snippet}</p>}
                      </li>
                    ))}</ul>
                  </div>
                )}
                {turn.warning && <p className="mt-3 rounded-lg bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">{turn.warning}</p>}
              </article>
            ))}
            {busy && <div className="mr-auto w-fit rounded-2xl border border-white/15 bg-[#17243a] px-5 py-3"><BrandLoader label="LooseMouth is responding…" size={36} /></div>}
          </div>

          <form onSubmit={send} className="relative z-10 border-t border-white/10 bg-[#101b30]/95 p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Choose model">
              <button type="button" disabled={busy || !gemmaAvailable} onClick={() => switchModel('gemma4')} aria-pressed={model === 'gemma4'} className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${model === 'gemma4' ? 'border-sky-300 bg-sky-300/20 text-white' : 'border-white/20 text-slate-300 hover:bg-white/10'}`}>LooseMouth Enhanced <span className="text-xs">· {gemmaAvailable ? 'Multimodal' : availabilityChecked ? 'Offline' : 'Connecting'}</span></button>
              <button type="button" disabled={busy || !nativeAvailable} onClick={() => switchModel('native')} aria-pressed={model === 'native'} className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${model === 'native' ? 'border-sky-300 bg-sky-300/20 text-white' : 'border-white/20 text-slate-300 hover:bg-white/10'}`}>LooseMouth Native <span className="text-xs">· {nativeAvailable ? 'INTENT' : availabilityChecked ? 'Offline' : 'Connecting'}</span></button>
            </div>
            {availabilityChecked && !gemmaAvailable && (
              <p role="status" className="mb-3 rounded-lg border border-sky-200/15 bg-sky-200/[0.06] px-3 py-2 text-sm leading-6 text-slate-200">
                LooseMouth Enhanced is offline. We need funding to keep serving larger models. {nativeAvailable ? 'Try LooseMouth Native.' : 'Please check back soon.'}
              </p>
            )}
            <label htmlFor="intent-message" className="sr-only">Message LooseMouth</label>
            <div className="rounded-2xl border border-white/20 bg-[#0b1425] p-2 shadow-inner transition-colors focus-within:border-sky-300/70 focus-within:ring-2 focus-within:ring-sky-300/15">
              <textarea ref={textareaRef} id="intent-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={onMessageKeyDown} maxLength={2000} rows={2} disabled={busy} className="max-h-40 min-h-14 w-full resize-y bg-transparent px-2 py-2 text-base leading-6 text-white outline-none placeholder:text-slate-400 disabled:opacity-60" placeholder="Message LooseMouth…" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-1 pt-2">
                {(model === 'native' || enhancedSearch) && <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-200 hover:bg-white/5">
                  <input type="checkbox" checked={search} onChange={(event) => setSearch(event.target.checked)} className="h-4 w-4 accent-sky-400" />
                  <Globe2 aria-hidden="true" size={16} /> Search the web
                </label>}
                {model === 'gemma4' && <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-200 hover:bg-white/5">
                  <ImagePlus aria-hidden="true" size={16} /> Add image
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => {
                    const selected = event.target.files?.[0] || null;
                    if (selected && selected.size > 4_000_000) { setError('Image must be under 4 MB.'); setImage(null); }
                    else { setError(''); setImage(selected); }
                  }} />
                </label>}
                <button type="submit" disabled={busy || !message.trim() || !availabilityChecked || (model === 'gemma4' ? !gemmaAvailable : !nativeAvailable)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-[#071425] transition hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-45">
                  Send <ArrowUp aria-hidden="true" size={17} />
                </button>
              </div>
              {image && <div className="flex items-center gap-2 px-2 pt-2 text-xs text-sky-200"><span className="max-w-64 truncate">{image.name}</span><button type="button" onClick={() => setImage(null)} aria-label="Remove image" className="rounded p-1 hover:bg-white/10"><X size={14} /></button></div>}
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 px-1 text-xs leading-5 text-slate-300">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span>LooseMouth can make mistakes.</span>
            </div>
            {error && <p role="alert" className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}
          </form>
        </section>
        <p className="px-1 text-center text-xs leading-5 text-slate-400">
          LooseMouth Enhanced is based on Gemma 4 E2B-it. LooseMouth Native is our experimental INTENT model trained from scratch. Both can make mistakes.
        </p>
      </div>
    </main>
  );
}
