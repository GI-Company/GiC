'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export default function PhysiologicalModelSimulator() {
  const [activePermutation, setActivePermutation] = useState<'between' | 'within'>('within');

  return (
    <div id="physio-model-simulator" className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-slate-300">
      {/* Header */}
      <div className="bg-[#0e121a] p-5 border-b border-[#181e2b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Null & Mixed Results Preserved
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[10px] text-slate-400">Continuous Hemodynamics Modeling</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Physiological Modeling Research: Permutation Case Study
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent retrospective analysis illustrating why statistical significance does not imply practical predictive utility.
          </p>
        </div>

        {/* Permutation Toggle */}
        <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-lg border border-[#181e28] text-xs">
          <button
            type="button"
            onClick={() => setActivePermutation('within')}
            className={`px-3 py-1.5 rounded transition-all ${
              activePermutation === 'within'
                ? 'bg-amber-950 border border-amber-600 text-amber-200 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Within-Patient (p = 0.0479)
          </button>
          <button
            type="button"
            onClick={() => setActivePermutation('between')}
            className={`px-3 py-1.5 rounded transition-all ${
              activePermutation === 'between'
                ? 'bg-amber-950 border border-amber-600 text-amber-200 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Between-Patient (p = 0.0798)
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Statistical Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[#0e121a] rounded-lg border border-[#1c2331]">
            <span className="text-[10px] text-slate-500 block uppercase">MAP Improvement</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">+0.0078 mmHg</span>
            <span className="text-[10px] text-amber-400 mt-0.5">Clinically Negligible</span>
          </div>

          <div className="p-3.5 bg-[#0e121a] rounded-lg border border-[#1c2331]">
            <span className="text-[10px] text-slate-500 block uppercase">95% Confidence Interval</span>
            <span className="text-lg font-bold text-slate-200 font-mono mt-1 block">[-0.1145, 0.1698]</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Spans zero & negative</span>
          </div>

          <div className="p-3.5 bg-[#0e121a] rounded-lg border border-[#1c2331]">
            <span className="text-[10px] text-slate-500 block uppercase">Permutation p-value</span>
            <span className={`text-xl font-bold font-mono mt-1 block ${activePermutation === 'within' ? 'text-emerald-400' : 'text-slate-400'}`}>
              {activePermutation === 'within' ? 'p = 0.0479 *' : 'p = 0.0798'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {activePermutation === 'within' ? 'Nominally significant' : 'Non-significant'}
            </span>
          </div>

          <div className="p-3.5 bg-[#0e121a] rounded-lg border border-[#1c2331]">
            <span className="text-[10px] text-slate-500 block uppercase">Held-Out Prediction Gain</span>
            <span className="text-xl font-bold text-red-400 font-mono mt-1 block">Zero Practical</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Fails clinical threshold</span>
          </div>
        </div>

        {/* Detailed Retrospective Narrative */}
        <div className="p-5 bg-[#0e121a] rounded-xl border border-[#1b222f] space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Scale className="w-4 h-4" />
            <span>The Epistemological Distinction: Statistical Significance vs Practical Utility</span>
          </div>
          <p className="text-slate-300">
            When evaluating continuous hemodynamic modeling on Mean Arterial Pressure (MAP), using a within-patient restricted permutation test yielded nominal statistical significance (<code className="text-emerald-400">p = 0.0479</code>).
          </p>
          <p className="text-slate-300">
            However, the estimated predictive gain was merely <strong className="text-white">+0.0078 mmHg</strong>—an effect size far below sensor noise floors and completely devoid of clinical utility. Furthermore, between-patient permutation remained non-significant (<code className="text-slate-400">p = 0.0798</code>), and the 95% bootstrap confidence interval spanned from negative to positive.
          </p>
          <div className="p-3 bg-[#0a0d13] rounded-lg border border-amber-900/60 text-amber-200/90">
            <strong className="text-amber-300 block mb-1">Global Intent Research Standard:</strong>
            &quot;Statistical evidence and practical predictive utility are different questions.&quot; Rather than burying this null finding or torturing hypotheses to claim success, Global Intent Company preserves this dataset as an institutional benchmark for empirical rigor.
          </div>
        </div>
      </div>
    </div>
  );
}
