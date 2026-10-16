
'use client';
import dynamic from 'next/dynamic';
import { useMemo, useState, type FormEvent } from 'react';
import { Activity, Atom, Database, Download, FlaskConical, Microscope, ShieldCheck, Sparkles } from 'lucide-react';
import VirtualLabWorkbench from './VirtualLabWorkbench';
import { calculateIsotopeEnvelope, type MassSpectrum } from '@/lib/virtual-lab-mass-spec';
import { parseInstrumentText, instrumentStatistics, type InstrumentImport } from '@/lib/virtual-lab-instruments';

const StructureViewer=dynamic(()=>import('./StructureViewer'),{ssr:false,loading:()=> <div className="rounded-xl bg-slate-100 p-8 text-sm">Initializing structure viewer…</div>});
type Tab='simulation'|'structure'|'mass'|'instrument'|'notebook';
type Event={id:string;kind:string;state:'SIMULATED'|'UNKNOWN'|'INFERRED';summary:string;time:string;payload:unknown};
const tabs:Array<{id:Tab;label:string;subtitle:string}>=[
 {id:'simulation',label:'Simulation & AI',subtitle:'RK4 · Google Gemini'},
 {id:'structure',label:'3D molecular world',subtitle:'Experimental coordinates'},
 {id:'mass',label:'Virtual mass spec',subtitle:'Isotope convolution'},
 {id:'instrument',label:'Instrument analysis',subtitle:'Local CSV and JSONL'},
 {id:'notebook',label:'Evidence notebook',subtitle:'Source and context'}
];
function download(name:string,data:string,type='application/json'){
 const url=URL.createObjectURL(new Blob([data],{type})),anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function sha256(text:string){
 const bytes=new TextEncoder().encode(text),hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
 return Array.from(hash,v=>v.toString(16).padStart(2,'0')).join('');
}
function IsotopePlot({spectrum}:{spectrum:MassSpectrum}){
 const peaks=spectrum.peaks,min=peaks[0]?.mz??0,max=peaks[peaks.length-1]?.mz??1,span=Math.max(0.2,max-min);
 return <figure className="min-w-0 rounded-xl bg-slate-950 p-3 sm:p-5">
  <svg viewBox="0 0 800 270" className="w-full" role="img" aria-label="Calculated isotopic peak intensity versus mass-to-charge ratio">
   {[0,25,50,75,100].map(v=><g key={v}><line x1="50" x2="770" y1={230-v*1.9} y2={230-v*1.9} stroke="#334155"/><text x="42" y={234-v*1.9} textAnchor="end" fill="#cbd5e1" fontSize="12">{v}%</text></g>)}
   {peaks.map(p=>{const x=50+(p.mz-min)/span*715;return <line key={p.nominal_shift} x1={x} x2={x} y1="230" y2={230-p.relative_intensity*1.9} stroke="#38bdf8" strokeWidth="4"/>;})}
   <text x="50" y="258" fill="#cbd5e1" fontSize="12">{min.toFixed(4)} m/z</text><text x="770" y="258" textAnchor="end" fill="#cbd5e1" fontSize="12">{max.toFixed(4)} m/z</text>
  </svg>
  <figcaption className="mt-2 text-xs text-slate-300">SIMULATED precursor isotope envelope. No physical mass-spectrometry signal is being captured.</figcaption>
 </figure>;
}
function ImportedSignal({data,channel}:{data:InstrumentImport;channel:string}){
 const entries=data.readings.filter(r=>r.channel===channel);if(!entries.length)return null;
 const minX=Math.min(...entries.map(x=>x.time)),maxX=Math.max(...entries.map(x=>x.time));
 const minY=Math.min(...entries.map(x=>x.value)),maxY=Math.max(...entries.map(x=>x.value));
 const pts=entries.filter((_,i)=>i%Math.max(1,Math.ceil(entries.length/750))===0);
 const points=pts.map(r=>String(50+(r.time-minX)/Math.max(1e-8,maxX-minX)*690)+','+String(229-(r.value-minY)/Math.max(1e-8,maxY-minY)*195)).join(' ');
 return <figure className="rounded-xl bg-slate-950 p-3"><svg viewBox="0 0 790 265" className="w-full" role="img" aria-label={'Imported numeric channel '+channel}>
  <line x1="50" x2="740" y1="230" y2="230" stroke="#94a3b8"/><line x1="50" x2="50" y1="25" y2="230" stroke="#94a3b8"/>
  <polyline points={points} fill="none" stroke="#4ade80" strokeWidth="2"/>
  <text x="50" y="255" fontSize="12" fill="#cbd5e1">{minX.toFixed(2)}</text><text x="740" y="255" textAnchor="end" fontSize="12" fill="#cbd5e1">{maxX.toFixed(2)} time units</text>
  <text x="43" y="30" textAnchor="end" fontSize="11" fill="#cbd5e1">{maxY.toPrecision(3)}</text>
 </svg><figcaption className="mt-2 text-xs text-slate-300">File-import plot · source UNKNOWN · not authenticated hardware telemetry.</figcaption></figure>;
}
export default function ScientificCockpit({accessToken}:{accessToken:string}){
 const [tab,setTab]=useState<Tab>('simulation');
 const [formula,setFormula]=useState('C20H28O'),[charge,setCharge]=useState(1),[spectrum,setSpectrum]=useState<MassSpectrum|null>(null),[massError,setMassError]=useState('');
 const [instrument,setInstrument]=useState<InstrumentImport|null>(null),[filename,setFilename]=useState(''),[fileHash,setFileHash]=useState(''),[channel,setChannel]=useState(''),[instrumentError,setInstrumentError]=useState('');
 const [events,setEvents]=useState<Event[]>([]),[note,setNote]=useState(''),[exportHash,setExportHash]=useState('');
 const channelReadings=useMemo(()=>instrument?.readings.filter(r=>r.channel===channel)||[],[instrument,channel]);
 const stats=useMemo(()=>channelReadings.length?instrumentStatistics(channelReadings):null,[channelReadings]);
 function record(kind:string,state:Event['state'],summary:string,payload:unknown){
  setEvents(previous=>[...previous,{id:crypto.randomUUID(),kind,state,summary,payload,time:new Date().toISOString()}].slice(-200));
  setExportHash('');
 }
 function massRun(event:FormEvent){
  event.preventDefault();setMassError('');
  try{
   const result=calculateIsotopeEnvelope(formula.trim(),charge);
   setSpectrum(result);record('Isotope envelope','SIMULATED',result.formula+' · charge +'+charge+' · '+result.peaks.length+' clusters',result);
  }catch(error){setSpectrum(null);setMassError(error instanceof Error?error.message:'Calculation failed.');}
 }
 async function importFile(file?:File){
  if(!file)return;setInstrumentError('');setInstrument(null);setFileHash('');
  try{
   if(file.size>2000000)throw new Error('Maximum supported file size is 2 MB.');
   const source=await file.text(),parsed=parseInstrumentText(source,file.name);
   const bytes=await file.arrayBuffer();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   setInstrument(parsed);setFilename(file.name);setFileHash(hash);setChannel(parsed.channels[0]);
   record('Instrument import','UNKNOWN',file.name+' · '+parsed.readings.length+' readings · '+parsed.rejected+' rejected',{filename:file.name,sha256:hash,format:parsed.format,channels:parsed.channels,units:parsed.units,count:parsed.readings.length});
  }catch(error){setInstrumentError(error instanceof Error?error.message:'Import failed.');}
 }
 async function notebookExport(){
  const payload={format:'gic-scientific-cockpit-notebook-v1',created:new Date().toISOString(),source_notice:'SHA-256 does not prove the origin of imported data. Not an Ed25519-signed .vlab bundle.',events};
  const value=JSON.stringify(payload),hash=await sha256(value);
  setExportHash(hash);download('gic-virtual-lab-notebook.json',JSON.stringify({payload,sha256:hash},null,2));
 }
 return <section className="min-w-0 space-y-5 text-slate-950" data-ph-mask="true" data-ph-no-capture="true">
  <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Global Intent Company · Virtual Lab</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Scientific research cockpit</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Real mathematical computation, experimental structure coordinates, instrument-file interpretation, and Gemini-assisted experiment planning in one workbench.</p></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold">Research beta · human review required</span></div>
   <div className="mt-5 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-3 text-xs"><Activity size={18} className="mb-2 text-blue-600"/><strong>SIMULATED</strong><p className="mt-1 text-slate-600">Deterministic RK4 and isotope calculations</p></div><div className="rounded-xl bg-indigo-50 p-3 text-xs"><Atom size={18} className="mb-2 text-indigo-600"/><strong>REFERENCE</strong><p className="mt-1 text-slate-600">RCSB experimentally determined coordinates</p></div><div className="rounded-xl bg-amber-50 p-3 text-xs"><ShieldCheck size={18} className="mb-2 text-amber-700"/><strong>UNKNOWN</strong><p className="mt-1 text-slate-600">Imported files pending external provenance review</p></div></div>
  </header>
  <nav aria-label="Lab workspaces" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2" role="tablist">
   {tabs.map(t=><button key={t.id} type="button" role="tab" id={'lab-tab-'+t.id} aria-controls={'lab-panel-'+t.id} aria-selected={tab===t.id} onClick={()=>setTab(t.id)} className={'min-w-36 shrink-0 rounded-lg px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-blue-700 '+(tab===t.id?'bg-blue-700 text-white':'bg-slate-50 hover:bg-slate-100')}><strong className="block text-xs">{t.label}</strong><span className="mt-1 block text-[11px] opacity-75">{t.subtitle}</span></button>)}
  </nav>
  <div role="tabpanel" id={'lab-panel-'+tab} aria-labelledby={'lab-tab-'+tab} className="min-w-0">
   <div hidden={tab!=='simulation'}><VirtualLabWorkbench accessToken={accessToken} onEvidence={e=>record('RK4 experiment','SIMULATED',e.protocol.parameter+' · '+e.runs+' trajectories · '+e.sha256.slice(0,12)+'…',e)}/></div>
   {tab==='structure'&&<StructureViewer accessToken={accessToken}/>}
   {tab==='mass'&&<section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h3 className="flex items-center gap-2 text-lg font-semibold"><FlaskConical size={20}/> Isotope-envelope calculator</h3>
    <p className="text-sm text-slate-600">Convolve actual isotope masses and approximate natural abundances. This calculates a molecular precursor envelope from a known formula; it cannot identify a compound in a sample.</p>
    <form onSubmit={massRun} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="text-sm font-medium">CHNO formula<input required maxLength={80} value={formula} onChange={e=>setFormula(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-3 font-mono"/></label><label className="text-sm font-medium">Positive charge<select value={charge} onChange={e=>setCharge(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-300 p-3">{[1,2,3,4,5].map(v=><option key={v} value={v}>+{v}</option>)}</select></label><button className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Calculate</button></form>
    <div className="flex flex-wrap gap-2">{[['Retinal','C20H28O'],['Caffeine','C8H10N4O2'],['Glucose','C6H12O6']].map(([label,chemical])=><button key={chemical} type="button" onClick={()=>setFormula(chemical)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">{label} · {chemical}</button>)}</div>
    {massError&&<p role="alert" className="text-sm text-red-700">{massError}</p>}
    {spectrum&&<><div className="grid gap-3 sm:grid-cols-3">{[['Monoisotopic m/z',spectrum.monoisotopic_mz.toFixed(6)],['Peak clusters',String(spectrum.peaks.length)],['Probability retained',(100*spectrum.displayed_probability).toFixed(3)+'%']].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-mono text-lg font-semibold">{value}</p></div>)}</div><IsotopePlot spectrum={spectrum}/><div className="max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead><tr className="bg-slate-100"><th className="p-2">Nominal shift</th><th className="p-2">m/z</th><th className="p-2">Intensity</th><th className="p-2">Probability</th></tr></thead><tbody>{spectrum.peaks.map(p=><tr key={p.nominal_shift} className="border-t border-slate-100"><td className="p-2">{p.nominal_shift}</td><td className="p-2 font-mono">{p.mz.toFixed(6)}</td><td className="p-2">{p.relative_intensity.toFixed(3)}%</td><td className="p-2">{p.probability.toExponential(3)}</td></tr>)}</tbody></table></div><button type="button" onClick={()=>download('isotope-envelope-'+spectrum.formula+'.json',JSON.stringify(spectrum,null,2))} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><Download size={16}/> Export spectrum</button><p className="text-xs leading-5 text-slate-600">{spectrum.limitations}</p></>}
   </section>}
   {tab==='instrument'&&<section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h3 className="flex items-center gap-2 text-lg font-semibold"><Microscope size={20}/> Instrument data inspector</h3><p className="text-sm text-slate-600">Load CSV or JSONL locally. Recognized columns include value, reading, intensity or voltage, with optional time/channel/unit. No upload to Gemini or the GIC server.</p>
    <label className="block rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold">Select numeric dataset, up to 2 MB<input type="file" accept=".csv,.jsonl,text/csv,application/x-ndjson" className="mt-3 block w-full text-xs" onChange={e=>void importFile(e.target.files?.[0])}/></label>
    {instrumentError&&<p role="alert" className="text-sm text-red-700">{instrumentError}</p>}
    {instrument&&<><p className="text-sm"><strong>{filename}</strong> · {instrument.readings.length} parsed readings · {instrument.rejected} rejected · {instrument.format}</p><p className="break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">SHA-256: {fileHash}</p><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><strong>UNKNOWN provenance:</strong> Fingerprints only verify identical file bytes. This is not verified physical measurement or a live Sensor Node connection.</p>
     <label className="block text-sm font-semibold">Inspect channel<select value={channel} onChange={e=>setChannel(e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3">{instrument.channels.map(c=><option key={c}>{c}</option>)}</select></label>
     {stats&&<div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{Object.entries(stats).map(([key,val])=><div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{key.replaceAll('_',' ')}</p><p className="mt-1 font-mono font-semibold">{val.toPrecision(5)}</p></div>)}</div>}
     <ImportedSignal data={instrument} channel={channel}/><p className="text-xs text-slate-600">Units supplied: {instrument.units.join(', ')}. Unit conversion and source attestation are not inferred.</p></>}
   </section>}
   {tab==='notebook'&&<section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h3 className="flex items-center gap-2 text-lg font-semibold"><Database size={20}/> Research notebook</h3><p className="text-sm text-slate-600">A session-level record of simulated runs, locally inspected imports and researcher notes. Exports are hashed but not signed .vlab evidence bundles.</p>
    <div className="flex flex-wrap gap-2"><button disabled={!events.length} onClick={()=>void notebookExport()} type="button" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Download size={16}/> Export with SHA-256</button><button type="button" onClick={()=>{setEvents([]);setExportHash('');}} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Clear session</button></div>
    {exportHash&&<p className="break-all font-mono text-xs">Export SHA-256: {exportHash}</p>}
    <form onSubmit={e=>{e.preventDefault();if(note.trim()){record('Research note','INFERRED',note.trim().slice(0,200),{text:note.trim()});setNote('');}}} className="space-y-2"><label className="block text-sm font-semibold">Research note<textarea rows={3} maxLength={3000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3"/></label><button disabled={!note.trim()} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 disabled:opacity-50" type="submit">Add note</button></form>
    {events.length===0?<p className="rounded-lg bg-slate-50 p-5 text-sm">No notebook entries yet. Run a simulation, calculate an isotope spectrum, or import data.</p>:<ol className="space-y-3">{events.slice().reverse().map(e=><li key={e.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap gap-3 text-xs"><strong className="text-blue-800">{e.kind}</strong><span className="text-amber-800">{e.state}</span><time className="text-slate-500">{e.time}</time></div><p className="mt-2 break-words text-sm">{e.summary}</p></li>)}</ol>}
   </section>}
  </div>
  <footer className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600"><ShieldCheck size={16}/> Research status is explicit: simulated output is not measured evidence; imported data is unverified. <Sparkles size={16}/> Gemini operates only through existing authenticated, bounded approval-gated tools.</footer>
 </section>;
}
