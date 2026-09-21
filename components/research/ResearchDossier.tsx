'use client';

import React, { useState } from 'react';
import { ResearchNode, RESEARCH_NODES } from '@/lib/research-data';
import SourceArtifactCard from '@/components/research/SourceArtifactCard';
import CortexMSProbeSimulator from '@/components/simulators/CortexMSProbeSimulator';
import VirtualLabIntegritySimulator from '@/components/simulators/VirtualLabIntegritySimulator';
import ACmKCognitiveDebugger from '@/components/simulators/ACmKCognitiveDebugger';
import EvidenceVaultSimulator from '@/components/simulators/EvidenceVaultSimulator';
import SensorNodeRFSimulator from '@/components/simulators/SensorNodeRFSimulator';
import {
  FileText,
  X,
  ChevronRight,
  GitFork,
  Cpu,
  Bookmark,
  Check,
  Binary,
  Activity,
  AlertTriangle,
  HelpCircle,
  Layers,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  Code2,
  Target,
  Sparkles,
  ShieldCheck,
  Wrench,
  ExternalLink,
  Clock,
  BookOpen,
} from 'lucide-react';

export type DossierTab =
  | 'architecture'
  | 'technical'
  | 'experiments'
  | 'findings'
  | 'research-log'
  | 'simulator'
  | 'artifacts'
  | 'lineage'
  | 'source'
  | 'features';

interface ResearchDossierProps {
  node: ResearchNode;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  activeTab?: DossierTab;
  onTabChange?: (tab: DossierTab) => void;
}

