'use client';

import React, { useState, useMemo } from 'react';
import { Database, Search, Cpu, RefreshCw, Layers, Zap } from 'lucide-react';

interface MemoryPage {
  id: string;
  label: string;
  vector: [number, number, number];
  sizeKb: number;
  accessCount: number;
  lastAccessed: number;
  affinity: string;
}

const INITIAL_PAGES: MemoryPage[] = [
  { id: 'PAGE-0x01', label: 'Kernel CapTree Root', vector: [0.91, 0.12, 0.35], sizeKb: 64, accessCount: 420, lastAccessed: 2, affinity: 'Core Substrate' },
  { id: 'PAGE-0x02', label: 'Axon Ring Slot 0', vector: [0.82, 0.44, 0.15], sizeKb: 128, accessCount: 3890, lastAccessed: 1, affinity: 'IPC Bus' },
  { id: 'PAGE-0x03', label: 'Semantic Context Graph', vector: [0.25, 0.88, 0.41], sizeKb: 512, accessCount: 1240, lastAccessed: 5, affinity: 'Neural Mesh' },
  { id: 'PAGE-0x04', label: 'Tensor Flow Cut Weights', vector: [0.15, 0.72, 0.89], sizeKb: 1024, accessCount: 910, lastAccessed: 8, affinity: 'Topology' },
  { id: 'PAGE-0x05', label: 'Virtual Lab Sensorium FIFO', vector: [0.38, 0.55, 0.78], sizeKb: 256, accessCount: 2110, lastAccessed: 3, affinity: 'Simulation' },
  { id: 'PAGE-0x06', label: 'Intent Invariant SMT Cache', vector: [0.65, 0.32, 0.75], sizeKb: 192, accessCount: 740, lastAccessed: 12, affinity: 'Goal Logic' },
  { id: 'PAGE-0x07', label: 'ACmK Work-Stealing DAG', vector: [0.77, 0.59, 0.22], sizeKb: 384, accessCount: 1650, lastAccessed: 4, affinity: 'Hardware UVM' },
  { id: 'PAGE-0x08', label: 'Associative Recall Index', vector: [0.42, 0.93, 0.31], sizeKb: 512, accessCount: 3100, lastAccessed: 2, affinity: 'Neural Mesh' },
];

