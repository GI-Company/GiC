'use client';

import React, { useState, useMemo } from 'react';
import {
  RESEARCH_NODES,
  RESEARCH_DOMAINS,
  ResearchNode,
  ProjectKind,
  ResearchDomain,
} from '@/lib/research-data';
import SourceArtifactCard from '@/components/research/SourceArtifactCard';
import {
  Search,
  Filter,
  Code2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Cpu,
  Target,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  GitFork,
  CheckCircle2,
} from 'lucide-react';

interface ProjectsIndexProps {
  selectedNodeId?: string | null;
  onSelectNode: (nodeId: string) => void;
  onOpenDossierTab?: (nodeId: string, tab: string) => void;
}

type KindFilter = 'all' | ProjectKind | 'github_verified';

export default function ProjectsIndex({ selectedNodeId, onSelectNode, onOpenDossierTab }: ProjectsIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timeline' | 'name' | 'domain'>('timeline');

  // Filter & Search Logic
  const filteredNodes = useMemo(() => {
    return RESEARCH_NODES.filter(node => {
      // Kind or verification filter
      if (kindFilter === 'github_verified') {
        if (!node.repositories || node.repositories.length === 0) return false;
      } else if (kindFilter !== 'all') {
        if (node.projectKind !== kindFilter) return false;
      }

      // Domain filter
      if (domainFilter !== 'all' && node.domain !== domainFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = node.name.toLowerCase().includes(query);
        const matchesCodename = node.codename.toLowerCase().includes(query);
        const matchesSummary = node.summary.toLowerCase().includes(query);
        const matchesDomain = node.domainLabel.toLowerCase().includes(query);
        const matchesStatus = node.statusLabel.toLowerCase().includes(query);
        const matchesRepo = node.repositories?.some(
          r => r.name.toLowerCase().includes(query) || r.owner.toLowerCase().includes(query)
        );
        const matchesStack = node.architecture.techStack?.some(t => t.toLowerCase().includes(query));

        if (
          !matchesName &&
          !matchesCodename &&
          !matchesSummary &&
          !matchesDomain &&
          !matchesStatus &&
          !matchesRepo &&
          !matchesStack
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'domain') {
        return a.domain.localeCompare(b.domain);
      }
      // timeline: descending by timeline string
      return (b.timeline || '').localeCompare(a.timeline || '');
    });
  }, [searchQuery, kindFilter, domainFilter, sortBy]);

  const kindCounts = useMemo(() => {
    return {
      all: RESEARCH_NODES.length,
      research: RESEARCH_NODES.filter(n => n.projectKind === 'research').length,
      engineering: RESEARCH_NODES.filter(n => n.projectKind === 'engineering').length,
      software: RESEARCH_NODES.filter(n => n.projectKind === 'software').length,
      infrastructure: RESEARCH_NODES.filter(n => n.projectKind === 'infrastructure').length,
      github_verified: RESEARCH_NODES.filter(n => n.repositories && n.repositories.length > 0).length,
    };
  }, []);

  return (
    <div className="space-y-6 font-mono text-slate-300">
      {/* Index Header & Organization Banner */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Canonical Research & Project Registry
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Projects & Repositories Index
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
              Comprehensive index of Global Intent Company research investigations, engineering systems,
              shipped software applications, and canonical public GitHub repositories under{' '}
              <span className="text-white font-mono">github.com/GI-Company</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/GI-Company?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-[#141b27] hover:bg-[#1a2435] text-emerald-300 border border-emerald-700/60 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>GI-Company on GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-[#1a202d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                kindFilter === 'all'
                  ? 'bg-slate-800 border-slate-600 text-white font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              All Projects ({kindCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setKindFilter('research')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                kindFilter === 'research'
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-200 font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Research ({kindCounts.research})
            </button>

            <button
              type="button"
              onClick={() => setKindFilter('engineering')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                kindFilter === 'engineering'
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-200 font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Engineering ({kindCounts.engineering})
            </button>

            <button
              type="button"
              onClick={() => setKindFilter('software')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                kindFilter === 'software'
                  ? 'bg-amber-950 border-amber-600 text-amber-200 font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Shipped Software ({kindCounts.software})
            </button>

            <button
              type="button"
              onClick={() => setKindFilter('infrastructure')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                kindFilter === 'infrastructure'
                  ? 'bg-purple-950 border-purple-600 text-purple-200 font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Infrastructure ({kindCounts.infrastructure})
            </button>

            <button
              type="button"
              onClick={() => setKindFilter('github_verified')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                kindFilter === 'github_verified'
                  ? 'bg-[#0f2d42] border-sky-500 text-sky-200 font-bold'
                  : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              GI-Company Repos ({kindCounts.github_verified})
            </button>
          </div>

          {/* Search Input and Domain Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects, repos, stack..."
                className="w-full bg-[#0e121a] border border-[#1e2430] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              className="bg-[#0e121a] border border-[#1e2430] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="all">All Domains</option>
              {RESEARCH_DOMAINS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#0e121a] border border-[#1e2430] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="timeline">Sort: Timeline</option>
              <option value="name">Sort: Name</option>
              <option value="domain">Sort: Domain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Cards List / Grid */}
      <div className="space-y-4">
        {filteredNodes.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0b0e14] border border-[#1c222e] text-center text-xs text-slate-500">
            No projects matched the selected filters.
          </div>
        ) : (
          filteredNodes.map(node => {
            const hasRepos = Boolean(node.repositories && node.repositories.length > 0);
            const primaryRepo = node.repositories?.[0];

            return (
              <div
                key={node.id}
                className="p-5 rounded-xl bg-[#0b0e14] border border-[#1c222e] hover:border-emerald-500/50 transition-all space-y-4"
              >
                {/* Top Row: Domain, Kind, Status, Timeline */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#181f2c] pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold uppercase">
                      {node.domainLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#151c27] text-slate-300 border border-[#252f40] font-bold uppercase">
                      {node.projectKind}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#10141d] text-slate-400 border border-[#1c2331]">
                      {node.statusLabel}
                    </span>
                    <span className="text-slate-500 font-mono">[{node.codename}]</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {node.timeline && (
                      <>
                        <span className="font-mono text-slate-400 font-semibold">{node.timeline}</span>
                        <span className="text-slate-600">|</span>
                      </>
                    )}
                    <span className="text-[11px] text-slate-500">{node.classification}</span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white tracking-tight">{node.name}</h2>
                      {node.classificationNote && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-semibold">
                          {node.classificationNote}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{node.summary}</p>

                    {/* Specific Objective / Purpose */}
                    {node.researchQuestion && (
                      <div className="text-xs text-slate-400 bg-[#0e121a] p-2.5 rounded border border-[#19202c]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Research Question:
                        </span>
                        <span className="italic text-slate-300">&quot;{node.researchQuestion}&quot;</span>
                      </div>
                    )}

                    {node.productPurpose && (
                      <div className="text-xs text-slate-400 bg-[#0e121a] p-2.5 rounded border border-[#19202c]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Software Purpose:
                        </span>
                        <span className="text-slate-300">{node.productPurpose}</span>
                      </div>
                    )}

                    {node.engineeringObjective && (
                      <div className="text-xs text-slate-400 bg-[#0e121a] p-2.5 rounded border border-[#19202c]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Engineering Objective:
                        </span>
                        <span className="text-slate-300">{node.engineeringObjective}</span>
                      </div>
                    )}

                    {/* Tech Stack Pills */}
                    {node.architecture.techStack && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {node.architecture.techStack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded bg-[#121722] border border-[#1e2736] text-[10px] text-slate-400 font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Source Code Repositories & Direct Navigation */}
                  <div className="space-y-3 bg-[#0e121a] p-3.5 rounded-lg border border-[#1a2230]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        Source Code Artifact
                      </span>
                    </div>

                    {hasRepos ? (
                      <div className="space-y-2">
                        {node.repositories?.map((repo, rIdx) => (
                          <SourceArtifactCard key={rIdx} repository={repo} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-[#090d14] border border-[#141a24] text-[11px] text-slate-500 italic">
                        Internal repository / In-progress research substrate.
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#19202c] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectNode(node.id)}
                        className="w-full py-1.5 px-3 rounded bg-[#131924] hover:bg-emerald-950/70 hover:border-emerald-600 border border-[#222b3b] text-emerald-300 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <span>View 3D Subgraph & Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
