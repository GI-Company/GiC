'use client';

import React from 'react';
import { ServerOff, Cpu, KeyRound, Network, RefreshCw, Layers } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section id="the-problem" className="py-20 sm:py-28 bg-[#090c13] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>01. The Problem</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Architectural Dependency</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            The externalization of intelligence has created an architectural dependency.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            Much of contemporary AI architecture assumes that users and organizations must transmit their computational state, sensitive operational context, and inference requests across the network into third-party cloud infrastructure they do not control, inspect, or own.
          </p>
        </div>

        {/* Pivot Question Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-lg bg-[#0e131d] border border-[#212b3c] shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-md bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <span className="font-mono text-sm font-bold">?</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                The Foundational Systems Question
              </span>
              <p className="text-lg sm:text-xl font-sans font-semibold text-white leading-snug">
                &ldquo;What changes when the model, infrastructure, and user experience are designed around private ownership from the beginning?&rdquo;
              </p>
              <p className="text-sm text-slate-400 font-sans leading-relaxed pt-1">
                Addressing this requires engineering every tier of the stack: from constrained-parameter neural network architectures that run efficiently on local silicon, to execution hubs that host weights deterministically, to client nodes that verify endpoints before streaming tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Architectural Comparison Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Column 1: The Status Quo / Hosted Dependency */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#182130]">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                Externalized Hosted AI
              </span>
              <span className="text-slate-500 text-[10px]">Cloud Dependency Model</span>
            </div>

            <ul className="space-y-3.5 text-slate-300 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-slate-500 font-mono text-xs mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-200">Remote Boundary Traversal:</strong> Prompts, embeddings, and context buffers leave local networks on every token generation pass.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-slate-500 font-mono text-xs mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-200">Black-Box Weight Execution:</strong> Model parameters, floating-point precision, and internal activation states cannot be directly probed or inspected.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-slate-500 font-mono text-xs mt-0.5">✕</span>
                <span>
                  <strong className="text-slate-200">Fragile Readiness Checks:</strong> Systems infer endpoint availability from basic HTTP responses, leading to stream failures when internal models are unready.
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: The Global Intent Architecture */}
          <div className="p-6 rounded-lg bg-[#0b121b] border border-emerald-900/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/80">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                Global Intent Architecture
              </span>
              <span className="text-emerald-500/70 text-[10px]">Private Ownership Model</span>
            </div>

            <ul className="space-y-3.5 text-slate-300 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono text-xs mt-0.5">✓</span>
                <span>
                  <strong className="text-emerald-200">Sovereign Data Perimeter:</strong> Inference compute and context windows execute entirely on dedicated, privately owned hardware nodes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono text-xs mt-0.5">✓</span>
                <span>
                  <strong className="text-emerald-200">Glass-Box Model Architectures:</strong> Direct C-level memory access, pre-allocated activation taps, and transparent parameter allocations.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-mono text-xs mt-0.5">✓</span>
                <span>
                  <strong className="text-emerald-200">Unified Verification Lifecycle:</strong> Health checks, capability discovery, and streaming share a unified transport ensuring verified readiness before execution.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
