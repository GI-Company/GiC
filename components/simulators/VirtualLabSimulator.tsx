'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Play, Pause, RotateCcw, AlertTriangle, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

interface AgentState {
  id: string;
  cycle: number;
  intentGoal: string;
  invariantsPassed: number;
  syntheticLatency: number;
  driftConfidence: number;
  stateStatus: 'CONVERGED' | 'RESOLVING' | 'CONSTRAINT_TRIP';
}

export default function VirtualLabSimulator() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [tick, setTick] = useState(1420);
  const [injectedFault, setInjectedFault] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentState[]>([
    { id: 'AGENT_ORBIT_ALPHA', cycle: 1420, intentGoal: 'Trajectory bounds [r < 4.2m]', invariantsPassed: 42, syntheticLatency: 0.8, driftConfidence: 99.8, stateStatus: 'CONVERGED' },
    { id: 'AGENT_KERNEL_SCHED', cycle: 1420, intentGoal: 'Zero-copy UVM page lock', invariantsPassed: 88, syntheticLatency: 1.1, driftConfidence: 99.9, stateStatus: 'CONVERGED' },
    { id: 'AGENT_CONSENSUS_BETA', cycle: 1420, intentGoal: 'CFRV Vector Coherency', invariantsPassed: 31, syntheticLatency: 1.9, driftConfidence: 98.4, stateStatus: 'RESOLVING' },
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTick(t => t + 1);
      setAgents(prev => prev.map(a => {
        const nextCycle = a.cycle + 1;
        const jitter = (Math.random() * 0.4 - 0.2);
        const newLatency = parseFloat(Math.max(0.4, a.syntheticLatency + jitter).toFixed(2));
        const newConfidence = injectedFault ? parseFloat((a.driftConfidence - 0.4).toFixed(1)) : parseFloat((Math.min(99.9, a.driftConfidence + 0.05)).toFixed(1));
        
        return {
          ...a,
          cycle: nextCycle,
          syntheticLatency: newLatency,
          driftConfidence: Math.max(92, newConfidence),
          invariantsPassed: a.invariantsPassed + 1,
          stateStatus: injectedFault ? 'CONSTRAINT_TRIP' : a.stateStatus === 'RESOLVING' && Math.random() > 0.4 ? 'CONVERGED' : a.stateStatus
        };
      }));
    }, 600);

    return () => clearInterval(timer);
  }, [isPlaying, injectedFault]);

  const toggleInjectFault = (faultName: string) => {
    if (injectedFault === faultName) {
      setInjectedFault(null);
    } else {
      setInjectedFault(faultName);
    }
  };

  const resetSimulation = () => {
    setInjectedFault(null);
    setTick(1420);
    setAgents([
      { id: 'AGENT_ORBIT_ALPHA', cycle: 1420, intentGoal: 'Trajectory bounds [r < 4.2m]', invariantsPassed: 42, syntheticLatency: 0.8, driftConfidence: 99.8, stateStatus: 'CONVERGED' },
      { id: 'AGENT_KERNEL_SCHED', cycle: 1420, intentGoal: 'Zero-copy UVM page lock', invariantsPassed: 88, syntheticLatency: 1.1, driftConfidence: 99.9, stateStatus: 'CONVERGED' },
      { id: 'AGENT_CONSENSUS_BETA', cycle: 1420, intentGoal: 'CFRV Vector Coherency', invariantsPassed: 31, syntheticLatency: 1.9, driftConfidence: 98.4, stateStatus: 'RESOLVING' },
    ]);
  };

  return (
    <div id="virtual-lab-sim" className="bg-[#0b0d11] border border-[#1e232d] p-5 rounded-lg text-slate-300 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b1f28] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="text-white font-semibold tracking-wider text-sm">VIRTUAL LAB :: AUTONOMOUS SENSORIUM RUNTIME</span>
          <span className="px-2 py-0.5 text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded">850x ACCELERATED</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 rounded bg-[#181d28] hover:bg-[#222938] text-white border border-[#252e3e] flex items-center gap-1.5 text-[11px]"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            {isPlaying ? 'Pause Ticks' : 'Run Clock'}
          </button>
          <button
            type="button"
            onClick={resetSimulation}
            className="px-2 py-1 rounded bg-[#181d28] hover:bg-[#222938] text-slate-400 hover:text-white border border-[#252e3e] flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Synthetic Fault Injection Controls */}
      <div className="mb-4 bg-[#0e121a] p-3 rounded border border-[#1c222f]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Dynamic Chaos & Adversarial Fault Injection
          </span>
          {injectedFault && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3" /> ACTIVE FAULT: {injectedFault}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => toggleInjectFault('DROP_50%_PACKETS')}
            className={`p-2 rounded text-left border transition-all text-[11px] ${
              injectedFault === 'DROP_50%_PACKETS'
                ? 'bg-amber-950/70 border-amber-500 text-white font-bold'
                : 'bg-[#121620] border-[#222938] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>PCIe Bus Congestion</span>
              <span className="text-[9px] text-slate-400">50% Drop</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tests zero-copy ring recovery</p>
          </button>

          <button
            type="button"
            onClick={() => toggleInjectFault('ADVERSARIAL_SEMANTIC_DRIFT')}
            className={`p-2 rounded text-left border transition-all text-[11px] ${
              injectedFault === 'ADVERSARIAL_SEMANTIC_DRIFT'
                ? 'bg-amber-950/70 border-amber-500 text-white font-bold'
                : 'bg-[#121620] border-[#222938] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Semantic Latent Noise</span>
              <span className="text-[9px] text-slate-400">+0.8σ</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tests Cortex-MS vector pruning</p>
          </button>

          <button
            type="button"
            onClick={() => toggleInjectFault('CLOCK_SKEW_INTERRUPT')}
            className={`p-2 rounded text-left border transition-all text-[11px] ${
              injectedFault === 'CLOCK_SKEW_INTERRUPT'
                ? 'bg-amber-950/70 border-amber-500 text-white font-bold'
                : 'bg-[#121620] border-[#222938] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Microkernel Jitter</span>
              <span className="text-[9px] text-slate-400">10ms Drift</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tests bounded deterministic timer</p>
          </button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="space-y-2">
        {agents.map(agent => (
          <div key={agent.id} className="p-3 rounded bg-[#0e121a] border border-[#1c222f] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xs">{agent.id}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#181e2b] text-slate-400 rounded">
                  Tick #{agent.cycle}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  agent.stateStatus === 'CONVERGED'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : agent.stateStatus === 'RESOLVING'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                }`}>
                  {agent.stateStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Goal: {agent.intentGoal}</p>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Invariants</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {agent.invariantsPassed} checked
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Latency</span>
                <span className="text-cyan-400 font-semibold">{agent.syntheticLatency} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Confidence</span>
                <span className="text-emerald-400 font-semibold">{agent.driftConfidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 text-[10px] text-slate-500 border-t border-[#1b202b] flex items-center justify-between">
        <span>Deterministic replay invariant: Bit-identical reconstruction valid</span>
        <span>Clock speedup: 850x accelerated</span>
      </div>
    </div>
  );
}
