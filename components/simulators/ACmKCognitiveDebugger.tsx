'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Undo2,
  Snowflake,
  Layers,
  Activity,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface StepState {
  stepIndex: number;
  stageName: string;
  observation: string;
  perception: string;
  alternatives: { id: string; name: string; score: number; risk: 'low' | 'med' | 'high' }[];
  selectedAlt: string;
  constraintsChecked: boolean;
  decision: string;
  humanReviewRequired: boolean;
}

const EXECUTION_STEPS: StepState[] = [
  {
    stepIndex: 1,
    stageName: 'Observation Ingestion',
    observation: 'Raw sensor frame: Spectrometer peak burst at 197.117 m/z + RF RSSI drop -14dBm',
    perception: 'Precursor ion detected with concomitant local spatial attenuation',
    alternatives: [
      { id: 'alt-a', name: 'Trigger High-Resolution MS/MS Scan', score: 0.72, risk: 'low' },
      { id: 'alt-b', name: 'Query Local Spectral Cache', score: 0.19, risk: 'low' },
      { id: 'alt-c', name: 'Discard Transient Spike as Noise', score: 0.09, risk: 'high' },
    ],
    selectedAlt: 'alt-a',
    constraintsChecked: true,
    decision: 'Arm collision cell for fragmentation sweep at 35 eV',
    humanReviewRequired: false,
  },
  {
    stepIndex: 2,
    stageName: 'Perception & Hypothesis Formulation',
    observation: 'MS/MS fragmentation produced 8 distinct ion fragments with base peak at 161.096',
    perception: 'Candidate matches Epinephrine derivative backbone or Isoquinoline isomer',
    alternatives: [
      { id: 'alt-a', name: 'Formulate Competing Hypotheses in Cortex Workspace', score: 0.81, risk: 'low' },
      { id: 'alt-b', name: 'One-Shot Nearest Neighbor Assignment', score: 0.14, risk: 'med' },
      { id: 'alt-c', name: 'Abort Acquisition', score: 0.05, risk: 'high' },
    ],
    selectedAlt: 'alt-a',
    constraintsChecked: true,
    decision: 'Spawn Hypothesis Slots A (C12H17NO) and B (C11H15NO2)',
    humanReviewRequired: false,
  },
  {
    stepIndex: 3,
    stageName: 'Inference & Constraint Evaluation',
    observation: 'Hard negative decoy isomer scores 1.259 similarity vs 0.750 true candidate',
    perception: 'Inverted contrastive margin detected: structural isomer ambiguity detected',
    alternatives: [
      { id: 'alt-a', name: 'Escalate to Operator Review Before Actuating Database Write', score: 0.88, risk: 'low' },
      { id: 'alt-b', name: 'Commit Higher-Scoring Hard Negative Automatically', score: 0.08, risk: 'high' },
      { id: 'alt-c', name: 'Silently Suppress Discrepancy', score: 0.04, risk: 'high' },
    ],
    selectedAlt: 'alt-a',
    constraintsChecked: true,
    decision: 'PAUSE COGNITIVE LOOP: Trigger Human Invariant Inspection Checkpoint',
    humanReviewRequired: true,
  },
];

