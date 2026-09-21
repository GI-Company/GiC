'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  Send,
  RotateCcw,
  CheckCircle2,
  Box,
  Radio,
  FileCode,
} from 'lucide-react';

interface BusMessage {
  id: string;
  topic: string;
  sender: string;
  recipient: string;
  correlationId: string;
  payload: string;
  status: 'routed' | 'executed' | 'sandboxed';
}

export default function AetherBusSimulator() {
  const [messages, setMessages] = useState<BusMessage[]>([
    {
      id: 'msg-01',
      topic: 'task.exec.wasi',
      sender: 'app.code_editor',
      recipient: 'runner.wazero_wasi',
      correlationId: 'req-8291a',
      payload: '{ binary: "spectral_filter.wasm", mem_limit: "64MB" }',
      status: 'sandboxed',
    },
    {
      id: 'msg-02',
      topic: 'vfs.partition.write',
      sender: 'service.ai_agent',
      recipient: 'system.vfs',
      correlationId: 'req-8291b',
      payload: '{ path: "/workspace/peaks.json", bytes: 14208 }',
      status: 'routed',
    },
  ]);

  const [activeTopic, setActiveTopic] = useState<string>('task.exec.wasi');

  const handleInjectMessage = (topic: string) => {
    const newMsg: BusMessage = {
      id: `msg-0${messages.length + 1}`,
      topic,
      sender: topic.startsWith('task') ? 'app.code_editor' : topic.startsWith('vfs') ? 'app.file_manager' : 'service.ai_proxy',
      recipient: topic.startsWith('task') ? 'runner.wazero_wasi' : topic.startsWith('vfs') ? 'system.vfs' : 'service.ai_agent',
      correlationId: `req-${Math.random().toString(36).substring(2, 7)}`,
      payload: topic.startsWith('task')
        ? '{ binary: "mass_spec_align.wasm", timeout: "2000ms" }'
        : topic.startsWith('vfs')
        ? '{ mount: "sandboxed_temp", read_only: false }'
        : '{ prompt_tokens: 412, response_tokens: 128, status: 200 }',
      status: topic.startsWith('task') ? 'sandboxed' : 'routed',
    };
    setMessages(prev => [newMsg, ...prev.slice(0, 4)]);
  };

  return (
    <div id="aether-bus-simulator" className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-slate-300">
      {/* Header */}
      <div className="bg-[#0e121a] p-5 border-b border-[#181e2b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Historical Systems Prototype
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[10px] text-slate-400">Browser-Native Go / WASM Operating Substrate</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AetherOS: Structured Message Bus & WASM Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical systems exploration investigating topic-based message dispatch, request correlation, and WASI execution boundaries.
          </p>
        </div>

        {/* Dispatch Message Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleInjectMessage('task.exec.wasi')}
            className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Emit WASI Task</span>
          </button>
          <button
            type="button"
            onClick={() => handleInjectMessage('vfs.partition.write')}
            className="px-3 py-1.5 rounded-lg bg-[#141a25] hover:bg-[#1a2333] border border-[#232d3e] text-slate-300 text-xs flex items-center gap-1.5 transition-all"
          >
            <span>Emit VFS Event</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Architectural Layers Schema */}
        <div className="p-4 bg-[#0a0d13] rounded-xl border border-[#181e2b] text-xs space-y-2">
          <span className="font-bold text-white uppercase text-[11px] block">
            AetherOS Orchestration Topology
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded bg-[#0e121a] border border-[#1a2130]">
              <div className="text-[10px] text-slate-500">Tier 1</div>
              <div className="text-white font-bold mt-0.5">React Desktop UI</div>
              <div className="text-[10px] text-slate-400 mt-1">Multi-window shell</div>
            </div>
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/80">
              <div className="text-[10px] text-amber-500">Tier 2</div>
              <div className="text-amber-300 font-bold mt-0.5">Go Message Bus</div>
              <div className="text-[10px] text-slate-400 mt-1">JSON topic routing</div>
            </div>
            <div className="p-2.5 rounded bg-[#0e121a] border border-[#1a2130]">
              <div className="text-[10px] text-slate-500">Tier 3</div>
              <div className="text-white font-bold mt-0.5">VFS & System Services</div>
              <div className="text-[10px] text-slate-400 mt-1">Sandboxed files</div>
            </div>
            <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/80">
              <div className="text-[10px] text-cyan-500">Tier 4</div>
              <div className="text-cyan-300 font-bold mt-0.5">Wazero WASI Runner</div>
              <div className="text-[10px] text-slate-400 mt-1">Deterministic compute</div>
            </div>
          </div>
        </div>

        {/* Live Message Dispatch Stream */}
        <div className="space-y-2 text-xs">
          <span className="text-slate-400 uppercase font-bold tracking-wider text-[11px] block">
            Real-Time Message Bus Event Stream ({messages.length})
          </span>

          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-[#0e121a] rounded-lg border border-[#181e2b] space-y-1.5 font-mono text-[11px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">
                      {m.topic}
                    </span>
                    <span className="text-slate-400">
                      {m.sender} ──► {m.recipient}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">Corr: {m.correlationId}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                      {m.status}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-[#090b10] rounded border border-[#151a24] text-slate-300 text-[10px]">
                  {m.payload}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Systems Finding */}
        <div className="p-4 bg-[#0a0d13] rounded-xl border border-amber-900/50 text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 block mb-1">Key Systems Research Finding:</strong>
          &quot;Intelligent systems require orchestration infrastructure around the model: state, permissions, messaging, failure handling, persistence, and observability.&quot; This foundational lesson led directly from AetherOS to Axon and eventually the ACmK cognitive microkernel.
        </div>
      </div>
    </div>
  );
}
