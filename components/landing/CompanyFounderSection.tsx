'use client';

import React from 'react';
import { Code2, User, Building2, ExternalLink, ShieldCheck, Terminal, BookOpen } from 'lucide-react';

export default function CompanyFounderSection() {
  return (
    <section id="company" className="py-20 sm:py-28 bg-[#07090e] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>08. About the Company</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Structure &amp; Provenance</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Independent research, transparent systems engineering, and focused execution.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            Global Intent Company operates as an independent software research and systems engineering organization founded by Cory Tortorici. We believe the deepest breakthroughs in artificial intelligence occur when model architecture, execution runtimes, and verified infrastructure are designed in concert.
          </p>
        </div>

        {/* 2-Column Organization Structure Breakdown */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
          {/* Column 1: Organization Model */}
          <div className="p-6 sm:p-8 rounded-lg bg-[#0b0e16] border border-[#1b2333] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#182130]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Development Structure</span>
              </div>
              <span className="text-slate-500 text-[10px]">INDEPENDENT LAB</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              Global Intent Company is structured as an agile, founder-led independent laboratory. By maintaining independence from external venture incentives and short-term hype cycles, the company focuses exclusively on core technical depth: low-level C neural runtimes, verified transport protocols, and sovereign software products.
            </p>

            <div className="space-y-2 pt-3 border-t border-[#182130] text-slate-300 font-sans">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono text-xs mt-0.5">•</span>
                <span><strong className="text-slate-200">Software in Production:</strong> <a href="https://agentrez.space" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">agentrez.space (resumeBUILDER)</a> operates actively as a production client document tool.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-500 font-mono text-xs mt-0.5">•</span>
                <span><strong className="text-slate-200">Focused Research Pipeline:</strong> Additional software prototypes (Quantumology, ggSLOTS) remain paused to concentrate engineering bandwidth on the core private AI stack.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Founder & Technical Standards */}
          <div className="p-6 sm:p-8 rounded-lg bg-[#0b0e16] border border-[#1b2333] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#182130]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Founder &amp; Engineering Focus</span>
              </div>
              <span className="text-slate-500 text-[10px]">CORY TORTORICI</span>
            </div>

            <p className="text-slate-300 font-sans text-sm leading-relaxed">
              Cory Tortorici leads architecture, implementation, and research direction across the entire stack. Engineering work spans ANSI C Transformer engines with Apple Accelerate BLAS, WebGPU compute shaders, inspectable microkernel architectures (Kernos/ACmK), and cryptographic evidence containers (.vlab).
            </p>

            {/* Official GitHub Org Badge & Link */}
            <div className="p-4 rounded-md bg-[#07090e] border border-[#161e2b] flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-white font-bold block text-xs">Official GitHub Organization</span>
                <span className="text-slate-400 text-[11px] block">Public repositories: tinyCOHERENT, BNLM, &amp; more</span>
              </div>
              <a
                href="https://github.com/GI-Company"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-[#101520] hover:bg-[#182030] text-emerald-400 border border-[#212c3f] hover:border-emerald-500/80 transition-colors flex items-center gap-1.5 font-semibold shrink-0"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>GI-Company</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
