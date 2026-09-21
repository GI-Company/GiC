'use client';

import React, { useState } from 'react';
import {
  Wifi,
  Radio,
  Camera,
  Compass,
  Activity,
  Sliders,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export default function SensorNodeRFSimulator() {
  const [epistemicState, setEpistemicState] = useState<'observed' | 'measured' | 'inferred'>('observed');
  const [rfDistance, setRfDistance] = useState<number>(2.4);
  const [multipathNoise, setMultipathNoise] = useState<number>(30);

  // Calculate RF RSSI and probabilistic occupancy based on physics model
  const rssiDbm = Math.round(-42 - 20 * Math.log10(rfDistance) - (multipathNoise / 100) * 12);
  const occupancyProbability = Math.max(0.08, Math.min(0.96, Number((0.85 - (rfDistance / 5) * 0.4 + (multipathNoise / 100) * 0.2).toFixed(2))));

  return (
    <div className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-xs">
      {/* Banner */}
      <div className="bg-[#0e121a] p-4 border-b border-[#181d27] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">SENSOR NODE & RF RESEARCH</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 uppercase font-semibold">
              Edge Hardware
            </span>
            <span className="text-[10px] text-slate-500">Hardware-Grounded Multimodal Acquisition</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Camera • IMU (Accel, Gyro, Mag) • Wi-Fi / RF Sensing • Epistemic Classification Triad
          </p>
        </div>

        {/* Epistemic Triad Toggle */}
        <div className="flex bg-[#07090d] p-0.5 rounded-lg border border-[#181d27]">
          <button
            type="button"
            onClick={() => setEpistemicState('observed')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              epistemicState === 'observed' ? 'bg-[#18202d] text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>●</span>
            <span>OBSERVED</span>
          </button>
          <button
            type="button"
            onClick={() => setEpistemicState('measured')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              epistemicState === 'measured' ? 'bg-[#18202d] text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>◆</span>
            <span>MEASURED</span>
          </button>
          <button
            type="button"
            onClick={() => setEpistemicState('inferred')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              epistemicState === 'inferred' ? 'bg-[#18202d] text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>▲</span>
            <span>INFERRED</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Epistemic Meaning Callout */}
        <div className="p-3.5 rounded-lg bg-[#0e121a] border border-[#1b212d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">
              {epistemicState === 'observed' && '●'}
              {epistemicState === 'measured' && '◆'}
              {epistemicState === 'inferred' && '▲'}
            </span>
            <div>
              <span className="font-bold text-white text-xs">
                {epistemicState === 'observed' && 'OBSERVED: Raw physical sensor readings directly from silicon'}
                {epistemicState === 'measured' && 'MEASURED: Calibrated and timestamp-synchronized physical channels'}
                {epistemicState === 'inferred' && 'INFERRED: Model predictions, probabilities, and spatial occupancy estimations'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Every data stream in Global Intent Company systems strictly declares its epistemic tier to prevent confounding model predictions with physical truth.
              </p>
            </div>
          </div>
        </div>

        {/* Hardware Stream Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Camera */}
          <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-bold text-white">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Camera Stream</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161c28] text-slate-300">60 FPS</span>
            </div>
            <div className="text-[10px] text-slate-400">1920x1080 Bayer raw format</div>
            <div className="text-[9px] text-emerald-400 font-mono">
              {epistemicState === 'observed' && 'Pixel voltages: raw 10-bit ADC'}
              {epistemicState === 'measured' && 'Debayered RGB + exposure: 8.2 ms'}
              {epistemicState === 'inferred' && 'Feature keypoints: 42 detected'}
            </div>
          </div>

          {/* IMU Accelerometer */}
          <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-bold text-white">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Accelerometer</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161c28] text-slate-300">200 Hz</span>
            </div>
            <div className="text-[10px] text-slate-400">3-Axis MEMS Silicon</div>
            <div className="text-[9px] text-cyan-400 font-mono">
              {epistemicState === 'observed' && 'X: 0.042g, Y: 0.012g, Z: 0.981g'}
              {epistemicState === 'measured' && 'Calibrated Gravity: 9.806 m/s²'}
              {epistemicState === 'inferred' && 'State: Stationary surface hold'}
            </div>
          </div>

          {/* IMU Gyroscope & Magnetometer */}
          <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-bold text-white">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Gyro & Mag</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161c28] text-slate-300">100 Hz</span>
            </div>
            <div className="text-[10px] text-slate-400">Angular rate & Earth B-field</div>
            <div className="text-[9px] text-purple-400 font-mono">
              {epistemicState === 'observed' && 'dTheta/dt: 0.002 rad/s, B: 48 uT'}
              {epistemicState === 'measured' && 'Heading: 342.1° True North'}
              {epistemicState === 'inferred' && 'Attitude quaternion: nominal'}
            </div>
          </div>

          {/* Wi-Fi / RF Receiver */}
          <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1b212d] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-bold text-white">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Wi-Fi / RF CSI</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161c28] text-slate-300">5.8 GHz</span>
            </div>
            <div className="text-[10px] text-slate-400">Channel State Information</div>
            <div className="text-[9px] text-blue-400 font-mono">
              {epistemicState === 'observed' && `Raw RSSI: ${rssiDbm} dBm`}
              {epistemicState === 'measured' && 'Subcarrier phase shift: 0.44 rad'}
              {epistemicState === 'inferred' && `Voxel Occupancy: ${occupancyProbability}`}
            </div>
          </div>
        </div>

        {/* Interactive RF Spatial Propagation Sandbox */}
        <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a202c] pb-2">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive RF Spatial Sensing & Voxel Estimation</span>
            </span>
            <span className="text-[10px] text-slate-400">Physical Ray Attenuation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sliders */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Obstacle Distance:</span>
                  <span className="text-cyan-400 font-bold">{rfDistance} meters</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={rfDistance}
                  onChange={(e) => setRfDistance(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#171c26] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Multipath Interference:</span>
                  <span className="text-purple-400 font-bold">{multipathNoise}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={multipathNoise}
                  onChange={(e) => setMultipathNoise(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#171c26] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Calculated Physical & Inferential Results */}
            <div className="bg-[#07090d] p-3 rounded-lg border border-[#181f2c] space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Calculated RSSI:</span>
                <span className="font-bold text-white">{rssiDbm} dBm</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Probabilistic Occupancy:</span>
                <span className="font-bold text-emerald-400">{occupancyProbability}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-[#141a25]">
                Note: RF sensing produces spatial probability distributions, never discrete optical silhouettes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
