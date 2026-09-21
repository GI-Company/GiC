'use client';

import React, { useState } from 'react';
import { Shield, Key, Lock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface CapabilityNode {
  id: string;
  name: string;
  rights: string[];
  depth: number;
  mask: string;
  revoked: boolean;
}

export default function AetherCapabilitySimulator() {
  const [capabilities, setCapabilities] = useState<CapabilityNode[]>([
    { id: 'CAP-ROOT', name: 'Root Capability (Substrate Master)', rights: ['READ', 'WRITE', 'EXEC', 'DELEGATE', 'REVOKE', 'IRQ_MAP'], depth: 0, mask: '0xFFFFFFFF', revoked: false },
    { id: 'CAP-MEM-0', name: 'Unified Memory Space Node', rights: ['READ', 'WRITE', 'EXEC', 'DELEGATE'], depth: 1, mask: '0x0000000F', revoked: false },
    { id: 'CAP-PAGE-TLB', name: 'TLB Pinning & Page Alloc', rights: ['READ', 'WRITE'], depth: 2, mask: '0x00000003', revoked: false },
    { id: 'CAP-BUS-RING', name: 'Axon Ring PCIe Descriptor', rights: ['READ', 'WRITE', 'IRQ_MAP'], depth: 1, mask: '0x00000023', revoked: false },
    { id: 'CAP-USER-AGENT', name: 'Virtual Lab Sandbox Client', rights: ['READ'], depth: 2, mask: '0x00000001', revoked: false },
  ]);

  const [selectedCapId, setSelectedCapId] = useState<string>('CAP-ROOT');
  const [testAction, setTestAction] = useState<string>('WRITE');
  const [testResult, setTestResult] = useState<{ allowed: boolean; reason: string } | null>(null);

  const activeCap = capabilities.find(c => c.id === selectedCapId) || capabilities[0];

  const verifyAction = (action: string) => {
    setTestAction(action);
    if (activeCap.revoked) {
      setTestResult({ allowed: false, reason: `Capability ${activeCap.id} was revoked by parent cascade.` });
      return;
    }
    const hasRight = activeCap.rights.includes(action);
    if (hasRight) {
      setTestResult({
        allowed: true,
        reason: `Action '${action}' permitted by CapTree derivation mask ${activeCap.mask} (41ns verification).`
      });
    } else {
      setTestResult({
        allowed: false,
        reason: `Action '${action}' blocked: Right not present in derived capability hierarchy.`
      });
    }
  };

  const toggleRevoke = (id: string) => {
    setCapabilities(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, revoked: !c.revoked };
      }
      return c;
    }));
    setTestResult(null);
  };

  return (
    <div id="aether-cap-sim" className="bg-[#0b0d11] border border-[#1e232d] p-5 rounded-lg text-slate-300 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b1f28] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-semibold tracking-wider text-sm">AETHEROS :: CAPABILITY MONOTONICITY MATRIX</span>
          <span className="px-2 py-0.5 text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded">UNFORGEABLE HANDLES</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Verification: <strong className="text-emerald-400">41 ns</strong></span>
          <span>Security Model: <strong className="text-white">Object-Capability</strong></span>
          <span>Zero Root State: <strong className="text-emerald-400">Verified</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CapTree View */}
        <div className="lg:col-span-7 bg-[#0e1117] p-3.5 rounded border border-[#1b202c]">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
            Active Capability Derivation Tree (CapTree)
          </div>

          <div className="space-y-2">
            {capabilities.map(cap => {
              const isSelected = selectedCapId === cap.id;
              return (
                <div
                  key={cap.id}
                  onClick={() => { setSelectedCapId(cap.id); setTestResult(null); }}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#151d2a] border-emerald-500'
                      : 'bg-[#11141d] border-[#1d2330] hover:border-slate-700'
                  }`}
                  style={{ marginLeft: `${cap.depth * 16}px` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Key className={`w-3.5 h-3.5 ${cap.revoked ? 'text-red-400' : 'text-emerald-400'}`} />
                      <span className={`font-semibold ${cap.revoked ? 'line-through text-red-300' : 'text-white'}`}>
                        {cap.name}
                      </span>
                      <span className="text-[10px] px-1 bg-[#1c2230] text-slate-400 rounded">
                        {cap.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRevoke(cap.id); }}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        cap.revoked
                          ? 'bg-red-950/60 border-red-800 text-red-300'
                          : 'bg-[#1c2230] border-[#2a3345] text-slate-400 hover:text-white'
                      }`}
                    >
                      {cap.revoked ? 'Revoked' : 'Active'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {cap.rights.map(r => (
                      <span key={r} className="text-[9px] px-1.5 py-0.2 bg-[#090b0e] border border-[#232938] text-emerald-400/90 rounded">
                        +{r}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-500 ml-auto">Mask: {cap.mask}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Verification Inspector */}
        <div className="lg:col-span-5 bg-[#0e1117] p-3.5 rounded border border-[#1b202c] flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">
              Hardware Capability Guard Test
            </div>
            <div className="p-2.5 rounded bg-[#11141c] border border-[#1d222e] mb-3">
              <div className="text-[10px] text-slate-400">Target Capability:</div>
              <div className="text-white font-bold mt-0.5">{activeCap.name}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Rights: [{activeCap.rights.join(', ')}]
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mb-2">Dispatch Target Action:</div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {['READ', 'WRITE', 'EXEC', 'IRQ_MAP', 'REVOKE', 'DELEGATE'].map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => verifyAction(action)}
                  className={`p-1.5 rounded text-left border transition-all text-[11px] ${
                    testAction === action
                      ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold'
                      : 'bg-[#11151e] border-[#1d2330] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            {testResult && (
              <div
                className={`p-3 rounded border text-xs leading-relaxed ${
                  testResult.allowed
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/80 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  {testResult.allowed ? 'CAPABILITY VERIFIED (ALLOW)' : 'ACCESS DENIED (FAULT)'}
                </div>
                <p className="text-[11px] opacity-90">{testResult.reason}</p>
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-slate-500 border-t border-[#1b202c]">
            Invariant: Derive(c) ⊆ Rights(c) is strictly monotonic across all thread execution spaces.
          </div>
        </div>
      </div>
    </div>
  );
}
