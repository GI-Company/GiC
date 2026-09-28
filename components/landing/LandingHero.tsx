'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ShieldCheck, Cpu, Network, Lock, Layers, Terminal, CheckCircle2 } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden border-b border-[#161d2b]">
      {/* Subtle structural grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1117240f_1px,transparent_1px),linear-gradient(to_bottom,#1117240f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Thesis & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Zero-pill metadata kicker */}
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Independent Systems &amp; Machine Learning R&amp;D</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Full-Stack AI Architecture</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-white text-balance leading-[1.08]">
                Private AI, from model to infrastructure.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-2xl">
                Global Intent Company develops efficient language-model architectures and the infrastructure required to privately deploy, verify, and operate them.
              </p>
            </div>

            {/* Core Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
              <a
                href="#the-stack"
                className="px-5 py-2.5 rounded-md bg-white text-slate-950 font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Explore the Technology</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/research"
                className="px-5 py-2.5 rounded-md bg-[#101622] hover:bg-[#182030] text-slate-200 border border-[#232d3f] hover:border-slate-500 transition-colors flex items-center gap-2"
              >
                <span>View Research Lab</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>

            {/* Quick architectural signals */}
            <div className="pt-6 border-t border-[#1a2332] grid grid-cols-3 gap-4 text-xs font-mono text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-1">Architecture</span>
                <span className="text-slate-200 font-medium">Constrained Budgets</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-1">Execution</span>
                <span className="text-slate-200 font-medium">PLMH Runtime</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-1">Boundary</span>
                <span className="text-emerald-400 font-medium">Verified Readiness</span>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Stack Schematic Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-lg bg-[#0b0f17] border border-[#1e2738] p-5 shadow-2xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#182130] text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">GIC PRIVATE STACK TOPOLOGY</span>
                </div>
                <span className="text-slate-500">SYSTEM ARCHITECTURE</span>
              </div>

              {/* Layer 1 */}
              <div className="p-3 rounded-md bg-[#0f1420] border border-[#222c3d] hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-emerald-400 font-bold">1. INTENT MODEL FAMILY</span>
                  <span className="text-slate-500">Intelligence Layer</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-normal">
                  Constrained-parameter language models (3.45M – 23M) with glass-box activation inspection &amp; native C / WebGPU execution.
                </p>
              </div>

              {/* Down arrow connector */}
              <div className="flex justify-center text-slate-600 -my-1">
                <span>↓</span>
              </div>

              {/* Layer 2 */}
              <div className="p-3 rounded-md bg-[#0f1420] border border-[#222c3d] hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-cyan-400 font-bold">2. PLMH — HUB</span>
                  <span className="text-slate-500">Execution Layer</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-normal">
                  Dedicated hosting runtime executing privately controlled weights behind standardized model/API protocols.
                </p>
              </div>

              {/* Down arrow connector */}
              <div className="flex justify-center text-slate-600 -my-1">
                <span>↓</span>
              </div>

              {/* Layer 3 */}
              <div className="p-3 rounded-md bg-[#0f1420] border border-[#222c3d] hover:border-blue-500/50 transition-colors">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-blue-400 font-bold">3. PLMN — NODE</span>
                  <span className="text-slate-500">Interaction &amp; Verification</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-normal">
                  Unified transport discovery, cryptographic authentication, and 7-stage verification lifecycle before inference streams.
                </p>
              </div>

              {/* Down arrow connector */}
              <div className="flex justify-center text-slate-600 -my-1">
                <span>↓</span>
              </div>

              {/* Layer 4 */}
              <div className="p-3 rounded-md bg-[#131926] border border-[#273449]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-amber-400 font-bold">4. USER / ORGANIZATION</span>
                  <span className="text-slate-500">Ownership Boundary</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-normal">
                  Complete sovereign ownership of weights, inference compute, prompts, and context buffers with zero cloud leakage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
