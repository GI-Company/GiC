'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Compass, Layers, ShieldCheck, Terminal, BookOpen, ExternalLink } from 'lucide-react';

export default function ResearchEngineSection() {
  return (
    <section id="research-engine" className="py-20 sm:py-28 bg-[#07090e] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>06. R&amp;D Foundation</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">The Research Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Built upon years of rigorous systems and machine learning research.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            The commercial private AI stack is the direct product of Global Intent Company&apos;s independent research program. Rather than treating individual prototypes as disconnected projects, our work follows a disciplined engineering progression.
          </p>
        </div>

        {/* 5-Step Unified Research Progression Pipeline */}
        <div className="mt-12 p-6 rounded-lg bg-[#0a0d15] border border-[#1b2333] font-mono text-xs shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#182130] text-[11px] text-slate-400">
            <span className="font-bold text-slate-200">GIC ENGINEERING TRANSLATION PIPELINE</span>
            <span className="text-emerald-400">EVIDENCE-DRIVEN CONTINUUM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-md bg-[#0f1422] border border-[#222d42] space-y-1">
              <span className="text-emerald-400 font-bold block">01. RESEARCH</span>
              <p className="text-slate-300 font-sans text-xs">Formulate core questions &amp; mathematical bounds.</p>
            </div>
            <div className="p-3.5 rounded-md bg-[#0f1422] border border-[#222d42] space-y-1">
              <span className="text-cyan-400 font-bold block">02. EXPERIMENT</span>
              <p className="text-slate-300 font-sans text-xs">Execute controlled hardware &amp; autograd trials.</p>
            </div>
            <div className="p-3.5 rounded-md bg-[#0f1422] border border-[#222d42] space-y-1">
              <span className="text-blue-400 font-bold block">03. EVIDENCE</span>
              <p className="text-slate-300 font-sans text-xs">Log telemetry, null results, &amp; verified code.</p>
            </div>
            <div className="p-3.5 rounded-md bg-[#0f1422] border border-[#222d42] space-y-1">
              <span className="text-indigo-400 font-bold block">04. ARCHITECTURE</span>
              <p className="text-slate-300 font-sans text-xs">Synthesize zero-dependency systems &amp; runtimes.</p>
            </div>
            <div className="p-3.5 rounded-md bg-[#0f1422] border border-[#222d42] space-y-1">
              <span className="text-amber-400 font-bold block">05. PRODUCT</span>
              <p className="text-slate-300 font-sans text-xs">Deploy verified, sovereign client applications.</p>
            </div>
          </div>
        </div>

        {/* 4 Research Pillars Bento Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Machine Learning */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>MACHINE LEARNING</span>
                <span className="text-slate-500">4 Active Nodes</span>
              </div>
              <h3 className="text-base font-bold text-white">Inspectable Neural Models</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                TinyCoherent (Pure C Apple Silicon LLM), BNLM (WebGPU in-browser transformer), and Cortex-MS (hypothesis-competition mass spectrometry learning).
              </p>
            </div>
            <Link
              href="/research"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-medium pt-2 border-t border-[#182130]"
            >
              <span>Explore ML Research</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 2: Systems Research */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>SYSTEMS RESEARCH</span>
                <span className="text-slate-500">4 Architecture Nodes</span>
              </div>
              <h3 className="text-base font-bold text-white">Microkernels &amp; Runtimes</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Kernos inspectable microkernel, ACmK 5-plane cognitive debugger with deterministic replay, and AetherOS capability message buses.
              </p>
            </div>
            <Link
              href="/systems"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium pt-2 border-t border-[#182130]"
            >
              <span>Explore Systems Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 3: Virtual Lab / Instrumentation */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                <span>VIRTUAL LAB</span>
                <span className="text-slate-500">3 Evidence Substrates</span>
              </div>
              <h3 className="text-base font-bold text-white">Cryptographic Telemetry</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Immutable .vlab cryptographic evidence archives, Sensor Node multi-sensor acquisition, and tamper-evident observation registries.
              </p>
            </div>
            <Link
              href="/virtual-lab"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 font-medium pt-2 border-t border-[#182130]"
            >
              <span>Explore Virtual Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 4: Shipped Software */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>SHIPPED SOFTWARE</span>
                <span className="text-emerald-400 font-semibold">Active Product</span>
              </div>
              <h3 className="text-base font-bold text-white">Production Applications</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Active shipped product: <strong className="text-slate-100">agentrez.space</strong> (resumeBUILDER). Additional systems (Quantumology, ggSLOTS) paused to focus on core AI &amp; systems infrastructure.
              </p>
            </div>
            <a
              href="https://agentrez.space"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 font-medium pt-2 border-t border-[#182130]"
            >
              <span>Visit agentrez.space</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Master CTA to enter the deep 3D interactive research experience */}
        <div className="mt-12 p-8 rounded-lg bg-[#0c1018] border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Compass className="w-4 h-4" />
              <span>Full Spatial Research Graph &amp; Dossiers</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Enter the Interactive Research Environment
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-xl">
              Inspect interactive 3D neural topologies, view live telemetry from NVIDIA L4 probes, examine ANSI C source code, and read founder research logs.
            </p>
          </div>

          <Link
            href="/research"
            className="px-6 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shrink-0 transition-colors shadow-lg"
          >
            <span>Explore Research Engine</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
