'use client';

import Image from 'next/image';
import type { WorkspaceAction } from '@/lib/workspace-agent';
import type { WorkbenchActivity } from '@/lib/artifact-agent';
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
  FileText,
  Code2,
  ImagePlus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { trackConversion } from '@/lib/conversion-events';
import AssistantMessage from '@/components/intent/AssistantMessage';
import { setWorkspaceAnalytics } from '@/lib/workspace-privacy';
import BrandLoader from '@/components/BrandLoader';
import IntentPwaControls from '@/components/intent/IntentPwaControls';
import LooseMouthWorkbench from '@/components/intent/LooseMouthWorkbench';
import WorkbenchDock, { type WorkbenchTab } from '@/components/intent/WorkbenchDock';
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
  feedbackId?: string;
  feedbackRating?: 'positive' | 'negative';
  mode?: 'fast' | 'medium' | 'enhanced';
  activity?: WorkbenchActivity[];
};
type ResearchDiagnostics = {
  depth?: 'quick' | 'deep';
  queries?: number;
  fetched_pages?: number;
  hops?: number;
  sources_considered?: number;
  elapsed_ms?: number;
};

type BillingStatus={authenticated:boolean;tier:'free'|'paid'|'enhanced';status?:string|null;trial_end?:string|null;current_period_end?:string|null;cancel_at_period_end?:boolean;limit:number;workbench?:'none'|'reports'|'full'};
type WorkbenchWindow = WorkbenchTab & {
  initialPrompt: string;
  conversationId: string | null;
};
const MAX_WORKBENCH_WINDOWS = 8;
type ChatResponse = {
  workspace_action?: WorkspaceAction | null;
  activity?: WorkbenchActivity[];
  session_id: string;
  answer: string;
  sources: Source[];
  warning: string | null;
  mode: string;
  research?: ResearchDiagnostics;
};

type IntentClientProps = {
  accessToken?: string;
  accountUserId?: string;
  accountEmail?: string;
  accountName?: string;
  accountProvider?: string;
  onSignOut?: () => void;
  onRequireAuth?: () => void;
};

const suggestions = [
  'Explain how INTENT differs from larger hosted models.',
  'What can Virtual Lab be used for?',
  'Summarize GIC\'s private AI architecture.',
];

async function optimizeImageFile(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use a JPEG, PNG, or WebP image.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image is too large. Use an image under 15 MB.');
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image could not be read.'));
    reader.onerror = () => reject(new Error('Image could not be read.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new window.Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error('Image could not be decoded.'));
    next.src = source;
  });

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image preparation is unavailable in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.84;
  let dataUrl = canvas.toDataURL('image/webp', quality);
  while (dataUrl.length > 3_600_000 && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/webp', quality);
  }
  if (dataUrl.length > 3_900_000) {
    throw new Error('Image is still too large after optimization. Try a smaller image.');
  }
  return dataUrl;
}

