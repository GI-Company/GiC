'use client';

import React, { useState } from 'react';
import { Network, GitBranch, RefreshCw, Zap, TrendingDown } from 'lucide-react';

interface TensorPipelineNode {
  id: string;
  name: string;
  assignedDevice: 'GPU_0' | 'GPU_1' | 'NPU_ACCEL' | 'HOST_CPU';
  loadPercent: number;
  tempC: number;
  memoryMb: number;
}

export default function TensorFlowSimulator() {
  const [nodes, setNodes] = useState<TensorPipelineNode[]>([
    { id: 'LAYER_0_EMBED', name: 'Layer 0: Embedding & Latent Projection', assignedDevice: 'GPU_0', loadPercent: 78, tempC: 62, memoryMb: 1420 },
    { id: 'LAYER_1_ATTN', name: 'Layer 1-12: Multi-Head Self Attention', assignedDevice: 'GPU_0', loadPercent: 94, tempC: 78, memoryMb: 4800 },
    { id: 'LAYER_2_FFN', name: 'Layer 13-24: Sparse MoE Feedforward', assignedDevice: 'GPU_1', loadPercent: 82, tempC: 68, memoryMb: 5200 },
    { id: 'LAYER_3_DECODE', name: 'Layer 25-32: Speculative Token Sampler', assignedDevice: 'NPU_ACCEL', loadPercent: 44, tempC: 51, memoryMb: 890 },
  ]);

  const [isRecompiling, setIsRecompiling] = useState(false);
  const [cutEnergy, setCutEnergy] = useState('0.142 J/token');
  const [interconnectSat, setInterconnectSat] = useState(94.8);

  const rebalanceGraph = () => {
    setIsRecompiling(true);
    setTimeout(() => {
      setNodes([
        { id: 'LAYER_0_EMBED', name: 'Layer 0: Embedding & Latent Projection', assignedDevice: 'GPU_0', loadPercent: 62, tempC: 59, memoryMb: 1420 },
        { id: 'LAYER_1_ATTN', name: 'Layer 1-12: Multi-Head Self Attention', assignedDevice: 'GPU_1', loadPercent: 71, tempC: 64, memoryMb: 4800 },
        { id: 'LAYER_2_FFN', name: 'Layer 13-24: Sparse MoE Feedforward', assignedDevice: 'GPU_1', loadPercent: 68, tempC: 63, memoryMb: 5200 },
        { id: 'LAYER_3_DECODE', name: 'Layer 25-32: Speculative Token Sampler', assignedDevice: 'NPU_ACCEL', loadPercent: 49, tempC: 52, memoryMb: 890 },
      ]);
      setCutEnergy('0.098 J/token');
      setInterconnectSat(98.2);
      setIsRecompiling(false);
    }, 350);
  };

  return (
    <div id="tensor-flow-sim" className="bg-[#0b0d11] border border-[#1e232d] p-5 rounded-lg text-slate-300 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b1f28] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-semibold tracking-wider text-sm">TENSORNETS :: TOPOLOGY-AWARE GRAPH RE-ROUTER</span>
          <span className="px-2 py-0.5 text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded">DYNAMIC JIT CUT</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Bus Saturation: <strong className="text-emerald-400">{interconnectSat}%</strong></span>
          <span>Cut Cost: <strong className="text-white">{cutEnergy}</strong></span>
          <button
            type="button"
            onClick={rebalanceGraph}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-900 hover:bg-cyan-800 text-white rounded text-[11px] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRecompiling ? 'animate-spin' : ''}`} />
            Rebalance Graph
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {nodes.map(node => (
          <div key={node.id} className="p-3 rounded bg-[#0e121a] border border-[#1c222f] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{node.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#191f2c] text-cyan-300 border border-cyan-800/40 rounded">
                  {node.assignedDevice}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                ID: {node.id} • VRAM: {node.memoryMb} MB
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Compute Load</span>
                <span className={`font-semibold ${node.loadPercent > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {node.loadPercent}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Silicon Temp</span>
                <span className={`font-semibold ${node.tempC > 75 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {node.tempC}°C
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