export default function CortexMemorySimulator() {
  const [pages, setPages] = useState<MemoryPage[]>(INITIAL_PAGES);
  const [queryText, setQueryText] = useState('Neural Mesh context synchronization');
  const [queryVector, setQueryVector] = useState<[number, number, number]>([0.3, 0.9, 0.35]);
  const [activeAllocation, setActiveAllocation] = useState<string | null>('PAGE-0x03');
  const [isSimulatingLookup, setIsSimulatingLookup] = useState(false);
  const [simulatedLookupsCount, setSimulatedLookupsCount] = useState(148);

  const calculateSimilarity = (v1: [number, number, number], v2: [number, number, number]) => {
    const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
    return Math.max(0, Math.min(1, dot / (mag1 * mag2)));
  };

  const rankedPages = useMemo(() => {
    return [...pages].map(page => {
      const similarity = calculateSimilarity(queryVector, page.vector);
      return {
        ...page,
        similarity,
      };
    }).sort((a, b) => b.similarity - a.similarity);
  }, [pages, queryVector]);

  const runQueryPreset = (text: string, vector: [number, number, number]) => {
    setIsSimulatingLookup(true);
    setQueryText(text);
    setQueryVector(vector);
    setSimulatedLookupsCount(prev => prev + 1);

    setTimeout(() => {
      setIsSimulatingLookup(false);
      // Select highest match
      const highest = [...pages].sort((a, b) => 
        calculateSimilarity(vector, b.vector) - calculateSimilarity(vector, a.vector)
      )[0];
      if (highest) {
        setActiveAllocation(highest.id);
      }
    }, 280);
  };

  const allocateSyntheticPage = () => {
    const newId = `PAGE-0x0${pages.length + 1}`;
    const newPage: MemoryPage = {
      id: newId,
      label: `Vector Slot ${pages.length + 1} (${queryText.slice(0, 16)}...)`,
      vector: [
        parseFloat((queryVector[0] + (Math.random() * 0.2 - 0.1)).toFixed(2)),
        parseFloat((queryVector[1] + (Math.random() * 0.2 - 0.1)).toFixed(2)),
        parseFloat((queryVector[2] + (Math.random() * 0.2 - 0.1)).toFixed(2)),
      ],
      sizeKb: 256,
      accessCount: 1,
      lastAccessed: 0,
      affinity: 'Dynamic Slot',
    };
    setPages(prev => [newPage, ...prev.slice(0, 9)]);
    setActiveAllocation(newId);
  };

  return (
    <div id="cortex-memory-sim" className="bg-[#0b0d11] border border-[#1e232d] p-5 rounded-lg text-slate-300 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b1f28] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-semibold tracking-wider text-sm">CORTEX-MS :: VECTOR ADDRESSING SUBSTRATE</span>
          <span className="px-2 py-0.5 text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded">HNSW L-1 CACHE</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Lookups: <strong className="text-white">{simulatedLookupsCount}</strong></span>
          <span>Lookup Latency: <strong className="text-emerald-400">280 µs</strong></span>
          <span>Page Faults: <strong className="text-emerald-400">0.00%</strong></span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Preset Query Buttons */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2">
            Simulate Cognitive Intent Query (Associative Memory Request)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => runQueryPreset('Neural Mesh context synchronization', [0.3, 0.9, 0.35])}
              className={`p-2 text-left rounded border transition-all ${
                queryText === 'Neural Mesh context synchronization'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#12161f] border-[#222834] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">Context Synch</span>
                <span className="text-[10px] text-emerald-400">1536-D</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Semantic drift vector pool</p>
            </button>

            <button
              type="button"
              onClick={() => runQueryPreset('Axon IPC ring buffer handoff', [0.85, 0.35, 0.2])}
              className={`p-2 text-left rounded border transition-all ${
                queryText === 'Axon IPC ring buffer handoff'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#12161f] border-[#222834] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">Axon Synapse</span>
                <span className="text-[10px] text-cyan-400">18ns</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Zero-copy ring buffer slot</p>
            </button>

            <button
              type="button"
              onClick={() => runQueryPreset('SMT Formal Invariant Safety Check', [0.6, 0.3, 0.8])}
              className={`p-2 text-left rounded border transition-all ${
                queryText === 'SMT Formal Invariant Safety Check'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#12161f] border-[#222834] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">Intent Verification</span>
                <span className="text-[10px] text-amber-400">Z3 Logic</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Formal constraint proof</p>
            </button>
          </div>
        </div>

        {/* Query Vector Representation */}
        <div className="bg-[#0e1117] p-3 rounded border border-[#1b202a] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className={`w-3.5 h-3.5 ${isSimulatingLookup ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
            <span className="text-slate-300">Active Intent:</span>
            <span className="text-white font-semibold">&ldquo;{queryText}&rdquo;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Vector Coordinates:</span>
            <span className="bg-[#181d26] px-2 py-0.5 text-emerald-400 rounded text-[11px]">
              [{queryVector.map(v => v.toFixed(2)).join(', ')}]
            </span>
            <button
              type="button"
              onClick={allocateSyntheticPage}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] transition-colors"
            >
              <Zap className="w-3 h-3" />
              Alloc Page
            </button>
          </div>
        </div>

        {/* Vector Pages Table */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {rankedPages.map((page, idx) => {
            const isTopMatch = idx === 0;
            const isSelected = activeAllocation === page.id;
            const matchPercent = (page.similarity * 100).toFixed(1);

            return (
              <div
                key={page.id}
                onClick={() => setActiveAllocation(page.id)}
                className={`p-2.5 rounded border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#151c27] border-emerald-500/80 shadow-sm'
                    : 'bg-[#10131a] border-[#1c222e] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 text-center font-bold text-[11px] ${isTopMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{page.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#1b202b] text-slate-300 rounded">
                        {page.id}
                      </span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        {page.affinity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Coords: [{page.vector.join(', ')}]</span>
                      <span>•</span>
                      <span>{page.sizeKb} KB</span>
                      <span>•</span>
                      <span>{page.accessCount.toLocaleString()} reads</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Visual similarity bar */}
                  <div className="w-20 sm:w-28 bg-[#181d26] h-2 rounded-full overflow-hidden border border-[#222834]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isTopMatch ? 'bg-emerald-400' : page.similarity > 0.6 ? 'bg-cyan-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${matchPercent}%` }}
                    />
                  </div>
                  <span className={`w-12 text-right font-bold text-[11px] ${isTopMatch ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {matchPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
