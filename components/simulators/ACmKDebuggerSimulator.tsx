'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Snowflake,
  Undo2,
  Terminal,
  Cpu,
  Layers,
  ShieldAlert,
  CheckCircle,
  Eye,
  Sliders,
} from 'lucide-react';

export default function ACmKDebuggerSimulator() {
  const [debuggerState, setDebuggerState] = useState<'running' | 'paused' | 'frozen' | 'stepped'>('paused');
  const [activeStep, setActiveStep] = useState<number>(3);
  const [selectedPlane, setSelectedPlane] = useState<'control' | 'state' | 'trace' | 'inference' | 'io'>('control');
  const [humanReviewTriggered, setHumanReviewTriggered] = useState<boolean>(true);

  // Stepping stages: 0: Observation, 1: Perception, 2: Inference, 3: Constraints, 4: Decision, 5: Review
  const pipelineSteps = [
    { title: 'OBSERVATION', subtitle: 'Sensor reading ingestion', plane: 'io', details: 'Camera frame #1042 & IMU delta acquired with hardware timestamps.' },
    { title: 'PERCEPTION', subtitle: 'Feature extraction', plane: 'state', details: 'Continuous vector embeddings generated from sensory streams.' },
    { title: 'INFERENCE', subtitle: 'Competing alternatives generated', plane: 'inference', details: 'Alternative A (0.72), Alternative B (0.19), Alternative C (0.09).' },
    { title: 'CONSTRAINTS', subtitle: 'Invariant checking', plane: 'state', details: 'Safety boundaries verified. Ambiguity delta (0.53) exceeds intervention threshold.' },
    { title: 'DECISION STATE', subtitle: 'Action candidate synthesis', plane: 'control', details: 'Proposed trajectory: Actuator repositioning along trajectory theta_2.' },
    { title: 'HUMAN REVIEW', subtitle: 'Supervisory breakpoint', plane: 'control', details: 'Execution suspended at breakpoint. Awaiting operator confirmation.' },
  ];

  const handleStep = () => {
    setDebuggerState('stepped');
    setActiveStep(prev => (prev + 1) % pipelineSteps.length);
  };

  const handleRollback = () => {
    setDebuggerState('stepped');
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  const handleTogglePlay = () => {
    if (debuggerState === 'running') {
      setDebuggerState('paused');
    } else {
      setDebuggerState('running');
    }
  };

  const handleFreeze = () => {
    setDebuggerState(prev => (prev === 'frozen' ? 'paused' : 'frozen'));
  };

  useEffect(() => {
    if (debuggerState !== 'running') return;
    const timer = setInterval(() => {
      setActiveStep(prev => {
        const next = (prev + 1) % pipelineSteps.length;
        if (next === 5) {
          // Trigger breakpoint at human review
          setDebuggerState('paused');
          setHumanReviewTriggered(true);
        }
        return next;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [debuggerState, pipelineSteps.length]);

  return (
    <div className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-xs">
      {/* Banner */}
      <div className="bg-[#0e121a] p-4 border-b border-[#181d27] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">OPTIC-TRIGEMINAL ACMK</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 uppercase font-semibold">
              Experimental Microkernel
            </span>
            <span className="text-[10px] text-slate-500">Cognitive Debugger & 5-Plane Inspector</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Can AI inference be structured so that cognitive state, reasoning traces, uncertainty, and human intervention remain inspectable?
          </p>
        </div>

        {/* Debugger Control Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#07090d] p-1.5 rounded-lg border border-[#1b212d]">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-2.5 py-1 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors ${
              debuggerState === 'running'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700'
                : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700 hover:bg-emerald-800/80'
            }`}
          >
            {debuggerState === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{debuggerState === 'running' ? 'PAUSE' : 'RUN'}</span>
          </button>

          <button
            type="button"
            onClick={handleStep}
            className="px-2 py-1 rounded bg-[#141a25] hover:bg-[#1c2433] text-slate-300 border border-[#212b3b] flex items-center gap-1 text-[11px]"
            title="Single-step forward"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>STEP</span>
          </button>

          <button
            type="button"
            onClick={handleRollback}
            className="px-2 py-1 rounded bg-[#141a25] hover:bg-[#1c2433] text-slate-300 border border-[#212b3b] flex items-center gap-1 text-[11px]"
            title="Rollback one step"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-400" />
            <span>ROLLBACK</span>
          </button>

          <button
            type="button"
            onClick={handleFreeze}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition-colors ${
              debuggerState === 'frozen'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                : 'bg-[#141a25] text-slate-400 border border-[#212b3b]'
            }`}
            title="Freeze cognitive memory"
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>FREEZE</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* The Five Architectural Planes (Vertical Stack) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>ACmK Five Planes Architecture — Vertically Isolated Substrates</span>
            <span className="text-slate-500">Click any plane to inspect</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {/* Plane 1: Control Plane */}
            <button
              type="button"
              onClick={() => setSelectedPlane('control')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlane === 'control'
                  ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-blue-400 uppercase font-bold">Plane 1</div>
              <div className="font-semibold text-white mt-0.5">CONTROL PLANE</div>
              <div className="text-[10px] text-slate-400 mt-1">pause • resume • replay • freeze • recompute</div>
              <div className="text-[9px] text-emerald-400 mt-2 font-mono">
                Status: {debuggerState.toUpperCase()}
              </div>
            </button>

            {/* Plane 2: State Plane */}
            <button
              type="button"
              onClick={() => setSelectedPlane('state')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlane === 'state'
                  ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-blue-400 uppercase font-bold">Plane 2</div>
              <div className="font-semibold text-white mt-0.5">STATE PLANE</div>
              <div className="text-[10px] text-slate-400 mt-1">cognitive state • confidence • risk • modalities</div>
              <div className="text-[9px] text-cyan-400 mt-2 font-mono">Risk: NOMINAL (0.21)</div>
            </button>

            {/* Plane 3: Trace Plane */}
            <button
              type="button"
              onClick={() => setSelectedPlane('trace')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlane === 'trace'
                  ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-blue-400 uppercase font-bold">Plane 3</div>
              <div className="font-semibold text-white mt-0.5">TRACE PLANE</div>
              <div className="text-[10px] text-slate-400 mt-1">snapshots • history • rollback ledger</div>
              <div className="text-[9px] text-purple-400 mt-2 font-mono">1,420 Snapshots</div>
            </button>

            {/* Plane 4: Inference Plane */}
            <button
              type="button"
              onClick={() => setSelectedPlane('inference')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlane === 'inference'
                  ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-blue-400 uppercase font-bold">Plane 4</div>
              <div className="font-semibold text-white mt-0.5">INFERENCE PLANE</div>
              <div className="text-[10px] text-slate-400 mt-1">model / inference proxy • competing options</div>
              <div className="text-[9px] text-emerald-400 mt-2 font-mono">3 Competing Trajectories</div>
            </button>

            {/* Plane 5: Environment / IO */}
            <button
              type="button"
              onClick={() => setSelectedPlane('io')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlane === 'io'
                  ? 'bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#0e121a] border-[#1a202c] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-blue-400 uppercase font-bold">Plane 5</div>
              <div className="font-semibold text-white mt-0.5">ENVIRONMENT / IO</div>
              <div className="text-[10px] text-slate-400 mt-1">evidence grounding • physical sensor signatures</div>
              <div className="text-[9px] text-amber-400 mt-2 font-mono">Camera + IMU Grounded</div>
            </button>
          </div>
        </div>

        {/* Live Step-Through Reasoning Pipeline */}
        <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a202c] pb-2">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cognitive Trace Trajectory (Step {activeStep + 1} of {pipelineSteps.length})</span>
            </span>
            <span className="text-[10px] text-slate-400">Step Inspection</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {pipelineSteps.map((step, idx) => {
              const isCurrent = idx === activeStep;
              const isPast = idx < activeStep;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => { setActiveStep(idx); setDebuggerState('paused'); }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'bg-blue-950/60 border-blue-400 shadow-md ring-1 ring-blue-400'
                      : isPast
                      ? 'bg-[#101520] border-[#1e2738] text-slate-300'
                      : 'bg-[#07090d] border-[#151a24] text-slate-500'
                  }`}
                >
                  <div className="text-[9px] uppercase font-bold text-slate-500">Step 0{idx + 1}</div>
                  <div className="font-semibold text-white mt-0.5 text-[11px]">{step.title}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{step.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep Inspector */}
          <div className="p-3.5 bg-[#07090d] rounded-lg border border-[#1a202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px]">
                {pipelineSteps[activeStep].title} — Subsystem Execution State
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#131924] text-blue-300 border border-[#1e273a]">
                Plane: {pipelineSteps[activeStep].plane.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {pipelineSteps[activeStep].details}
            </p>

            {/* If at Inference or Decision step, show competing alternatives */}
            {activeStep === 2 && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#181e2b]">
                <div className="p-2 rounded bg-[#0e121a] border border-emerald-800/60">
                  <div className="flex justify-between font-bold text-white text-[10px]">
                    <span>Alternative A</span>
                    <span className="text-emerald-400">Score 0.72</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Maintain current trajectory with steering compensation</div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1a202c]">
                  <div className="flex justify-between font-bold text-white text-[10px]">
                    <span>Alternative B</span>
                    <span className="text-slate-400">Score 0.19</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Emergency deceleration and inertial re-anchor</div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1a202c]">
                  <div className="flex justify-between font-bold text-white text-[10px]">
                    <span>Alternative C</span>
                    <span className="text-slate-400">Score 0.09</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Bypass sensor stream; query secondary GPS beacon</div>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-800/80 text-blue-200 text-[11px] space-y-1">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                  <span>Human Supervisor Gate Engaged</span>
                </div>
                <div className="text-[10px] text-blue-200/90 font-sans">
                  The control plane halted inference before actuator emission because Alternative A margin was within 0.15 of safety limits.
                  Human supervisor must explicitly approve or roll back.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
