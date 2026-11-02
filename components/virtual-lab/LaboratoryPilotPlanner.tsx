'use client';

import { useState } from 'react';
import { ClipboardCheck, Download, Plus, Trash2 } from 'lucide-react';

type Step = { id: string; activity: string; review: string };
const initialSteps: Step[] = [
  { id: 'sample', activity: 'Document the approved sample or simulation source', review: 'Source and usage rights confirmed' },
  { id: 'run', activity: 'Specify the intended method and comparison', review: 'Protocol reviewed before execution' },
  { id: 'report', activity: 'Review outputs, limitations and evidence classifications', review: 'Independent reviewer assigned' },
];
const checks = [
  'Project scope and authorized participants are documented',
  'Inputs are synthetic, public, or explicitly cleared for sharing',
  'Measurement claims will require separate provenance review',
  'Acceptance criteria and human review are defined',
];

export default function LaboratoryPilotPlanner() {
  const [project, setProject] = useState('');
  const [objective, setObjective] = useState('');
  const [workflow, setWorkflow] = useState('Mass spectrometry review');
  const [dataOrigin, setDataOrigin] = useState('Synthetic / simulation');
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [confirmed, setConfirmed] = useState<boolean[]>(checks.map(() => false));
  const [notice, setNotice] = useState('');
  const ready = Boolean(project.trim() && objective.trim() && steps.every(s => s.activity.trim()) && confirmed.every(Boolean));

  function addStep() {
    if (steps.length >= 8) return;
    setSteps(old => [...old, { id: crypto.randomUUID(), activity: '', review: '' }]);
    setNotice('');
  }
  function patch(id: string, key: 'activity' | 'review', value: string) {
    setSteps(old => old.map(s => s.id === id ? { ...s, [key]: value } : s));
    setNotice('');
  }
  function download() {
    if (!ready) { setNotice('Complete the scope, steps and review checklist before exporting a draft.'); return; }
    const draft = {
      format: 'gic-virtuallab-pilot-plan-draft-v1',
      state: 'DRAFT_NOT_SUBMITTED',
      created_at: new Date().toISOString(),
      project: project.trim(), objective: objective.trim(), workflow,
      data_origin: dataOrigin,
      steps: steps.map(({ activity, review }, index) => ({ order: index + 1, activity: activity.trim(), review: review.trim() })),
      operator_attestations: checks,
      limitations: [
        'Planning document only: does not run or schedule an experiment',
        'Does not grant hosted-project permission or instrument access',
        'Data integrity checks and model output do not prove experimental or biological validity',
      ],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'virtuallab-pilot-plan-draft.json';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Draft JSON exported to your device. It was not uploaded, submitted or executed.');
  }

  return <section className="space-y-6" data-ph-mask="true" data-ph-no-capture="true">
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-7">
      <div className="flex items-center gap-3"><ClipboardCheck className="text-sky-700"/><h2 className="text-xl font-semibold text-slate-950">Laboratory pilot planner</h2></div>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
        Assemble a review-ready plan using the desktop VirtualLab workflow vocabulary. This is a local draft tool, not a hosted project, credential, campaign execution system, instrument connector or scientific approval.
      </p>
      <p className="mt-3 text-xs font-semibold text-sky-800">LABORATORY TIER · LOCAL DRAFT · NO SERVER STORAGE</p>
    </div>
    <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-7">
      <label className="block text-sm font-semibold">Pilot project
        <input value={project} maxLength={120} onChange={e => { setProject(e.target.value); setNotice(''); }} placeholder="e.g. Antibody HOS comparison" className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal"/>
      </label>
      <label className="block text-sm font-semibold">Research workflow
        <select value={workflow} onChange={e => setWorkflow(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">
          {['Mass spectrometry review','Antibody characterization','Numerical simulation comparison','Evidence and reproducibility review'].map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">Research question or pilot objective
        <textarea rows={3} maxLength={2000} value={objective} onChange={e => { setObjective(e.target.value); setNotice(''); }} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="What will be compared, and what would count as useful evidence?"/>
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">Intended input classification
        <select value={dataOrigin} onChange={e => setDataOrigin(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal">
          {['Synthetic / simulation','Public reference dataset','Authorized nonconfidential import','Not selected — requires review'].map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold">Proposed workflow steps</h3><p className="mt-1 text-sm text-slate-500">A human reviews each step before any future execution.</p></div>
        <button type="button" onClick={addStep} disabled={steps.length >= 8} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-50"><Plus size={16}/> Add step</button>
      </div>
      <div className="mt-5 space-y-3">{steps.map((step, i) => <div key={step.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[28px_1fr_1fr_auto] md:items-start">
        <span className="text-sm font-semibold text-sky-700">{i + 1}.</span>
        <label className="text-xs font-semibold text-slate-600">Activity
          <input value={step.activity} maxLength={240} onChange={e => patch(step.id, 'activity', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm font-normal text-slate-900"/>
        </label>
        <label className="text-xs font-semibold text-slate-600">Human review requirement
          <input value={step.review} maxLength={240} onChange={e => patch(step.id, 'review', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm font-normal text-slate-900"/>
        </label>
        <button type="button" disabled={steps.length === 1} aria-label={'Remove step ' + (i + 1)} onClick={() => setSteps(old => old.filter(s => s.id !== step.id))} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"><Trash2 size={16}/></button>
      </div>)}</div>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h3 className="text-lg font-semibold">Pre-export review</h3>
      <div className="mt-4 space-y-3">{checks.map((text, i) => <label key={text} className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" checked={confirmed[i]} onChange={e => setConfirmed(old => old.map((v,j)=>i===j?e.target.checked:v))} className="mt-1 h-4 w-4 accent-blue-700"/>
        <span>{text}</span>
      </label>)}</div>
      <button type="button" disabled={!ready} onClick={download} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><Download size={17}/> Export local pilot plan JSON</button>
      {notice && <p role="status" className="mt-3 text-sm text-sky-800">{notice}</p>}
      <p className="mt-4 text-xs leading-6 text-slate-500">Do not enter confidential sample records here without an approved data-handling process. This form retains its draft in the current tab only; it does not write to the GIC database or the research service.</p>
    </div>
  </section>;
}
