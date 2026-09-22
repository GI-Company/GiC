'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import HeaderNav, { ActiveTab } from '@/components/navigation/HeaderNav';
import NeuralGraphCanvas, { RenderTier, DossierTabType } from '@/components/neural-mesh/NeuralGraphCanvas';
import ResearchDossier, { DossierTab } from '@/components/research/ResearchDossier';
import ProjectsIndex from '@/components/research/ProjectsIndex';
import ResearchLogView from '@/components/research/ResearchLogView';
import LabManifesto from '@/components/lab/LabManifesto';
import CortexMSProbeSimulator from '@/components/simulators/CortexMSProbeSimulator';
import VirtualLabIntegritySimulator from '@/components/simulators/VirtualLabIntegritySimulator';
import ACmKCognitiveDebugger from '@/components/simulators/ACmKCognitiveDebugger';
import EvidenceVaultSimulator from '@/components/simulators/EvidenceVaultSimulator';
import SensorNodeRFSimulator from '@/components/simulators/SensorNodeRFSimulator';
import PhysiologicalModelSimulator from '@/components/simulators/PhysiologicalModelSimulator';
import AetherBusSimulator from '@/components/simulators/AetherBusSimulator';
import {
  RESEARCH_NODES,
  RESEARCH_DOMAINS,
  ResearchDomain,
  ResearchNode,
} from '@/lib/research-data';
import { playSyntheticClick } from '@/lib/audio';
import {
  getCanonicalUrl,
  parseSpatialUrl,
} from '@/lib/spatial-router';
import {
  Code2,
  ChevronRight,
  Shield,
  Layers,
  FileText,
  Activity,
  Terminal,
  Compass,
  ArrowDown,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Mail,
} from 'lucide-react';

interface SpatialResearchAppProps {
  initialDomain?: ResearchDomain | null;
  initialNodeId?: string | null;
  initialSection?: string | null;
  initialActiveTab?: ActiveTab;
}

