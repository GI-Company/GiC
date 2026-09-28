'use client';

import React, { useState } from 'react';
import { Network, CheckCircle2, AlertCircle, ShieldAlert, Cpu, Radio, Key, Play } from 'lucide-react';

interface VerificationStage {
  step: number;
  id: string;
  name: string;
  shortDesc: string;
  technicalValidation: string;
  failureModePrevented: string;
  color: string;
}

const VERIFICATION_STAGES: VerificationStage[] = [
  {
    step: 1,
    id: 'CONFIGURED',
    name: 'CONFIGURED',
    shortDesc: 'Local node endpoint credentials, TLS certificates, and transport parameters loaded into memory.',
    technicalValidation: 'Validates cryptographic client certificate, target URI structure, and local buffer allocation.',
    failureModePrevented: 'Prevents uninitialized transport crashes and invalid configuration execution.',
    color: 'text-slate-300',
  },
  {
    step: 2,
    id: 'DISCOVERED',
    name: 'DISCOVERED',
    shortDesc: 'Node identifies available PLMH instances via broadcast, mDNS, or configured static registry.',
    technicalValidation: 'Resolves network address and service discovery descriptors across the private subnet.',
    failureModePrevented: 'Eliminates hardcoded stale IP routing when hub instances migrate.',
    color: 'text-cyan-400',
  },
  {
    step: 3,
    id: 'REACHABLE',
    name: 'REACHABLE',
    shortDesc: 'Low-level transport ping and socket handshake established with target PLMH instance.',
    technicalValidation: 'Verifies TCP/mTLS socket establishment and round-trip transport latency limits.',
    failureModePrevented: 'Catches silent firewall packet drops and network partition boundaries.',
    color: 'text-blue-400',
  },
  {
    step: 4,
    id: 'PROTOCOL_OK',
    name: 'PROTOCOL_OK',
    shortDesc: 'Dialect and schema compatibility handshake completed between node and hub runtime.',
    technicalValidation: 'Negotiates wire protocol version, token serialization schemas, and capability flags.',
    failureModePrevented: 'Prevents subtle deserialization failures caused by mismatched protocol versions.',
    color: 'text-indigo-400',
  },
  {
    step: 5,
    id: 'AUTHENTICATED',
    name: 'AUTHENTICATED',
    shortDesc: 'Cryptographic challenge-response token verified against hub access control list.',
    technicalValidation: 'Validates nonces, signature validity, and access scope for requested model operations.',
    failureModePrevented: 'Rejects unauthorized requests before compute buffers or model weights are touched.',
    color: 'text-purple-400',
  },
  {
    step: 6,
    id: 'MODEL_READY',
    name: 'MODEL_READY',
    shortDesc: 'Hub confirms target model weights are loaded into VRAM/RAM with primed KV cache structures.',
    technicalValidation: 'Probes model parameter checkpoint status, context window capacity, and memory saturation.',
    failureModePrevented: 'Prevents sending token prompts to an uninitialized or cold model undergoing weight reload.',
    color: 'text-amber-400',
  },
  {
    step: 7,
    id: 'STREAM_READY',
    name: 'STREAM_READY',
    shortDesc: 'Unified transport streaming pipeline primed for low-latency bidirectional token delivery.',
    technicalValidation: 'Verifies streaming buffer queues, backpressure handling, and end-of-stream signal invariants.',
    failureModePrevented: 'Eliminates broken stream connections mid-generation caused by unprimed transport pipelines.',
    color: 'text-emerald-400',
  },
];

export default function PLMNSection() {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(6); // Default to STREAM_READY
  const currentStage = VERIFICATION_STAGES[activeStageIndex];

  return (
    <section id="plmn" className="py-20 sm:py-28 bg-[#090c13] border-b border-[#161d2b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <span>05. Ownership &amp; Interaction Layer</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">PLMN Node</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white text-balance leading-tight">
            Private Language Model Node: Verified Readiness Lifecycle
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
            Determining that an IP address responds is not the same as verifying that a private language model is ready to execute inference. PLMN implements a rigorous 7-stage verification lifecycle over a unified transport abstraction.
          </p>
        </div>

        {/* 7-Stage Visual Verification Lifecycle Stepper */}
        <div className="mt-12 p-6 sm:p-8 rounded-lg bg-[#0a0d15] border border-[#1b2333] font-mono text-xs shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#182130]">
            <span className="text-slate-200 font-bold text-[11px]">
              NODE VERIFICATION STATE MACHINE (7 PHASES)
            </span>
            <span className="text-emerald-400 text-[11px]">
              CURRENT INSPECTION: {currentStage.name}
            </span>
          </div>

          {/* Interactive Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {VERIFICATION_STAGES.map((stage, idx) => {
              const isActive = activeStageIndex === idx;
              const isPast = idx < activeStageIndex;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`p-3 rounded-md text-left transition-all border relative ${
                    isActive
                      ? 'bg-[#121927] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : isPast
                      ? 'bg-[#0e1420] border-[#222c3d] text-slate-300 hover:border-slate-500'
                      : 'bg-[#07090f] border-[#151b26] text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">0{stage.step}</span>
                    {idx <= activeStageIndex ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <div className={`font-bold text-[11px] truncate ${stage.color}`}>
                    {stage.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Stage Explanation Card */}
          <div className="p-5 rounded-md bg-[#0f1522] border border-[#232f44] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-[10px]">
                  PHASE 0{currentStage.step}
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide">{currentStage.name}</h4>
              </div>
              <span className="text-slate-400 text-[11px] font-sans">
                {currentStage.shortDesc}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#1a2333] font-sans text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Technical Invariant Checked
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {currentStage.technicalValidation}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Failure Mode Prevented
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {currentStage.failureModePrevented}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Readiness != Ping & Unified Transport Concept */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Card 1: Verified Readiness vs Ping */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Why Readiness Differs from an IP Ping</span>
            </div>
            <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
              Standard infrastructure checks often rely on simple TCP socket ACKs or HTTP 200 health pings. However, in neural inference systems, a listening port does not confirm that weights are loaded into VRAM, that tensor buffers are aligned, or that the tokenizer is calibrated. PLMN guarantees execution integrity before accepting inference requests.
            </p>
          </div>

          {/* Card 2: Unified Transport Abstraction */}
          <div className="p-6 rounded-lg bg-[#0b0e16] border border-[#1b2333] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Unified Transport Abstraction</span>
            </div>
            <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
              Health checks, capability discovery, and live inference token streaming share an identical transport layer. By avoiding split-path networking (e.g., HTTP health checks combined with disparate WebSocket streams), PLMN eliminates inconsistencies between diagnostic health and live token generation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
