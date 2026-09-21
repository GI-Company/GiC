'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, Zap, ArrowRight, Gauge, ShieldCheck } from 'lucide-react';

interface SynapticPacket {
  id: number;
  source: string;
  target: string;
  payloadType: string;
  latencyNs: number;
  timestamp: string;
}

const PACKET_TYPES = [
  'CAP_GRANT_PAGETABLE',
  'VECTOR_BURST_1536D',
  'SYNAPSE_THRESHOLD_TRIP',
  'TOPOLOGY_JIT_CUT',
  'AGENT_SENSOR_TICK',
  'ZERO_COPY_RING_COMMIT',
];

export default function AxonBusSimulator() {
  const [isRunning, setIsRunning] = useState(true);
  const [ringSlots, setRingSlots] = useState<number[]>([1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0]);
  const [headIndex, setHeadIndex] = useState(3);
  const [tailIndex, setTailIndex] = useState(0);
  const [packetsDispatched, setPacketsDispatched] = useState(142080);
  const [currentLatency, setCurrentLatency] = useState(18);
  const [packetHistory, setPacketHistory] = useState<SynapticPacket[]>([
    { id: 10482, source: 'KERNEL_CAP', target: 'ACMK_DAG', payloadType: 'CAP_GRANT_PAGETABLE', latencyNs: 18, timestamp: '10:42:01.002' },
    { id: 10483, source: 'ACMK_DAG', target: 'CORTEX_HNSW', payloadType: 'VECTOR_BURST_1536D', latencyNs: 19, timestamp: '10:42:01.004' },
    { id: 10484, source: 'CORTEX_HNSW', target: 'INTENT_SMT', payloadType: 'SEMANTIC_DELTA', latencyNs: 17, timestamp: '10:42:01.006' },
  ]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setHeadIndex(prevHead => {
        const nextHead = (prevHead + 1) % 12;
        setTailIndex(prevTail => (prevTail + 1) % 12);
        
        setRingSlots(prevSlots => {
          const next = [...prevSlots];
          next[nextHead] = 1;
          next[(nextHead + 6) % 12] = 0;
          return next;
        });

        // Random slight jitter in latency between 16 and 21 ns
        const latency = Math.floor(16 + Math.random() * 5);
        setCurrentLatency(latency);
        setPacketsDispatched(p => p + 1);

        const newPacket: SynapticPacket = {
          id: Math.floor(10000 + Math.random() * 90000),
          source: ['ACMK_UVM', 'CORTEX_MS', 'AETHER_CORE', 'VIRTUAL_LAB'][Math.floor(Math.random() * 4)],
          target: ['SYNAPSE_BUS', 'GPU_RING_0', 'NEURAL_MESH', 'INTENT_SOLVER'][Math.floor(Math.random() * 4)],
          payloadType: PACKET_TYPES[Math.floor(Math.random() * PACKET_TYPES.length)],
          latencyNs: latency,
          timestamp: new Date().toISOString().substring(11, 23),
        };

        setPacketHistory(prev => [newPacket, ...prev.slice(0, 4)]);
        return nextHead;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isRunning]);

  const injectBurst = () => {
    setPacketsDispatched(p => p + 500);
    setCurrentLatency(16);
    setRingSlots(Array(12).fill(1));
    setTimeout(() => {
      setRingSlots([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0]);
    }, 300);
  };

  return (
    <div id="axon-bus-sim" className="bg-[#0b0d11] border border-[#1e232d] p-5 rounded-lg text-slate-300 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b1f28] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-semibold tracking-wider text-sm">AXON :: SYNAPTIC ZERO-COPY RING FABRIC</span>
          <span className="px-2 py-0.5 text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded">LOCK-FREE RING</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Throughput: <strong className="text-white">124.2M msg/s</strong></span>
          <span>Avg Latency: <strong className="text-cyan-400">{currentLatency} ns</strong></span>
          <span>Ring Slots: <strong className="text-white">12 Ring Lines</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ring Buffer Graphic */}
        <div className="bg-[#0e1117] p-4 rounded border border-[#1c212c]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Circular Synapse Memory Ring (PCIe Gen4)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="p-1 px-2 rounded bg-[#181e28] hover:bg-[#202734] text-slate-300 border border-[#252c3b] flex items-center gap-1 text-[11px]"
              >
                {isRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                {isRunning ? 'Pause Ring' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={injectBurst}
                className="p-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 flex items-center gap-1 text-[11px]"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                Burst (500x)
              </button>
            </div>
          </div>

          {/* Ring Slots Visualizer */}
          <div className="grid grid-cols-6 gap-2 my-4">
            {ringSlots.map((isOccupied, idx) => {
              const isHead = idx === headIndex;
              const isTail = idx === tailIndex;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded border text-center relative transition-all ${
                    isHead
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] text-white'
                      : isTail
                      ? 'bg-amber-950/40 border-amber-600/70 text-amber-300'
                      : isOccupied
                      ? 'bg-[#151c27] border-cyan-800/40 text-slate-300'
                      : 'bg-[#10131a] border-[#1d222d] text-slate-600'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 mb-0.5">SLOT {idx}</div>
                  <div className="font-bold text-xs">
                    {isHead ? 'HEAD' : isTail ? 'TAIL' : isOccupied ? 'BUSY' : 'IDLE'}
                  </div>
                  {isHead && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1a1f2a]">
            <span>Head Pointer: <strong>0x00{headIndex.toString(16).toUpperCase()}</strong></span>
            <span>Tail Pointer: <strong>0x00{tailIndex.toString(16).toUpperCase()}</strong></span>
            <span>Cacheline: <strong>64-byte aligned</strong></span>
          </div>
        </div>

        {/* Live Packet Log Stream */}
        <div className="bg-[#0e1117] p-4 rounded border border-[#1c212c] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Live Synaptic Event Trace
              </span>
              <span className="text-[10px] text-slate-500">
                Total Dispatched: {packetsDispatched.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1.5">
              {packetHistory.map(pkt => (
                <div key={pkt.id} className="p-2 rounded bg-[#11151e] border border-[#1d2330] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-white font-medium">{pkt.payloadType}</span>
                      <span className="text-[10px] text-slate-500">#{pkt.id}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-cyan-400">{pkt.source}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-emerald-400">{pkt.target}</span>
                      <span className="text-slate-600">@</span>
                      <span className="text-slate-500">{pkt.timestamp}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] font-bold">
                      {pkt.latencyNs} ns
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1b202c] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Hardware Memory Barrier: Enforced
            </span>
            <span>Zero-Copy Direct SVM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
