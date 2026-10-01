'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Send, Trash2, Wifi, WifiOff } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ApiReply = {
  answer?: string;
  session_id?: string;
  checkpoint_step?: number;
  mode?: string;
  warning?: string | null;
  error?: string;
  ready?: boolean;
};

export default function IntentPreviewPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/intent', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as { ready?: boolean };
        setOnline(res.ok && data.ready !== false);
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
      });

      const data = (await res.json()) as ApiReply;
      if (!res.ok) throw new Error(data.error || 'INTENT request failed.');

      if (data.session_id) setSessionId(data.session_id);
      if (typeof data.checkpoint_step === 'number') setCheckpoint(data.checkpoint_step);
      setOnline(true);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.answer || 'No response was returned.' },
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'INTENT is unavailable.';
      setOnline(false);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `[Preview unavailable] ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function resetConversation() {
    if (sessionId) {
      await fetch(`/api/intent?session_id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      }).catch(() => undefined);
    }
    setSessionId('');
    setMessages([]);
    setCheckpoint(null);
  }

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100">
      <header className="border-b border-[#182130] bg-[#090c13]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Global Intent Company
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono">
            {online === true ? (
              <><Wifi className="w-4 h-4 text-emerald-400" /><span className="text-emerald-300">runtime online</span></>
            ) : online === false ? (
              <><WifiOff className="w-4 h-4 text-amber-400" /><span className="text-amber-300">runtime offline</span></>
            ) : (
              <span className="text-slate-500">checking runtime…</span>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <div className="rounded-xl border border-[#1c2636] bg-[#0a0e16] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#182130] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h1 className="font-mono font-semibold text-sm text-white">INTENT V2 — Research Preview</h1>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  A small independently trained language model served from Global Intent infrastructure.
                </p>
              </div>
              <button
                type="button"
                onClick={resetConversation}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-[#141b28]"
                title="Reset conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[52vh] min-h-[420px] overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="max-w-md space-y-3">
                    <p className="text-slate-300 text-sm">Try the current INTENT research checkpoint.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        'What is the capital of France?',
                        'Why do plants need sunlight?',
                        'What is 2 plus 2?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setInput(prompt)}
                          className="px-3 py-2 rounded-md border border-[#253146] bg-[#0f1520] text-xs text-slate-300 hover:border-emerald-700/70"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-emerald-950/50 border border-emerald-800/50 text-slate-100'
                        : 'bg-[#101622] border border-[#222d40] text-slate-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="text-xs font-mono text-emerald-400 animate-pulse">INTENT is generating…</div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="p-4 border-t border-[#182130]">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={2000}
                  rows={2}
                  placeholder="Message INTENT…"
                  className="flex-1 resize-none rounded-md border border-[#263246] bg-[#070a10] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="self-stretch px-4 rounded-md bg-emerald-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-600">
                <span>Research preview · responses may be incorrect</span>
                <span>{input.length}/2000</span>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#1c2636] bg-[#0a0e16] p-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-400">Model status</h2>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Family</dt><dd className="text-slate-300">INTENT V2</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Scale</dt><dd className="text-slate-300">~162M params</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Context</dt><dd className="text-slate-300">experimental</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Checkpoint</dt><dd className="text-slate-300">{checkpoint ?? 'runtime-selected'}</dd></div>
              </dl>
            </div>

            <div className="rounded-lg border border-[#1c2636] bg-[#0a0e16] p-4 space-y-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">Scope</h2>
              <p className="text-xs leading-relaxed text-slate-400">
                This is an experimental model, not a production knowledge authority. The preview exists to expose measured model behavior while the architecture is still under active development.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
