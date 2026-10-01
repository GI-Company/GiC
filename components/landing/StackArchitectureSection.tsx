'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, Server, Network, Shield, ArrowDown, ChevronRight, CheckCircle, Database, Lock, Eye } from 'lucide-react';

interface StackLayer {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  role: string;
  color: string;
  borderColor: string;
  badgeColor: string;
  description: string;
  technicalCapabilities: string[];
  protocolOrEngine: string;
  epistemicRole: string;
}

const STACK_LAYERS: StackLayer[] = [
  {
    id: 'intent',
    number: '01',
    name: 'INTENT MODEL FAMILY',
    subtitle: 'Intelligence Layer',
    role: 'Efficient, inspectable language model architectures designed for constrained parameter budgets and sovereign silicon.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    description:
      'A developing family of efficient language-model architectures, including the LooseMouth conversational model and smaller research models. The research models explore native ANSI C with Apple Accelerate BLAS and browser-native WebGPU WGSL compute shaders, prioritizing glass-box activation inspection, low memory footprints, and sovereign execution.',
    technicalCapabilities: [
      'Model types spanning small research systems and the approximately 162M-parameter LooseMouth conversational model',
      'Direct ANSI C execution with memory-mapped tensor buffers',
      'Apple Accelerate BLAS & WebGPU WGSL hardware acceleration',
      'Real-time glass-box activation inspection via live REPL',
      'Curated step-by-step reasoning token datasets (Rung 6 V2)',
    ],
    protocolOrEngine: 'Native ANSI C99 / WebGPU WGSL / Apple Accelerate BLAS',
    epistemicRole: 'SOURCE-VERIFIED CODE & EXPERIMENTAL ARCHITECTURES',
  },
  {
    id: 'plmh',
    number: '02',
    name: 'PLMH — Private Language Model Hub',
    subtitle: 'Execution Layer',
    role: 'Dedicated runtime infrastructure hosting and executing privately controlled language models across local hardware.',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    description:
      'The Private Language Model Hub provides the isolated execution environment where model weights are loaded into deterministic memory pages, managed under local hardware constraints, and exposed through strict model/API protocols without cloud telemetry or external logging.',
    technicalCapabilities: [
      'Deterministic memory allocation & continuous KV caching',
      'Unified model execution runtime with CPU/GPU scheduling',
      'Standardized model/API protocol abstraction',
      'Mutual TLS authenticated private network access',
      'Total isolation from third-party telemetry and external scrapers',
    ],
    protocolOrEngine: 'PLMH Model/API Protocol & Runtime Supervisor',
    epistemicRole: 'SYSTEMS ARCHITECTURE & HOST RUNTIME',
  },
  {
    id: 'plmn',
    number: '03',
    name: 'PLMN — Private Language Model Node',
    subtitle: 'Ownership & Interaction Layer',
    role: 'Client & gateway layer providing discovery, connection, capability verification, and robust inference streaming.',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    description:
      'The Private Language Model Node manages the complete client-to-hub relationship. It implements a 7-stage verification lifecycle ensuring an endpoint is mathematically, cryptographically, and functionally ready before beginning token generation, using a unified transport abstraction for health checks and streaming.',
    technicalCapabilities: [
      '7-Stage Verification Lifecycle (CONFIGURED → STREAM_READY)',
      'Unified transport abstraction for diagnostics & streaming',
      'Cryptographic challenge-response token authentication',
      'Dynamic model capability & context window negotiation',
      'Resilient backpressure handling and token buffer management',
    ],
    protocolOrEngine: 'PLMN Verification Transport & Stream Pipeline',
    epistemicRole: 'NODE VERIFICATION PROTOCOL',
  },
  {
    id: 'ownership',
    number: '04',
    name: 'USER / ORGANIZATION',
    subtitle: 'Private Ownership & Control',
    role: 'The sovereign boundary where weights, inference compute, prompt telemetry, and data assets reside exclusively.',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    description:
      'At the boundary layer, users and enterprise organizations retain unmediated sovereignty. Inference requests, embeddings, and context memories never cross trust boundaries, eliminating external lock-in and vendor vulnerability.',
    technicalCapabilities: [
      'Complete ownership of weights and checkpoint artifacts',
      'Zero remote telemetry egress or data retention risk',
      'Inspectable audit trails and deterministic replay',
      'Direct integration with internal applications and tools',
      'Sovereignty over fine-tuning data and proprietary knowledge',
    ],
    protocolOrEngine: 'Sovereign Perimeter & Local Control Plane',
    epistemicRole: 'ORGANIZATIONAL BOUNDARY INVARIANT',
  },
];

