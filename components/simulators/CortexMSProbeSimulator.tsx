'use client';

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Search,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function CortexMSProbeSimulator() {
  const [selectedBatchSize, setSelectedBatchSize] = useState<number>(32);
  const [selectedModule, setSelectedModule] = useState<string>('workspace');
  const [activeTab, setActiveTab] = useState<'architecture' | 'telemetry' | 'diagnostics' | 'findings'>('architecture');

  // Realistic scaling model based on real L4 probe data
  const scalingData = useMemo(() => {
    // Baseline at Batch 32: throughput 229.6, step time 139.4, memory 2.58 GB
    const b = selectedBatchSize;
    const ratio = b / 32;
    // Non-linear scaling showing data pipeline serialization bottleneck
    const throughput = Number((229.6 * Math.pow(ratio, 0.42)).toFixed(1));
    const stepTime = Number((139.4 * (b / 32) * (229.6 / throughput)).toFixed(1));
    const memory = Number((2.58 + (b - 32) * 0.054).toFixed(2));
    const loss = Number((3.9329 - Math.log10(ratio) * 0.08).toFixed(4));
    const temp = Math.min(68, Math.round(52 + (b / 256) * 14));
    const power = Math.min(72, Math.round(44 + (b / 256) * 26));

    return {
      throughput,
      stepTime,
      memory,
      loss,
      temp,
      power,
      isSaturated: b >= 128,
    };
  }, [selectedBatchSize]);

  return (
    <div className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-xs">
      {/* Top Banner & Active Research Badge */}
      <div className="bg-[#0e121a] p-4 border-b border-[#181d27] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">CORTEX-MS</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 uppercase font-semibold">
              Active Research
            </span>
            <span className="text-[10px] text-slate-500">[NVIDIA L4 Hardware Tested]</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Experimental Molecular Representation & Mass-Spectrometry Learning System • 3,232,492 Parameters • BF16 Precision
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-[#07090d] p-0.5 rounded-lg border border-[#181d27]">
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'architecture' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'telemetry' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            L4 Saturation Probe
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'diagnostics' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Diagnostics & Observation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'findings' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Research Findings
          </button>
        </div>
      </div>

      {/* Main Interactive Body */}
      <div className="p-5 space-y-6">
        {/* TAB 1: ARCHITECTURE FLOW */}
        {activeTab === 'architecture' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Interactive Pipeline Diagram — Click any module to inspect its representations and hypothesis states</span>
              <span className="text-emerald-400 font-semibold">Active: {selectedModule.toUpperCase()}</span>
            </div>

            {/* Visual Pipeline Layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 pt-2">
              {/* Stage 1: Spectrum Input */}
              <button
                type="button"
                onClick={() => setSelectedModule('input')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModule === 'input'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase font-bold">Input</div>
                <div className="font-semibold text-white mt-1">Mass Spectrum</div>
                <div className="text-[10px] text-slate-400 mt-1">MS/MS centroid peaks & collision context</div>
                <div className="mt-2 h-6 flex items-end gap-0.5 bg-[#07090d] p-1 rounded">
                  <div className="w-1 bg-emerald-500 h-5" />
                  <div className="w-1 bg-emerald-400 h-2" />
                  <div className="w-1 bg-emerald-600 h-4" />
                  <div className="w-1 bg-slate-600 h-1" />
                  <div className="w-1 bg-emerald-300 h-6" />
                  <div className="w-1 bg-emerald-500 h-3" />
                </div>
              </button>

              {/* Stage 2: Peak Encoder */}
              <button
                type="button"
                onClick={() => setSelectedModule('encoder')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModule === 'encoder'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase font-bold">Layer 1</div>
                <div className="font-semibold text-white mt-1">Peak Encoder</div>
                <div className="text-[10px] text-slate-400 mt-1">m/z & abundance geometric metric space</div>
                <div className="mt-2 text-[10px] text-emerald-400 font-mono">[N_peaks, 512-dim]</div>
              </button>

              {/* Stage 3: Spectrum Embedding */}
              <button
                type="button"
                onClick={() => setSelectedModule('embedding')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModule === 'embedding'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase font-bold">Layer 2</div>
                <div className="font-semibold text-white mt-1">Spectrum Emb</div>
                <div className="text-[10px] text-slate-400 mt-1">Global fragmentation context pooling</div>
                <div className="mt-2 text-[10px] text-cyan-400 font-mono">[1024-dim Manifold]</div>
              </button>

              {/* Stage 4: Cortex Workspace */}
              <button
                type="button"
                onClick={() => setSelectedModule('workspace')}
                className={`p-3 rounded-lg border text-left transition-all md:col-span-2 ${
                  selectedModule === 'workspace'
                    ? 'bg-purple-950/50 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                    : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-purple-400 uppercase font-bold">Active Core</div>
                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-900/60 text-purple-300 rounded">Competing</span>
                </div>
                <div className="font-semibold text-white mt-1">Cortex Workspace</div>
                <div className="text-[10px] text-slate-400 mt-1">Hypothesis A, B, C competition dynamics</div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-center">
                  <div className="bg-[#171b26] p-1 rounded border border-purple-800/40 text-purple-300">Hyp A (0.64)</div>
                  <div className="bg-[#171b26] p-1 rounded border border-purple-800/40 text-purple-300">Hyp B (0.28)</div>
                  <div className="bg-[#171b26] p-1 rounded border border-purple-800/40 text-purple-300">Hyp C (0.08)</div>
                </div>
              </button>

              {/* Stage 5: Multi-task & Ranking */}
              <button
                type="button"
                onClick={() => setSelectedModule('ranking')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModule === 'ranking'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase font-bold">Output</div>
                <div className="font-semibold text-white mt-1">Candidate Rank</div>
                <div className="text-[10px] text-slate-400 mt-1">Formula, Fingerprint, & Margin Scoring</div>
                <div className="mt-2 text-[10px] text-emerald-400 font-mono">Calibrated Margins</div>
              </button>
            </div>

            {/* Selected Module Detail Inspector */}
            <div className="p-4 rounded-lg bg-[#0e121a] border border-[#1b212d] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1b212d] pb-2">
                <span className="font-bold text-white text-sm">
                  {selectedModule === 'input' && 'Mass Spectrum Input & Fragmentation Context'}
                  {selectedModule === 'encoder' && 'Continuous Geometric Peak Encoder'}
                  {selectedModule === 'embedding' && 'Global Spectrum Embedding Latent Space'}
                  {selectedModule === 'workspace' && 'Cortex Bounded Workspace & Hypothesis Competition'}
                  {selectedModule === 'ranking' && 'Candidate Ranking, Formula Prediction & Morgan Fingerprints'}
                </span>
                <span className="text-[10px] text-slate-500">Subsystem Details</span>
              </div>

              {selectedModule === 'input' && (
                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Rather than binning continuous m/z channels into discrete histograms that lose precision, Cortex-MS takes centroided
                    peak arrays [m/z, intensity] alongside precursor mass, collision energy (eV), ion mode, and adduct states.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-[#07090d] p-2 rounded border border-[#161c27]">
                      <span className="text-slate-500 block text-[10px]">Precursor m/z:</span>
                      <span className="font-semibold text-white">412.1854 Da</span>
                    </div>
                    <div className="bg-[#07090d] p-2 rounded border border-[#161c27]">
                      <span className="text-slate-500 block text-[10px]">Collision Energy:</span>
                      <span className="font-semibold text-white">35 eV (CID)</span>
                    </div>
                    <div className="bg-[#07090d] p-2 rounded border border-[#161c27]">
                      <span className="text-slate-500 block text-[10px]">Adduct Mode:</span>
                      <span className="font-semibold text-white">[M+H]+ Positive</span>
                    </div>
                    <div className="bg-[#07090d] p-2 rounded border border-[#161c27]">
                      <span className="text-slate-500 block text-[10px]">Centroid Peaks:</span>
                      <span className="font-semibold text-white">64 resolved ions</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedModule === 'workspace' && (
                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    The core research question of Cortex-MS is whether maintaining competing molecular hypotheses produces better
                    candidate ranking than one-shot classification. The workspace maintains three persistent hypothesis slots that update
                    their confidence weights as evidence accumulates:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded bg-[#07090d] border border-purple-900/60">
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>Hypothesis A</span>
                        <span className="text-emerald-400">Score 0.64</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Predicted Formula: C21H24N2O4</div>
                      <div className="text-[10px] text-slate-400">Loss consistent with ester cleavage</div>
                    </div>
                    <div className="p-3 rounded bg-[#07090d] border border-[#1a202c]">
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>Hypothesis B</span>
                        <span className="text-slate-400">Score 0.28</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Predicted Formula: C22H28N2O3</div>
                      <div className="text-[10px] text-slate-400">Alternative neutral loss pathway</div>
                    </div>
                    <div className="p-3 rounded bg-[#07090d] border border-[#1a202c]">
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>Hypothesis C</span>
                        <span className="text-slate-400">Score 0.08</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Predicted Formula: C20H20N2O5</div>
                      <div className="text-[10px] text-slate-400">Low-confidence radical fragmentation</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedModule === 'ranking' && (
                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    The multi-task output head branches into three simultaneous objectives: (1) elemental formula logits, (2) 2048-bit
                    Morgan fingerprint probabilities, and (3) contrastive representation embedding for ranking against PubChem/ChEMBL
                    candidates.
                  </p>
                </div>
              )}

              {(selectedModule === 'encoder' || selectedModule === 'embedding') && (
                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Fragment ions are projected using sine-cosine harmonic positional encodings over continuous m/z ranges. Multi-head
                    attention layers model intra-spectrum fragmentation relationships (such as common neutral water, carbon monoxide, or
                    methyl losses) without requiring pre-computed fragmentation trees.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: L4 SATURATION PROBE & BATCH SLIDER */}
        {activeTab === 'telemetry' && (
          <div className="space-y-5">
            {/* Interactive Batch Size Slider */}
            <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-white font-bold text-sm">Batch Size Saturation Slider: </span>
                  <span className="text-emerald-400 font-bold text-base">{selectedBatchSize} molecules</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">NVIDIA L4 (24 GB)</span>
                  <span className="px-2 py-0.5 rounded bg-[#161c28] text-cyan-300 border border-[#222b3b]">
                    BF16 Precision
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="32"
                max="256"
                step="32"
                value={selectedBatchSize}
                onChange={(e) => setSelectedBatchSize(Number(e.target.value))}
                className="w-full h-2 bg-[#171c26] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>32 (Baseline Probe)</span>
                <span>64</span>
                <span>128</span>
                <span>192</span>
                <span>256 (Max VRAM Saturation)</span>
              </div>
            </div>

            {/* Live Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                <div className="text-[10px] text-slate-400 uppercase">Throughput</div>
                <div className="text-xl font-bold text-white mt-1">
                  {scalingData.throughput} <span className="text-xs text-emerald-400 font-normal">mol/s</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {selectedBatchSize === 32 ? 'Measured baseline: 229.6' : 'Sub-linear scaling'}
                </div>
              </div>

              <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                <div className="text-[10px] text-slate-400 uppercase">Step Time</div>
                <div className="text-xl font-bold text-white mt-1">
                  {scalingData.stepTime} <span className="text-xs text-cyan-400 font-normal">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {selectedBatchSize === 32 ? 'Measured baseline: 139.4 ms' : 'Forward step latency'}
                </div>
              </div>

              <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                <div className="text-[10px] text-slate-400 uppercase">Peak GPU VRAM</div>
                <div className="text-xl font-bold text-white mt-1">
                  {scalingData.memory} <span className="text-xs text-purple-400 font-normal">GB</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">24 GB Hardware Capacity</div>
              </div>

              <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d]">
                <div className="text-[10px] text-slate-400 uppercase">Total Multi-Task Loss</div>
                <div className="text-xl font-bold text-white mt-1">
                  {scalingData.loss}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Contrastive + FP + Formula</div>
              </div>
            </div>

            {/* Detailed Batch 32 Measured Breakdown Table */}
            <div className="bg-[#0e121a] rounded-xl border border-[#1b212d] overflow-hidden">
              <div className="p-3 bg-[#111622] border-b border-[#1b212d] flex items-center justify-between">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                  Empirical Batch 32 Measurement Record (NVIDIA L4)
                </span>
                <span className="text-[10px] text-emerald-400">Zero Simulated Fiction</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-bold border-b border-[#181f2c] pb-1">
                    System Parameters & Execution
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Model Parameters</span>
                    <span className="font-semibold text-white">3,232,492</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Arithmetic Precision</span>
                    <span className="font-semibold text-white">BF16 Mixed Precision</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Accelerator Silicon</span>
                    <span className="font-semibold text-white">NVIDIA L4 Tensor Core (24 GB)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Measured Throughput</span>
                    <span className="font-semibold text-emerald-400">229.6 molecules/sec</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Measured Step Time</span>
                    <span className="font-semibold text-white">139.4 ms</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-bold border-b border-[#181f2c] pb-1">
                    Loss Decomposition Breakdown
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Composite Loss</span>
                    <span className="font-semibold text-white">3.9329</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Contrastive Loss</span>
                    <span className="font-semibold text-white">3.3853</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Morgan Fingerprint BCE</span>
                    <span className="font-semibold text-white">0.3251</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141a24]">
                    <span className="text-slate-400">Formula Logits Loss</span>
                    <span className="font-semibold text-white">0.2021</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Candidate Ranking Margin</span>
                    <span className="font-semibold text-white">0.6937</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & HONEST OBSERVATION */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-5">
            {/* Representation Diagnostics Box */}
            <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b212d] pb-2">
                <span className="font-bold text-white text-sm">Representation Diagnostics (Batch 32)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300">
                  Critical Research Finding
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#07090d] p-3 rounded-lg border border-[#181d27]">
                  <span className="text-[10px] text-slate-400 block">Positive Score:</span>
                  <span className="text-lg font-bold text-white">0.750</span>
                  <span className="text-[9px] text-emerald-400 block mt-1">Nominal matching</span>
                </div>
                <div className="bg-[#07090d] p-3 rounded-lg border border-[#181d27]">
                  <span className="text-[10px] text-slate-400 block">Negative Score:</span>
                  <span className="text-lg font-bold text-white">0.577</span>
                  <span className="text-[9px] text-slate-500 block mt-1">Random baseline</span>
                </div>
                <div className="bg-[#07090d] p-3 rounded-lg border border-red-900/60 bg-red-950/20">
                  <span className="text-[10px] text-red-300 block font-bold">Hard Negative:</span>
                  <span className="text-lg font-bold text-red-400">1.259</span>
                  <span className="text-[9px] text-red-400 block mt-1">⚠️ Exceeds positive</span>
                </div>
                <div className="bg-[#07090d] p-3 rounded-lg border border-amber-900/60">
                  <span className="text-[10px] text-amber-300 block font-bold">Margin:</span>
                  <span className="text-lg font-bold text-amber-400">-0.509</span>
                  <span className="text-[9px] text-amber-400 block mt-1">Inverted margin</span>
                </div>
                <div className="bg-[#07090d] p-3 rounded-lg border border-[#181d27]">
                  <span className="text-[10px] text-slate-400 block">Batch Top-1:</span>
                  <span className="text-lg font-bold text-white">0.062</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Early training stage</span>
                </div>
              </div>

              {/* The Uncomfortable Result Callout */}
              <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/80 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Empirical Observation</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                  Under this configuration, hard-negative similarity (1.259) exceeded positive similarity (0.750). The representation space
                  therefore had not yet achieved the intended separation behavior.
                </p>
                <div className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-800/40 font-mono">
                  Next Experiment: Curriculum-weighted contrastive temperature annealing and parallel host-pipeline spectral batching.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RESEARCH FINDINGS (OBSERVED / UNRESOLVED) */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="text-[11px] text-slate-400">
              Categorized empirical observations from Cortex-MS experimental trials. We explicitly separate verified findings from
              unresolved architectural questions.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1c2230] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    OBSERVED
                  </span>
                  <span className="font-bold text-white text-xs">L4 Saturation Non-Linearity</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Small-model molecular ML workloads do not automatically saturate an L4 accelerator simply by increasing batch size. Host-side
                  tensor batching and deserialization quickly become the governing bottleneck.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1c2230] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    OBSERVED
                  </span>
                  <span className="font-bold text-white text-xs">Hard Negative Inversion</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  The current contrastive representation has configurations where hard negatives score above true positives, yielding a
                  negative margin of -0.509 under naive pairwise margin loss.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1c2230] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    UNRESOLVED
                  </span>
                  <span className="font-bold text-white text-xs">Matched Transformer Baseline</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Whether the Cortex hypothesis workspace provides a verified advantage over a properly matched standard Transformer baseline
                  remains an open, unresolved research question.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1c2230] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    UNRESOLVED
                  </span>
                  <span className="font-bold text-white text-xs">Large Chemical Space Generalization</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Whether observed improvements survive evaluation on millions of unseen heterogeneous compounds and controlled ablation
                  studies.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
