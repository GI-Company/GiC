'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp, Globe2, RotateCcw } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type Source = { title: string; snippet: string; date: string; url: string };
type Turn = { role: 'user' | 'assistant'; text: string; sources?: Source[]; warning?: string | null };
type ChatResponse = { session_id: string; answer: string; sources: Source[]; warning: string | null; mode: string };

const suggestions = [
  'Why do plants need sunlight?',
  'What is the capital of France?',
  'What is the latest NASA news?',
];

export default function IntentPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setTurns((current) => [...current, { role: 'user', text }]);
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, search }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed.');
      const answer = data as ChatResponse;
      setSessionId(answer.session_id);
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
    setTurns([]);
    setSessionId(null);
    setMessage('');
    setError('');
    textareaRef.current?.focus();
  }

  return (
    <main className="min-h-screen bg-[#090e1b] px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition hover:text-sky-100 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
              <span aria-hidden="true">←</span> Global Intent Company
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Talk to INTENT</h1>
              <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">Research preview</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Explore a model built by Global Intent Company. It is experimental and may make mistakes; check retrieved sources when they appear.
            </p>
          </div>
          <button type="button" onClick={newChat} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
            <RotateCcw aria-hidden="true" size={16} /> New chat
          </button>
        </header>

        <section aria-label="INTENT chat" className="relative isolate overflow-hidden rounded-[1.5rem] border border-sky-200/15 bg-[#0d172b] shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.16),transparent_60%)]" />
            <Image src="/images/intent-chat-art.png" alt="" fill priority sizes="(max-width: 768px) 100vw, 1024px" className="object-contain object-top opacity-[0.58]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d172b]/5 via-[#0d172b]/20 to-[#0d172b]/75" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#101d34]/75 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.7)]" />
              <span className="text-sm font-semibold tracking-wide">INTENT</span>
            </div>
            <span className="text-xs text-slate-300">Experimental assistant</span>
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-sky-200">{turn.role === 'user' ? 'You' : 'INTENT'}</p>
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 sm:text-base">{turn.text}</p>
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
            {busy && <div className="mr-auto w-fit rounded-2xl border border-white/15 bg-[#17243a] px-5 py-3 text-sm text-slate-200" role="status">INTENT is responding…</div>}
          </div>

          <form onSubmit={send} className="relative z-10 border-t border-white/10 bg-[#101b30]/95 p-3 sm:p-5">
            <label htmlFor="intent-message" className="sr-only">Message INTENT</label>
            <div className="rounded-2xl border border-white/20 bg-[#0b1425] p-2 shadow-inner transition-colors focus-within:border-sky-300/70 focus-within:ring-2 focus-within:ring-sky-300/15">
              <textarea ref={textareaRef} id="intent-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={onMessageKeyDown} maxLength={2000} rows={2} disabled={busy} className="max-h-40 min-h-14 w-full resize-y bg-transparent px-2 py-2 text-base leading-6 text-white outline-none placeholder:text-slate-400 disabled:opacity-60" placeholder="Message INTENT…" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-1 pt-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-200 hover:bg-white/5">
                  <input type="checkbox" checked={search} onChange={(event) => setSearch(event.target.checked)} className="h-4 w-4 accent-sky-400" />
                  <Globe2 aria-hidden="true" size={16} /> Search the web
                </label>
                <button type="submit" disabled={busy || !message.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-[#071425] transition hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-45">
                  Send <ArrowUp aria-hidden="true" size={17} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 px-1 text-xs leading-5 text-slate-300">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span>INTENT can make mistakes.</span>
            </div>
            {error && <p role="alert" className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}
