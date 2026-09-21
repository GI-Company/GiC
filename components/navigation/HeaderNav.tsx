'use client';

import React from 'react';
import { RenderTier } from '@/components/neural-mesh/NeuralGraphCanvas';
import {
  Compass,
  Layers,
  FileText,
  Terminal,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Search,
  Code2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export type ActiveTab = 'spatial' | 'dossiers' | 'research-log' | 'simulators' | 'manifesto';

interface HeaderNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  renderTier: RenderTier;
  onTierChange: (tier: RenderTier) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export default function HeaderNav({
  activeTab,
  onTabChange,
  renderTier,
  onTierChange,
  soundEnabled,
  onToggleSound,
  selectedNodeId,
  onSelectNode,
}: HeaderNavProps) {
  return (
    <header id="global-intent-header" className="sticky top-0 z-40 bg-[#07090d]/95 backdrop-blur-md border-b border-[#181d27] font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Lab Brand & Founder */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { onTabChange('spatial'); onSelectNode(''); }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0f141f] border border-[#212838] flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/80 transition-colors">
              <span className="font-bold text-sm tracking-tighter text-white">GI</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wider text-sm">GLOBAL INTENT</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 rounded font-bold">
                  COMPANY
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Cory Tortorici • Independent Research</p>
            </div>
          </button>
        </div>

        {/* Primary View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-[#0d1017] p-1 rounded-lg border border-[#1b212d] overflow-x-auto">
          <button
            type="button"
            onClick={() => onTabChange('spatial')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'spatial'
                ? 'bg-[#18202d] text-white font-semibold shadow-sm border border-[#273247]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spatial Mesh</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('dossiers')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'dossiers'
                ? 'bg-[#18202d] text-white font-semibold shadow-sm border border-[#273247]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Projects & Repositories</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('research-log')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'research-log'
                ? 'bg-[#18202d] text-white font-semibold shadow-sm border border-[#273247]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Research Logs & Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('simulators')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'simulators'
                ? 'bg-[#18202d] text-white font-semibold shadow-sm border border-[#273247]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Instruments</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('manifesto')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'manifesto'
                ? 'bg-[#18202d] text-white font-semibold shadow-sm border border-[#273247]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Company Manifesto</span>
          </button>
        </nav>

        {/* Canonical GitHub Link, Sound & Tier Quick Toggle */}
        <div className="flex items-center gap-2">
          {/* GitHub Organization Link */}
          <a
            href="https://github.com/GI-Company"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border bg-[#0e121a] hover:bg-[#151c27] border-[#1c222e] hover:border-slate-500 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-[11px]"
            title="Global Intent Company official GitHub organization"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono font-medium">GI-Company</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500 hidden sm:inline" />
          </a>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                : 'bg-[#0e121a] border-[#1c222e] text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Acoustic feedback enabled' : 'Acoustic feedback muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Render Tier Badge */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0e121a] border border-[#1c222e] px-2 py-1 rounded-lg text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span suppressHydrationWarning className="uppercase font-bold text-slate-300">{renderTier}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