export default function StackArchitectureSection() {
  const [selectedLayerId, setSelectedLayerId] = useState<string>('intent');
  const activeLayer = STACK_LAYERS.find(l => l.id === selectedLayerId) || STACK_LAYERS[0];

  return (
    <section id="the-stack" className="py-20 sm:py-28 bg-[#070a10] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>02. The Architecture</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Full-Stack AI Topology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            The Private AI Stack: From Model to Infrastructure
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            Global Intent Company designs the complete continuum of private artificial intelligence—unifying model architectures, execution runtimes, verified transport protocols, and the sovereign user boundary into a single cohesive system.
          </p>
        </div>

        {/* Interactive Desktop / Responsive Diagram */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Top: Interactive Layer Selector & Diagram */}
          <div className="lg:col-span-6 space-y-3 font-mono">
            {STACK_LAYERS.map((layer, index) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div key={layer.id} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`w-full text-left p-5 rounded-lg border transition-all relative overflow-hidden group ${
                      isSelected
                        ? `bg-[#0f1522] ${layer.borderColor} shadow-lg ring-1 ring-white/10`
                        : 'bg-[#0a0d15] border-[#1a2230] hover:border-slate-600 hover:bg-[#0c101a]'
                    }`}
                  >
                    {/* Active left indicator bar */}
                    {isSelected && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          layer.id === 'intent'
                            ? 'bg-emerald-400'
                            : layer.id === 'plmh'
                            ? 'bg-cyan-400'
                            : layer.id === 'plmn'
                            ? 'bg-blue-400'
                            : 'bg-amber-400'
                        }`}
                      />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold ${layer.color}`}>{layer.number}</span>
                        <span className="font-semibold text-white tracking-wide text-xs sm:text-sm">
                          {layer.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-sans">{layer.subtitle}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed pl-6">
                      {layer.role}
                    </p>

                    <div className="mt-3 pl-6 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">{layer.protocolOrEngine}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-slate-300">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>

                  {/* Flow arrow between layers */}
                  {index < STACK_LAYERS.length - 1 && (
                    <div className="flex items-center justify-center py-0.5 text-slate-600 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-[#1a2230]" />
                        <span className="font-mono text-slate-500">↓ verified data &amp; control flow</span>
                        <span className="w-8 h-[1px] bg-[#1a2230]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right / Bottom: Deep Layer Inspector Panel */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="p-6 rounded-lg bg-[#0b0f17] border border-[#1e2738] shadow-2xl space-y-6 font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#182130]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${activeLayer.color}`}>LAYER {activeLayer.number}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-white font-semibold">{activeLayer.subtitle}</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{activeLayer.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">TOPOLOGY TIER</span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase">{activeLayer.id}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 font-sans">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Layer Specification
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeLayer.description}
                </p>
              </div>

              {/* Technical Capabilities List */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Engineering Capabilities &amp; Invariants
                </span>
                <div className="space-y-2 rounded-md bg-[#07090e] border border-[#161e2b] p-3.5">
                  {activeLayer.technicalCapabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-slate-300 text-xs font-sans">
                      <span className={`font-mono text-xs ${activeLayer.color} mt-0.5`}>•</span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol / Grounding Footer */}
              <div className="pt-4 border-t border-[#182130] flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">VERIFICATION ROLE</span>
                  <span className="text-slate-300">{activeLayer.epistemicRole}</span>
                </div>

                {activeLayer.id === 'intent' && (
                  <Link
                    href="/research/tinycoherent"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View TinyCoherent C Code</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {activeLayer.id === 'plmh' && (
                  <a
                    href="#plmh"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Read PLMH Blueprint</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {activeLayer.id === 'plmn' && (
                  <a
                    href="#plmn"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View 7-Stage Lifecycle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {activeLayer.id === 'ownership' && (
                  <Link
                    href="/research"
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Inspect Research Engine</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
