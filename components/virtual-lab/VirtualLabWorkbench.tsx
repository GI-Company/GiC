'use client';
import { useRef, useState } from 'react';
import { Download, FlaskConical, Play, ShieldCheck, Sparkles } from 'lucide-react';
import AssistantMessage from '@/components/intent/AssistantMessage';
import { DEFAULT_PROPOSAL, LAB_SOURCE, LAB_LIMITATIONS, PARAMS, canonicalJson, validateProposal, type LabProposal, type LabRun, type SweepParameter } from '@/lib/virtual-lab-demo';
import type { AgentResult } from '@/lib/virtual-lab-agent';
type Bundle = { payload: { protocol: LabProposal; runs: LabRun[] }; sha256:string };
const colors=['#2563eb','#059669','#d97706','#9333ea','#dc2626'];
function download(name:string,type:string,text:string) {
  const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function VirtualLabWorkbench({accessToken}:{accessToken:string}) {
  const [parameter,setParameter]=useState<SweepParameter>(DEFAULT_PROPOSAL.parameter);
  const [values,setValues]=useState(DEFAULT_PROPOSAL.values.join(', '));
  const [duration,setDuration]=useState(DEFAULT_PROPOSAL.duration);
  const [rationale,setRationale]=useState(DEFAULT_PROPOSAL.rationale);
  const [goal,setGoal]=useState('Propose a useful comparison of stimulus levels with a control. Explain what we can learn and what this model cannot establish.');
  const [bundle,setBundle]=useState<Bundle|null>(null),[report,setReport]=useState(''),[agent,setAgent]=useState<AgentResult|null>(null);
  const [busy,setBusy]=useState<'run'|'agent'|null>(null),[error,setError]=useState(''),[verified,setVerified]=useState<boolean|null>(null);
  const inFlight=useRef(false);
  function proposal() { return validateProposal({parameter,values:values.split(',').map(v=>v.trim()?Number(v):NaN),duration,rationale}); }
  function invalidate(){setBundle(null);setReport('');setAgent(null);setVerified(null);setError('');}
  function applyProposal(p:LabProposal){invalidate();setParameter(p.parameter);setValues(p.values.join(', '));setDuration(p.duration);setRationale(p.rationale);}
  async function request(action:'run'|'agent') {
    if(inFlight.current)return;inFlight.current=true;setError('');setBusy(action);
    try {
      const protocol=proposal();
      const response=await fetch('/api/virtual-lab',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${accessToken}`},body:JSON.stringify({action,protocol,goal,approved:Boolean(bundle)})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Lab action failed.');
      if(action==='run'){setBundle(data.bundle);setReport(data.report);setAgent(null);setVerified(null);}
      else {setAgent(data);}
    }catch(cause){setError(cause instanceof Error?cause.message:'Lab action failed.');}
    finally{inFlight.current=false;setBusy(null);}
  }
  async function verify(){if(!bundle)return;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJson(bundle.payload)));setVerified(Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===bundle.sha256);}
  const runs=bundle?.payload.runs||[],maxY=Math.max(1,...runs.flatMap(r=>r.points.map(p=>p.protein)));
  return <div className="grid min-w-0 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]" data-ph-mask="true" data-ph-no-capture="true">
    <aside className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Protocol · MODEL_ASSUMPTION</p><h2 className="mt-2 text-xl font-semibold">Design the experiment</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sweep one assumed parameter. Execution starts only when you approve the displayed protocol.</p></div>
      <fieldset disabled={Boolean(busy)} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Sweep parameter<select value={parameter} onChange={e=>{invalidate();const p=e.target.value as SweepParameter;setParameter(p);setValues(p==='concentration'?'0, 1, 5':'0.1, 0.5, 1');}} className="mt-2 w-full rounded-lg border border-slate-300 p-2">{Object.entries(PARAMS).map(([id,p])=><option key={id} value={id}>{p.label} ({p.unit})</option>)}</select></label>
        <label className="block text-sm font-medium">Values ({PARAMS[parameter].unit})<input value={values} onChange={e=>{invalidate();setValues(e.target.value);}} className="mt-2 w-full rounded-lg border border-slate-300 p-2"/><span className="mt-1 block text-xs text-slate-500">2–5 distinct values, {PARAMS[parameter].min}–{PARAMS[parameter].max}; separated by commas.</span></label>
        <label className="block text-sm font-medium">Duration (hours)<input type="number" min={1} max={72} value={duration} onChange={e=>{invalidate();setDuration(Number(e.target.value));}} className="mt-2 w-full rounded-lg border border-slate-300 p-2"/></label>
        <p className="text-xs leading-5 text-slate-500">Both states start at zero. Basal transcription 1; mRNA decay 0.5/h; translation 2/h; protein decay 0.1/h; induction 2; EC50 1 µM; stimulus 1 µM, except the swept parameter. Browser adaptation of the reference model.</p>
        <button type="button" onClick={()=>applyProposal(DEFAULT_PROPOSAL)} className="text-sm font-semibold text-blue-700">Use reference protocol</button>
      </fieldset>
      <p className="text-sm leading-6 text-slate-600">{rationale}</p>
      <button type="button" onClick={()=>void request('run')} disabled={Boolean(busy)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-semibold text-white disabled:opacity-50"><Play size={16}/>{busy==='run'?'Running solver…':'Approve & run experiment'}</button>
      <div className="border-t border-slate-200 pt-5"><h3 className="flex items-center gap-2 font-semibold"><Sparkles size={16}/> Research assistant</h3><p className="mt-2 text-xs leading-5 text-slate-500">Groq can inspect this environment, propose a protocol and draft an interpretation. It cannot operate hardware or turn simulations into measurements. One AI action uses one lab AI allowance.</p><label className="mt-3 block text-sm font-medium">Research brief<textarea value={goal} maxLength={4000} disabled={Boolean(busy)} onChange={e=>setGoal(e.target.value)} className="mt-2 h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"/></label>
        <button type="button" onClick={()=>void request('agent')} disabled={Boolean(busy)||!goal.trim()} className="mt-3 min-h-11 w-full rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800 disabled:opacity-50">{busy==='agent'?'Agent using tools…':bundle?'Ask AI to inspect results':'Ask AI to propose a plan'}</button>
      </div>
      {error&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      <p className="text-xs leading-5 text-slate-500">Each account can request up to 8 solver runs and 8 AI actions per hour in this demo.</p>
    </aside>
    <div className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><FlaskConical size={20}/> Simulation workbench</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{bundle?'SIMULATED':'Awaiting approval'}</span></div>
        {bundle?<><p className="mt-2 text-sm text-slate-600">Protein trajectory · normalized abundance · {duration} hours</p><svg viewBox="0 0 640 280" className="mt-4 w-full" role="img" aria-label="Protein abundance trajectories for the approved parameter sweep"><line x1="45" y1="235" x2="610" y2="235" stroke="#cbd5e1"/><line x1="45" y1="20" x2="45" y2="235" stroke="#cbd5e1"/>{[0,0.5,1].map(v=><g key={v}><text x="38" y={239-v*210} textAnchor="end" fontSize="11" fill="#64748b">{(v*maxY).toFixed(1)}</text><line x1="45" x2="610" y1={235-v*210} y2={235-v*210} stroke="#e2e8f0"/></g>)}{runs.map((r,i)=><polyline key={r.value} fill="none" stroke={colors[i]} strokeWidth="2.5" points={r.points.map(p=>`${45+p.time/duration*565},${235-p.protein/maxY*210}`).join(' ')}/>)}<text x="45" y="257" fontSize="11" fill="#64748b">0 h</text><text x="610" y="257" textAnchor="end" fontSize="11" fill="#64748b">{duration} h</text></svg>
        <div className="flex flex-wrap gap-4 text-xs">{runs.map((r,i)=><span key={r.value} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:colors[i]}}/>{PARAMS[parameter].label} {r.value} {PARAMS[parameter].unit}</span>)}</div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Final simulated abundances</caption><thead><tr className="border-b border-slate-200"><th className="p-2">Sweep value</th><th className="p-2">mRNA</th><th className="p-2">Protein</th></tr></thead><tbody>{runs.map(r=><tr key={r.value} className="border-b border-slate-100"><td className="p-2">{r.value}</td><td className="p-2">{r.finalMrna.toFixed(4)}</td><td className="p-2">{r.finalProtein.toFixed(4)}</td></tr>)}</tbody></table></div></>:<div className="flex min-h-60 flex-col items-center justify-center text-center"><FlaskConical size={32} className="text-blue-300"/><p className="mt-4 font-semibold">A real calculation, with visible assumptions.</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Approve a protocol to run the reference equations, compare trajectories and create a reproducible evidence export.</p></div>}
      </section>
      {agent&&<section aria-label="Lab agent activity" className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold">AI activity · Groq</h2><ol className="mt-3 space-y-2">{agent.trace.map((step,i)=><li key={i} className="rounded-lg bg-white p-3 text-xs"><strong className={step.status==='rejected'?'text-amber-700':'text-blue-700'}>{step.tool} · {step.status}</strong><p className="mt-1 text-slate-600">{step.summary}</p></li>)}</ol><div className="mt-4"><AssistantMessage text={agent.answer}/></div>{agent.proposal&&<div className="mt-4 rounded-xl border border-blue-200 bg-white p-4"><h3 className="text-sm font-semibold">Proposed protocol · not executed</h3><p className="mt-2 text-sm">{PARAMS[agent.proposal.parameter].label}: {agent.proposal.values.join(', ')} · {agent.proposal.duration} hours</p><p className="mt-2 text-xs leading-5 text-slate-600">{agent.proposal.rationale}</p><button type="button" disabled={Boolean(busy)} onClick={()=>applyProposal(validateProposal(agent.proposal))} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Use proposal for review</button></div>}{agent.report&&<div className="mt-4"><AssistantMessage text={agent.report}/><button type="button" onClick={()=>download('lab-ai-interpretation.md','text/markdown',agent.report!)} className="mt-3 text-sm font-semibold text-blue-700">Export AI interpretation</button></div>}</section>}
      {bundle&&<section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Evidence & report</h2><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={()=>download('gic-lab-evidence.json','application/json',JSON.stringify(bundle,null,2))} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold"><Download size={15}/>Export evidence JSON</button><button type="button" onClick={()=>download('gic-lab-report.md','text/markdown',report)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold">Export report</button><button type="button" onClick={()=>void verify()} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold"><ShieldCheck size={15}/>Verify checksum</button></div>{verified!==null&&<p role="status" className="mt-3 text-sm">{verified?'Checksum matches the current exported payload.':'Checksum mismatch: payload changed.'}</p>}<p className="mt-3 break-all font-mono text-[10px] text-slate-500">SHA-256 {bundle.sha256}</p><p className="mt-2 text-xs leading-5 text-slate-500">Portable browser-demo JSON with a content checksum. This is not a signed .vlab bundle or a hardware measurement.</p><div className="mt-5"><AssistantMessage text={report}/></div></section>}
      <p className="text-xs leading-6 text-slate-500">{LAB_LIMITATIONS} <a href={LAB_SOURCE} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700">Inspect the source equations.</a></p>
    </div>
  </div>;
}
