'use client';

import React, { useState } from 'react';
import { LAB_IDENTITY, FOUNDATIONAL_QUESTIONS, RESEARCH_NODES } from '@/lib/research-data';
import { Terminal, Compass, Check, HelpCircle, Shield, AlertCircle, Layers } from 'lucide-react';

interface LabManifestoProps {
  onSelectNode?: (nodeId: string) => void;
}

export default function LabManifesto({ onSelectNode }: LabManifestoProps) {
  const [inquirySubject, setInquirySubject] = useState('Empirical Collaboration / Technical Inquiries');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div id="lab-manifesto" className="space-y-8 font-mono text-slate-300">
      {/* Hero / Identity Overview */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131924] border border-[#222b3b] text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATED BY CORY TORTORICI • FOUNDER & INDEPENDENT RESEARCHER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            GLOBAL INTENT COMPANY
          </h1>

          <p className="text-sm text-emerald-400/90 font-medium">
            Independent Research & Engineering Company
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Global Intent Company explores computational architectures and scientific systems designed around inspectability, evidence preservation, experimental validation, and reproducibility.
          </p>

          <div className="p-3.5 bg-[#0e1219] rounded-lg border border-[#1b222e] text-xs text-slate-300 leading-relaxed font-sans">
            <strong className="text-white block mb-1 font-mono">Independent Developer Nature:</strong>
            Global Intent Company is an independent, solo research and engineering effort. We do not manufacture inflated corporate narratives or hide behind marketing veneer. Every line of code, experimental measurement, architectural proposal, and negative result is documented transparently.
          </div>

          {/* Primary Domains Grid */}
          <div className="pt-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-2">
              Primary Research & Engineering Domains:
            </span>
            <div className="flex flex-wrap gap-2">
              {LAB_IDENTITY.primaryDomains.map(d => (
                <span key={d} className="px-2.5 py-1 rounded bg-[#10141d] border border-[#1d2432] text-xs text-slate-200">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* The Universal Epistemic Triad */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs uppercase tracking-wider text-slate-200 font-bold">
            The Epistemic Triad: Standards of Evidence
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          To prevent scientific hallucination and unwarranted extrapolation, Global Intent systems enforce a non-negotiable architectural boundary between three categories of information:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-[#0e121a] rounded-lg border border-[#1b222f] space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>● OBSERVED</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {LAB_IDENTITY.epistemicTriad.observed}
            </p>
          </div>

          <div className="p-4 bg-[#0e121a] rounded-lg border border-[#1b222f] space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rotate-45 bg-emerald-400" />
              <span>◆ MEASURED</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {LAB_IDENTITY.epistemicTriad.measured}
            </p>
          </div>

          <div className="p-4 bg-[#0e121a] rounded-lg border border-[#1b222f] space-y-2">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-purple-400" />
              <span>▲ INFERRED</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {LAB_IDENTITY.epistemicTriad.inferred}
            </p>
          </div>
        </div>
      </div>

      {/* The 6 Foundational Questions / Intellectual Pillars */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>The Six Intellectual Pillars & Foundational Questions</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOUNDATIONAL_QUESTIONS.map((pillar, idx) => (
            <div key={pillar.id} className="p-5 rounded-xl bg-[#0b0e14] border border-[#1d2330] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>PILLAR 0{idx + 1}</span>
                  <span className="text-emerald-400 uppercase font-bold">{pillar.title}</span>
                </div>
                <h3 className="text-sm font-bold text-white italic">&quot;{pillar.question}&quot;</h3>
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological Research Lineage (2021 — 2026) */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4">
          Research Lineage & Architecture Evolution
        </h2>

        <div className="space-y-3">
          {RESEARCH_NODES.map((node) => (
            <div
              key={node.id}
              onClick={() => onSelectNode?.(node.id)}
              className="p-4 rounded-lg bg-[#0e121a] hover:bg-[#121722] border border-[#1c222e] hover:border-emerald-500/50 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold text-xs w-28 shrink-0">{node.statusLabel}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm group-hover:text-emerald-300 transition-colors">
                      {node.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#171d28] text-slate-400 rounded">
                      {node.codename}
                    </span>
                    <span className="text-[10px] uppercase text-cyan-400">
                      {node.domainLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">{node.summary}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#151c27] text-slate-300 border border-[#232c3f]">
                  {node.classification}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Contact & Collaboration Terminal */}
      <div className="bg-[#0b0e14] border border-[#1d2330] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs uppercase tracking-wider text-white font-bold">
            Direct Research Inquiries
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-xl mb-4 font-sans">
          Direct inquiries are reviewed directly by Cory Tortorici. We welcome discussions on mass-spectrometry learning architectures, evidence provenance, and cognitive microkernels.
        </p>

        {submitted ? (
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/80 text-emerald-200 text-xs flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Transmission Dispatched to Cory Tortorici</div>
              <p className="text-[11px] opacity-90 mt-0.5">
                Your message has been queued for review. Inquiries with technical or empirical depth receive priority response.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Subject / Area of Interest</label>
              <input
                type="text"
                value={inquirySubject}
                onChange={e => setInquirySubject(e.target.value)}
                className="w-full bg-[#080b10] border border-[#1c2331] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Contact Email</label>
              <input
                type="email"
                placeholder="researcher@institution.org"
                value={inquiryEmail}
                onChange={e => setInquiryEmail(e.target.value)}
                className="w-full bg-[#080b10] border border-[#1c2331] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Technical Inquiry / Message</label>
              <textarea
                rows={3}
                placeholder="Describe your research question or architectural inquiry..."
                value={inquiryMessage}
                onChange={e => setInquiryMessage(e.target.value)}
                className="w-full bg-[#080b10] border border-[#1c2331] rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-2 transition-colors"
            >
              <span>Transmit Inquiry</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
