'use client';
import { useState } from 'react';
import { Download, FlaskConical, ShieldCheck } from 'lucide-react';
import { PARAMS, DEFAULT_PROPOSAL, LAB_LIMITATIONS, LAB_SOURCE, LAB_VERSION, canonicalJson, evidenceBundle, experimentReport, validateProposal, type LabProposal, type LabRun, type SweepParameter } from '@/lib/virtual-lab-demo';

type Evidence=Awaited<ReturnType<typeof evidenceBundle>>;
const choices:Record<SweepParameter,number[]>={
  concentration:[0,1,5], mrna_decay:[0.1,0.5,1], translation:[0.5,2,5], protein_decay:[0.05,0.1,0.5],
};
const palette=['#2563eb','#059669','#d97706','#7c3aed','#dc2626'];
function download(filename:string,mime:string,data:string){
  const url=URL.createObjectURL(new Blob([data],{type:mime}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
export default function VirtualLabFreeWorkbench(){
  const [parameter,setParameter]=useState<SweepParameter>(DEFAULT_PROPOSAL.parameter);
  const [values,setValues]=useState(DEFAULT_PROPOSAL.values.join(', '));
  const [duration,setDuration]=useState(DEFAULT_PROPOSAL.duration);
  const [evidence,setEvidence]=useState<Evidence|null>(null);
  const [verified,setVerified]=useState<boolean|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [lastProtocol,setLastProtocol]=useState<LabProposal|null>(null);
  function invalidate(){setError('');setEvidence(null);setVerified(null);setLastProtocol(null);}
  async function run(){
    if(busy)return;setBusy(true);setError('');setVerified(null);
    try{
      const proposed=validateProposal({parameter,values:values.split(',').map(s=>s.trim()?Number(s):NaN),duration,rationale:'Free public parameter-sweep demonstration; model assumptions only.'});
      const result=await evidenceBundle(proposed);
      setLastProtocol(proposed);setEvidence(result);
    }catch(e){setEvidence(null);setLastProtocol(null);setError(e instanceof Error?e.message:'Unable to run experiment.');}
    finally{setBusy(false);}
  }
  async function verify(){
    if(!evidence)return;
    try{
      const bytes=new TextEncoder().encode(canonicalJson(evidence.payload));
      const hash=await crypto.subtle.digest('SHA-256',bytes);
      const actual=Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
      setVerified(actual===evidence.sha256);
    }catch{setVerified(false);}
  }
  const runs=evidence?.payload.runs||[];
  const max=Math.max(1,...runs.flatMap(r=>r.points.map(p=>p.protein)));
  const hours=lastProtocol?.duration||duration;
  return <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" data-ph-mask="true" data-ph-no-capture="true">
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2"><FlaskConical size={21} className="text-blue-700"/><h2 className="text-xl font-semibold">Create a comparison</h2></div>
      <p className="mt-2 text-sm leading-6 text-slate-600">Edit the assumptions, then explicitly run the experiment. All computation is local to this browser tab.</p>
      <label className="mt-6 block text-sm font-medium">Sweep parameter
        <select value={parameter} onChange={e=>{const p=e.target.value as SweepParameter;invalidate();setParameter(p);setValues(choices[p].join(', '));}} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">{Object.entries(PARAMS).map(([id,v])=><option key={id} value={id}>{v.label} ({v.unit})</option>)}</select>
      </label>
      <label className="mt-4 block text-sm font-medium">Values (comma separated)
        <input value={values} onChange={e=>{invalidate();setValues(e.target.value);}} className="mt-2 w-full rounded-lg border border-slate-300 p-3" aria-describedby="value-hint"/>
      </label>
      <p id="value-hint" className="mt-1 text-xs text-slate-500">2–5 distinct numbers within the selected parameter's range.</p>
      <label className="mt-4 block text-sm font-medium">Duration in hours
        <input type="number" min={1} max={72} value={duration} onChange={e=>{invalidate();setDuration(Number(e.target.value));}} className="mt-2 w-full rounded-lg border border-slate-300 p-3"/>
      </label>
      <button type="button" onClick={()=>void run()} disabled={busy} className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?'Calculating…':'Run free simulation'}</button>
      <p className="mt-5 text-xs leading-6 text-slate-500">2400 RK4 solver steps per trajectory · model state: MODEL_ASSUMPTION · output state: SIMULATED. No instrument measurements and no training.</p>
      <p className="mt-3 text-xs text-slate-500">Source model: <a href={LAB_SOURCE} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">VirtualLab gene-expression model</a> · {LAB_VERSION}</p>
    </aside>
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Simulation results</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">SIMULATED · NOT MEASURED</span></div>
      {error&&<p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {!evidence?<div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-50 p-8 text-center text-slate-600"><p>Choose your assumptions and run the free numerical comparison.</p></div>:
      <>
        <p className="mt-3 text-sm text-slate-600">Normalized protein abundance over {hours} hours. Every line represents a different assumed {PARAMS[parameter].label.toLowerCase()}.</p>
        <div className="mt-5 overflow-x-auto"><svg className="min-w-[460px] w-full" viewBox="0 0 680 300" role="img" aria-label="Plot of simulated protein abundance over time">
          {[0,0.5,1].map(y=><g key={y}><line x1="52" x2="650" y1={255-y*212} y2={255-y*212} stroke="#cbd5e1"/><text x="46" y={259-y*212} textAnchor="end" fill="#64748b" fontSize="12">{(y*max).toFixed(1)}</text></g>)}
          {runs.map((r,i)=><polyline key={r.value} fill="none" stroke={palette[i]} strokeWidth="2.7" points={r.points.map(p=>`${52+p.time/hours*598},${255-p.protein/max*212}`).join(' ')}/>)}
          <text x="350" y="289" textAnchor="middle" fill="#64748b" fontSize="13">Time (hours)</text>
        </svg></div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">{runs.map((r,i)=><span key={r.value} className="inline-flex items-center gap-2"><span style={{background:palette[i]}} className="inline-block h-2.5 w-2.5 rounded-full"/>{r.value} {PARAMS[parameter].unit}</span>)}</div>
        <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-2 text-left font-semibold">Final states (normalized model units)</caption><thead className="border-b border-slate-200 text-slate-500"><tr><th className="p-2">Sweep value</th><th className="p-2 text-right">mRNA</th><th className="p-2 text-right">Protein</th></tr></thead><tbody>{runs.map((r:LabRun)=><tr key={r.value} className="border-b border-slate-100"><td className="p-2">{r.value} {PARAMS[parameter].unit}</td><td className="p-2 text-right tabular-nums">{r.finalMrna.toFixed(4)}</td><td className="p-2 text-right tabular-nums">{r.finalProtein.toFixed(4)}</td></tr>)}</tbody></table></div>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-700"/><h3 className="font-semibold">Software evidence checksum</h3></div>
          <p className="mt-2 break-all font-mono text-xs text-slate-600">SHA-256: {evidence.sha256}</p>
          <button onClick={()=>void verify()} className="mt-3 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800">Recalculate & verify</button>
          {verified!==null&&<span className={`ml-3 text-sm font-semibold ${verified?'text-emerald-700':'text-red-700'}`}>{verified?'Local payload matches hash':'Hash mismatch'}</span>}
          <p className="mt-3 text-xs leading-5 text-slate-500">A matching checksum detects changes in the exported payload. It does not authenticate an instrument or validate a scientific claim.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={()=>download('virtual-lab-free-simulation.json','application/json',JSON.stringify(evidence,null,2))} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><Download size={16}/> Evidence JSON</button>
          <button onClick={()=>download('virtual-lab-free-report.md','text/markdown',experimentReport(lastProtocol!,runs))} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><Download size={16}/> Report Markdown</button>
        </div>
      </>}
      <p className="mt-6 text-xs leading-6 text-slate-500">{LAB_LIMITATIONS}</p>
    </section>
  </div>;
}