export default function SpatialResearchApp({
  initialDomain = null,
  initialNodeId = null,
  initialSection = null,
  initialActiveTab = 'spatial',
}: SpatialResearchAppProps) {
  // Navigation & state
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialActiveTab);
  const [activeDomain, setActiveDomain] = useState<ResearchDomain | null>(initialDomain || null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId || null);
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTab>(
    (initialSection as DossierTab) || 'architecture'
  );
  const [renderTier, setRenderTier] = useState<RenderTier>('high');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeSimIndex, setActiveSimIndex] = useState<number>(0);

  // Synchronize with Browser Address Bar & History (Back/Forward)
  useEffect(() => {
    // If running in browser and initial state was not explicitly provided by props, parse current URL
    if (typeof window !== 'undefined' && !initialNodeId && !initialDomain) {
      const parsed = parseSpatialUrl(window.location.pathname, window.location.search);
      if (parsed.nodeId) {
        setSelectedNodeId(parsed.nodeId);
        const node = RESEARCH_NODES.find(n => n.id === parsed.nodeId);
        if (node) setActiveDomain(node.domain);
        if (parsed.sectionId) setActiveDossierTab(parsed.sectionId as DossierTab);
      } else if (parsed.domainId) {
        setActiveDomain(parsed.domainId);
      }
    }

    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const parsed = parseSpatialUrl(window.location.pathname, window.location.search);
      setSelectedNodeId(parsed.nodeId);
      setActiveDomain(parsed.domainId);
      if (parsed.sectionId) {
        setActiveDossierTab(parsed.sectionId as DossierTab);
      } else {
        setActiveDossierTab('architecture');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialDomain, initialNodeId]);

  // Update URL helper
  const updateUrl = useCallback((domainId: ResearchDomain | null, nodeId: string | null, sectionId: string | null) => {
    if (typeof window === 'undefined') return;
    const targetUrl = getCanonicalUrl({ domainId, nodeId, sectionId });
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, []);

  // Selection handlers
  const handleSelectDomain = (domain: ResearchDomain | null) => {
    setActiveDomain(domain);
    setSelectedNodeId(null);
    setActiveDossierTab('architecture');
    updateUrl(domain, null, null);
    playSyntheticClick(soundEnabled, 550);
  };

  const handleSelectNode = (nodeId: string) => {
    if (!nodeId) {
      setSelectedNodeId(null);
      updateUrl(activeDomain, null, null);
      playSyntheticClick(soundEnabled, 440);
      return;
    }

    const node = RESEARCH_NODES.find(n => n.id === nodeId);
    const domain = node ? node.domain : activeDomain;

    setSelectedNodeId(nodeId);
    setActiveDomain(domain);
    setActiveDossierTab('architecture');
    updateUrl(domain, nodeId, 'architecture');
    playSyntheticClick(soundEnabled, 880);
  };

  const handleSelectDossierTab = (tab: DossierTabType) => {
    if (tab === 'livedemo') {
      const node = RESEARCH_NODES.find(n => n.id === selectedNodeId);
      const demoUrl = node?.repositories?.[0]?.homepageUrl;
      if (demoUrl) {
        window.open(demoUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setActiveDossierTab(tab as DossierTab);
    updateUrl(activeDomain, selectedNodeId, tab as string);
    playSyntheticClick(soundEnabled, 720);
  };

  const handleNavigateRoot = () => {
    setSelectedNodeId(null);
    setActiveDomain(null);
    setActiveDossierTab('architecture');
    updateUrl(null, null, null);
    playSyntheticClick(soundEnabled, 400);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playSyntheticClick(true, 750);
  };

  const selectedNode = useMemo(() => {
    return RESEARCH_NODES.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  const activeDomainMeta = useMemo(() => {
    if (!activeDomain) return null;
    return RESEARCH_DOMAINS.find(d => d.id === activeDomain) || null;
  }, [activeDomain]);

  const simulatorsList = [
    { title: 'Cortex-MS Probe & L4 Telemetry', component: <CortexMSProbeSimulator />, domain: 'Machine Learning' },
    { title: 'Virtual Lab .vlab Integrity Attack Sandbox', component: <VirtualLabIntegritySimulator />, domain: 'Virtual Lab' },
    { title: 'ACmK 5-Plane Cognitive Debugger', component: <ACmKCognitiveDebugger />, domain: 'Systems Research' },
    { title: 'Evidence Vault Epistemic Provenance Graph', component: <EvidenceVaultSimulator />, domain: 'Virtual Lab' },
    { title: 'Sensor Node RF Spatial Voxel Ray-Caster', component: <SensorNodeRFSimulator />, domain: 'Virtual Lab' },
    { title: 'Physiological Model Retrospective & Null Result', component: <PhysiologicalModelSimulator />, domain: 'Machine Learning' },
    { title: 'Aether Capability Monotonicity Bus', component: <AetherBusSimulator />, domain: 'Systems Research' },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 font-mono">
      {/* Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          playSyntheticClick(soundEnabled, 600);
        }}
        renderTier={renderTier}
        onTierChange={(tier) => {
          setRenderTier(tier);
          playSyntheticClick(soundEnabled, 700);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectNode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* 1. Spatial Research Mesh View (Hierarchical 3D Navigation) */}
        {activeTab === 'spatial' && (
          <div className="space-y-6">
            {/* Top Spatial Canvas Section */}
            <div className="w-full relative shadow-2xl">
              <NeuralGraphCanvas
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                activeDomain={activeDomain}
                onSelectDomain={handleSelectDomain}
                renderTier={renderTier}
                onTierChange={setRenderTier}
                activeDossierTab={activeDossierTab as DossierTabType}
                onSelectDossierTab={handleSelectDossierTab}
                onNavigateRoot={handleNavigateRoot}
              />
            </div>

            {/* Hierarchical Quick Navigation Bar */}
            <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#1b212d] flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
                  Domains:
                </span>
                <button
                  type="button"
                  onClick={handleNavigateRoot}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all font-semibold shrink-0 ${
                    !activeDomain && !selectedNodeId
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      : 'bg-[#121620] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Root Overview
                </button>
                {RESEARCH_DOMAINS.map(domain => {
                  const isActive = activeDomain === domain.id;
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => handleSelectDomain(domain.id)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-all font-semibold flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-[#142030] text-white border border-emerald-400 shadow-sm'
                          : 'bg-[#121620] text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domain.colorHex }} />
                      <span>{domain.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Switcher CTA to 2D Index */}
              <button
                type="button"
                onClick={() => setActiveTab('dossiers')}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Switch to 2D Index View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2D Research Dossier Section (Deliberate separation from 3D) */}
            <div id="research-dossier" className="pt-2">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b212d]">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SPATIAL FOCUS:</span>
                      <strong className="text-white font-bold">{selectedNode.name}</strong>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400">{selectedNode.domainLabel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedNode.repositories && selectedNode.repositories.length > 0 && (
                        <a
                          href={selectedNode.repositories[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-[#0a2030] border border-sky-600/70 text-sky-300 text-xs hover:bg-[#0e2c44] flex items-center gap-1.5 transition-colors font-semibold"
                        >
                          <Code2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>GitHub</span>
                          <ExternalLink className="w-3 h-3 text-sky-400" />
                        </a>
                      )}
                      {selectedNode.repositories?.[0]?.homepageUrl && (
                        <a
                          href={selectedNode.repositories[0].homepageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-[#2b1e07] border border-amber-500/70 text-amber-300 text-xs hover:bg-[#3d2b0a] flex items-center gap-1.5 transition-colors font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Live App</span>
                          <ExternalLink className="w-3 h-3 text-amber-400" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedNodeId(null)}
                        className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white bg-[#101520] hover:bg-[#182132] transition-colors"
                      >
                        Fold Node
                      </button>
                    </div>
                  </div>

                  <ResearchDossier
                    node={selectedNode}
                    onClose={() => setSelectedNodeId(null)}
                    onSelectNode={handleSelectNode}
                    activeTab={activeDossierTab}
                    onTabChange={(tab) => {
                      setActiveDossierTab(tab);
                      updateUrl(activeDomain, selectedNode.id, tab);
                    }}
                  />
                </div>
              ) : activeDomainMeta ? (
                /* Domain Summary Card when no specific project is focused */
                <div className="p-6 rounded-2xl bg-[#0b0e14] border border-[#1b212d] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: activeDomainMeta.colorHex }} />
                      <h2 className="text-xl font-bold text-white tracking-wide">{activeDomainMeta.label}</h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#161c28] text-slate-300 border border-[#232c3d]">
                        {RESEARCH_NODES.filter(n => n.domain === activeDomainMeta.id).length} Projects Unfolded
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNavigateRoot}
                      className="px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#1a2130] text-slate-300 text-xs flex items-center gap-1.5 border border-[#232d40] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-400" />
                      <span>Return to Root</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                    {activeDomainMeta.description}
                  </p>

                  <div className="pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Projects in this Domain:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {RESEARCH_NODES.filter(n => n.domain === activeDomainMeta.id).map(node => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => handleSelectNode(node.id)}
                          className="p-4 rounded-xl bg-[#0f131c] border border-[#1d2433] hover:border-emerald-500/70 text-left transition-all hover:scale-[1.02] group shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                              <span className="font-semibold text-slate-400">{node.statusLabel}</span>
                              {node.repositories && node.repositories.length > 0 && (
                                <span className="text-sky-400 flex items-center gap-1 text-[10px]">
                                  <Code2 className="w-3 h-3" /> GitHub
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-white group-hover:text-emerald-400 text-sm mb-1 transition-colors">
                              {node.name}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-2">
                              {node.summary}
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#18202d] flex items-center justify-between text-[11px] text-slate-500">
                            <span className="text-slate-400">{node.classification}</span>
                            <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Root Global Intent Overview */
                <div className="p-6 rounded-2xl bg-[#0b0e14] border border-[#1b212d] space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>GLOBAL INTENT SYSTEM ARCHITECTURE</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-wide">
                    Autonomous Scientific Discovery, Verified Systems & Shipped Software
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                    The 3D neural mesh above visualizes the hierarchical research structure of GI-Company.
                    Select any of the 4 primary domain hubs (Machine Learning, Virtual Lab, Systems Research, or Shipped Software)
                    to travel into that cluster and unfold its verified project nodes, or choose a project below to inspect its
                    engineering dossier, architecture stages, experiments, and source code.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {RESEARCH_DOMAINS.map(domain => {
                      const count = RESEARCH_NODES.filter(n => n.domain === domain.id).length;
                      return (
                        <button
                          key={domain.id}
                          type="button"
                          onClick={() => handleSelectDomain(domain.id)}
                          className="p-4 rounded-xl bg-[#0e121a] border border-[#1d2535] hover:border-emerald-500/70 text-left transition-all hover:scale-[1.02] group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domain.colorHex }} />
                            <span className="text-[10px] text-slate-500">{count} projects</span>
                          </div>
                          <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                            {domain.label}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {domain.description}
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <span>Travel to Domain</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Conventional 2D Research/Projects Index (Full alternative navigation) */}
        {activeTab === 'dossiers' && (
          <ProjectsIndex
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => {
              handleSelectNode(nodeId);
              setActiveTab('spatial');
            }}
          />
        )}

        {/* 2.5 Global Research Log & Evolutionary Timeline */}
        {activeTab === 'research-log' && (
          <ResearchLogView
            onSelectNode={(nodeId) => {
              handleSelectNode(nodeId);
              setActiveTab('spatial');
            }}
          />
        )}

        {/* 3. Interactive Workbenches & Simulators */}
        {activeTab === 'simulators' && (
          <div className="space-y-6">
            <div className="border-b border-[#1b212d] pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Autonomous Verification Simulators & Testbenches
                </h2>
                <p className="text-xs text-slate-400">
                  Direct interactive mathematical instrumentation, cognitive debuggers, and attack sandboxes.
                </p>
              </div>

              {/* Simulator Switcher Pills */}
              <div className="flex flex-wrap gap-2">
                {simulatorsList.map((sim, idx) => (
                  <button
                    key={sim.title}
                    type="button"
                    onClick={() => setActiveSimIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeSimIndex === idx
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        : 'bg-[#0e121a] text-slate-400 hover:text-slate-200 border border-[#1b212d]'
                    }`}
                  >
                    {sim.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Render Selected Simulator Component */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1b212d]">
              {simulatorsList[activeSimIndex].component}
            </div>
          </div>
        )}

        {/* 4. Lab Philosophy & Manifesto */}
        {activeTab === 'manifesto' && <LabManifesto />}
      </main>

      {/* Persistent Technical Provenance Footer */}
      <footer className="border-t border-[#141822] bg-[#05070a] py-6 px-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>GI-Company Cognitive Microkernel & Autonomous Science</span>
            <span className="text-slate-700">|</span>
            <span>Hierarchical 3D Mesh Navigation</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <a
              href="https://github.com/GI-Company"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span>GI-Company</span>
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://github.com/GI-Company/GiC"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors text-emerald-400"
            >
              <span>Site Source: GI-Company/GiC</span>
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="mailto:support@globalintentcompany.space"
              className="hover:text-white flex items-center gap-1 transition-colors text-slate-300"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>support@globalintentcompany.space</span>
            </a>
            <span className="text-slate-700">•</span>
            <span>Founder: Cory Tortorici</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
