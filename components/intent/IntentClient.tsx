'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUp,
  Globe2,
  RotateCcw,
  X,
  LogOut,
  ShieldCheck,
  Gauge,
  Cpu,
  ExternalLink,
  Trash2,
  Menu,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import BrandLoader from '@/components/BrandLoader';
import IntentPwaControls from '@/components/intent/IntentPwaControls';
import { enrichSourcesWithPyScript } from '@/lib/pyscript-search';
import {
  createConversation,
  deleteConversation,
  getPreferences,
  listConversations,
  loadMessages,
  saveExchange,
  savePreferences,
  updateConversation,
  type PersistedConversation,
} from '@/lib/loosemouth-persistence';

type Source = { title: string; snippet: string; date: string; url: string };
type Turn = {
  role: 'user' | 'assistant';
  text: string;
  imageName?: string;
  sources?: Source[];
  warning?: string | null;
  research?: ResearchDiagnostics;
};
type ResearchDiagnostics = {
  depth?: 'quick' | 'deep';
  queries?: number;
  fetched_pages?: number;
  hops?: number;
  sources_considered?: number;
  elapsed_ms?: number;
};

type ChatResponse = {
  session_id: string;
  answer: string;
  sources: Source[];
  warning: string | null;
  mode: string;
  research?: ResearchDiagnostics;
};

type IntentClientProps = {
  accessToken: string;
  accountUserId?: string;
  accountEmail?: string;
  accountName?: string;
  accountProvider?: string;
  onSignOut: () => void;
};

const suggestions = [
  'Explain how INTENT differs from larger hosted models.',
  'What can Virtual Lab be used for?',
  'Summarize GIC\'s private AI architecture.',
];

