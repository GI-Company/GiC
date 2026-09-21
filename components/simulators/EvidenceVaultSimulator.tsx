'use client';

import React, { useState } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  Layers,
  FileText,
  AlertTriangle,
  Sparkles,
  Bookmark,
  Check,
  TrendingDown,
} from 'lucide-react';

export default function EvidenceVaultSimulator() {
  const [selectedTarget, setSelectedTarget] = useState<'ADRA1A' | 'ADRA1B' | 'ADRA1D' | 'RHO'>('ADRA1A');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('rec-01');
  const [activeTab, setActiveTab] = useState<'vault' | 'provenance' | 'physio-null'>('vault');

  // Sample Demonstration Records illustrating the property-graph schema architecture
  const records = [
    {
      id: 'rec-01',
      compound: 'Prazosin',
      smiles: 'COc1cc2nc(nc(N)c2cc1OC)N3CCN(CC3)C(=O)c4ccco4',
      target: 'ADRA1A',
      endpoint: 'Ki',
      value: 0.17,
      unit: 'nM',
      operator: '=',
      assay: 'Radioligand competition binding against [3H]-prazosin in cloned human alpha-1a cells',
      database: 'ChEMBL (CHEMBL2)',
      publication: 'Eur J Pharmacol (Reference Sample)',
      doi: 'DEMO-REF-CHEMBL2',
      retrieved: '2024-11-14T18:22:00Z',
      recordStatus: 'DEMONSTRATION DATA' as const,
    },
    {
      id: 'rec-02',
      compound: 'Tamsulosin',
      smiles: 'CCOc1ccccc1OCCNC[C@H](C)c2ccc(cc2)S(=O)(=O)N',
      target: 'ADRA1A',
      endpoint: 'IC50',
      value: 0.08,
      unit: 'nM',
      operator: '<',
      assay: 'High-affinity displacement assay in rat vascular smooth muscle membrane preparations',
      database: 'BindingDB (BDBM50000042)',
      publication: 'J Med Chem (Reference Sample)',
      doi: 'DEMO-REF-BDBM50000042',
      retrieved: '2024-11-14T19:04:12Z',
      recordStatus: 'DEMONSTRATION DATA' as const,
    },
    {
      id: 'rec-03',
      compound: 'Phenoxybenzamine',
      smiles: 'CCOC(C)COc1ccccc1N(CCCl)Cc2ccccc2',
      target: 'ADRA1B',
      endpoint: 'Kd',
      value: 1.2,
      unit: 'nM',
      operator: '=',
      assay: 'Irreversible alkylation binding assay in vascular endothelium',
      database: 'IUPHAR / BPS Guide to Pharmacology (Sample)',
      publication: 'Mol Pharmacol (Reference Sample)',
      doi: 'DEMO-REF-ADRA1B-SAMPLE',
      retrieved: '2024-11-15T10:12:00Z',
      recordStatus: 'DEMONSTRATION DATA' as const,
    },
    {
      id: 'rec-04',
      compound: '11-cis-Retinal',
      smiles: 'CC1=C(C(CCC1)(C)C)/C=C/C(=C/C=C/C(=C/C=O)/C)/C',
      target: 'RHO',
      endpoint: 'Kd',
      value: 4.7,
      unit: 'nM',
      operator: '=',
      assay: 'Spectrophotometric regeneration of visual pigment in bovine rod outer segments',
      database: 'Protein Data Bank (PDB 1U19) / UniProt P08100',
      publication: 'Nature / PDB Reference Structure',
      doi: 'DEMO-REF-PDB-1U19',
      retrieved: '2024-11-16T14:45:00Z',
      recordStatus: 'DEMONSTRATION DATA' as const,
    },
  ];

  const activeRecord = records.find(r => r.id === selectedRecordId) || records[0];

  return (
    <div className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-xs">
      {/* Prominent Mandatory Epistemic Demonstration Notice */}
      <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold tracking-wide uppercase text-[11px]">
            INTERACTIVE DEMONSTRATION — SAMPLE DATA
          </span>
          <span className="hidden sm:inline text-amber-400/80 text-[10px]">
            • Illustrates Evidence Vault graph schema architecture. Sample records are synthetic demonstrations of typed linking.
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-amber-200 font-semibold uppercase">
          DEMONSTRATION
        </span>
      </div>

      {/* Banner */}
      <div className="bg-[#0e121a] p-4 border-b border-[#181d27] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">MOLECULAR EVIDENCE VAULT</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 uppercase font-semibold">
              Schema Architecture Prototype
            </span>
            <span className="text-[10px] text-slate-500">Context-Preserving Pharmacological Graph</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Demonstration Instance • 4 Sample Targets (ADRA1A, ADRA1B, ADRA1D, RHO) • Granular Assay Provenance Schema
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-[#07090d] p-0.5 rounded-lg border border-[#181d27]">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'vault' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'provenance' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Provenance Record
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('physio-null')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'physio-null' ? 'bg-[#18202d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Physiological Null Result
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* TAB 1: EVIDENCE GRAPH & SCHEMA */}
        {activeTab === 'vault' && (
          <div className="space-y-5">
            {/* Target Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Protein Target:</span>
              {(['ADRA1A', 'ADRA1B', 'ADRA1D', 'RHO'] as const).map(target => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setSelectedTarget(target)}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    selectedTarget === target
                      ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold'
                      : 'bg-[#0e121a] border-[#1b212d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>

            {/* Visual Schema Graph Diagram */}
            <div className="p-4 rounded-xl bg-[#07090d] border border-[#1b212d] space-y-3">
              <div className="text-[11px] text-slate-400 flex items-center justify-between border-b border-[#161c28] pb-2">
                <span className="font-bold text-white">Relational Evidence Schema</span>
                <span className="text-emerald-400">Click elements below to inspect provenance</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 py-3 text-center">
                <div className="p-2.5 rounded-lg bg-[#0e121a] border border-emerald-800/60 min-w-[120px]">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Entity 1</div>
                  <div className="font-bold text-white text-xs mt-0.5">COMPOUND</div>
                  <div className="text-[9px] text-emerald-400 mt-1">{activeRecord.compound}</div>
                </div>

                <div className="text-slate-600 font-bold">────►</div>

                <div className="p-2.5 rounded-lg bg-[#0e121a] border border-cyan-800/60 min-w-[140px]">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Granular Evidence</div>
                  <div className="font-bold text-white text-xs mt-0.5">MEASUREMENT</div>
                  <div className="text-[9px] text-cyan-400 mt-1">
                    {activeRecord.endpoint} {activeRecord.operator} {activeRecord.value} {activeRecord.unit}
                  </div>
                </div>

                <div className="text-slate-600 font-bold">────►</div>

                <div className="p-2.5 rounded-lg bg-[#0e121a] border border-purple-800/60 min-w-[120px]">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Generated By</div>
                  <div className="font-bold text-white text-xs mt-0.5">ASSAY</div>
                  <div className="text-[9px] text-purple-400 mt-1">Binding Protocol</div>
                </div>

                <div className="text-slate-600 font-bold">────►</div>

                <div className="p-2.5 rounded-lg bg-[#0e121a] border border-amber-800/60 min-w-[120px]">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Biological Target</div>
                  <div className="font-bold text-white text-xs mt-0.5">PROTEIN</div>
                  <div className="text-[9px] text-amber-400 mt-1">{activeRecord.target}</div>
                </div>

                <div className="text-slate-600 font-bold">────►</div>

                <div className="p-2.5 rounded-lg bg-[#0e121a] border border-blue-800/60 min-w-[120px]">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Reported In</div>
                  <div className="font-bold text-white text-xs mt-0.5">PAPER</div>
                  <div className="text-[9px] text-blue-400 mt-1">Primary Literature</div>
                </div>
              </div>

              {/* Core Principle Quote */}
              <div className="p-3 bg-[#0e121a] rounded-lg border border-[#1b212d] text-[11px] text-emerald-300/90 italic text-center">
                &ldquo;Scientific evidence loses meaning when provenance and experimental context are discarded.&rdquo;
              </div>
            </div>

            {/* Sample Table of Evidence Records */}
            <div className="bg-[#0e121a] rounded-xl border border-[#1b212d] overflow-hidden">
              <div className="p-3 bg-[#111622] border-b border-[#1b212d] flex items-center justify-between">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                  Curated Binding Records ({selectedTarget})
                </span>
                <span className="text-[10px] text-slate-400">7 Databases Cross-Referenced</span>
              </div>

              <div className="divide-y divide-[#151a25]">
                {records.map(rec => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setSelectedRecordId(rec.id)}
                    className={`w-full p-3 text-left transition-colors flex flex-wrap items-center justify-between gap-3 ${
                      selectedRecordId === rec.id ? 'bg-emerald-950/30' : 'hover:bg-[#121722]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rec.compound}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#171e2c] text-slate-300">
                          {rec.target}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {rec.endpoint} {rec.operator} {rec.value} {rec.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xl">
                        {rec.assay}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>{rec.database}</div>
                      <div>{rec.publication.substring(0, 28)}...</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROVENANCE RECORD INSPECTOR */}
        {activeTab === 'provenance' && (
          <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b212d] pb-2">
              <span className="font-bold text-white text-sm">
                Granular Evidence Record: {activeRecord.compound} ➔ {activeRecord.target}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Record ID: {activeRecord.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
              <div className="bg-[#07090d] p-2.5 rounded border border-[#161c27]">
                <span className="text-slate-500 block text-[10px]">Measurement Value & Endpoint:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {activeRecord.endpoint} {activeRecord.operator} {activeRecord.value} {activeRecord.unit}
                </span>
              </div>
              <div className="bg-[#07090d] p-2.5 rounded border border-[#161c27]">
                <span className="text-slate-500 block text-[10px]">Biological Target:</span>
                <span className="font-bold text-white text-sm">{activeRecord.target}</span>
              </div>
              <div className="bg-[#07090d] p-2.5 rounded border border-[#161c27]">
                <span className="text-slate-500 block text-[10px]">Database Source:</span>
                <span className="font-bold text-cyan-400 text-sm">{activeRecord.database}</span>
              </div>
            </div>

            <div className="bg-[#07090d] p-3 rounded border border-[#161c27] space-y-1">
              <span className="text-slate-500 block text-[10px]">Experimental Assay Protocol:</span>
              <p className="text-slate-300 leading-relaxed">{activeRecord.assay}</p>
            </div>

            <div className="bg-[#07090d] p-3 rounded border border-[#161c27] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block text-[10px]">Sample Provenance Linkage (Demonstration):</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-semibold">
                  {activeRecord.recordStatus}
                </span>
              </div>
              <p className="text-white font-semibold">{activeRecord.publication}</p>
              <div className="text-slate-400 text-[10px]">
                Graph Schema Ref: {activeRecord.doi} • Timestamp: {activeRecord.retrieved}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHYSIOLOGICAL MODELING NULL RESULT */}
        {activeTab === 'physio-null' && (
          <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b212d] pb-2">
              <span className="font-bold text-white text-sm">
                Physiological Modeling Research — Preserved Null & Mixed Results
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                Experimental Integrity
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#07090d] p-3 rounded-lg border border-[#161c27]">
                <span className="text-[10px] text-slate-500 block">MAP Improvement:</span>
                <span className="text-base font-bold text-white">+0.0078 mmHg</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Absolute magnitude</span>
              </div>
              <div className="bg-[#07090d] p-3 rounded-lg border border-[#161c27]">
                <span className="text-[10px] text-slate-500 block">95% Confidence Interval:</span>
                <span className="text-base font-bold text-white">[-0.1145, 0.1698]</span>
                <span className="text-[9px] text-amber-400 block mt-0.5">Crosses zero</span>
              </div>
              <div className="bg-[#07090d] p-3 rounded-lg border border-[#161c27]">
                <span className="text-[10px] text-slate-500 block">Between-Patient Permutation:</span>
                <span className="text-base font-bold text-slate-300">p = 0.0798</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Not significant</span>
              </div>
              <div className="bg-[#07090d] p-3 rounded-lg border border-amber-900/60">
                <span className="text-[10px] text-amber-400 block">Within-Patient Restricted:</span>
                <span className="text-base font-bold text-amber-300">p = 0.0479</span>
                <span className="text-[9px] text-amber-400 block mt-0.5">Subtle math signal</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/80 text-amber-200 space-y-2">
              <div className="font-bold text-amber-300 text-sm">
                Research Principle: Statistical Evidence != Practical Utility
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                Don&rsquo;t turn p = 0.0479 into a promotional claim. While a subtle within-patient mathematical signal was detectable, practical
                held-out predictive improvement remained negligible (+0.0078 mmHg). Rather than cherry-picking, Global Intent Company preserves
                this result transparently.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
