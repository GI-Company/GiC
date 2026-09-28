'use client';

import React from 'react';
import { Lock, Cpu, ShieldCheck, Eye, Scale } from 'lucide-react';

interface Principle {
  number: string;
  title: string;
  tagline: string;
  description: string;
  invariant: string;
  icon: React.ElementType;
}

const PRINCIPLES: Principle[] = [
  {
    number: '01',
    title: 'Private Ownership',
    tagline: 'Sovereign compute, sovereign weights, sovereign boundaries.',
    description:
      'Inference, contextual memory, and model weights must remain strictly within the operator’s sovereign network perimeter. We reject architectures that force external data exfiltration for routine intelligence tasks.',
    invariant: 'INVARIANT: Zero unauthenticated external network egress during inference.',
    icon: Lock,
  },
  {
    number: '02',
    title: 'Efficient Computation',
    tagline: 'Maximizing capability per parameter and compute cycle.',
    description:
      'Rather than relying on brute-force scaling alone, we engineer compact architectures (3.45M – 23M) with low-overhead C runtimes and memory-mapped tensors to execute on local workstation silicon.',
    invariant: 'INVARIANT: Zero dependency on heavy Python/PyTorch runtime layers in core C engines.',
    icon: Cpu,
  },
  {
    number: '03',
    title: 'Verifiable Infrastructure',
    tagline: 'Multi-stage validation before token emission.',
    description:
      'An endpoint must mathematically and cryptographically prove its readiness through a 7-stage verification lifecycle before receiving user prompts. Health checks and streaming share a unified transport.',
    invariant: 'INVARIANT: Readiness diagnostics and streaming pipelines execute over identical transport paths.',
    icon: ShieldCheck,
  },
  {
    number: '04',
    title: 'Transparent Experimentation',
    tagline: 'Glass-box activation taps over opaque black boxes.',
    description:
      'Neural architectures must be inspectable. By managing contiguous activation memory buffers, operators can probe internal layer representations, attention maps, and gradient updates in real time via live REPL interfaces.',
    invariant: 'INVARIANT: Constant-time O(1) buffer lookup during live activation inspection.',
    icon: Eye,
  },
  {
    number: '05',
    title: 'Evidence Before Claims',
    tagline: 'Epistemic discipline and honest null result reporting.',
    description:
      'Every technical statement is rigorously categorized into source-verified code, controlled empirical trials, author-reported observations, or open hypotheses. Negative margins and hardware bottlenecks are documented openly.',
    invariant: 'INVARIANT: Explicit separation of verified empirical data from architectural hypotheses.',
    icon: Scale,
  },
];

export default function PrinciplesSection() {
  return (
    <section id="principles" className="py-20 sm:py-28 bg-[#090c13] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>07. Core Philosophy</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Principles of Operation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Engineering principles grounded in mathematical and systems discipline.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            Global Intent Company operates under a strict epistemic and architectural code. We build systems based on verifiable capabilities rather than inflated marketing promises.
          </p>
        </div>

        {/* Principles Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.number}
                className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] hover:border-[#2a364d] transition-colors flex flex-col justify-between space-y-4 font-mono text-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-[#182130]">
                    <span className="text-emerald-400 font-bold text-xs">{principle.number}</span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>

                  <h3 className="text-base font-bold text-white font-sans">{principle.title}</h3>
                  <span className="text-emerald-400/90 text-xs font-sans font-medium block">
                    {principle.tagline}
                  </span>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {principle.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#182130] text-[10px] text-slate-400 leading-snug">
                  {principle.invariant}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
