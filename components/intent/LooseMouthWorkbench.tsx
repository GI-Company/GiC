'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Download,
  Eye,
  FileText,
  Minus,
  Plus,
  PencilLine,
  Play,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  createArtifact,
  deleteArtifact,
  listArtifacts,
  updateArtifact,
  type ArtifactKind,
  type LooseMouthArtifact,
} from '@/lib/loosemouth-artifacts';
import type { WorkbenchActivity } from '@/lib/artifact-agent';
import AssistantMessage from '@/components/intent/AssistantMessage';
import type { WorkbenchTab } from '@/components/intent/WorkbenchDock';

type Props = {
  accessToken: string;
  userId: string;
  conversationId?: string | null;
  conversationTurns?: Array<{
    role: 'user' | 'assistant';
    text: string;
    sources?: Array<{ title: string; url: string }>;
  }>;
  initialKind?: ArtifactKind;
  initialPrompt?: string;
  windowId: string;
  name: string;
  isActive: boolean;
  tabs: WorkbenchTab[];
  canCreate: boolean;
  canCreateApplet: boolean;
  onRename: (name: string, onlyIfDefault?: boolean) => void;
  onSwitch: (id: string) => void;
  onCreate: (kind: ArtifactKind) => void;
  onMinimize: () => void;
  onClose: () => void;
};

type AppletFile = { path: string; content: string };

function appletFiles(content: Record<string, unknown> | null): AppletFile[] {
  if (!content || !Array.isArray(content.files)) return [];
  return content.files
    .filter((file): file is { path?: string; content?: string } => Boolean(file && typeof file === 'object'))
    .map((file) => ({
      path: typeof file.path === 'string' ? file.path : 'untitled.txt',
      content: typeof file.content === 'string' ? file.content : '',
    }));
}

function appletDoc(content: Record<string, unknown>) {
  const files = appletFiles(content);
  const get = (path: string) => files.find((file) => file.path === path)?.content || '';
  let html = get('index.html') || '<main id="app"></main>';
  const css = get('style.css');
  const js = get('app.js').replace(/<\/script/gi, '<\\/script');

  if (!/<html[\s>]/i.test(html)) html = `<!doctype html><html><head></head><body>${html}</body></html>`;
  if (!/<head[\s>]/i.test(html)) html = html.replace(/<html([^>]*)>/i, '<html$1><head></head>');
  if (!/<body[\s>]/i.test(html)) html = html.replace(/<\/head>/i, '</head><body></body>');

  const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src \'none\'; object-src \'none\'; frame-src \'none\'; base-uri \'none\'; form-action \'none\'">';
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${csp}`) : `${csp}${html}`;
  const styleTag = `<style>${css}</style>`;
  html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${styleTag}</head>`) : `${styleTag}${html}`;

  const scriptTag = `<script>${js}<\/script>`;
  html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scriptTag}</body>`) : `${html}${scriptTag}`;
  return html;
}

function safeFilename(value: string, fallback: string) {
  const cleaned = value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 90);
  return cleaned || fallback;
}

function downloadBlob(filename: string, type: string, value: string) {
  const blob = new Blob([value], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 30_000);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function reportBodyHtml(markdown: string) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const output: string[] = [];
  let inCode = false;
  let code: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = null;
  };

  for (const raw of lines) {
    if (raw.trim().startsWith('```')) {
      closeList();
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(raw);
      continue;
    }

    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (listType !== 'ul') {
        closeList();
        output.push('<ul>');
        listType = 'ul';
      }
      output.push(`<li>${escapeHtml(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      if (listType !== 'ol') {
        closeList();
        output.push('<ol>');
        listType = 'ol';
      }
      output.push(`<li>${escapeHtml(numbered[1])}</li>`);
      continue;
    }

    closeList();
    if (line.startsWith('> ')) {
      output.push(`<blockquote>${escapeHtml(line.slice(2))}</blockquote>`);
      continue;
    }
    output.push(`<p>${escapeHtml(line)}</p>`);
  }

  if (inCode && code.length) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  closeList();
  return output.join('\n');
}

function reportDocument(title: string, markdown: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a;background:#f8fafc}
  *{box-sizing:border-box}body{margin:0;padding:48px 20px}.page{max-width:900px;margin:0 auto;background:white;padding:56px;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 18px 60px rgba(15,23,42,.08)}
  h1{font-size:34px;line-height:1.15;margin:0 0 28px}h2{font-size:24px;margin:34px 0 12px}h3{font-size:18px;margin:26px 0 10px}p,li{font-size:15px;line-height:1.8;color:#334155}ul,ol{padding-left:24px}blockquote{margin:22px 0;padding:14px 18px;border-left:3px solid #2563eb;background:#eff6ff;color:#334155}
  pre{overflow:auto;border-radius:12px;background:#0f172a;color:#e2e8f0;padding:18px;font-size:13px;line-height:1.6}@media print{body{background:white;padding:0}.page{border:0;box-shadow:none;max-width:none;padding:0}}
</style>
</head>
<body><main class="page">${reportBodyHtml(markdown)}</main></body>
</html>`;
}