export default function IntentClient({
  accessToken,
  accountUserId,
  accountEmail,
  accountName,
  accountProvider,
  onSignOut,
}: IntentClientProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [searchDepth, setSearchDepth] = useState<'quick' | 'deep'>('quick');
  const [model, setModel] = useState<'intentR-402' | 'native'>('native');
  const [intentRAvailable, setIntentRAvailable] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [enhancedSearch, setEnhancedSearch] = useState(false);
  const [enhancedMaxTokens, setEnhancedMaxTokens] = useState(160);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(20);
  const [quotaResetAt, setQuotaResetAt] = useState<string | null>(null);
  const [conversations, setConversations] = useState<PersistedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentRef = useRef(false);
  const preferencesLoadedRef = useRef(false);

  const displayName = accountName?.trim() || accountEmail?.split('@')[0] || 'Signed-in user';
  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : displayName.slice(0, 2)).toUpperCase();
  }, [displayName]);

  useEffect(() => {
    let active = true;
    async function refreshAvailability() {
      try {
        const response = await fetch('/api/intent', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data: { models?: string[]; enhancedSearch?: boolean; enhancedMaxTokens?: number } | null =
          response.ok ? await response.json() : null;
        if (!active) return;
        const enhanced = data?.models?.includes('intentR-402') === true;
        setIntentRAvailable(enhanced);
        setNativeAvailable(data?.models?.includes('native') === true);
        setEnhancedSearch(data?.enhancedSearch === true);
        setEnhancedMaxTokens(data?.enhancedMaxTokens === 512 ? 512 : 160);
        if (!hasSentRef.current && !preferencesLoadedRef.current && !activeConversationId) {
          setModel(enhanced ? 'intentR-402' : 'native');
        }
      } catch {
        if (!active) return;
        setIntentRAvailable(false);
        setNativeAvailable(false);
      } finally {
        if (active) setAvailabilityChecked(true);
      }
    }

    void refreshAvailability();
    const interval = window.setInterval(() => void refreshAvailability(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [accessToken, activeConversationId]);

  useEffect(() => {
    let active = true;

    async function restoreWorkspace() {
      if (!accountUserId) {
        if (active) setHistoryReady(true);
        return;
      }

      try {
        const [storedConversations, preferences] = await Promise.all([
          listConversations(accessToken, accountUserId),
          getPreferences(accessToken, accountUserId),
        ]);
        if (!active) return;
        setConversations(storedConversations);
        if (preferences) {
          preferencesLoadedRef.current = true;
          setModel(preferences.preferred_model);
          setSearch(preferences.web_search_enabled);
        } else {
          preferencesLoadedRef.current = true;
        }
        setHistoryError('');
      } catch (cause) {
        if (!active) return;
        setHistoryError(cause instanceof Error ? cause.message : 'Conversation history is temporarily unavailable.');
      } finally {
        if (active) setHistoryReady(true);
      }
    }

    void restoreWorkspace();
    return () => { active = false; };
  }, [accessToken, accountUserId]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || !availabilityChecked || (model === 'intentR-402' ? !intentRAvailable : !nativeAvailable)) return;

    hasSentRef.current = true;
    setTurns((current) => [...current, { role: 'user', text }]);
    setMessage('');
    setError('');
    setBusy(true);

    try {
      const maxTokens = model === 'intentR-402' && enhancedMaxTokens === 512 ? 320 : 100;
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          model,
          session_id: sessionId,
          search,
          search_depth: search ? searchDepth : undefined,
          max_tokens: maxTokens,
        }),
      });

      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      if (remaining != null && Number.isFinite(Number(remaining))) setQuotaRemaining(Number(remaining));
      if (reset) setQuotaResetAt(reset);

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) setQuotaRemaining(0);
        throw new Error(data.error || 'Request failed.');
      }

      const answer = data as ChatResponse;
      setSessionId(answer.session_id);
      const enrichedSources = search && answer.sources?.length
        ? await enrichSourcesWithPyScript(text, answer.sources)
        : answer.sources;
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          text: answer.answer,
          sources: enrichedSources,
          warning: answer.warning,
          research: answer.research,
        },
      ]);

      if (accountUserId) {
        try {
          let conversationId = activeConversationId;
          let conversation = conversations.find((entry) => entry.id === conversationId) ?? null;

          if (!conversationId) {
            const title = text.length > 72 ? `${text.slice(0, 69)}…` : text;
            conversation = await createConversation(accessToken, accountUserId, { title, model });
            conversationId = conversation.id;
            setActiveConversationId(conversationId);
          }

          await saveExchange(accessToken, accountUserId, conversationId, {
            userContent: text,
            assistantContent: answer.answer,
            assistantSources: enrichedSources,
            assistantWarning: answer.warning,
          });
          await updateConversation(accessToken, accountUserId, conversationId, {
            model,
            inference_session_id: answer.session_id,
          });

          const updatedAt = new Date().toISOString();
          const nextConversation: PersistedConversation = conversation
            ? { ...conversation, model, inference_session_id: answer.session_id, updated_at: updatedAt }
            : {
                id: conversationId,
                user_id: accountUserId,
                title: text.slice(0, 72) || 'New conversation',
                model,
                inference_session_id: answer.session_id,
                created_at: updatedAt,
                updated_at: updatedAt,
              };
          setConversations((current) => [
            nextConversation,
            ...current.filter((entry) => entry.id !== conversationId),
          ]);

          // Re-read the canonical list so Recent sessions reflects persisted state,
          // not only optimistic client state.
          const refreshedConversations = await listConversations(accessToken, accountUserId);
          setConversations(refreshedConversations);
          setHistoryError('');
        } catch (cause) {
          setHistoryError(cause instanceof Error ? cause.message : 'This response could not be saved to history.');
        }
      }
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
    setActiveConversationId(null);
    setTurns([]);
    setSessionId(null);
    setMessage('');
    setError('');
    textareaRef.current?.focus();
  }

  function switchModel(next: 'intentR-402' | 'native') {
    if (busy || next === model || (next === 'intentR-402' ? !intentRAvailable : !nativeAvailable)) return;
    hasSentRef.current = false;
    setActiveConversationId(null);
    setModel(next);
    setSearch(false);
    setTurns([]);
    setSessionId(null);
    setError('');
    if (accountUserId) {
      void savePreferences(accessToken, accountUserId, {
        preferred_model: next,
        web_search_enabled: false,
      })
        .then(() => setHistoryError(''))
        .catch((cause) => setHistoryError(
          cause instanceof Error ? cause.message : 'Model preference could not be saved.',
        ));
    }
  }

  async function openConversation(conversation: PersistedConversation) {
    if (!accountUserId || busy) return;
    setHistoryError('');
    try {
      const storedMessages = await loadMessages(accessToken, accountUserId, conversation.id);
      setActiveConversationId(conversation.id);
      setModel(conversation.model);
      setSessionId(conversation.inference_session_id);
      setTurns(storedMessages.map((entry) => ({
        role: entry.role,
        text: entry.content,
        imageName: entry.image_name || undefined,
        sources: entry.sources,
        warning: entry.warning,
      })));
      hasSentRef.current = storedMessages.length > 0;
      setMessage('');
      setError('');
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : 'Conversation could not be loaded.');
    }
  }

  async function removeConversation(conversation: PersistedConversation) {
    if (!accountUserId || busy || deletingConversationId) return;

    const confirmed = window.confirm(`Delete “${conversation.title}” and its saved messages?`);
    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setHistoryError('');

    try {
      await deleteConversation(accessToken, accountUserId, conversation.id);
      setConversations((current) => current.filter((entry) => entry.id !== conversation.id));

      if (activeConversationId === conversation.id) {
        hasSentRef.current = false;
        setActiveConversationId(null);
        setTurns([]);
        setSessionId(null);
        setMessage('');
        setError('');
      }

      const refreshedConversations = await listConversations(accessToken, accountUserId);
      setConversations(refreshedConversations);
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : 'Conversation could not be deleted.');
    } finally {
      setDeletingConversationId(null);
    }
  }

  const resetLabel = quotaResetAt
    ? new Date(quotaResetAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <main className="h-[100dvh] overflow-hidden bg-white text-slate-950 lg:h-auto lg:min-h-screen lg:overflow-visible">
      <div className="mx-auto grid h-full max-w-[1500px] lg:min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-slate-50 px-5 py-6 lg:block">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/global-intent-company-icon.png"
                alt="Global Intent Company"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Global Intent Company</p>
                <p className="text-sm font-semibold text-slate-950">LooseMouth Workspace</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                {accountEmail && <p className="truncate text-xs text-slate-500">{accountEmail}</p>}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck size={14} /> Authenticated
              </span>
              <span className="text-slate-500">{accountProvider === 'google' ? 'Google' : 'Email'}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={newChat}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <RotateCcw size={16} /> New session
            </button>

            <nav className="grid grid-cols-2 gap-2" aria-label="Workspace navigation">
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                Main site
              </Link>
              <Link
                href="/research"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                Research
              </Link>
              <Link
                href="/systems"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                Systems
              </Link>
              <Link
                href="/virtual-lab"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                Virtual Lab
              </Link>
            </nav>

          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent sessions</p>
              <span className="text-[10px] text-slate-600">{historyReady ? 'Synced' : 'Syncing…'}</span>
            </div>
            <div className="mt-2 space-y-1">
              {conversations.slice(0, 12).map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-stretch rounded-lg transition ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50'
                      : 'hover:bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation)}
                    disabled={busy || deletingConversationId === conversation.id}
                    className={`min-w-0 flex-1 rounded-l-lg px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-55 ${
                      activeConversationId === conversation.id
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <span className="block truncate text-xs font-medium">{conversation.title}</span>
                    <span className="mt-1 block text-[10px] text-slate-600">
                      {conversation.model === 'intentR-402' ? 'INTENT-R 402M' : 'Native'} · {new Date(conversation.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeConversation(conversation)}
                    disabled={busy || deletingConversationId != null}
                    aria-label={`Delete session: ${conversation.title}`}
                    title="Delete session"
                    className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-r-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {historyReady && conversations.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-600">Your saved conversations will appear here.</p>
              )}
            </div>
          </div>

          <div className="mt-6 hidden space-y-5 lg:block">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Inference allowance</p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-slate-950">{quotaRemaining ?? '—'}</p>
                    <p className="text-xs text-slate-500">requests remaining</p>
                  </div>
                  <Gauge className="h-5 w-5 text-blue-700" />
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, ((quotaRemaining ?? 20) / 20) * 100))}%` }}
                  />
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  20 requests / hour{resetLabel ? ` · resets around ${resetLabel}` : ''}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
              <div className="mt-2 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <span>Session</span>
                  <span className="font-mono text-slate-700">{sessionId ? sessionId.slice(0, 8) : 'new'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <span>Transport</span>
                  <span className="text-emerald-700">GIC-operated</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        <section className="flex h-full min-w-0 flex-col lg:min-h-screen">
          <header className="shrink-0 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={newChat}
                aria-label="New session"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <RotateCcw size={17} />
              </button>

              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src="/images/loosemouth-model-logo.png"
                  alt=""
                  width={1456}
                  height={1080}
                  sizes="44px"
                  className="h-auto w-10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">LooseMouth</p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-[0.11em] text-blue-700">
                    {model === 'intentR-402' ? 'INTENT-R 402M' : 'Native'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open sessions and settings"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <Menu size={18} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Choose model">
              <button
                type="button"
                disabled={busy || !intentRAvailable}
                onClick={() => switchModel('intentR-402')}
                aria-pressed={model === 'intentR-402'}
                className={`min-h-9 rounded-lg border px-2 text-xs font-semibold disabled:opacity-40 ${
                  model === 'intentR-402'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Enhanced · {intentRAvailable ? '402M' : availabilityChecked ? 'offline' : 'checking'}
              </button>
              <button
                type="button"
                disabled={busy || !nativeAvailable}
                onClick={() => switchModel('native')}
                aria-pressed={model === 'native'}
                className={`min-h-9 rounded-lg border px-2 text-xs font-semibold disabled:opacity-40 ${
                  model === 'native'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Native · {nativeAvailable ? 'INTENT' : availabilityChecked ? 'offline' : 'checking'}
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close sessions and settings"
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
              />
              <aside className="fixed inset-y-0 right-0 z-[60] w-[min(88vw,360px)] overflow-y-auto border-l border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">LooseMouth</p>
                    <p className="text-xs text-slate-500">{displayName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5">
                  <IntentPwaControls />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Recent sessions</p>
                  <span className="text-[10px] text-slate-500">{quotaRemaining ?? '—'} / 20 left</span>
                </div>

                <div className="mt-2 space-y-1">
                  {conversations.slice(0, 12).map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-stretch rounded-xl border ${
                        activeConversationId === conversation.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-transparent bg-slate-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          void openConversation(conversation).then(() => setMobileMenuOpen(false));
                        }}
                        disabled={busy || deletingConversationId === conversation.id}
                        className="min-w-0 flex-1 px-3 py-3 text-left disabled:opacity-50"
                      >
                        <span className="block truncate text-xs font-semibold text-slate-800">{conversation.title}</span>
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {conversation.model === 'intentR-402' ? 'INTENT-R 402M' : 'Native'} · {new Date(conversation.updated_at).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeConversation(conversation)}
                        disabled={busy || deletingConversationId != null}
                        aria-label={`Delete session: ${conversation.title}`}
                        className="flex w-11 items-center justify-center text-slate-400 hover:text-red-700 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {historyReady && conversations.length === 0 && (
                    <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No saved sessions yet.</p>
                  )}
                </div>

                <nav className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-200 pt-5 text-xs font-semibold">
                  <Link href="/" className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700">Main site</Link>
                  <Link href="/research" className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700">Research</Link>
                  <Link href="/systems" className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700">Systems</Link>
                  <Link href="/virtual-lab" className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700">Virtual Lab</Link>
                </nav>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </aside>
            </>
          )}

          <header className="hidden border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur lg:block">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Image
                  src="/images/loosemouth-model-logo.png"
                  alt="LooseMouth model logo"
                  width={1456}
                  height={1080}
                  priority
                  sizes="72px"
                  className="h-auto w-16 shrink-0 sm:w-20"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">LooseMouth</h1>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                      Signed-in workspace
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Private inference access through the INTENT model family.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-right sm:block">
                  <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">Active model</p>
                  <p className="text-xs font-semibold text-slate-950">
                    {model === 'intentR-402' ? 'LooseMouth Enhanced · INTENT-R 402M' : 'LooseMouth Native'}
                  </p>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    model === 'intentR-402' ? (intentRAvailable ? 'bg-emerald-500' : 'bg-slate-300') : nativeAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  aria-label="Model availability"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Choose model">
              <button
                type="button"
                disabled={busy || !intentRAvailable}
                onClick={() => switchModel('intentR-402')}
                aria-pressed={model === 'intentR-402'}
                className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45 ${
                  model === 'intentR-402'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                Enhanced <span className="text-xs text-slate-600">· {intentRAvailable ? 'INTENT-R 402M' : availabilityChecked ? 'offline' : 'checking'}</span>
              </button>
              <button
                type="button"
                disabled={busy || !nativeAvailable}
                onClick={() => switchModel('native')}
                aria-pressed={model === 'native'}
                className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45 ${
                  model === 'native'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                Native <span className="text-xs text-slate-600">· {nativeAvailable ? 'INTENT' : availabilityChecked ? 'offline' : 'checking'}</span>
              </button>

              <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 lg:hidden">
                <span>{quotaRemaining ?? '—'} / 20 left</span>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={transcriptRef}
              role="log"
              aria-label="Conversation"
              aria-live="polite"
              aria-relevant="additions text"
              className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6 lg:min-h-[420px] lg:px-10"
            >
              {!availabilityChecked && turns.length === 0 && (
                <div className="mx-auto flex min-h-[44vh] lg:min-h-[58vh] max-w-3xl flex-col justify-center">
                  <BrandLoader
                    label={`Connecting to ${model === 'intentR-402' ? 'INTENT-R 402M' : 'LooseMouth Native'}…`}
                    size={52}
                  />
                </div>
              )}

              {availabilityChecked && turns.length === 0 && (
                <div className="mx-auto flex min-h-[44vh] lg:min-h-[58vh] max-w-3xl flex-col justify-center">
                  <div className="mb-7 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                      <Cpu className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Session ready</p>
                      <p className="text-sm text-slate-500">Authenticated as {displayName}</p>
                    </div>
                  </div>

                  <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    What do you want to investigate?
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    Ask LooseMouth directly, switch models above, or enable web search when the active model supports it.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setMessage(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm leading-6 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-950"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((turn, index) => (
                <article
                  key={index}
                  className={`mx-auto max-w-4xl ${
                    turn.role === 'user'
                      ? 'rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 sm:px-5'
                      : 'px-1 py-2'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {turn.role === 'user' ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-950">
                        {initials}
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
                        <Image src="/images/loosemouth-model-logo.png" alt="" width={28} height={20} className="h-4 w-auto object-contain" />
                      </div>
                    )}
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {turn.role === 'user' ? displayName : 'LooseMouth'}
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800 sm:text-base">{turn.text}</p>

                  {turn.imageName && <p className="mt-2 text-xs text-blue-700">Image attached: {turn.imageName}</p>}

                  {turn.sources && turn.sources.length > 0 && (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sources</p>
                      <ul className="space-y-3">
                        {turn.sources.map((source, sourceIndex) => (
                          <li key={sourceIndex} className="text-sm leading-6 text-slate-700">
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-700 underline decoration-sky-300/30 underline-offset-2 hover:text-slate-950"
                              >
                                [{sourceIndex + 1}] {source.title || source.url}
                              </a>
                            ) : (
                              <span>[{sourceIndex + 1}] {source.title}</span>
                            )}
                            {source.date && <span className="ml-2 text-xs text-slate-500">{source.date}</span>}
                            {source.snippet && <p className="mt-1 text-sm text-slate-600">{source.snippet}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {turn.research && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="font-semibold uppercase tracking-[0.12em] text-blue-700">
                        {turn.research.depth === 'deep' ? 'Deep research' : 'Web research'}
                      </span>
                      {typeof turn.research.queries === 'number' && <span>{turn.research.queries} queries</span>}
                      {typeof turn.research.fetched_pages === 'number' && <span>{turn.research.fetched_pages} pages</span>}
                      {typeof turn.research.hops === 'number' && <span>{turn.research.hops} hops</span>}
                      {typeof turn.research.sources_considered === 'number' && <span>{turn.research.sources_considered} sources considered</span>}
                      {typeof turn.research.elapsed_ms === 'number' && <span>{(turn.research.elapsed_ms / 1000).toFixed(1)}s research</span>}
                    </div>
                  )}

                  {turn.warning && (
                    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      {turn.warning}
                    </p>
                  )}
                </article>
              ))}

              {busy && (
                <div className="mx-auto max-w-4xl">
                  <div className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                    <BrandLoader label="LooseMouth is responding…" size={34} />
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white/96 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:py-4 lg:px-10">
              <form onSubmit={send} className="mx-auto max-w-4xl">
                {availabilityChecked && !intentRAvailable && model === 'intentR-402' && (
                  <p role="status" className="mb-3 rounded-lg border border-sky-200/15 bg-sky-200/[0.05] px-3 py-2 text-sm text-slate-700">
                    INTENT-R 402M is offline. {nativeAvailable ? 'Switch to Native to continue.' : 'Please check back soon.'}
                  </p>
                )}

                <label htmlFor="intent-message" className="sr-only">Message LooseMouth</label>
                <div className="rounded-2xl border border-slate-300 bg-white p-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.24)] transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <textarea
                    ref={textareaRef}
                    id="intent-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={onMessageKeyDown}
                    maxLength={2000}
                    rows={2}
                    disabled={busy}
                    className="max-h-40 min-h-16 w-full resize-y bg-transparent px-2 py-2 text-base leading-6 text-slate-950 outline-none placeholder:text-slate-600 disabled:opacity-60"
                    placeholder="Message LooseMouth…"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-1 pt-2">
                    <div className="flex flex-wrap items-center gap-1">
                      {(model === 'native' || enhancedSearch) && (
                        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950">
                          <input
                            type="checkbox"
                            checked={search}
                            onChange={(event) => {
                              const next = event.target.checked;
                              setSearch(next);
                              if (accountUserId) {
                                void savePreferences(accessToken, accountUserId, {
                                  preferred_model: model,
                                  web_search_enabled: next,
                                })
                                  .then(() => setHistoryError(''))
                                  .catch((cause) => setHistoryError(
                                    cause instanceof Error ? cause.message : 'Search preference could not be saved.',
                                  ));
                              }
                            }}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <Globe2 size={16} /> Web
                        </label>
                      )}

                      {search && (
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Web research depth">
                          <button
                            type="button"
                            onClick={() => setSearchDepth('quick')}
                            aria-pressed={searchDepth === 'quick'}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                              searchDepth === 'quick' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
                            }`}
                          >
                            Quick
                          </button>
                          <button
                            type="button"
                            onClick={() => setSearchDepth('deep')}
                            aria-pressed={searchDepth === 'deep'}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                              searchDepth === 'deep' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'
                            }`}
                          >
                            Deep
                          </button>
                        </div>
                      )}


                    </div>

                    <button
                      type="submit"
                      disabled={busy || !message.trim() || !availabilityChecked || (model === 'intentR-402' ? !intentRAvailable : !nativeAvailable)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send <ArrowUp size={17} />
                    </button>
                  </div>


                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 px-1 text-[11px] text-slate-600">
                  <span>Enter to send · Shift+Enter for newline</span>
                  <span>LooseMouth can make mistakes.</span>
                </div>

                {historyError && (
                  <p role="status" className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    History: {historyError}
                  </p>
                )}

                {error && (
                  <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {error}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
