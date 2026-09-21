'use client';

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  AlertOctagon,
  CheckCircle2,
  FileCode,
  Database,
  Key,
  RotateCcw,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function VirtualLabIntegritySimulator() {
  const [attackStep, setAttackStep] = useState<'nominal' | 'modified_db' | 'recomputed_manifest' | 'signed_verified'>('nominal');
  const [signatureEnforced, setSignatureEnforced] = useState<boolean>(false);
  const [dbDataModified, setDbDataModified] = useState<boolean>(false);
  const [manifestRecomputed, setManifestRecomputed] = useState<boolean>(false);

  const resetAttack = () => {
    setAttackStep('nominal');
    setSignatureEnforced(false);
    setDbDataModified(false);
    setManifestRecomputed(false);
  };

  // Trigger Step 1: Modify genesis.db
  const handleModifyDb = () => {
    setDbDataModified(true);
    setManifestRecomputed(false);
    setAttackStep('modified_db');
  };

  // Trigger Step 2: Modify genesis.db AND recompute manifest hashes
  const handleModifyAndRecompute = () => {
    setDbDataModified(true);
    setManifestRecomputed(true);
    setAttackStep('recomputed_manifest');
  };

  // Trigger Step 3: Enforce Ed25519 cryptographic signature verification
  const handleEnforceSignature = () => {
    setSignatureEnforced(true);
    setAttackStep('signed_verified');
  };

  return (
    <div className="bg-[#0b0e14] border border-[#1b212d] rounded-xl overflow-hidden font-mono text-xs">
      {/* Banner */}
      <div className="bg-[#0e121a] p-4 border-b border-[#181d27] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">VIRTUAL LAB</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 uppercase font-semibold">
              Operational PoC
            </span>
            <span className="text-[10px] text-slate-500">.vlab Evidence Container Integrity Sandbox</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Interactive Artifact Tamper Attack: Demonstrating why plain checksums fail and why Ed25519 signatures are essential.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAttack}
          className="px-3 py-1.5 rounded-lg bg-[#141a25] hover:bg-[#1a2333] border border-[#212a3b] text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset Artifact State</span>
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Structure of .vlab Artifact */}
        <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1b212d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a202c] pb-2">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Experiment Artifact Container (experiment.vlab)</span>
            </span>
            <span className="text-[10px] text-slate-400">Content-Addressed Package</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
            <div className={`p-2.5 rounded border transition-colors ${dbDataModified ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-[#07090d] border-[#181f2c] text-slate-300'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>genesis.db</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Raw sensor observations</div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono">
                {dbDataModified ? 'SHA: [ALTERED]' : 'SHA: 7a9e...4b12'}
              </div>
            </div>

            <div className={`p-2.5 rounded border transition-colors ${manifestRecomputed ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-[#07090d] border-[#181f2c] text-slate-300'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>manifest.json</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">File hashes & metadata</div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono">
                {manifestRecomputed ? 'Hashes Recomputed' : 'SHA: e3b0...c45a'}
              </div>
            </div>

            <div className="p-2.5 rounded border bg-[#07090d] border-[#181f2c] text-slate-300">
              <div className="font-bold">observations/</div>
              <div className="text-[10px] text-slate-400 mt-1">Raw camera & IMU files</div>
              <div className="text-[9px] text-slate-500 mt-1">Immutable frames</div>
            </div>

            <div className="p-2.5 rounded border bg-[#07090d] border-[#181f2c] text-slate-300">
              <div className="font-bold">artifacts/</div>
              <div className="text-[10px] text-slate-400 mt-1">Derived model weights</div>
              <div className="text-[9px] text-slate-500 mt-1">Lineage traces</div>
            </div>

            <div className="p-2.5 rounded border bg-[#07090d] border-[#181f2c] text-slate-300">
              <div className="font-bold">metadata/</div>
              <div className="text-[10px] text-slate-400 mt-1">Device & environment</div>
              <div className="text-[9px] text-slate-500 mt-1">Clock drift scalars</div>
            </div>

            <div className={`p-2.5 rounded border transition-colors ${signatureEnforced ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200' : 'bg-[#07090d] border-[#181f2c] text-slate-300'}`}>
              <div className="flex items-center gap-1.5 font-bold">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>signature</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Ed25519 signature</div>
              <div className="text-[9px] text-slate-500 mt-1">
                {signatureEnforced ? 'Verified root key' : 'Unchecked root'}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Attack Simulator Controls */}
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            Execute Attack Vector Scenarios:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Scenario 1 */}
            <button
              type="button"
              onClick={handleModifyDb}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                attackStep === 'modified_db'
                  ? 'bg-red-950/40 border-red-500 shadow-md'
                  : 'bg-[#0e121a] border-[#1b212d] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-red-400 uppercase font-bold">Scenario 1 (Naive Tamper)</div>
              <div className="font-semibold text-white mt-1">Modify genesis.db</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Adversary alters experimental evidence inside genesis.db without touching manifest.json.
              </div>
            </button>

            {/* Scenario 2 */}
            <button
              type="button"
              onClick={handleModifyAndRecompute}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                attackStep === 'recomputed_manifest'
                  ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-[#0e121a] border-[#1b212d] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-amber-400 uppercase font-bold">Scenario 2 (Manifest Forgery)</div>
              <div className="font-semibold text-white mt-1">Modify + Recompute Manifest</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Adversary modifies genesis.db and recalculates the SHA-256 hash in manifest.json.
              </div>
            </button>

            {/* Scenario 3 */}
            <button
              type="button"
              onClick={handleEnforceSignature}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                attackStep === 'signed_verified'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                  : 'bg-[#0e121a] border-[#1b212d] hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Scenario 3 (Signed Security)</div>
              <div className="font-semibold text-white mt-1">Ed25519 Public Key Gate</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Verification checks manifest against the trusted public key authority.
              </div>
            </button>
          </div>
        </div>

        {/* Audit Verification Terminal Output */}
        <div className="p-4 rounded-xl bg-[#07090d] border border-[#1b212d] space-y-2">
          <div className="flex items-center justify-between border-b border-[#181d27] pb-2">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>VLab Verification Engine Audit Log</span>
            </span>
            <span className="text-[10px] text-slate-500">Real-Time Verification</span>
          </div>

          {attackStep === 'nominal' && (
            <div className="text-emerald-400 font-mono text-[11px] py-2 space-y-1">
              <div>[INFO] Loading package: experiment.vlab</div>
              <div>[PASS] genesis.db hash: 7a9e...4b12 matches manifest entry</div>
              <div>[PASS] observations/ hash tree matches manifest entry</div>
              <div className="text-slate-300 font-bold">[STATUS: UNTAMPERED ARTIFACT]</div>
            </div>
          )}

          {attackStep === 'modified_db' && (
            <div className="font-mono text-[11px] py-2 space-y-1">
              <div className="text-slate-400">[INFO] Verifying package checksums...</div>
              <div className="text-red-400 font-bold">[FAIL] HASH MISMATCH on genesis.db!</div>
              <div className="text-slate-400">  Expected: 7a9e4b12...</div>
              <div className="text-slate-400">  Computed: f801c3de...</div>
              <div className="text-red-300 font-bold bg-red-950/40 p-2 rounded border border-red-800/80 mt-2">
                ARTIFACT REJECTED: Evidence corruption detected. Plain checksum caught the modification.
              </div>
            </div>
          )}

          {attackStep === 'recomputed_manifest' && (
            <div className="font-mono text-[11px] py-2 space-y-1">
              <div className="text-slate-400">[INFO] Verifying package checksums...</div>
              <div className="text-emerald-400">[PASS] genesis.db hash matches manifest.json entry</div>
              <div className="text-emerald-400">[PASS] observations/ hash matches manifest.json entry</div>
              <div className="text-amber-300 font-bold bg-amber-950/50 p-2.5 rounded border border-amber-800/80 mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <span>CRITICAL TRUST FAILURE (VULNERABILITY DEMONSTRATED)</span>
                </div>
                <div className="text-[11px] font-sans text-amber-200/90 leading-relaxed">
                  The checksums are 100% valid, but the evidence is forged! An attacker capable of changing the evidence can also
                  recompute the expected hashes in manifest.json. Checksums alone offer zero protection without manifest authentication.
                </div>
              </div>
            </div>
          )}

          {attackStep === 'signed_verified' && (
            <div className="font-mono text-[11px] py-2 space-y-1">
              <div className="text-slate-400">[INFO] Manifest hash valid. Entering cryptographic validation gate...</div>
              <div className="text-purple-400">[CRYPTO] Verifying Ed25519 signature against trusted public key ed25519_pk_gic_root...</div>
              <div className="text-red-400 font-bold">[FAIL] SIGNATURE INVALID!</div>
              <div className="text-slate-400">  Manifest hash does not match signature signed by authority key.</div>
              <div className="text-emerald-300 font-bold bg-emerald-950/40 p-2.5 rounded border border-emerald-800/80 mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>TAMPERING BLOCKED BY CRYPTOGRAPHIC AUTHENTICATION</span>
                </div>
                <div className="text-[11px] font-sans text-emerald-200/90 leading-relaxed">
                  Manifest was recomputed by the attacker, but the attacker lacks the private key. Verification rejected the forged
                  manifest, preserving scientific integrity.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Foundational Lessons Learned */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0e121a] border border-[#1b212d] space-y-1">
            <div className="font-bold text-white text-[11px]">Finding 01</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Checksums alone are insufficient when the checksum manifest itself is not cryptographically authenticated.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0e121a] border border-[#1b212d] space-y-1">
            <div className="font-bold text-white text-[11px]">Finding 02</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Reproducibility requires raw observation + acquisition metadata + configuration + processing lineage + derived artifacts + environment + integrity.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0e121a] border border-[#1b212d] space-y-1">
            <div className="font-bold text-white text-[11px]">Finding 03</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Scientific software needs stricter integrity semantics than ordinary application software. A UI displaying a result does not establish data integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