export default function LooseMouthWorkbench({
  accessToken,
  userId,
  conversationId,
  conversationTurns = [],
  initialKind = 'report',
  initialPrompt = '',
  windowId,
  name,
  isActive,
  tabs,
  canCreate,
  canCreateApplet,
  onRename,
  onSwitch,
  onCreate,
  onMinimize,
  onClose,
}: Props) {
  const [kind, setKind] = useState<ArtifactKind>(initialKind);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [items, setItems] = useState<LooseMouthArtifact[]>([]);
  const [active, setActive] = useState<LooseMouthArtifact | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState<WorkbenchActivity[]>([]);
  const [reportMode, setReportMode] = useState<'preview' | 'edit'>('preview');
  const [activeFile, setActiveFile] = useState('index.html');
  const [compiledPreview, setCompiledPreview] = useState('');
  const [includeConversation, setIncludeConversation] = useState(Boolean(conversationTurns.length));
  const conversationPreferenceTouchedRef = useRef(false);

  useEffect(() => {
    // A Workbench started before chat research can opt into new conversation context automatically.
    if (conversationTurns.length && !conversationPreferenceTouchedRef.current) setIncludeConversation(true);
  }, [conversationTurns.length]);
  useEffect(() => {
    setKind(initialKind);
    setPrompt(initialPrompt);
    setActive(null);
    setDraft(null);
    setActivity([]);
    setError('');
    setReportMode('preview');
    setActiveFile('index.html');
    setCompiledPreview('');
  }, [initialKind, initialPrompt]);

  useEffect(() => {
    // Re-fetch saved builds when this window becomes active, so saves made in another
    // Workbench appear without discarding this window's independent editor draft.
    if (!isActive) return;
    let active = true;
    setLoadingItems(true);
    void listArtifacts(accessToken, userId)
      .then((next) => { if (active) setItems(next); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Saved builds could not be loaded.'); })
      .finally(() => { if (active) setLoadingItems(false); });
    return () => { active = false; };
  }, [accessToken, userId, isActive]);

  const files = useMemo(() => appletFiles(draft), [draft]);
  const reportMarkdown = typeof draft?.markdown === 'string' ? draft.markdown : '';
  const artifactTitle = String(draft?.title || active?.title || (kind === 'report' ? 'Untitled report' : 'Untitled applet'));

  function resetBuild(nextKind: ArtifactKind = kind) {
    setKind(nextKind);
    setPrompt('');
    setActive(null);
    setDraft(null);
    setActivity([]);
    setError('');
    setReportMode('preview');
    setActiveFile('index.html');
    setCompiledPreview('');
  }

  function openArtifact(item: LooseMouthArtifact) {
    if (busy) return;
    setActive(item);
    setKind(item.kind);
    setDraft(item.content);
    setActivity([]);
    setPrompt(item.prompt);
    setError('');
    setReportMode('preview');
    const nextFiles = appletFiles(item.content);
    setActiveFile(nextFiles[0]?.path || 'index.html');
    setCompiledPreview(item.kind === 'applet' ? appletDoc(item.content) : '');
    onRename(item.title.slice(0, 64), true);
  }

  async function refreshItems() {
    setItems(await listArtifacts(accessToken, userId));
  }

  async function generate() {
    if (!prompt.trim() || busy) return;
    setActivity([]);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/intent/artifact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          prompt,
          current: draft,
          conversation_context: includeConversation && conversationTurns.length
            ? conversationTurns.slice(-16).map((turn) => ({
                role: turn.role,
                text: turn.text.slice(0, 4000),
                sources: turn.sources?.slice(0, 8),
              }))
            : undefined,
        }),
      });
      const data = await response.json() as { error?: string; artifact?: Record<string, unknown>; activity?: WorkbenchActivity[] };
      if (!response.ok || !data.artifact) throw new Error(data.error || 'Generation failed.');
      setDraft(data.artifact);
      setActivity(data.activity || []);
      const generatedTitle = data.artifact.title;
      if (/^(Report|Applet) \d+$/.test(name) && typeof generatedTitle === 'string' && generatedTitle.trim()) {
        onRename(generatedTitle.trim().slice(0, 64), true);
      }
      if (kind === 'applet') {
        const nextFiles = appletFiles(data.artifact);
        setActiveFile(nextFiles[0]?.path || 'index.html');
        setCompiledPreview('');
      } else {
        setReportMode('preview');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft || busy) return;
    setBusy(true);
    setError('');
    try {
      const title = String(draft.title || active?.title || 'Untitled artifact').slice(0, 160);
      let saved: LooseMouthArtifact;
      if (active) {
        saved = await updateArtifact(accessToken, userId, active.id, {
          title,
          prompt,
          content: draft,
          version: active.version + 1,
        });
      } else {
        saved = await createArtifact(accessToken, userId, {
          conversation_id: conversationId,
          kind,
          title,
          prompt,
          content: draft,
        });
      }
      setActive(saved);
      await refreshItems();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!active || busy) return;
    if (!window.confirm(`Delete “${active.title}”?`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteArtifact(accessToken, userId, active.id);
      await refreshItems();
      resetBuild(kind);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  function updateReport(markdown: string) {
    setDraft((current) => ({ ...(current || {}), title: String(current?.title || artifactTitle), markdown }));
  }

  function updateAppletFile(path: string, value: string) {
    setDraft((current) => {
      const currentFiles = appletFiles(current);
      const nextFiles = currentFiles.map((file) => file.path === path ? { ...file, content: value } : file);
      return { ...(current || {}), files: nextFiles };
    });
  }

  function compileApplet() {
    if (!draft) return;
    setCompiledPreview(appletDoc(draft));
  }

  function downloadPrimary() {
    if (!draft) return;
    const base = safeFilename(artifactTitle, kind === 'report' ? 'loosemouth-report' : 'loosemouth-applet');
    if (kind === 'report') {
      downloadBlob(`${base}.html`, 'text/html;charset=utf-8', reportDocument(artifactTitle, reportMarkdown));
      return;
    }
    downloadBlob(`${base}.html`, 'text/html;charset=utf-8', appletDoc(draft));
  }

  function downloadMarkdown() {
    if (!draft || kind !== 'report') return;
    downloadBlob(`${safeFilename(artifactTitle, 'loosemouth-report')}.md`, 'text/markdown;charset=utf-8', reportMarkdown);
  }

  function printReport() {
    if (!draft || kind !== 'report') return;
    // Open synchronously from the user gesture to support mobile popup policies.
    // The "noopener" window feature makes window.open return null in some browsers.
    const popup = window.open('', '_blank');
    if (!popup) {
      setError('Your browser blocked the PDF/print window. Allow popups for this site and try again.');
      return;
    }
    popup.opener = null;
    popup.document.open();
    popup.document.write(reportDocument(artifactTitle, reportMarkdown));
    popup.document.close();
    const openPrintDialog = () => {
      popup.focus();
      popup.print();
    };
    if (popup.document.readyState === 'complete') {
      popup.setTimeout(openPrintDialog, 150);
    } else {
      popup.addEventListener('load', openPrintDialog, { once: true });
    }
  }

  const currentFile = files.find((file) => file.path === activeFile) || files[0];

  function closeWindow() {
    const hasUnsavedDraft = Boolean(draft && (!active || JSON.stringify(draft) !== JSON.stringify(active.content)));
    if (hasUnsavedDraft && !window.confirm('Close "' + name + '"? Unsaved changes will be lost. Save or download your work first.')) return;
    onClose();
  }

  return (
    <section role="dialog" aria-modal={isActive} aria-label={name || "LooseMouth Workbench"} style={{ display: isActive ? undefined : "none" }} className="fixed inset-0 z-[70] flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-950/35 backdrop-blur-sm lg:p-5">
      <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] overflow-hidden bg-white shadow-2xl lg:grid-cols-[260px_minmax(0,1fr)] lg:rounded-2xl lg:border lg:border-slate-200">
        <aside className="hidden min-h-0 border-r border-slate-200 bg-slate-50 p-4 lg:flex lg:flex-col">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">LooseMouth Workbench</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Reports and runnable browser applets kept with your workspace.</p>
          </div>

          <button
            type="button"
            onClick={() => resetBuild()}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={14} /> New build
          </button>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Saved builds</p>
              <span className="text-[10px] text-slate-400">{loadingItems ? 'Loading…' : items.length}</span>
            </div>
            <div className="mt-2 space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openArtifact(item)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition ${active?.id === item.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-white'}`}
                >
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[.1em] text-slate-500">{item.kind} · v{item.version}</span>
                </button>
              ))}
              {!loadingItems && items.length === 0 && <p className="rounded-xl bg-white px-3 py-3 text-xs leading-5 text-slate-500">Saved reports and applets will appear here.</p>}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FileText size={16} className="shrink-0 text-blue-700" />
              <div className="min-w-0 flex-1">
                <input
                  aria-label="Workbench name"
                  title="Rename this Workbench"
                  value={name}
                  maxLength={64}
                  onChange={(event) => onRename(event.target.value)}
                  onBlur={() => { if (!name.trim()) onRename(kind === 'report' ? 'Untitled report' : 'Untitled applet'); else if (name !== name.trim()) onRename(name.trim()); }}
                  className="w-full truncate rounded-lg border border-transparent bg-white px-1 py-0.5 text-sm font-semibold text-slate-950 outline-none hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="truncate px-1 text-[11px] text-slate-500">Rename this window · keep drafts open while chatting</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onMinimize}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:px-3"
                aria-label="Minimize Workbench and return to chat"
                title="Return to chat while keeping this Workbench open"
              >
                <Minus size={18} /> <span className="hidden sm:inline">Chat</span>
              </button>
              <button type="button" onClick={closeWindow} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100" aria-label={'Close ' + name}>
                <X size={18} />
              </button>
            </div>
          </header>

          <nav aria-label="Switch between Workbenches" className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Windows</span>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                title={tab.name}
                aria-current={tab.id === windowId ? 'page' : undefined}
                onClick={() => onSwitch(tab.id)}
                className={`inline-flex min-h-9 max-w-44 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold ${tab.id === windowId ? 'border-blue-300 bg-blue-100 text-blue-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-blue-50'}`}
              >
                {tab.kind === 'report' ? <FileText size={13} /> : <Code2 size={13} />}
                <span className="truncate">{tab.name || 'Untitled Workbench'}</span>
              </button>
            ))}
            <button type="button" disabled={!canCreate} onClick={() => onCreate('report')} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"><Plus size={13} /> Report</button>
            <button type="button" disabled={!canCreate || !canCreateApplet} onClick={() => onCreate('applet')} title={!canCreateApplet ? 'Applets require Enhanced Workspace' : 'Create a new applet window'} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"><Plus size={13} /> Applet</button>
          </nav>

          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200 p-3">
            <button
              type="button"
              onClick={() => resetBuild('report')}
              disabled={busy}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${kind === 'report' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              <FileText size={15} /> Report
            </button>
            <button
              type="button"
              onClick={() => resetBuild('applet')}
              disabled={busy || !canCreateApplet}
              title={!canCreateApplet ? 'Applets require Enhanced Workspace' : 'Edit applet'}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${kind === 'applet' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              <Code2 size={15} /> Applet
            </button>
            {active && <span className="ml-auto shrink-0 text-xs text-slate-500">Saved · v{active.version}</span>}
          </div>

          <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
            <div className="min-h-0 border-b border-slate-200 p-4 lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[.13em] text-slate-500">{kind === 'report' ? 'Report brief' : 'Applet brief'}</p>
              <textarea
                value={prompt}
                disabled={busy}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={kind === 'report'
                  ? 'Describe the report you want. You can ask for an executive summary, technical brief, research memo, comparison, or documentation.'
                  : 'Describe the applet you want. Explain the interface, controls, calculations, visualization, or interaction you need.'}
                className="mt-2 h-40 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {conversationTurns.length > 0 && (
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeConversation}
                    disabled={busy}
                    onChange={(event) => { conversationPreferenceTouchedRef.current = true; setIncludeConversation(event.target.checked); }}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Use current conversation</span>
                    <span className="block">Include the recent chat and its source links as context for this build.</span>
                  </span>
                </label>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={busy || !prompt.trim()}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Play size={15} /> {busy ? 'Agent working…' : draft ? 'Ask agent to revise' : 'Run workbench agent'}
              </button>

              <p className="mt-2 text-xs leading-5 text-slate-500">Groq-powered agent · reads context, drafts and checks. You control save, preview and export.</p>
              {activity.length > 0 && <section aria-label="Workbench agent activity" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="text-xs font-semibold text-slate-900">Agent activity</h3><ol className="mt-2 space-y-2">{activity.map((step,index) => <li key={index} className="text-xs leading-5"><span className={step.status === 'rejected' ? 'font-semibold text-amber-700' : 'font-semibold text-blue-700'}>{step.tool} · {step.status}</span><p className="text-slate-600">{step.summary}</p></li>)}</ol></section>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={!draft || busy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Save size={14} /> Save
                </button>
                <button
                  type="button"
                  onClick={downloadPrimary}
                  disabled={!draft}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Download size={14} /> {kind === 'report' ? 'HTML' : 'Download'}
                </button>
              </div>

              {kind === 'report' && draft && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={downloadMarkdown} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Download size={13} /> Markdown
                  </button>
                  <button type="button" onClick={printReport} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Printer size={13} /> Print / PDF
                  </button>
                </div>
              )}

              {active && (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={busy}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 size={13} /> Delete saved build
                </button>
              )}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                {kind === 'report'
                  ? 'Reports stay editable in the workspace and can be exported as HTML, Markdown, or printed to PDF.'
                  : 'Applets are assembled into a self-contained HTML document and run in an isolated browser sandbox with scripts enabled but no parent-page access.'}
              </div>

              {conversationId && <p className="mt-3 text-[10px] text-slate-400">Saved builds stay linked to the active conversation for workspace continuity.</p>}
              {error && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{error}</p>}
            </div>

            <div className="min-h-[52vh] min-w-0 overflow-y-auto overscroll-contain bg-slate-100 p-3 sm:p-4 lg:min-h-0">
              {!draft ? (
                <div className="flex h-full min-h-[480px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                  <div className="max-w-sm px-6">
                    {kind === 'report' ? <FileText className="mx-auto h-8 w-8 text-blue-700" /> : <Code2 className="mx-auto h-8 w-8 text-blue-700" />}
                    <p className="mt-4 font-semibold text-slate-900">{kind === 'report' ? 'Your report canvas will open here.' : 'Your applet workspace will open here.'}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{kind === 'report' ? 'Generate a polished document, edit the Markdown, then export it.' : 'Generate HTML, CSS, and JavaScript, edit the files, compile, and run the result here.'}</p>
                  </div>
                </div>
              ) : kind === 'report' ? (
                <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-0">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{artifactTitle}</p>
                      <p className="text-[10px] uppercase tracking-[.12em] text-slate-400">LooseMouth report · downloadable</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={downloadPrimary} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Download HTML report"><Download size={13} /> HTML</button>
                      <button type="button" onClick={downloadMarkdown} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Download Markdown report"><Download size={13} /> MD</button>
                      <button type="button" onClick={printReport} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Print or save as PDF"><Printer size={13} /> PDF</button>
                      <div className="inline-flex rounded-lg bg-slate-100 p-1">
                        <button type="button" onClick={() => setReportMode('preview')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${reportMode === 'preview' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}><Eye size={13} /> Preview</button>
                        <button type="button" onClick={() => setReportMode('edit')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${reportMode === 'edit' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}><PencilLine size={13} /> Edit</button>
                      </div>
                    </div>
                  </div>
                  {reportMode === 'preview' ? (
                    <article className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
                      <div className="mx-auto max-w-4xl"><AssistantMessage text={reportMarkdown} /></div>
                    </article>
                  ) : (
                    <textarea
                      value={reportMarkdown}
                      aria-label="Edit report Markdown"
                      disabled={busy}
                      onChange={(event) => updateReport(event.target.value)}
                      className="min-h-[280px] flex-1 resize-none overflow-y-auto bg-white p-5 font-mono text-sm leading-7 text-slate-800 outline-none sm:p-8 lg:min-h-0"
                      spellCheck
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-0">
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
                    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                      {files.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setActiveFile(file.path)}
                          className={`shrink-0 rounded-lg px-3 py-2 font-mono text-xs ${currentFile?.path === file.path ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {file.path}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={compileApplet} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
                      <Play size={13} /> Compile &amp; run
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 lg:grid-cols-2">
                    <div className="min-h-[300px] border-b border-slate-200 lg:min-h-0 lg:border-b-0 lg:border-r">
                      {currentFile ? (
                        <textarea
                          value={currentFile.content}
                          disabled={busy}
                          onChange={(event) => updateAppletFile(currentFile.path, event.target.value)}
                          className="h-full min-h-[300px] w-full resize-none bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none"
                          spellCheck={false}
                          aria-label={`Edit ${currentFile.path}`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">No applet files were generated.</div>
                      )}
                    </div>
                    <div className="min-h-[360px] bg-slate-50 p-3 lg:min-h-0">
                      {compiledPreview ? (
                        <iframe
                          title="LooseMouth applet preview"
                          sandbox="allow-scripts"
                          srcDoc={compiledPreview}
                          className="h-full min-h-[340px] w-full rounded-xl border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="flex h-full min-h-[340px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">Compile the applet to run the preview.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
