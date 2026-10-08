'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ExternalLink } from 'lucide-react';

const HEIGHT_EVENT = 'gic:bitvision-cell-height';
const MIN_HEIGHT = 720;
const MAX_HEIGHT = 16000;

export default function BitVisionCellEmbed() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1450);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    const next = Math.max(
      doc.documentElement.scrollHeight,
      doc.body.scrollHeight,
      doc.body.offsetHeight,
    );
    if (Number.isFinite(next) && next >= MIN_HEIGHT && next <= MAX_HEIGHT) {
      setHeight((current) => Math.abs(current - next) > 3 ? Math.ceil(next + 2) : current);
    }
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;

    function onLoad() {
      observer?.disconnect();
      const doc = frame?.contentDocument;
      if (doc && 'ResizeObserver' in window) {
        observer = new ResizeObserver(measure);
        if (doc.body) observer.observe(doc.body);
      }
      measure();
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
      if (!event.data || event.data.type !== HEIGHT_EVENT) return;
      const next = Number(event.data.height);
      if (Number.isFinite(next) && next >= MIN_HEIGHT && next <= MAX_HEIGHT) {
        setHeight((current) => Math.abs(current - next) > 3 ? Math.ceil(next + 2) : current);
      }
    }

    frame.addEventListener('load', onLoad);
    window.addEventListener('message', onMessage);
    window.addEventListener('resize', measure);
    if (frame.contentDocument?.readyState === 'complete') onLoad();

    return () => {
      observer?.disconnect();
      frame.removeEventListener('load', onLoad);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  function jumpToDashboard() {
    const iframe = frameRef.current;
    const panel = iframe?.contentDocument?.querySelector('.layout > aside');
    if (!iframe || !panel) {
      iframe?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const top = window.scrollY + iframe.getBoundingClientRect().top + panel.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, top - 86), behavior: 'smooth' });
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#07131e] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Live simulator and measurement dashboard</p>
          <p className="mt-1 text-xs text-slate-400">Scroll the page to reach every metric, action, and trajectory. Alt + mouse wheel zooms the simulation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={jumpToDashboard} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-200">
            <ArrowDown size={15} /> Jump to dashboard
          </button>
          <a href="/bitvision-cell-live.html" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
            Standalone view <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <iframe
        ref={frameRef}
        src="/bitvision-cell-live.html"
        title="BitVision-Cell v0.2 live checkpoint inference and scrollable measurement dashboard"
        className="block min-h-[720px] w-full border-0 bg-slate-950"
        style={{ height: height + 'px' }}
        allow="cross-origin-isolated; fullscreen"
      />
    </div>
  );
}
