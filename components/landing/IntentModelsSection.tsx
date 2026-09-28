'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Terminal, Eye, Layers, ArrowUpRight, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ModelCard {
  id: string;
  name: string;
  codename: string;
  parameterRange: string;
  runtime: string;
  description: string;
  verifiedInCode: string[];
  epistemicNote: string;
  researchLink: string;
}

const INTENT_MODELS: ModelCard[] = [
  {
    id: 'tinycoherent',
    name: 'TinyCoherent',
    codename: 'TINYCOHERENT-SCALE',
    parameterRange: '3.45M – 23M Parameters',
    runtime: 'Pure ANSI C / Apple Silicon Accelerate BLAS',
    description:
      'A zero-dependency decoder-only Transformer written in pure C. Features direct memory-mapped tensor allocations, custom analytical backpropagation, prompt-loss masking for instruction tuning, and pre-allocated activation buffers for live glass-box terminal REPL inspection.',
    verifiedInCode: [
      'Pure C99/C11 implementation with zero Python/PyTorch runtime dependencies',
      'Apple Accelerate framework (cblas_sgemm) linear algebra dispatch',
      'Subword Byte-Pair Encoding (BPE) addressing sequence inflation',
      'Rung 6 V2 step-by-step reasoning scratchpad curation pipeline',
    ],
    epistemicNote:
      'Focuses on inspectability, memory mapping, and pure C execution rather than frontier benchmark claims.',
    researchLink: '/research/tinycoherent',
  },
  {
    id: 'bnlm',
    name: 'BNLM (Browser-Native LM)',
    codename: 'BNLM-BROWSER-TRANSFORMER',
    parameterRange: 'Sub-10M Lightweight Transformer',
    runtime: 'JavaScript ES Modules / WebGPU WGSL Compute Shaders',
    description:
      'A decoder-only Transformer initialized, trained, and executed for inference entirely client-side inside a browser tab with WebGPU compute shaders and non-blocking Web Workers.',
    verifiedInCode: [
      'Client-side reverse-mode automatic differentiation in pure JS',
      'WebGPU WGSL matmul shader with automatic CPU fallback',
      'Zero server dependencies, Python runtimes, or build steps',
      'Finite-difference numerical gradient verification (gradcheck.mjs)',
    ],
    epistemicNote:
      'Explores boundary feasibility for zero-server in-browser training and execution under strict client constraints.',
    researchLink: '/research/bnlm',
  },
  {
    id: 'cortex',
    name: 'Cortex Global Workspace',
    codename: 'CORTEX-ARCH',
    parameterRange: 'Selective Workspace Routing Architecture',
    runtime: 'Hybrid Local Reflex & Gated Global Hypothesis Slots',
    description:
      'A cognitive architecture decoupling fast-path sensory reflex from deliberate global workspace integration. Gated thresholds recruit bounded hypothesis slots to compete for final output synthesis.',
    verifiedInCode: [
      'Selective local processing resolving low-entropy signals locally',
      'Bounded hypothesis competition slots (H1, H2, H3)',
      'Gating hysteresis analysis avoiding decision threshold thrashing',
      'Empirical baseline testing against dense self-attention',
    ],
    epistemicNote:
      'An experimental architectural paradigm investigating whether selective global integration can reduce compute on ambiguous inputs.',
    researchLink: '/research/cortex',
  },
  {
    id: 'cortex-ms',
    name: 'Cortex-MS',
    codename: 'CORTEX-MS-L4',
    parameterRange: '3.2M-Parameter Molecular Representation Model',
    runtime: 'NVIDIA L4 Hardware Probe & Multi-Task Decoders',
    description:
      'Transforms raw tandem mass spectra (MS/MS) and precursor metadata into structured geometric peak embeddings, maintaining competing molecular hypotheses for formula and fingerprint decoding.',
    verifiedInCode: [
      'Geometric peak manifold projections with Fourier positional encoding',
      'Active hypothesis workspace evaluating competing molecular slots',
      'L4 saturation probe documenting input deserialization bottlenecks',
      'Contrastive margin diagnostics with honest null/negative margin reporting',
    ],
    epistemicNote:
      'Documents honest hardware saturation non-linearities and representation challenges under real L4 probe telemetry.',
    researchLink: '/research/cortex-ms',
  },
];

export default function IntentModelsSection() {
  return (
    <section id="intent-models" className="py-20 sm:py-28 bg-[#090c13] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>03. Intelligence Layer</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Intent Model Family</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Efficient architectures engineered for inspectability and constrained silicon.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            The Intent Model Family explores what can be accomplished when neural architectures are built without bloated framework layers—running directly on local hardware via pure C, WebGPU compute shaders, and glass-box activation taps.
          </p>
        </div>

        {/* Epistemic Rigor & Scope Note */}
        <div className="mt-8 p-4 rounded-md bg-[#0e1420] border border-[#212c3e] text-xs font-mono text-slate-300 flex items-start gap-3">
          <Eye className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-sans leading-relaxed">
            <strong className="text-emerald-300 font-mono">Epistemic Scope:</strong> Our research program targets efficiency, inspectability, transparency, and private edge execution under constrained parameter budgets. We do not make unfounded claims of matching or exceeding trillion-parameter frontier cloud models; our work is evaluated against specific architectural baselines documented in our public research dossiers.
          </p>
        </div>

        {/* Models Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTENT_MODELS.map((model) => (
            <div
              key={model.id}
              className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] hover:border-[#2b3952] transition-colors flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{model.name}</h3>
                    <span className="text-xs font-mono text-emerald-400 block">{model.codename}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 text-right">
                    {model.parameterRange}
                  </span>
                </div>

                {/* Runtime & Description */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>{model.runtime}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    {model.description}
                  </p>
                </div>

                {/* Verified In Code List */}
                <div className="space-y-1.5 pt-2 border-t border-[#182130]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Source-Verified Implementation Features
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 font-sans">
                    {model.verifiedInCode.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-mono text-[10px] mt-0.5">✓</span>
                        <span className="text-[12px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer with Epistemic Note & Link */}
              <div className="pt-4 border-t border-[#182130] space-y-3">
                <p className="text-[11px] text-slate-400 italic font-sans">
                  {model.epistemicNote}
                </p>

                <Link
                  href={model.researchLink}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <span>Open Complete Research Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