export default function ResearchDossier({
  node,
  onClose,
  onSelectNode,
  activeTab: controlledTab,
  onTabChange,
}: ResearchDossierProps) {
  const [internalTab, setInternalTab] = useState<DossierTab>('architecture');
  const [activeTechSectionId, setActiveTechSectionId] = useState<string>(
    node.technicalSections?.[0]?.id || 'overview'
  );
  const activeTab = controlledTab ?? internalTab;

  const handleTabClick = (tab: DossierTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [copiedCitation, setCopiedCitation] = useState(false);

  const statusStyles: Record<string, string> = {
    active_research: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
    experimental: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
    operational_poc: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80',
    operational_infrastructure: 'bg-purple-950/80 text-purple-300 border-purple-700/80',
    historical_prototype: 'bg-slate-900 text-slate-300 border-slate-700',
    shipped: 'bg-emerald-900/60 text-emerald-200 border-emerald-600/80',
    pending_verification: 'bg-amber-950/80 text-amber-300 border-amber-600/80',
  };

  const copyCitation = () => {
    const citation = `${node.name} (${node.codename}). ${node.classification}. Operator: ${node.operator}. Global Intent Company Technical Record.`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const parentNodes = RESEARCH_NODES.filter(n => node.lineage.parents.includes(n.id));
  const childNodes = RESEARCH_NODES.filter(n => node.lineage.children.includes(n.id));

  const hasRepositories = Boolean(node.repositories && node.repositories.length > 0);
  const primaryRepo = node.repositories?.[0];

  return (
    <div id="research-dossier" className="bg-[#0b0e14] border border-[#1d2330] rounded-xl overflow-hidden shadow-2xl font-mono text-slate-300">
      {/* Dossier Header */}
      <div className="bg-[#0e121a] p-5 border-b border-[#1b212d] flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
              {node.domainLabel}
            </span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#151c27] text-slate-300 border border-[#252f40] font-bold">
              Kind: {node.projectKind}
            </span>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${statusStyles[node.status] || 'bg-slate-900 border-slate-700 text-slate-300'}`}>
              {node.statusLabel}
            </span>
            <span className="text-xs text-slate-500 font-mono">[{node.codename}]</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{node.name}</h2>
            {primaryRepo && (
              <a
                href={primaryRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16202e] hover:bg-[#1f2c40] text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold transition-colors"
                title="View canonical source code on GitHub"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{primaryRepo.owner}/{primaryRepo.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>

          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{node.summary}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCitation}
            className="p-2 rounded-lg bg-[#141a25] hover:bg-[#1c2433] text-slate-300 border border-[#222b3b] transition-colors flex items-center gap-1.5 text-xs"
            title="Copy Record Citation"
          >
            {copiedCitation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedCitation ? 'Copied' : 'Cite'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#141a25] hover:bg-[#1c2433] text-slate-400 hover:text-white border border-[#222b3b] transition-colors"
            title="Close Dossier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dossier Kind-Specific Objective / Purpose Banner */}
      {node.researchQuestion && (
        <div className="bg-[#090d14] px-6 py-3 border-b border-[#161d2b] flex items-start gap-3 text-xs">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Core Research Question:
            </span>
            <span className="text-slate-200 font-semibold italic">
              &quot;{node.researchQuestion}&quot;
            </span>
          </div>
        </div>
      )}

      {node.engineeringObjective && (
        <div className="bg-[#090d14] px-6 py-3 border-b border-[#161d2b] flex items-start gap-3 text-xs">
          <Target className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Engineering Objective:
            </span>
            <span className="text-slate-200 font-semibold">
              {node.engineeringObjective}
            </span>
          </div>
        </div>
      )}

      {node.productPurpose && (
        <div className="bg-[#090d14] px-6 py-3 border-b border-[#161d2b] flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
              Software Purpose & Scope:
            </span>
            <span className="text-slate-200 font-semibold">
              {node.productPurpose}
            </span>
          </div>
        </div>
      )}

      {node.classificationNote && (
        <div className="bg-[#181206] px-6 py-2.5 border-b border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-300">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold tracking-wider text-[11px] uppercase">
            {node.classificationNote}
          </span>
          <span className="text-slate-400 text-[11px]">
            — Technical claims are deferred until verified directly from repository source code.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1b212d] bg-[#090b10] px-4 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => handleTabClick('architecture')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'border-emerald-400 text-white bg-[#0e131d]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          {node.projectKind === 'software'
            ? 'Application Architecture'
            : node.projectKind === 'engineering'
            ? 'System Architecture'
            : 'Architecture & Principles'}
        </button>

        {/* Technical Sections Tab for Modular Specifications */}
        {node.technicalSections && node.technicalSections.length > 0 && (
          <button
            type="button"
            onClick={() => handleTabClick('technical')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'technical'
                ? 'border-emerald-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Technical Specifications ({node.technicalSections.length})
          </button>
        )}

        {/* Research Log & Evolutionary Timeline Tab */}
        {((node.timelineEvents && node.timelineEvents.length > 0) || (node.publications && node.publications.length > 0)) && (
          <button
            type="button"
            onClick={() => handleTabClick('research-log')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'research-log'
                ? 'border-indigo-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Research Log & Timeline ({node.timelineEvents?.length || node.publications?.length})
          </button>
        )}

        {node.features && node.features.length > 0 && (
          <button
            type="button"
            onClick={() => handleTabClick('features')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'features'
                ? 'border-amber-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Features & UX ({node.features.length})
          </button>
        )}

        {node.experiments && node.experiments.length > 0 && (
          <button
            type="button"
            onClick={() => handleTabClick('experiments')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'experiments'
                ? 'border-cyan-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Controlled Experiments ({node.experiments.length})
          </button>
        )}

        {node.findings && node.findings.length > 0 && (
          <button
            type="button"
            onClick={() => handleTabClick('findings')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'findings'
                ? 'border-amber-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Classified Findings ({node.findings.length})
          </button>
        )}

        {/* Source Artifacts Tab */}
        {hasRepositories && (
          <button
            type="button"
            onClick={() => handleTabClick('source')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'source'
                ? 'border-emerald-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            Source Repositories ({node.repositories?.length})
          </button>
        )}

        {node.simulatorType && (
          <button
            type="button"
            onClick={() => handleTabClick('simulator')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-emerald-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
            Interactive Workbench
          </button>
        )}

        {node.artifacts && node.artifacts.length > 0 && (
          <button
            type="button"
            onClick={() => handleTabClick('artifacts')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'artifacts'
                ? 'border-blue-400 text-white bg-[#0e131d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Artifacts & Datasets
          </button>
        )}

        <button
          type="button"
          onClick={() => handleTabClick('lineage')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lineage'
              ? 'border-purple-400 text-white bg-[#0e131d]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-purple-400" />
          Project Lineage
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* 1. Architecture Tab */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Structural Overview
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0e121a] p-4 rounded-lg border border-[#1b212d]">
                {node.architecture.overview}
              </p>
            </div>

            {/* Source Artifact Highlight if present */}
            {hasRepositories && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  Canonical Source Artifact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {node.repositories?.map((repo, idx) => (
                    <SourceArtifactCard key={idx} repository={repo} />
                  ))}
                </div>
              </div>
            )}

            {/* Architecture Principles if present */}
            {node.architecture.principles && node.architecture.principles.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                  Design Invariants & Principles
                </h3>
                <div className="space-y-2">
                  {node.architecture.principles.map((principle, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                      <span className="text-emerald-400 font-bold">[{idx + 1}]</span>
                      <span className="text-slate-300">{principle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline Stages if present */}
            {node.architecture.pipelineStages && node.architecture.pipelineStages.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Sequential Pipeline & Processing Stages
                </h3>
                <div className="space-y-3">
                  {node.architecture.pipelineStages.map((stage, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-[#0e121a] border border-[#1b212d] relative pl-10"
                    >
                      <div className="absolute left-3.5 top-4 w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600/80 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{stage.name}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#151c28] text-emerald-400 border border-emerald-900/60 font-semibold">
                          {stage.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{stage.description}</p>
                      {stage.io && (
                        <div className="text-[11px] text-slate-500 font-mono bg-[#090d14] px-2.5 py-1 rounded border border-[#141a24]">
                          <span className="text-slate-400">Data Contract:</span> {stage.io}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Components & Tech Stack for Software / Engineering */}
            {node.architecture.components && node.architecture.components.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  System Components
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {node.architecture.components.map((c, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1b212d]">
                      <div className="font-bold text-white text-xs mb-1">{c.name}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {node.architecture.techStack && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                  Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {node.architecture.techStack.map((tech, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-[#131924] border border-[#222b3b] text-slate-300 text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Decisions */}
            {node.architecture.technicalDecisions && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                  Technical Decisions
                </h3>
                <div className="space-y-2">
                  {node.architecture.technicalDecisions.map((dec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{dec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modular Technical Specifications Tab */}
        {activeTab === 'technical' && node.technicalSections && (
          <div className="space-y-6">
            {/* Sub-navigation for Technical Sections */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-[#1b212d]">
              {node.technicalSections.map((sec) => {
                const isActive = activeTechSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveTechSectionId(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
                        : 'bg-[#0e121a] text-slate-400 hover:text-white border border-[#1c222e]'
                    }`}
                  >
                    <span>{sec.title}</span>
                    {sec.isVerifiedFromSource && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Directly verified from source code" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Technical Section Detail */}
            {(() => {
              const currentSection =
                node.technicalSections.find((s) => s.id === activeTechSectionId) ||
                node.technicalSections[0];
              if (!currentSection) return null;

              const epistemicStyles: Record<string, string> = {
                'SOURCE-VERIFIED': 'bg-emerald-950/90 text-emerald-300 border-emerald-700 font-bold',
                'EXPERIMENT-VERIFIED': 'bg-cyan-950/90 text-cyan-300 border-cyan-700 font-bold',
                'AUTHOR-REPORTED': 'bg-amber-950/90 text-amber-300 border-amber-700 font-bold',
                'DESIGN CLAIM / HYPOTHESIS': 'bg-purple-950/90 text-purple-300 border-purple-700 font-bold',
                'SOURCE CODE': 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
                'EXPERIMENT': 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
                'RESULT': 'bg-blue-950/80 text-blue-300 border-blue-800/80',
                'RESEARCH LOG': 'bg-purple-950/80 text-purple-300 border-purple-800/80',
                'EXTERNAL SOURCE': 'bg-slate-900 text-slate-300 border-slate-700',
              };

              return (
                <div className="space-y-6 bg-[#0e121a] p-6 rounded-xl border border-[#1d2433]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b212d] pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${
                            epistemicStyles[currentSection.epistemicRole] ||
                            'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          Epistemic Role: {currentSection.epistemicRole}
                        </span>
                        {currentSection.isVerifiedFromSource && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Source-Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {currentSection.title}
                      </h3>
                    </div>

                    {currentSection.sourceReferences && currentSection.sourceReferences.length > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                          Source References:
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {currentSection.sourceReferences.map((ref, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded bg-[#090d14] text-emerald-400 border border-[#161d2b] text-[11px] font-mono"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Markdown / text content */}
                  <div className="text-xs text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-mono">
                    {currentSection.content}
                  </div>

                  {/* Highlights if present */}
                  {currentSection.highlights && currentSection.highlights.length > 0 && (
                    <div className="pt-4 border-t border-[#181e2b]">
                      <h4 className="text-xs uppercase text-slate-400 font-bold mb-2">
                        Key Invariants & Parameters:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentSection.highlights.map((h, hIdx) => (
                          <div
                            key={hIdx}
                            className="bg-[#090d14] p-3 rounded-lg border border-[#161d2b] text-xs text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-emerald-400 font-bold">▪</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Research Log & Evolutionary Timeline Tab */}
        {activeTab === 'research-log' && (
          <div className="space-y-8">
            {/* Timeline Header Note */}
            <div className="bg-[#0e121a] p-5 rounded-xl border border-[#1d2433] space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Idea Lineage & Public Research Logs
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chronological sequence tracking hypothesis formulation, source code implementation, controlled trials, observed empirical results, null findings, and public research articles.
              </p>
            </div>

            {/* Timeline Milestones */}
            {node.timelineEvents && node.timelineEvents.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Chronological Progression Lineage
                </h4>

                <div className="relative pl-6 border-l-2 border-[#1c222e] space-y-4">
                  {node.timelineEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="relative bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-2"
                    >
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-[#0b0e14] border-2 border-emerald-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#181e2b] pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {evt.lineageStage && (
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#161f2e] text-cyan-300 border border-cyan-800/60 font-bold">
                              {evt.lineageStage}
                            </span>
                          )}
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
                            {evt.epistemicStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Phase: {evt.phase}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-white">{evt.title}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>

                      {evt.relatedArticleUrl && (
                        <div className="mt-2 pt-2 border-t border-[#181e2b] flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 truncate">
                            {evt.articleTitle || 'LinkedIn Research Log'}
                          </span>
                          <a
                            href={evt.relatedArticleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <span>Read Log</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Research Articles */}
            {node.publications && node.publications.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  Associated Public Research Articles ({node.publications.length})
                </h4>

                <div className="space-y-3">
                  {node.publications.map((pub, idx) => {
                    const isResearchPub = 'platform' in pub;
                    const pubType = isResearchPub ? pub.type : 'paper';
                    const pubUrl = isResearchPub ? pub.url : undefined;
                    const pubPlatform = isResearchPub ? pub.platform : 'academic';
                    const pubRel = isResearchPub ? pub.evidenceRelationship : undefined;
                    const pubSummary = isResearchPub ? pub.summary : (pub as any).abstract;
                    const pubCitation = isResearchPub ? `Public Research Log • ${pub.platform}` : (pub as any).citation;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#0e121a] border border-[#1b212d] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 font-bold">
                              {pubType}
                            </span>
                            {pubPlatform && (
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#131924] text-slate-400 border border-[#222b3b]">
                                {pubPlatform}
                              </span>
                            )}
                            {pubRel && (
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#101c18] text-emerald-400 border border-emerald-900/60 font-semibold">
                                Relationship: {pubRel}
                              </span>
                            )}
                          </div>

                          {pubUrl && (
                            <a
                              href={pubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#16202e] hover:bg-[#1f2c40] text-emerald-300 border border-emerald-700/50 text-xs font-semibold transition-colors"
                            >
                              <span>Read Article</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>

                        <h5 className="text-sm font-bold text-white">{pub.title}</h5>
                        {pubSummary && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {pubSummary}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono">
                          Citation / Venue: {pubCitation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Tab (For Shipped Software) */}
        {activeTab === 'features' && node.features && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Product Capabilities & Functional Scope
              </h3>
              <div className="space-y-2.5">
                {node.features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1b212d] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 font-sans">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {node.challenges && node.challenges.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Engineering Challenges & Solutions
                </h3>
                <div className="space-y-2.5">
                  {node.challenges.map((chal, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1b212d] flex items-start gap-3">
                      <span className="text-amber-400 font-bold text-xs shrink-0">[{idx + 1}]</span>
                      <span className="text-xs text-slate-300 font-sans">{chal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Source Repositories Tab */}
        {activeTab === 'source' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Canonical Source Code Artifacts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official GitHub repository links under the canonical GI-Company organization.
                  </p>
                </div>

                <a
                  href="https://github.com/GI-Company?tab=repositories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  View GI-Company Index <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {hasRepositories ? (
                <div className="space-y-4">
                  {node.repositories?.map((repo, idx) => (
                    <SourceArtifactCard key={idx} repository={repo} featured={idx === 0} />
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-lg bg-[#0e121a] border border-[#1b212d] text-xs text-slate-400">
                  Source repository for this project is currently internal or pending publication under the GI-Company organization.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Experiments Tab */}
        {activeTab === 'experiments' && node.experiments && (
          <div className="space-y-8">
            {node.experiments.map(exp => (
              <div key={exp.id} className="space-y-4 bg-[#0e121a] p-5 rounded-xl border border-[#1c222e]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b212d] pb-3">
                  <div>
                    <span className="text-[10px] uppercase text-cyan-400 font-bold block">
                      Controlled Experiment
                    </span>
                    <h3 className="text-base font-bold text-white">{exp.name}</h3>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Specific Hypothesis Tested:
                  </span>
                  <div className="text-xs text-slate-200 italic bg-[#090d14] p-3 rounded border border-[#161d2b]">
                    &quot;{exp.hypothesis}&quot;
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Experimental Methodology & Controls:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.methodology}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">
                    Verified Execution Configuration:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(exp.configuration).map(([key, val]) => (
                      <div key={key} className="bg-[#090d14] p-2.5 rounded border border-[#161d2b]">
                        <span className="text-slate-500 text-[10px] block truncate">{key}</span>
                        <span className="font-bold text-slate-200 truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {exp.telemetry && exp.telemetry.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">
                      Empirical Telemetry & Loss Metrics:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {exp.telemetry.map((metric, mIdx) => (
                        <div key={mIdx} className="bg-[#090d14] p-2.5 rounded border border-[#161d2b]">
                          <span className="text-slate-500 text-[10px] block truncate">{metric.label}</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {metric.value} <span className="text-[10px] text-slate-500">{metric.unit || ''}</span>
                          </span>
                          {metric.note && (
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{metric.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Observed Empirical Results:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0a0e16] p-3 rounded border border-[#161d2b]">
                    {exp.results}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Epistemic Interpretation:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.interpretation}</p>
                </div>

                {exp.observationNote && (
                  <div className="bg-[#181a10] border border-amber-800/60 p-3 rounded text-xs text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-400 uppercase text-[10px] block mb-0.5">
                      Epistemic Caveat / Non-Linearity Note:
                    </span>
                    {exp.observationNote}
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Limitations & Validity Constraints:
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed italic">{exp.limitations}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Findings Tab */}
        {activeTab === 'findings' && node.findings && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 mb-2">
              All findings are categorized according to rigorous epistemic criteria.
            </div>

            {node.findings.map((finding, idx) => {
              const findingConfig = {
                OBSERVED: {
                  badge: 'Observed Empirical Fact',
                  badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
                  icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                },
                SUPPORTED: {
                  badge: 'Empirically Supported Hypothesis',
                  badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
                  icon: <Check className="w-4 h-4 text-cyan-400" />,
                },
                UNRESOLVED: {
                  badge: 'Unresolved Open Question',
                  badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
                  icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
                },
                FAILED: {
                  badge: 'Negative / Disproven Finding',
                  badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
                  icon: <XCircle className="w-4 h-4 text-rose-400" />,
                },
              }[finding.type];

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0e121a] border border-[#1c222e] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${findingConfig.badgeClass}`}>
                      {findingConfig.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">FND-{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {findingConfig.icon}
                    {finding.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Interactive Workbench Tab */}
        {activeTab === 'simulator' && node.simulatorType && (
          <div className="space-y-4">
            <div className="border border-[#1f2838] rounded-xl overflow-hidden bg-[#0a0d13]">
              {node.simulatorType === 'cortex-ms-probe' && <CortexMSProbeSimulator />}
              {node.simulatorType === 'virtual-lab-integrity' && <VirtualLabIntegritySimulator />}
              {node.simulatorType === 'acmk-debugger' && <ACmKCognitiveDebugger />}
              {node.simulatorType === 'evidence-vault' && <EvidenceVaultSimulator />}
              {node.simulatorType === 'sensor-node-rf' && <SensorNodeRFSimulator />}
            </div>
          </div>
        )}

        {/* 5. Artifacts & Datasets Tab */}
        {activeTab === 'artifacts' && node.artifacts && (
          <div className="space-y-4">
            {node.artifacts.map(art => (
              <div key={art.id} className="p-4 rounded-xl bg-[#0e121a] border border-[#1c222e] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{art.name}</span>
                  <div className="flex items-center gap-2">
                    {art.size && <span className="text-[10px] px-2 py-0.5 rounded bg-[#161d28] text-slate-400">{art.size}</span>}
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
                      {art.type}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{art.description}</p>
                {art.hash && (
                  <div className="text-[11px] text-slate-500 font-mono bg-[#090d14] p-2 rounded border border-[#161d2b]">
                    <span className="text-slate-400">Content Hash (SHA-256):</span> {art.hash}
                  </div>
                )}
                <div className="text-[10px] text-slate-500">
                  <span className="text-slate-400">Provenance:</span> {art.provenance}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="space-y-6">
            {node.lineage.relationshipNote && (
              <div className="bg-[#0e121a] p-4 rounded-lg border border-[#1c222e] text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-emerald-400 uppercase text-[10px] block mb-1">
                  Lineage Evolution Note:
                </span>
                {node.lineage.relationshipNote}
              </div>
            )}

            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
                Preceding Ancestor Substrates
              </h3>
              {parentNodes.length === 0 ? (
                <div className="p-4 rounded bg-[#0e121a] border border-[#1c222e] text-xs text-slate-500 italic">
                  Root domain substrate (no direct internal parent dependencies).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parentNodes.map(parent => (
                    <button
                      key={parent.id}
                      type="button"
                      onClick={() => onSelectNode(parent.id)}
                      className="p-3 rounded-lg bg-[#0e121a] hover:bg-[#141a26] border border-[#1c222e] hover:border-emerald-500/60 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{parent.domainLabel}</span>
                        <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm mt-1">{parent.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{parent.summary}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
                Subsequent Descendant Architectures
              </h3>
              {childNodes.length === 0 ? (
                <div className="p-4 rounded bg-[#0e121a] border border-[#1c222e] text-xs text-slate-500 italic">
                  Current active frontier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {childNodes.map(child => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelectNode(child.id)}
                      className="p-3 rounded-lg bg-[#0e121a] hover:bg-[#141a26] border border-[#1c222e] hover:border-cyan-500/60 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{child.domainLabel}</span>
                        <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm mt-1">{child.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{child.summary}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
