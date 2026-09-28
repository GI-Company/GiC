'use client';

import React from 'react';
import { Server, Cpu, Lock, Network, ShieldCheck, Database, Terminal, ArrowRight } from 'lucide-react';

export default function PLMHSection() {
  return (
    <section id="plmh" className="py-20 sm:py-28 bg-[#07090e] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>04. Execution Layer</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">PLMH Infrastructure</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Private Language Model Hub: Sovereign Runtime Execution
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            PLMH is the infrastructure substrate for hosting and executing privately controlled language models. It transforms raw model checkpoints into deterministic, network-accessible inference endpoints without exposing data or telemetry to external clouds.
          </p>
        </div>

        {/* Conceptual Pipeline Flow Diagram */}
        <div className="mt-12 p-6 sm:p-8 rounded-lg bg-[#0a0d15] border border-[#1c2436] font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#182130] text-[11px] text-slate-400">
            <span className="font-bold text-slate-200">PLMH EXECUTION PIPELINE ARCHITECTURE</span>
            <span className="text-cyan-400">DETERMINISTIC DATA PATHWAY</span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Stage 1 */}
            <div className="p-4 rounded-md bg-[#0f1422] border border-[#222d42] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">1. MODELS</span>
                <span className="text-[10px] text-slate-400">ARTIFACTS</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                Raw SAFETENSORS / C memory-mapped weights &amp; BPE vocabulary matrices.
              </p>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-[#182235]">
                Positional encodings · KV allocations
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-md bg-[#0f1422] border border-[#222d42] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">2. RUNTIME</span>
                <span className="text-[10px] text-slate-400">SUPERVISOR</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                ANSI C execution supervisor, Apple Accelerate BLAS routines, &amp; buffer scheduling.
              </p>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-[#182235]">
                Zero malloc in inner loop · REPL taps
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-md bg-[#0f1422] border border-[#222d42] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold">3. PROTOCOL</span>
                <span className="text-[10px] text-slate-400">TRANSLATION</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                Standardized model/API interface handling token generation, probes, &amp; streaming buffers.
              </p>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-[#182235]">
                Unified transport · Dialect check
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-md bg-[#0f1422] border border-[#222d42] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold">4. PRIVATE ACCESS</span>
                <span className="text-[10px] text-slate-400">PERIMETER</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                Mutual TLS, cryptographic challenge tokens, &amp; zero external telemetry egress.
              </p>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-[#182235]">
                Local perimeter · Sovereign audit
              </div>
            </div>
          </div>
        </div>

        {/* Technical Sub-systems Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded-lg bg-[#0a0d15] border border-[#1b2333] space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Deterministic Memory Layout</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Weights and activation caches reside in contiguous, pre-allocated memory buffers. This avoids dynamic memory fragmentation during intensive training passes and inference loops.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#0a0d15] border border-[#1b2333] space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>Model / API Dialect Bridge</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Exposes low-overhead token stream protocols alongside introspection endpoints for reading attention distributions, perplexity diagnostics, and probe telemetry.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#0a0d15] border border-[#1b2333] space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Telemetry Isolation</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              By design, PLMH has no external telemetry reporters, analytics beacons, or remote logging. The entire runtime is contained within the organization’s network perimeter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
