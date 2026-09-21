'use client';

import React, { useState, useMemo } from 'react';
import {
  RESEARCH_NODES,
  RESEARCH_DOMAINS,
  ResearchDomain,
  ResearchNode,
  ResearchPublication,
  ResearchTimelineEvent,
  getAllTimelineEvents,
  getAllResearchPublications,
} from '@/lib/research-data';
import {
  FileText,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  Layers,
  Sparkles,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Code2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Compass,
} from 'lucide-react';

interface ResearchLogViewProps {
  onSelectNode?: (nodeId: string) => void;
  initialDomainFilter?: ResearchDomain | 'all';
}

export default function ResearchLogView({
  onSelectNode,
  initialDomainFilter = 'all',
}: ResearchLogViewProps) {
  const [selectedDomain, setSelectedDomain] = useState<ResearchDomain | 'all'>(initialDomainFilter);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all timeline events combined with their parent project
  const allEvents = useMemo(() => {
    return getAllTimelineEvents();
  }, []);

  // Collect all research publications
  const allPublications = useMemo(() => {
    return getAllResearchPublications();
  }, []);

  // Filtered timeline items
  const filteredEvents = useMemo(() => {
    return allEvents.filter(({ project, event }) => {
      // Domain filter
      if (selectedDomain !== 'all' && project.domain !== selectedDomain) {
        return false;
      }
      // Stage filter
      if (selectedStage !== 'all' && event.lineageStage !== selectedStage) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && event.epistemicStatus !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProject = project.name.toLowerCase().includes(q) || project.codename.toLowerCase().includes(q);
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesDesc = event.description.toLowerCase().includes(q);
        const matchesArticle = event.articleTitle ? event.articleTitle.toLowerCase().includes(q) : false;
        if (!matchesProject && !matchesTitle && !matchesDesc && !matchesArticle) {
          return false;
        }
      }
      return true;
    });
  }, [allEvents, selectedDomain, selectedStage, selectedStatus, searchQuery]);

  const epistemicStatusColors: Record<string, { bg: string; text: string; border: string }> = {
    'SOURCE-VERIFIED': { bg: 'bg-emerald-950/90', text: 'text-emerald-300', border: 'border-emerald-700' },
    'EXPERIMENT-VERIFIED': { bg: 'bg-cyan-950/90', text: 'text-cyan-300', border: 'border-cyan-700' },
    'AUTHOR-REPORTED': { bg: 'bg-amber-950/90', text: 'text-amber-300', border: 'border-amber-700' },
    'DESIGN CLAIM / HYPOTHESIS': { bg: 'bg-purple-950/90', text: 'text-purple-300', border: 'border-purple-700' },
    'SOURCE CODE': { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800/80' },
    'MEASURED': { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-800/80' },
    'OBSERVED': { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800/80' },
    'SUPPORTED': { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-800/80' },
    'FAILED / NULL': { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-800/80' },
    'HYPOTHESIS': { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-800/80' },
    'RESEARCH LOG': { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-800/80' },
    'DEMONSTRATION': { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700' },
  };

  const stageBadgeColors: Record<string, { bg: string; text: string }> = {
    QUESTION: { bg: 'bg-amber-950/70', text: 'text-amber-400' },
    IMPLEMENTATION: { bg: 'bg-emerald-950/70', text: 'text-emerald-400' },
    EXPERIMENT: { bg: 'bg-cyan-950/70', text: 'text-cyan-400' },
    RESULT: { bg: 'bg-blue-950/70', text: 'text-blue-400' },
    'FAILURE/LESSON': { bg: 'bg-rose-950/70', text: 'text-rose-400' },
    ITERATION: { bg: 'bg-purple-950/70', text: 'text-purple-400' },
    'PUBLIC RESEARCH LOG': { bg: 'bg-indigo-950/70', text: 'text-indigo-400' },
  };

  return (
    <div id="global-research-log-view" className="space-y-8 font-mono text-slate-300">
      {/* Header & Epistemic Framework Banner */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
                Global Intent Research Chronology
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#161d29] text-slate-400 border border-[#232d3d] font-bold">
                Founder Research Logs & Milestones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Public Research Logs & Evolutionary Timeline
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed mt-1">
              Follow the complete lineage of ideas across TinyCoherent, Optic-Trigeminal physiological modeling, and Virtual Lab:
              from initial research questions and source code implementation, through controlled trials, null results, and public research logs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3 py-2 rounded-lg bg-[#0e121a] border border-[#1c222e]">
              <span className="text-slate-500 text-[10px] block">Public Articles</span>
              <span className="text-base font-bold text-emerald-400">{allPublications.length}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#0e121a] border border-[#1c222e]">
              <span className="text-slate-500 text-[10px] block">Timeline Events</span>
              <span className="text-base font-bold text-cyan-400">{allEvents.length}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-[#0e121a] border border-[#1c222e]">
              <span className="text-slate-500 text-[10px] block">Null/Mixed Preserved</span>
              <span className="text-base font-bold text-rose-400">100%</span>
            </div>
          </div>
        </div>

        {/* Evidentiary Caveat Banner */}
        <div className="bg-[#090d14] border border-[#1b2332] p-4 rounded-lg flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">
              Evidentiary Standards & Public Log Role:
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Public research logs on LinkedIn document independent research hypotheses, iterative engineering lessons, and public progress in real time.
              They represent transparent communication of the research process, while source code repositories, telemetry logs, and controlled experiment datasets serve as primary empirical proof.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Domain:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDomain('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedDomain === 'all'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'bg-[#0e121a] text-slate-400 border border-[#1c222e] hover:text-white'
              }`}
            >
              All Domains
            </button>
            {RESEARCH_DOMAINS.map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomain(domain.id)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedDomain === domain.id
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                    : 'bg-[#0e121a] text-slate-400 border border-[#1c222e] hover:text-white'
                }`}
              >
                {domain.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs, experiments, keywords..."
              className="w-full bg-[#080b10] border border-[#1c222e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Secondary filters: Stage and Epistemic Status */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#181d27] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Stage:</span>
            {['all', 'QUESTION', 'IMPLEMENTATION', 'EXPERIMENT', 'RESULT', 'FAILURE/LESSON', 'ITERATION'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStage(st)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedStage === st
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'bg-[#0e121a] text-slate-500 hover:text-slate-300 border border-[#1c222e]'
                }`}
              >
                {st === 'all' ? 'All Stages' : st}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Epistemic Role:</span>
            {['all', 'SOURCE CODE', 'EXPERIMENT', 'MEASURED', 'OBSERVED', 'SUPPORTED', 'FAILED / NULL'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedStatus === status
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                    : 'bg-[#0e121a] text-slate-500 hover:text-slate-300 border border-[#1c222e]'
                }`}
              >
                {status === 'all' ? 'All Statuses' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Showing {filteredEvents.length} research progression milestones</span>
          <span>Lineage: Question ➔ Code ➔ Trial ➔ Result ➔ Lesson ➔ Public Log</span>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-[#1c222e] space-y-6">
          {filteredEvents.map(({ project, event }) => {
            const statusConfig = epistemicStatusColors[event.epistemicStatus] || {
              bg: 'bg-slate-900',
              text: 'text-slate-300',
              border: 'border-slate-700',
            };
            const stageConfig = event.lineageStage
              ? stageBadgeColors[event.lineageStage] || { bg: 'bg-slate-900', text: 'text-slate-400' }
              : null;

            return (
              <div
                key={event.id}
                className="relative bg-[#0b0e14] border border-[#1d2330] hover:border-[#2e394f] rounded-xl p-5 transition-all shadow-lg group"
              >
                {/* Timeline node icon on the vertical line */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-5 h-5 rounded-full bg-[#0b0e14] border-2 border-emerald-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>

                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#181d27]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Project Jump Button */}
                    <button
                      type="button"
                      onClick={() => onSelectNode?.(project.id)}
                      className="text-xs font-bold text-white hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      title="Inspect full project dossier"
                    >
                      <span className="text-slate-500">PROJECT:</span>
                      <span className="text-emerald-400 underline decoration-emerald-500/40 underline-offset-2">
                        {project.name}
                      </span>
                      <span className="text-[10px] text-slate-500">[{project.codename}]</span>
                    </button>

                    {/* Stage Badge */}
                    {event.lineageStage && (
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${stageConfig?.bg} ${stageConfig?.text}`}>
                        {event.lineageStage}
                      </span>
                    )}

                    {/* Epistemic Status Badge */}
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      {event.epistemicStatus}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Phase: {event.phase}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-base font-bold text-white mb-1.5">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {event.description}
                </p>

                {/* Associated Public Article / Research Log Link */}
                {event.relatedArticleUrl && (
                  <div className="mt-3 pt-3 border-t border-[#181e2b] flex flex-wrap items-center justify-between gap-2 bg-[#080c12] p-3 rounded-lg border border-[#141a26]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="text-xs text-slate-300 font-medium line-clamp-1">
                        {event.articleTitle || 'Public Research Log Article'}
                      </span>
                    </div>

                    <a
                      href={event.relatedArticleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#151c28] hover:bg-[#1f2a3d] text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold transition-colors"
                      title="Read original publication on LinkedIn"
                    >
                      <span>Read on LinkedIn</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