export default function ACmKCognitiveDebugger() {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [activePlane, setActivePlane] = useState<'control' | 'state' | 'trace' | 'inference' | 'environment'>('inference');

  const currentStep = EXECUTION_STEPS[currentStepIdx];

  const handleStepForward = () => {
    if (isFrozen) return;
    if (currentStepIdx < EXECUTION_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handleRollback = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div id="acmk-debugger" className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-slate-300">
      {/* Header */}
      <div className="bg-[#0e121a] p-5 border-b border-[#181e2b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Experimental Cognitive System Architecture
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[10px] text-slate-400">Optic-Trigeminal ACmK Microkernel</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            ACmK: The Five-Plane Cognitive Debugger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step through cognitive execution cycles with real-time alternative candidate inspection and human intervention gating.
          </p>
        </div>

        {/* Debugger Control Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#080b10] p-1.5 rounded-lg border border-[#1a202c]">
          <button
            type="button"
            onClick={handleStepForward}
            disabled={isFrozen || currentStepIdx >= EXECUTION_STEPS.length - 1}
            className="px-2.5 py-1.5 rounded bg-[#131924] hover:bg-[#1a2333] border border-[#21293a] text-xs text-emerald-300 disabled:opacity-40 flex items-center gap-1 transition-all"
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            type="button"
            onClick={handleRollback}
            disabled={currentStepIdx === 0}
            className="px-2.5 py-1.5 rounded bg-[#131924] hover:bg-[#1a2333] border border-[#21293a] text-xs text-cyan-300 disabled:opacity-40 flex items-center gap-1 transition-all"
            title="Rollback Step"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Rollback</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFrozen(!isFrozen)}
            className={`px-2.5 py-1.5 rounded border text-xs flex items-center gap-1 transition-all ${
              isFrozen
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-[#131924] hover:bg-[#1a2333] border-[#21293a] text-slate-300'
            }`}
            title="Freeze Execution State"
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFrozen ? 'Frozen' : 'Freeze'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStepIdx(0);
              setIsFrozen(false);
            }}
            className="p-1.5 rounded bg-[#131924] hover:bg-[#1a2333] border border-[#21293a] text-xs text-slate-400 hover:text-white"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* The 5 Planes Vertical Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActivePlane('control')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePlane === 'control'
                ? 'bg-amber-950/80 border-amber-500 text-white font-semibold'
                : 'bg-[#0e121a] border-[#181d28] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500">Plane 1</div>
            <div className="font-bold text-xs mt-0.5">Control Plane</div>
            <div className="text-[10px] text-amber-400 mt-1">Pause / Replay / Freeze</div>
          </button>

          <button
            type="button"
            onClick={() => setActivePlane('state')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePlane === 'state'
                ? 'bg-amber-950/80 border-amber-500 text-white font-semibold'
                : 'bg-[#0e121a] border-[#181d28] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500">Plane 2</div>
            <div className="font-bold text-xs mt-0.5">State Plane</div>
            <div className="text-[10px] text-slate-400 mt-1">Confidence & Context</div>
          </button>

          <button
            type="button"
            onClick={() => setActivePlane('trace')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePlane === 'trace'
                ? 'bg-amber-950/80 border-amber-500 text-white font-semibold'
                : 'bg-[#0e121a] border-[#181d28] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500">Plane 3</div>
            <div className="font-bold text-xs mt-0.5">Trace Plane</div>
            <div className="text-[10px] text-slate-400 mt-1">Snapshot History</div>
          </button>

          <button
            type="button"
            onClick={() => setActivePlane('inference')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePlane === 'inference'
                ? 'bg-amber-950/80 border-amber-500 text-white font-semibold'
                : 'bg-[#0e121a] border-[#181d28] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500">Plane 4</div>
            <div className="font-bold text-xs mt-0.5">Inference Plane</div>
            <div className="text-[10px] text-emerald-400 mt-1">Competing Candidates</div>
          </button>

          <button
            type="button"
            onClick={() => setActivePlane('environment')}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePlane === 'environment'
                ? 'bg-amber-950/80 border-amber-500 text-white font-semibold'
                : 'bg-[#0e121a] border-[#181d28] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500">Plane 5</div>
            <div className="font-bold text-xs mt-0.5">Environment / IO</div>
            <div className="text-[10px] text-cyan-400 mt-1">Sensory Evidence</div>
          </button>
        </div>

        {/* Current Execution State Inspector */}
        <div className="bg-[#0e121a] p-5 rounded-xl border border-[#1b222f] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">CYCLE {currentStep.stepIndex} OF 3:</span>
              <span className="text-white font-bold">{currentStep.stageName}</span>
            </div>
            {currentStep.humanReviewRequired && (
              <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 text-[10px] font-bold animate-pulse">
                HUMAN REVIEW GATE TRIPPED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Observation & Perception */}
            <div className="space-y-3">
              <div className="p-3 bg-[#0a0d13] rounded-lg border border-[#181d28] space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">5. Environment Observation</span>
                <p className="text-slate-300">{currentStep.observation}</p>
              </div>

              <div className="p-3 bg-[#0a0d13] rounded-lg border border-[#181d28] space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">2. State Representation</span>
                <p className="text-slate-300">{currentStep.perception}</p>
              </div>
            </div>

            {/* Inference Plane: Competing Alternatives */}
            <div className="p-3.5 bg-[#0a0d13] rounded-lg border border-[#181d28] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">
                  4. Inference Candidates Evaluated
                </span>
                <span className="text-[10px] text-slate-500">Uncertainty Scoring</span>
              </div>

              <div className="space-y-2">
                {currentStep.alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-2 rounded border flex items-center justify-between ${
                      alt.id === currentStep.selectedAlt
                        ? 'bg-emerald-950/40 border-emerald-600/80 text-white'
                        : 'bg-[#080a0f] border-[#151922] text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[11px]">{alt.name}</div>
                      <div className="text-[9px] text-slate-500">
                        Risk Profile: <span className="uppercase text-slate-400">{alt.risk}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-emerald-300">{(alt.score * 100).toFixed(0)}%</div>
                      <div className="text-[9px] text-slate-500">Confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision & Action Gate */}
          <div className="p-3.5 rounded-lg bg-[#121722] border border-[#1d273a] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Microkernel Decision:</span>
              <strong className="text-white font-mono">{currentStep.decision}</strong>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500">Constraints Invariant:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
