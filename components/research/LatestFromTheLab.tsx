'use client';

import React, { useMemo } from 'react';
import {
  getAllTimelineEvents,
  ResearchTimelineEvent,
  ResearchNode,
} from '@/lib/research-data';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  Activity,
  Shield,
  HelpCircle,
  Calendar,
} from 'lucide-react';

interface LatestFromTheLabProps {
  onSelectNode: (nodeId: string) => void;
  onViewAllLogs: () => void;
}

export default function LatestFromTheLab({
  onSelectNode,
  onViewAllLogs,
}: LatestFromTheLabProps) {
  // Derive latest entries directly from existing structured research data
  const latestEntries = useMemo(() => {
    const all = getAllTimelineEvents();

    // Map each item with its original index for stable tie-breaking
    const indexed = all.map((item, index) => ({ item, index }));

    // Extract items with a valid known date
    const dated = indexed.filter(({ item }) => {
      if (!item.event.date) return false;
      const parsed = Date.parse(item.event.date);
      return !isNaN(parsed);
    });

    // Sort dated entries descending by actual date; use existing data order as stable tie-breaker
    dated.sort((a, b) => {
      const timeA = Date.parse(a.item.event.date!);
      const timeB = Date.parse(b.item.event.date!);
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return a.index - b.index;
    });

    // Extract items without valid dates, preserving original data order
    const undated = indexed.filter(({ item }) => {
      if (!item.event.date) return true;
      return isNaN(Date.parse(item.event.date));
    });

    // Combined list: dated entries first (newest to oldest), then undated entries in existing data order
    const combined = [...dated, ...undated];

    // Select the three newest entries without fabricating dates
    return combined.slice(0, 3).map(({ item }) => item);
  }, []);

  const getLineageBadge = (stage?: string) => {
    switch (stage) {
      case 'FAILURE/LESSON':
        return {
          label: 'FAILURE / LESSON',
          bg: 'bg-rose-950/80 border-rose-700/80 text-rose-300',
          icon: <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />,
        };
      case 'RESULT':
        return {
          label: 'RESULT',
          bg: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />,
        };
      case 'ITERATION':
        return {
          label: 'ITERATION',
          bg: 'bg-blue-950/80 border-blue-700/80 text-blue-300',
          icon: <Layers className="w-3 h-3 text-blue-400 shrink-0" />,
        };
      case 'EXPERIMENT':
        return {
          label: 'EXPERIMENT',
          bg: 'bg-purple-950/80 border-purple-700/80 text-purple-300',
          icon: <Activity className="w-3 h-3 text-purple-400 shrink-0" />,
        };
      case 'IMPLEMENTATION':
        return {
          label: 'IMPLEMENTATION',
          bg: 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300',
          icon: <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />,
        };
      default:
        return {
          label: stage || 'RESEARCH LOG',
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          icon: <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />,
        };
    }
  };

  const getEpistemicBadge = (status: string) => {
    switch (status) {
      case 'SOURCE-VERIFIED':
        return {
          label: 'SOURCE-VERIFIED',
          bg: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400',
        };
      case 'EXPERIMENT-VERIFIED':
        return {
          label: 'EXPERIMENT-VERIFIED',
          bg: 'bg-cyan-950/70 border-cyan-800/80 text-cyan-400',
        };
      case 'FAILED / NULL':
        return {
          label: 'NULL RESULT / DISCONFIRMED',
          bg: 'bg-rose-950/70 border-rose-800/80 text-rose-400',
        };
      case 'AUTHOR-REPORTED':
        return {
          label: 'AUTHOR-REPORTED',
          bg: 'bg-amber-950/70 border-amber-800/80 text-amber-400',
        };
      case 'DESIGN CLAIM / HYPOTHESIS':
        return {
          label: 'DESIGN CLAIM',
          bg: 'bg-purple-950/70 border-purple-800/80 text-purple-400',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-900 border-slate-800 text-slate-400',
        };
    }
  };

  return (
    <section id="latest-from-the-lab" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#1b212d] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wider uppercase font-semibold">Laboratory Chronology</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            LATEST FROM THE LAB
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Recent empirical findings, architectural iterations, and null results surfaced directly from active research logs.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAllLogs}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors font-semibold shrink-0"
        >
          <span>View Complete Research Log</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Featured Recent Research Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestEntries.map(({ project, event }) => {
          const lineage = getLineageBadge(event.lineageStage);
          const epistemic = getEpistemicBadge(event.epistemicStatus);

          return (
            <article
              key={event.id}
              className="p-5 rounded-xl bg-[#0b0e14] border border-[#1a212e] hover:border-[#2b384e] flex flex-col justify-between transition-all duration-200 group relative"
            >
              <div className="space-y-3">
                {/* Header: Lineage Stage & Project Identification */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1.5 tracking-wider uppercase ${lineage.bg}`}
                  >
                    {lineage.icon}
                    <span>{lineage.label}</span>
                  </span>

                  <div className="flex items-center gap-2 text-slate-400 font-semibold">
                    {event.date && (
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                        <span>{event.date}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                      <span>{project.name}</span>
                    </span>
                  </div>
                </div>

                {/* Event Title */}
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {event.title}
                </h3>

                {/* Concise Existing Summary */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {event.description}
                </p>

                {/* Epistemic Classification Badge */}
                <div className="pt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono ${epistemic.bg}`}
                  >
                    {epistemic.label}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Separate Documentation from Evidence */}
              <div className="mt-4 pt-3 border-t border-[#161c28] flex items-center justify-between gap-2 text-xs">
                {event.relatedArticleUrl ? (
                  <a
                    href={event.relatedArticleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded bg-[#101520] hover:bg-[#182130] text-slate-300 hover:text-white border border-[#20293a] flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                    title="Read the author's public research log on LinkedIn"
                  >
                    <BookOpen className="w-3 h-3 text-purple-400" />
                    <span>Read Log</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono">LAB RECORD</span>
                )}

                <button
                  type="button"
                  onClick={() => onSelectNode(project.id)}
                  className="px-3 py-1.5 rounded bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-700/80 flex items-center gap-1 text-[11px] font-bold transition-all ml-auto"
                >
                  <span>{event.lineageStage === 'EXPERIMENT' ? 'Inspect Experiment' : 'Inspect Project'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Restrained View Complete Log Bar */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onViewAllLogs}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors font-mono py-1"
        >
          <span>VIEW COMPLETE RESEARCH LOG</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>
    </section>
  );
}