export default function IntentClient({
  accessToken,
  accountUserId,
  accountEmail,
  accountName,
  accountProvider,
  onSignOut,
  onRequireAuth,
}: IntentClientProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [searchDepth, setSearchDepth] = useState<'quick' | 'deep'>('quick');
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(true);
  const [model, setModel] = useState<'fast' | 'medium' | 'enhanced'>('fast');
  const [researchAgent, setResearchAgent] = useState<'off' | 'auto' | 'intent_r' | 'bitvision' | 'plm'>('off');
  const [availableModes, setAvailableModes] = useState<string[]>([]);
  const [multimodal, setMultimodal] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const enhancedSearch = true;
  const [enhancedMaxTokens] = useState(1200);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(accessToken?20:5);
  const [billing,setBilling]=useState<BillingStatus>({authenticated:Boolean(accessToken),tier:'free',limit:accessToken?20:5,workbench:'none'});
  const [billingReady, setBillingReady] = useState(!accessToken);
  const [privacyReady, setPrivacyReady] = useState(!accountUserId);
  const [billingBusy,setBillingBusy]=useState(false);
  const [billingNotice,setBillingNotice]=useState('');
  const [upgradeNotice,setUpgradeNotice]=useState(false);
  const [quotaResetAt, setQuotaResetAt] = useState<string | null>(null);
  const [conversations, setConversations] = useState<PersistedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<{ key: string; reason: string; comment: string } | null>(null);
  const [feedbackSendingKey, setFeedbackSendingKey] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<{ key: string; message: string } | null>(null);
  const [workspaceAgent, setWorkspaceAgent] = useState(false);
  const [workbenchWindows, setWorkbenchWindows] = useState<WorkbenchWindow[]>([]);
  const [activeWorkbenchId, setActiveWorkbenchId] = useState<string | null>(null);
  const lastWorkbenchIdRef = useRef<string | null>(null);
  const nextWorkbenchNumberRef = useRef(0);
  const [imageAttachment, setImageAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const hasSentRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const activationTrackedRef = useRef(false);
  const billingTierRef = useRef<'free' | 'paid' | 'enhanced'>('free');

  const workbenchConversationTurns = useMemo(() => turns.map((turn) => ({
    role: turn.role,
    text: turn.text,
    sources: turn.sources?.map((source) => ({ title: source.title, url: source.url })),
  })), [turns]);

  useEffect(() => {
    // Never preserve another user's in-memory Workbench drafts across sign-out/account changes.
    setWorkbenchWindows([]);
    setActiveWorkbenchId(null);
    lastWorkbenchIdRef.current = null;
    nextWorkbenchNumberRef.current = 0;
  }, [accountUserId]);

  useEffect(() => {
    if (!accountUserId) {
      setSidebarCollapsed(false);
      return;
    }
    try {
      setSidebarCollapsed(localStorage.getItem('gic-sidebar-collapsed:' + accountUserId) === 'true');
    } catch {
      setSidebarCollapsed(false);
    }
  }, [accountUserId]);

  function toggleSidebar() {
    // Guest mode intentionally keeps its standard navigation.
    if (!accessToken || !accountUserId) return;
    setSidebarCollapsed((current) => {
      const next = !current;
      try { localStorage.setItem('gic-sidebar-collapsed:' + accountUserId, String(next)); } catch { /* private browsing */ }
      return next;
    });
  }

  async function copyTurn(text: string, id: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.style.position = 'fixed';
        scratch.style.opacity = '0';
        document.body.appendChild(scratch);
        scratch.select();
        const copied = document.execCommand('copy');
        scratch.remove();
        if (!copied) throw new Error('Clipboard unavailable.');
      }
      setCopiedTurnId(id);
      window.setTimeout(() => setCopiedTurnId((current) => current === id ? null : current), 2000);
    } catch {
      setError('Could not copy text. Please select and copy the message manually.');
    }
  }

  async function submitFeedback(turn: Turn, rating: 'positive' | 'negative', reason?: string, comment = '') {
    if (turn.role !== 'assistant' || !turn.feedbackId || feedbackSendingKey) return;
    const id = turn.feedbackId;
    setFeedbackSendingKey(id);
    setFeedbackError(null);
    try {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(turn.text));
      const responseHash = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
      const response = await fetch('/api/intent/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        },
        body: JSON.stringify({
          feedback_key: id,
          response_hash: responseHash,
          conversation_id: accountUserId ? activeConversationId : null,
          model: turn.mode || model,
          rating,
          reason: rating === 'negative' ? reason : null,
          comment: rating === 'negative' ? comment.trim() : '',
        }),
      });
      const payload = await response.json() as { recorded?: boolean; error?: string };
      if (!response.ok || !payload.recorded) throw new Error(payload.error || 'Unable to save feedback.');
      setTurns((current) => current.map((item) =>
        item.feedbackId === id ? { ...item, feedbackRating: rating } : item,
      ));
      setFeedbackDraft((current) => current?.key === id ? null : current);
    } catch (cause) {
      setFeedbackError({ key: id, message: cause instanceof Error ? cause.message : 'Feedback could not be saved.' });
    } finally {
      setFeedbackSendingKey(null);
    }
  }

  const telemetryRequired = billing.tier === 'free';
  const effectiveDataCollectionEnabled = telemetryRequired || dataCollectionEnabled;

  const displayName = accountName?.trim() || accountEmail?.split('@')[0] || 'Guest';
  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : displayName.slice(0, 2)).toUpperCase();
  }, [displayName]);

  useEffect(() => {
    let active = true;
    async function refreshAvailability() {
      try {
        const response = await fetch(researchAgent === 'off' ? '/api/intent' : '/api/research-agents', {
          cache: 'no-store',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const data: { models?: string[]; multimodal?: boolean } | null = response.ok ? await response.json() : null;
        if (!active) return;
        const modes = data?.models || [];
        setAvailableModes(modes);
        setMultimodal(data?.multimodal === true);
        if (!hasSentRef.current && !activeConversationId) {
          setModel(modes.includes('fast') ? 'fast' : modes.includes('medium') ? 'medium' : 'enhanced');
        }
      } catch {
        if (!active) return;
        setAvailableModes([]);
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
  }, [accessToken, activeConversationId, availabilityAttempt]);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    let attempts = 0;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('billing');
    const checkoutSession = params.get('session_id');

    if (outcome === 'success') setBillingNotice('Checkout completed. Activating your workspace access…');
    if (outcome === 'cancelled') setBillingNotice('Checkout cancelled. Your current plan is unchanged.');

    async function loadBilling() {
      if (!accessToken) {
        if (active) { setBilling({ authenticated: false, tier: 'free', limit: 5, workbench: 'none' }); setBillingReady(true); }
        return;
      }
      try {
        if (outcome === 'success' && checkoutSession) {
          const activation = await fetch('/api/billing/activate', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: checkoutSession }),
          });
          if (!activation.ok) {
            const result = await activation.json() as { error?: string };
            throw new Error(result.error || 'Checkout activation is still processing.');
          }
        }
        const response = await fetch('/api/billing/status', {
          headers: { Authorization: 'Bearer ' + accessToken },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Unable to refresh your workspace plan.');
        const data = await response.json() as BillingStatus;
        if (!active) return;
        if (outcome === 'success' && data.tier !== 'free' && !activationTrackedRef.current) {
          activationTrackedRef.current = true;
          trackConversion('gic_subscription_activated', { plan: data.tier, status: data.status === 'trialing' ? 'trialing' : 'active' });
        }
        if (billingTierRef.current !== data.tier) {
          billingTierRef.current = data.tier;
          setQuotaRemaining(null);
        }
        setBilling(data);
        setBillingReady(true);
        if (data.tier !== 'free') {
          setUpgradeNotice(false);
          setBillingNotice(data.status === 'trialing' ? 'Your subscription trial is active.' : 'Your subscription is active.');
          if (outcome === 'success') {
            const url = new URL(window.location.href);
            url.searchParams.delete('billing');
            url.searchParams.delete('session_id');
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
            if (timer !== undefined) window.clearInterval(timer);
          }
        } else if (outcome === 'success') {
          setBillingNotice('Checkout received. Workspace activation is pending; we are checking again…');
        }
      } catch (error) {
        if (active && outcome === 'success') {
          setBillingNotice(error instanceof Error ? error.message : 'Workspace activation is temporarily unavailable.');
        }
      }
      attempts += 1;
      if (attempts >= 8 && timer !== undefined) window.clearInterval(timer);
    }

    void loadBilling();
    if (outcome === 'success') timer = window.setInterval(() => void loadBilling(), 4000);
    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [accessToken]);

  useEffect(() => {
    let active = true;

    async function restoreWorkspace() {
      if (!accountUserId) {
        if (active) setHistoryReady(true);
        return;
      }

      try {
        const [storedConversations, preferences] = await Promise.all([
          listConversations(accessToken!, accountUserId),
          getPreferences(accessToken!, accountUserId),
        ]);
        if (!active) return;
        setConversations(storedConversations);
        setPrivacyReady(true);
        if (preferences) {
          preferencesLoadedRef.current = true;
          setModel('fast');
          setSearch(preferences.web_search_enabled);
          setDataCollectionEnabled(preferences.data_collection_enabled !== false);
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
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Keep the composer one line high until its actual text needs more room.
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(40, Math.min(120, textarea.scrollHeight))}px`;
  }, [message]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  useEffect(() => {
    setWorkspaceAnalytics(billingReady && privacyReady ? effectiveDataCollectionEnabled : null);
    return () => setWorkspaceAnalytics(null);
  }, [billingReady, privacyReady, effectiveDataCollectionEnabled]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || (researchAgent === 'off' && (!availabilityChecked || !availableModes.includes(model)))) return;
    if (researchAgent !== 'off' && (!accessToken || billing.tier === 'free')) return;
    if (researchAgent !== 'off' && imageAttachment) { setError('Research agents currently support text only. Remove the image attachment.'); return; }

    const attachedImage = imageAttachment;
    hasSentRef.current = true;
    setTurns((current) => [...current, { role: 'user', text, imageName: attachedImage?.name }]);
    setMessage('');
    setImageAttachment(null);
    setError('');
    setBusy(true);

    try {
      const maxTokens = model === 'enhanced' ? 1200 : model === 'medium' ? 900 : 600;
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchAgent === 'off' ? {
          message: text,
          workspace_agent: workspaceAgent && billing.tier !== 'free',
          conversation_context: workspaceAgent ? turns.slice(-8).map(turn => ({ role: turn.role, text: turn.text })) : undefined,
          model,
          session_id: sessionId,
          search,
          search_depth: search ? searchDepth : undefined,
          max_tokens: maxTokens,
          data_collection_enabled: billingReady && privacyReady ? effectiveDataCollectionEnabled : false,
          image_url: attachedImage?.dataUrl,
        } : { agent: researchAgent, messages: [...turns.slice(-10).map(turn => ({ role: turn.role, content: turn.text.slice(0,4000) })), { role: 'user', content: text }] }),
      });

      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      if (remaining != null && Number.isFinite(Number(remaining))) { const n=Number(remaining); setQuotaRemaining(n); if(accessToken&&billing.tier==='free'&&n<=5){const key='gic-upgrade-prompt-dismissed';const last=Number(localStorage.getItem(key)||0);if(Date.now()-last>3*24*60*60*1000)setUpgradeNotice(true);}}
      if (reset) setQuotaResetAt(reset);

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) setQuotaRemaining(0);
        if (data.auth_required && onRequireAuth) onRequireAuth();
        throw new Error(data.error || 'Request failed.');
      }

      const answer = (researchAgent === 'off' ? data : { answer: data.answer, session_id: sessionId, mode: model, sources: [], warning: `Research assistant: ${data.agent} · External inference: ${data.provider}` }) as ChatResponse;
      trackConversion('gic_answer_received', { access: accessToken ? 'account' : 'guest', first_in_session: !turns.some((turn) => turn.role === 'assistant') });
      setSessionId(answer.session_id);
      const enrichedSources = search && answer.sources?.length
        ? await enrichSourcesWithPyScript(text, answer.sources)
        : answer.sources;
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          text: answer.answer,
          feedbackId: crypto.randomUUID(),
          mode: answer.mode === 'enhanced' || answer.mode === 'medium' ? answer.mode : 'fast',
          sources: enrichedSources,
          warning: answer.warning,
          research: answer.research,
          activity: answer.activity,
        },
      ]);

      if (answer.workspace_action) openWorkbench(answer.workspace_action.kind, answer.workspace_action.brief, true);

      if (accountUserId) {
        try {
          let conversationId = activeConversationId;
          let conversation = conversations.find((entry) => entry.id === conversationId) ?? null;

          if (!conversationId) {
            const title = text.length > 72 ? `${text.slice(0, 69)}…` : text;
            conversation = await createConversation(accessToken!, accountUserId, { title, model });
            conversationId = conversation.id;
            setActiveConversationId(conversationId);
          }

          await saveExchange(accessToken!, accountUserId, conversationId, {
            userContent: text,
            userImageName: attachedImage?.name,
            assistantContent: answer.answer,
            assistantSources: enrichedSources,
            assistantWarning: answer.warning,
          });
          await updateConversation(accessToken!, accountUserId, conversationId, {
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
          const refreshedConversations = await listConversations(accessToken!, accountUserId);
          setConversations(refreshedConversations);
          setHistoryError('');
        } catch (cause) {
          setHistoryError(cause instanceof Error ? cause.message : 'This response could not be saved to history.');
        }
      }
    } catch (cause) {
      setTurns((current) => current.slice(0, -1));
      setMessage(text);
      setImageAttachment(attachedImage);
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

  async function attachImage(file: File | null) {
    if (!file) return;
    setError('');
    try {
      const dataUrl = await optimizeImageFile(file);
      setImageAttachment({ name: file.name.slice(0, 180), dataUrl });
      setSearch(false);
    } catch (cause) {
      setImageAttachment(null);
      setError(cause instanceof Error ? cause.message : 'Image could not be attached.');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  function restoreWorkbench(id: string) {
    if (!workbenchWindows.some((windowItem) => windowItem.id === id)) return;
    lastWorkbenchIdRef.current = id;
    setActiveWorkbenchId(id);
    setMobileMenuOpen(false);
  }

  function closeWorkbench(id: string) {
    setWorkbenchWindows((current) => current.filter((windowItem) => windowItem.id !== id));
    setActiveWorkbenchId((current) => current === id ? null : current);
    if (lastWorkbenchIdRef.current === id) lastWorkbenchIdRef.current = null;
  }

  function renameWorkbench(id: string, name: string, onlyIfDefault = false) {
    setWorkbenchWindows((current) => current.map((windowItem) => {
      if (windowItem.id !== id) return windowItem;
      // Do not overwrite a user-edited window name when generation finishes asynchronously.
      if (onlyIfDefault && !/^(Report|Applet) \d+$/.test(windowItem.name)) return windowItem;
      return { ...windowItem, name: name.slice(0, 64) };
    }));
  }

  function openWorkbench(kind: 'report' | 'applet' = 'report', prompt = '', createNew = false) {
    if (!accessToken || !accountUserId) {
      onRequireAuth?.();
      return;
    }
    if (billing.workbench === 'none') { window.location.href = '/pricing#plans'; return; }
    if (kind === 'applet' && billing.workbench !== 'full') { window.location.href = '/pricing#plans'; return; }

    // The main Workbench action restores the last window; explicit New and chat actions create a fresh one.
    if (!createNew && !prompt && workbenchWindows.length) {
      const recent = workbenchWindows.find((item) => item.id === lastWorkbenchIdRef.current);
      restoreWorkbench((recent || workbenchWindows[workbenchWindows.length - 1]).id);
      return;
    }
    if (workbenchWindows.length >= MAX_WORKBENCH_WINDOWS) {
      setError(`You can keep up to ${MAX_WORKBENCH_WINDOWS} Workbenches open. Close an unused window to start another.`);
      return;
    }
    nextWorkbenchNumberRef.current += 1;
    const id = `workbench-${Date.now().toString(36)}-${nextWorkbenchNumberRef.current}`;
    const name = `${kind === 'report' ? 'Report' : 'Applet'} ${nextWorkbenchNumberRef.current}`;
    setWorkbenchWindows((current) => [...current, { id, name, kind, initialPrompt: prompt, conversationId: activeConversationId }]);
    lastWorkbenchIdRef.current = id;
    setActiveWorkbenchId(id);
    setMobileMenuOpen(false);
  }

  function dismissUpgrade(){localStorage.setItem('gic-upgrade-prompt-dismissed',String(Date.now()));setUpgradeNotice(false);}
  async function manageBilling(){if(!accessToken||billingBusy)return;setBillingBusy(true);try{const r=await fetch('/api/billing/portal',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`}});const data=await r.json() as {url?:string;error?:string};if(!r.ok||!data.url)throw new Error(data.error||'Billing portal unavailable.');window.location.href=data.url;}catch(cause){setError(cause instanceof Error?cause.message:'Billing portal unavailable.');setBillingBusy(false);}}

  function newChat() {
    setFeedbackDraft(null);
    setFeedbackError(null);
    hasSentRef.current = false;
    setActiveConversationId(null);
    setTurns([]);
    setSessionId(null);
    setMessage('');
    setImageAttachment(null);
    setError('');
    textareaRef.current?.focus();
  }

  function switchModel(next: 'fast' | 'medium' | 'enhanced') {
    if (busy || next === model || !availableModes.includes(next)) return;
    setFeedbackDraft(null);
    setFeedbackError(null);
    hasSentRef.current = false;
    setActiveConversationId(null);
    setModel(next);
    setSearch(false);
    setTurns([]);
    setSessionId(null);
    setImageAttachment(null);
    setError('');
  }

  async function openConversation(conversation: PersistedConversation) {
    if (!accountUserId || busy) return;
    setFeedbackDraft(null);
    setFeedbackError(null);
    setHistoryError('');
    try {
      const storedMessages = await loadMessages(accessToken!, accountUserId, conversation.id);
      setActiveConversationId(conversation.id);
      setModel(conversation.model);
      setSessionId(conversation.inference_session_id);
      setTurns(storedMessages.map((entry) => ({
        role: entry.role,
        text: entry.content,
        imageName: entry.image_name || undefined,
        sources: entry.sources,
        warning: entry.warning,
        feedbackId: entry.role === 'assistant' ? crypto.randomUUID() : undefined,
        mode: conversation.model,
      })));
      hasSentRef.current = storedMessages.length > 0;
      setMessage('');
      setImageAttachment(null);
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
      await deleteConversation(accessToken!, accountUserId, conversation.id);
      setConversations((current) => current.filter((entry) => entry.id !== conversation.id));

      if (activeConversationId === conversation.id) {
        hasSentRef.current = false;
        setActiveConversationId(null);
        setTurns([]);
        setSessionId(null);
        setMessage('');
        setImageAttachment(null);
        setError('');
      }

      const refreshedConversations = await listConversations(accessToken!, accountUserId);
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
    <main data-ph-mask className="ph-no-capture h-[100dvh] min-h-0 overflow-hidden bg-white text-slate-950">
      <div className={`mx-auto grid h-full min-h-0 overflow-hidden ${accessToken && sidebarCollapsed ? 'lg:grid-cols-[minmax(0,1fr)]' : 'lg:grid-cols-[270px_minmax(0,1fr)]'}`}>
        <aside aria-label="Workspace sidebar" className={`${accessToken && sidebarCollapsed ? 'hidden' : 'hidden lg:block'} h-full min-h-0 overflow-y-auto overscroll-contain border-r border-slate-200 bg-slate-50 px-5 py-6`}>
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
              onClick={() => accessToken ? onSignOut?.() : onRequireAuth?.()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            >
              <LogOut size={14} /> {accessToken ? 'Sign out' : 'Sign in'}
            </button>
          </div>

          {accessToken && accountUserId && (
            <button type="button" onClick={toggleSidebar}
              className="mt-4 hidden min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 lg:inline-flex">
              <PanelLeftClose size={15} /> Collapse sidebar
            </button>
          )}

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
                <ShieldCheck size={14} /> {accessToken ? `${billing.tier === 'enhanced' ? 'Enhanced' : billing.tier === 'paid' ? 'Paid' : 'Free'} account` : 'Guest · 5 messages'}
              </span>
              <span className="text-slate-500">{billing.status === 'trialing' ? '30-day trial' : accessToken ? (accountProvider === 'google' ? 'Google' : 'Email') : 'Guest'}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {accessToken && accountUserId && (
              <button type="button" onClick={() => openWorkbench()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 hover:bg-blue-100">
                {billing.workbench === 'none' ? 'Upgrade for Workbench' : `Workbenches · ${workbenchWindows.length} open`}
              </button>
            )}

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

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
            <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-700">
              <span><span className="block font-semibold text-slate-900">Usage data</span><span className="mt-0.5 block text-[10px] font-normal text-slate-500">{telemetryRequired ? 'Included with Guest and Free access. Conversation text is masked from replay.' : 'Turn off usage analytics and session replay for this paid workspace.'}</span></span>
              <input
                type="checkbox"
                checked={effectiveDataCollectionEnabled}
                disabled={telemetryRequired || !billingReady || !privacyReady}
                onChange={(event) => {
                  const next = event.target.checked;
                  setDataCollectionEnabled(next);
                  if (accountUserId) void savePreferences(accessToken!, accountUserId, { preferred_model: model, web_search_enabled: search, data_collection_enabled: next }).catch(() => setHistoryError('Privacy preference could not be saved.'));
                }}
                className="h-4 w-4 accent-blue-600"
              />
            </label>
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
                      {conversation.model === 'enhanced' ? 'Enhanced' : conversation.model === 'medium' ? 'Medium' : 'Fast'} · {new Date(conversation.updated_at).toLocaleDateString()}
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

          {!accessToken && (
            <button
              type="button"
              onClick={() => onRequireAuth?.()}
              className="mt-5 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            >
              Create a free account to continue
            </button>
          )}

          {accessToken && billing.tier!=='free' && <button type="button" disabled={billingBusy} onClick={()=>void manageBilling()} className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{billingBusy?'Opening billing…':'Manage subscription'}</button>}
          {billing.status==='trialing'&&billing.trial_end&&<p className="mt-2 px-1 text-[11px] text-slate-500">Free trial ends {new Date(billing.trial_end).toLocaleDateString()}.</p>}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-900">{billing.tier === 'enhanced' ? 'Enhanced Workspace · $14.99/month' : billing.tier === 'paid' ? 'Paid Workspace · $4.99/month' : 'Support private AI R&D · $4.99/month'}</p>
            <p className="mt-1">{billing.tier === 'enhanced' ? 'Reports and runnable applet workflows are unlocked for your account.' : billing.tier === 'paid' ? 'Reports are unlocked in your Workbench. Enhanced Workspace adds runnable applets.' : 'Support helps fund Global Intent Company research into privately operated models, compute, and verifiable AI infrastructure.'}</p>
            <p className="mt-2 text-[10px] text-slate-500">Current hosted LooseMouth inference is provided through Groq.</p>
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
                    style={{ width: `${Math.max(0, Math.min(100, ((quotaRemaining ?? billing.limit) / billing.limit) * 100))}%` }}
                  />
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  {billing.limit} requests / hour{resetLabel ? ` · resets around ${resetLabel}` : ''}
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
                  <span className="text-emerald-700">Hosted via Groq</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => accessToken ? onSignOut?.() : onRequireAuth?.()}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <LogOut size={14} /> {accessToken ? 'Sign out' : 'Log in / Sign up'}
            </button>
          </div>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {billingNotice && !['Your subscription trial is active.', 'Your subscription is active.'].includes(billingNotice) && <div role="status" className="border-b border-blue-200 bg-blue-50 px-4 py-1.5 text-center text-xs font-medium text-blue-800">{billingNotice}</div>}
          {accessToken && billing.tier !== 'free' && (
            <div role="status" aria-label="Subscription status" className="flex shrink-0 items-center justify-between gap-2 border-b border-blue-200 bg-blue-50 px-4 py-1 text-[11px] leading-5 text-blue-900">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                <strong>{billing.tier === 'enhanced' ? 'Enhanced active' : 'Paid active'}</strong>
                <span className="hidden sm:inline">{billing.tier === 'enhanced' ? 'Reports & applets · 300/hour' : 'Reports · 100/hour'}</span>
                {billing.status === 'trialing' && billing.trial_end && <span>Trial until {new Date(billing.trial_end).toLocaleDateString()}</span>}
              </div>
              <button type="button" onClick={() => openWorkbench()} className="min-h-6 shrink-0 rounded px-2 text-[11px] font-semibold text-blue-800 underline underline-offset-2 hover:bg-blue-100">Open Workbench</button>
            </div>
          )}
          {upgradeNotice&&billing.tier==='free'&&<div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"><span>You have {quotaRemaining ?? 0} free requests left this hour. Paid starts with a 30-day free trial and raises the allowance to 100/hour.</span><span className="flex shrink-0 gap-2"><Link href="/pricing#plans" className="font-semibold underline">View plans</Link><button type="button" onClick={dismissUpgrade} aria-label="Dismiss upgrade notice"><X size={14}/></button></span></div>}
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
                  <p className="flex items-center gap-1.5 truncate text-[10px] font-medium uppercase tracking-[0.11em] text-slate-500">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        availableModes.includes(model) ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      aria-hidden="true"
                    />
                    {model === 'enhanced' ? 'Enhanced' : model === 'medium' ? 'Medium' : 'Fast'}
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
                    <p className="text-xs text-slate-500">{displayName} · {billing.tier === 'enhanced' ? 'Enhanced' : billing.tier === 'paid' ? 'Paid' : accessToken ? 'Free' : 'Guest'}</p>
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

                {accessToken && billing.tier !== 'free' && (
                  <button type="button" disabled={billingBusy} onClick={() => void manageBilling()}
                    className="mt-5 min-h-11 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 disabled:opacity-50">
                    {billingBusy ? 'Opening billing…' : 'Manage subscription'}
                  </button>
                )}
                <div className="mt-5">
                  <IntentPwaControls />
                </div>

                {accessToken && accountUserId && (
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); openWorkbench(); }}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 hover:bg-blue-100"
                  >
                    <FileText size={15} /> {billing.workbench==='none'?'Upgrade for Workbench':`Workbenches · ${workbenchWindows.length} open`}
                  </button>
                )}

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Model</p>
                  <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Choose model">
                    {(['fast', 'medium', 'enhanced'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={busy || !availableModes.includes(mode)}
                        onClick={() => switchModel(mode)}
                        aria-pressed={model === mode}
                        className={`min-h-11 rounded-xl border px-2 text-xs font-semibold capitalize disabled:opacity-40 ${
                          model === mode
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {mode}
                        <span className="mt-0.5 block text-[9px] font-medium text-slate-500">
                          {availableModes.includes(mode) ? 'Available' : availabilityChecked ? 'Offline' : 'Checking'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {accessToken && billing.tier !== 'free' && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                      <label htmlFor="gic-research-agent" className="block text-xs font-semibold text-slate-700">GIC Research Agent</label>
                      <select id="gic-research-agent" value={researchAgent} disabled={busy} onChange={event => { setResearchAgent(event.target.value as typeof researchAgent); setSearch(false); }} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900">
                        <option value="off">LooseMouth standard</option><option value="auto">INTENT-R automatic router</option><option value="intent_r">INTENT-R Research · Gemini</option><option value="bitvision">BitVision Research · Gemini</option><option value="plm">PLM Infrastructure · Groq</option>
                      </select>
                      <p className="mt-2 text-xs text-slate-500">Research agents use third-party AI providers. Text only; separate hourly workbench quota applies. Web search and image generation are not available in this mode.</p>
                    </div>
                  )}
                  {enhancedSearch && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <label className="flex min-h-10 items-center justify-between gap-3 text-sm font-medium text-slate-700">
                        <span className="inline-flex items-center gap-2"><Globe2 size={16} /> Web research</span>
                        <input
                          type="checkbox"
                          checked={search}
                          onChange={(event) => {
                            const next = event.target.checked;
                            setSearch(next);
                            if (accountUserId) {
                              void savePreferences(accessToken!, accountUserId, {
                                preferred_model: model,
                                web_search_enabled: next,
                              data_collection_enabled: dataCollectionEnabled,
                              })
                                .then(() => setHistoryError(''))
                                .catch((cause) => setHistoryError(
                                  cause instanceof Error ? cause.message : 'Search preference could not be saved.',
                                ));
                            }
                          }}
                          className="h-5 w-5 accent-blue-600"
                        />
                      </label>

                      {search && (
                        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Web research depth">
                          <button
                            type="button"
                            onClick={() => setSearchDepth('quick')}
                            aria-pressed={searchDepth === 'quick'}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                              searchDepth === 'quick' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Quick
                          </button>
                          <button
                            type="button"
                            onClick={() => setSearchDepth('deep')}
                            aria-pressed={searchDepth === 'deep'}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                              searchDepth === 'deep' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Deep
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex min-h-10 items-center justify-between gap-3 text-sm font-medium text-slate-700">
                    <span><span className="block">{telemetryRequired ? 'Usage analytics included' : 'Share usage data'}</span><span className="block text-[10px] font-normal text-slate-500">{telemetryRequired ? 'Included with Guest and Free access. Conversation text is masked from replay.' : 'Turn off usage analytics and session replay for this paid workspace.'}</span></span>
                    <input
                      type="checkbox"
                      checked={effectiveDataCollectionEnabled}
                disabled={telemetryRequired || !billingReady || !privacyReady}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setDataCollectionEnabled(next);
                        if (accountUserId) void savePreferences(accessToken!, accountUserId, { preferred_model: model, web_search_enabled: search, data_collection_enabled: next }).catch(() => setHistoryError('Privacy preference could not be saved.'));
                      }}
                      className="h-5 w-5 accent-blue-600"
                    />
                  </label>
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
                          {conversation.model === 'enhanced' ? 'Enhanced' : conversation.model === 'medium' ? 'Medium' : 'Fast'} · {new Date(conversation.updated_at).toLocaleDateString()}
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
                  <Link href="/virtual-lab/demo" className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-slate-700">Virtual Lab · Paid demo</Link>
                </nav>

                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); if (accessToken) onSignOut?.(); else onRequireAuth?.(); }}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  <LogOut size={15} /> {accessToken ? 'Sign out' : 'Log in / Sign up'}
                </button>
              </aside>
            </>
          )}

          <header className="hidden shrink-0 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:block">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 shrink-0 items-center gap-2">
                {accessToken && accountUserId && sidebarCollapsed && (
                  <button type="button" onClick={toggleSidebar} aria-label="Expand sidebar" title="Expand sidebar"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
                    <PanelLeftOpen size={17} />
                  </button>
                )}
                <Image src="/images/loosemouth-model-logo.png" alt="LooseMouth model logo" width={1456} height={1080} priority sizes="40px" className="h-8 w-10 shrink-0 object-contain" />
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">LooseMouth</h1>
                <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 xl:inline">
                  {billing.tier === 'enhanced' ? 'Enhanced' : billing.tier === 'paid' ? 'Paid' : accessToken ? 'Free' : 'Guest'}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1" role="group" aria-label="Choose LooseMouth mode">
                {(['fast', 'medium', 'enhanced'] as const).map((choice) => (
                  <button key={choice} type="button" disabled={busy || !availableModes.includes(choice)} onClick={() => switchModel(choice)} aria-pressed={model === choice}
                    className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs capitalize disabled:cursor-not-allowed disabled:opacity-45 ${model === choice ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                    {choice}{choice === 'fast' ? ' ⚡' : choice === 'enhanced' ? ' ✨' : ' 🧠'}
                  </button>
                ))}
                {multimodal && <span className="hidden px-2 text-[10px] text-slate-500 2xl:inline">Vision ready</span>}
              </div>
              {accessToken && accountUserId && <button type="button" onClick={() => openWorkbench()} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"><FileText size={13} /> Workbenches{workbenchWindows.length ? ` (${workbenchWindows.length})` : ''}</button>}
              <span className={`h-2 w-2 shrink-0 rounded-full ${availableModes.includes(model) ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-label="Model availability" />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={transcriptRef}
              role="log"
              aria-label="Conversation"
              aria-live="polite"
              aria-relevant="additions text"
              className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 lg:px-8"
            >
              {!availabilityChecked && turns.length === 0 && (
                <div className="mx-auto flex min-h-32 max-w-3xl flex-col justify-center">
                  <BrandLoader
                    label={`Connecting to LooseMouth ${model.charAt(0).toUpperCase() + model.slice(1)}…`}
                    size={52}
                  />
                </div>
              )}

              {availabilityChecked && availableModes.length === 0 && turns.length === 0 && (
                <div role="status" className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
                  <h2 className="text-xl font-semibold">LooseMouth is temporarily unavailable.</h2>
                  <p className="mt-2 text-sm leading-6">The workspace cannot reach an available model right now. Try again in a moment; we also check automatically every 30 seconds.</p>
                  <button type="button" onClick={() => { setAvailabilityChecked(false); setAvailabilityAttempt((current) => current + 1); }} className="mt-4 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold">Try again</button>
                </div>
              )}

              {availabilityChecked && availableModes.length > 0 && turns.length === 0 && (
                <div className="mx-auto flex max-w-3xl flex-col justify-center py-4 sm:py-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                      <Cpu className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Session ready</p>
                      <p className="text-sm text-slate-500">{accessToken ? `Signed in as ${displayName}` : 'You are using a guest session'}</p>
                    </div>
                  </div>

                  <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                    Ask LooseMouth
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                    {billing.tier !== 'free' ? 'Explore an idea, prepare a report, or turn your conversation into a useful tool. You review each draft before saving.' : 'Start a conversation or open the menu for models, search, and saved sessions.'}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
                    {(billing.tier !== 'free' ? [
                      { label: 'Plan a project', prompt: 'Help me plan [project]. Ask for the goal, constraints and deadline before preparing a report workbench brief.', agent: true },
                      { label: 'Compare my options', prompt: 'Help me compare [options] for [goal]. Ask which criteria matter, then prepare a decision report brief.', agent: true },
                      billing.workbench === 'full' ? { label: 'Build an interactive tool', prompt: 'Help me design a browser tool for [task]. Ask what inputs and outputs I need before preparing an applet workbench brief.', agent: true } : { label: 'Explain a difficult topic', prompt: 'Explain [topic] with a concrete example. Ask what I already know and what I want to use it for.', agent: false },
                    ] : suggestions.map((prompt) => ({ label: prompt, prompt, agent: false }))).map((suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        onClick={() => {
                          setMessage(suggestion.prompt);
                          setWorkspaceAgent(suggestion.agent);
                          if (suggestion.agent) { setSearch(false); setImageAttachment(null); }
                          textareaRef.current?.focus();
                        }}
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-left text-sm leading-6 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-950"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((turn, index) => (
                <article
                  key={index}
                  className={
                    turn.role === 'user'
                      ? 'ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-white lg:mx-auto lg:max-w-4xl lg:rounded-2xl lg:border lg:border-blue-200 lg:bg-blue-50 lg:px-5 lg:py-4 lg:text-slate-950'
                      : 'mr-auto w-full max-w-4xl px-1 py-2 lg:mx-auto'
                  }
                >
                  <div className={`mb-2 items-center gap-2 ${turn.role === 'user' ? 'hidden lg:flex' : 'flex'}`}>
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

                  {turn.role === 'assistant' ? <><AssistantMessage text={turn.text} />
                          {turn.activity?.length ? <details className="mt-3 rounded-lg border border-slate-200 p-3 text-xs"><summary className="cursor-pointer font-semibold text-blue-700">Workspace agent activity</summary><ol className="mt-2 space-y-2">{turn.activity.map((step,index) => <li key={index}><strong>{step.tool} · {step.status}</strong><p className="text-slate-600">{step.summary}</p></li>)}</ol></details> : null}</> : (
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-white sm:text-base sm:leading-7 lg:text-slate-800">{turn.text}</p>
                  )}

                  {turn.imageName && <p className="mt-2 text-xs text-blue-700">Image attached: {turn.imageName}</p>}

                  {turn.sources && turn.sources.length > 0 && (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sources</p>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {turn.sources.map((source, sourceIndex) => (
                          <li key={sourceIndex} className="min-w-0 break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                            {/^https?:\/\//i.test(source.url) ? (
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

                  <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${turn.role === 'user' ? 'text-blue-50 lg:text-slate-600' : 'text-slate-600'}`}>
                    <button
                      type="button"
                      onClick={() => void copyTurn(turn.text, turn.feedbackId || `user-${index}`)}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition ${turn.role === 'user' ? 'hover:bg-blue-500 lg:hover:bg-blue-100' : 'hover:bg-slate-100'}`}
                      title={turn.role === 'user' ? 'Copy your prompt' : 'Copy response'}
                    >
                      <Copy size={14} /> {copiedTurnId === (turn.feedbackId || `user-${index}`) ? 'Copied' : 'Copy'}
                    </button>
                    {turn.role === 'assistant' && turn.feedbackId && (
                      <>
                        <button
                          type="button"
                          disabled={feedbackSendingKey === turn.feedbackId}
                          aria-pressed={turn.feedbackRating === 'positive'}
                          title="Mark this response helpful"
                          onClick={() => void submitFeedback(turn, 'positive')}
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition hover:bg-emerald-50 disabled:opacity-50 ${turn.feedbackRating === 'positive' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}
                        >
                          <ThumbsUp size={14} /> Helpful
                        </button>
                        <button
                          type="button"
                          disabled={feedbackSendingKey === turn.feedbackId}
                          aria-pressed={turn.feedbackRating === 'negative'}
                          title="Report an issue with this response"
                          onClick={() => {
                            setFeedbackError(null);
                            setFeedbackDraft((current) => current?.key === turn.feedbackId ? null : { key: turn.feedbackId!, reason: 'incorrect', comment: '' });
                          }}
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition hover:bg-amber-50 disabled:opacity-50 ${turn.feedbackRating === 'negative' ? 'bg-amber-50 text-amber-800' : 'text-slate-600'}`}
                        >
                          <ThumbsDown size={14} /> Needs work
                        </button>
                        {turn.feedbackRating && (
                          <span role="status" className="text-[11px] text-emerald-700">Feedback saved</span>
                        )}
                      </>
                    )}
                  </div>

                  {turn.role === 'assistant' && turn.feedbackId && feedbackDraft?.key === turn.feedbackId && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitFeedback(turn, 'negative', feedbackDraft.reason, feedbackDraft.comment);
                      }}
                      className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:max-w-lg"
                    >
                      <label className="text-xs font-semibold text-slate-700" htmlFor={`feedback-reason-${turn.feedbackId}`}>What needs improvement?</label>
                      <select
                        id={`feedback-reason-${turn.feedbackId}`}
                        value={feedbackDraft.reason}
                        onChange={(event) => setFeedbackDraft((current) => current && current.key === turn.feedbackId ? { ...current, reason: event.target.value } : current)}
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
                      >
                        <option value="incorrect">Incorrect information</option>
                        <option value="incomplete">Missing important details</option>
                        <option value="irrelevant">Did not follow my request</option>
                        <option value="formatting">Hard to read or poorly formatted</option>
                        <option value="unsafe">Safety or reliability concern</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        value={feedbackDraft.comment}
                        maxLength={600}
                        rows={2}
                        placeholder="Optional: tell us what should change."
                        aria-label="Additional feedback"
                        onChange={(event) => setFeedbackDraft((current) => current && current.key === turn.feedbackId ? { ...current, comment: event.target.value } : current)}
                        className="min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      />
                      <p className="text-[11px] leading-4 text-slate-500">Feedback records your rating, reason, optional comment, model, and account/session metadata. It does not store a separate copy of the message text.</p>
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setFeedbackDraft(null)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
                        <button type="submit" disabled={feedbackSendingKey === turn.feedbackId} className="min-h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                          {feedbackSendingKey === turn.feedbackId ? 'Saving…' : 'Send feedback'}
                        </button>
                      </div>
                    </form>
                  )}
                  {turn.role === 'assistant' && turn.feedbackId && feedbackError?.key === turn.feedbackId && (
                    <p role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{feedbackError.message}</p>
                  )}

                  {turn.role === 'assistant' && accessToken && accountUserId && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openWorkbench(
                          'report',
                          turn.sources?.length
                            ? 'Turn this conversation and the cited web research into a polished report. Preserve relevant source links and separate established facts from analysis.'
                            : 'Turn this conversation into a polished report with clear sections, concise analysis, and actionable conclusions.',
                        )}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <FileText size={13} /> Make report
                      </button>
                      <button
                        type="button"
                        onClick={() => openWorkbench(
                          'applet',
                          'Build a useful interactive browser applet from this conversation. Choose an interface that helps the user inspect, calculate, compare, visualize, or interact with the subject instead of merely reproducing the text.',
                        )}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Code2 size={13} /> Build applet
                      </button>
                    </div>
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

            <div className="relative z-10 shrink-0 border-t border-slate-200 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:px-8">
              <form onSubmit={send} className="mx-auto max-w-4xl">
                

                <label htmlFor="intent-message" className="sr-only">Message LooseMouth</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void attachImage(event.target.files?.[0] || null)}
                />
                <div className="rounded-2xl border border-slate-300 bg-white p-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.08)] transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  {imageAttachment && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                      <ImagePlus size={15} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{imageAttachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setImageAttachment(null)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-blue-100"
                        aria-label="Remove attached image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    id="intent-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={onMessageKeyDown}
                    maxLength={4000}
                    rows={1}
                    disabled={busy}
                    className="block max-h-[120px] min-h-10 w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-base leading-6 text-slate-950 outline-none placeholder:text-slate-500 disabled:opacity-60"
                    placeholder="Message LooseMouth…"
                  />

                  <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-1 pt-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={busy || !multimodal}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                        title={multimodal ? 'Attach an image' : 'Vision model is currently unavailable'}
                        aria-label="Attach image"
                      >
                        <ImagePlus size={16} />
                        <span className="hidden sm:inline">Image</span>
                      </button>

                      {enhancedSearch && (
                        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950">
                          <input
                            type="checkbox"
                            checked={search}
                            disabled={Boolean(imageAttachment)}
                            onChange={(event) => {
                              const next = event.target.checked;
                              setSearch(next);
                              if (accountUserId) {
                                void savePreferences(accessToken!, accountUserId, {
                                  preferred_model: model,
                                  web_search_enabled: next,
                                  data_collection_enabled: dataCollectionEnabled,
                                })
                                  .then(() => setHistoryError(''))
                                  .catch((cause) => setHistoryError(
                                    cause instanceof Error ? cause.message : 'Search preference could not be saved.',
                                  ));
                              }
                            }}
                            className="h-4 w-4 accent-blue-600 disabled:opacity-40"
                          />
                          <Globe2 size={16} /> Web
                        </label>
                      )}

                      {billing.tier !== 'free' && <label title="Let the Groq-powered agent read this chat and open a report or applet brief. You review, build and save in the workbench." className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs text-slate-600 hover:bg-slate-50"><input type="checkbox" aria-label="Workspace agent" checked={workspaceAgent} disabled={busy} onChange={(event) => { setWorkspaceAgent(event.target.checked); if (event.target.checked) { setSearch(false); setImageAttachment(null); } }} className="h-4 w-4 accent-blue-600"/>Agent</label>}

                      {search && (
                        <div className="hidden rounded-lg border border-slate-200 bg-slate-50 p-1 sm:inline-flex" role="group" aria-label="Web research depth">
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
                      disabled={busy || !message.trim() || !availabilityChecked || !availableModes.includes(model)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:gap-2 sm:px-4"
                    >
                      <span className="hidden sm:inline">Send</span><ArrowUp size={17} />
                    </button>
                  </div>


                </div>

                <div className="mt-1 flex justify-center px-1 text-[10px] text-slate-500 sm:justify-between sm:text-[11px] sm:text-slate-600">
                  <span className="hidden sm:inline">Enter to send · Shift+Enter for newline</span>
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
      {accessToken && accountUserId && workbenchWindows.map((windowItem) => (
        <LooseMouthWorkbench
          key={windowItem.id}
          windowId={windowItem.id}
          name={windowItem.name}
          isActive={activeWorkbenchId === windowItem.id}
          tabs={workbenchWindows}
          canCreate={workbenchWindows.length < MAX_WORKBENCH_WINDOWS}
          canCreateApplet={billing.workbench === 'full'}
          onRename={(name, onlyIfDefault) => renameWorkbench(windowItem.id, name, onlyIfDefault)}
          onSwitch={restoreWorkbench}
          onCreate={(kind) => openWorkbench(kind, '', true)}
          onMinimize={() => setActiveWorkbenchId(null)}
          onClose={() => closeWorkbench(windowItem.id)}
          accessToken={accessToken}
          userId={accountUserId}
          conversationId={windowItem.conversationId || activeConversationId}
          conversationTurns={workbenchConversationTurns}
          initialKind={windowItem.kind}
          initialPrompt={windowItem.initialPrompt}
        />
      ))}
      {accessToken && accountUserId && workbenchWindows.length > 0 && (
        <WorkbenchDock
          windows={workbenchWindows}
          visible={activeWorkbenchId === null}
          canCreate={workbenchWindows.length < MAX_WORKBENCH_WINDOWS}
          canCreateApplet={billing.workbench === 'full'}
          onOpen={restoreWorkbench}
          onCreate={(kind) => openWorkbench(kind, '', true)}
        />
      )}
    </main>
  );
}
