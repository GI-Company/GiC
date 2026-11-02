'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity, ArrowRight, Atom, BookOpenText, CheckCircle2, CircleHelp,
  ClipboardList, Database, FileChartColumn, FileSearch, FlaskConical,
  FolderOpen, LayoutDashboard, LockKeyhole, Monitor, PanelLeft, ShieldCheck,
  Sparkles, Waves, type LucideIcon,
} from 'lucide-react';
import ScientificCockpit, { type CockpitTab } from './ScientificCockpit';
import ResearchWorkspace from './ResearchWorkspace';
import VirtualLabFreeWorkbench from './VirtualLabFreeWorkbench';
import LaboratoryPilotPlanner from './LaboratoryPilotPlanner';
import { setWorkspaceAnalytics } from '@/lib/workspace-privacy';
import {
  cockpitSections, studioAvailability, studioModules,
  type StudioAvailability, type StudioSection, type StudioTier,
} from '@/lib/virtual-lab-studio';

type AccountState = 'guest' | 'free' | 'allowed' | 'error';
const icons: Record<StudioSection, LucideIcon> = {
  overview: LayoutDashboard, free: FlaskConical, simulation: Sparkles,
  structure: Atom, rhodopsin: Activity, optics: Waves, mass: FileChartColumn,
  instrument: FileSearch, notebook: BookOpenText, projects: FolderOpen,
  laboratory: ClipboardList, desktop: Monitor,
};
const groupNames = {
  START: 'Workspace',
  EXPERIMENT: 'Scientific tools',
  EVIDENCE: 'Research records',
  ADVANCED: 'Laboratory & desktop',
} as const;
const groups = ['START','EXPERIMENT','EVIDENCE','ADVANCED'] as const;
const descriptions: Record<StudioSection, string> = {
  overview: 'Your scientific research environment and available capabilities.',
  free: 'A deterministic reference calculation running entirely in this browser.',
  simulation: 'Review assumed parameters, approve RK4 experiments and use bounded AI assistance.',
  structure: 'Navigate tissue and cellular representations and view curated reference structures.',
  rhodopsin: 'Explore an assumed four-state numerical kinetics model.',
  optics: 'Generate illustrative optical frames and inspect synthetic packet outputs.',
  mass: 'Calculate a precursor isotope distribution from a molecular formula.',
  instrument: 'Inspect numeric CSV or JSONL data on this device without uploading the file.',
  notebook: 'Review simulation records, imported-file provenance and session evidence.',
  projects: 'Read projects, experiments, campaign summaries and verified reports from a qualified private host.',
  laboratory: 'Prepare a review-ready, local laboratory pilot protocol without performing experiments.',
  desktop: 'See how the browser surface relates to the native Qt research workstations.',
};
const title: Record<StudioSection, string> = {
  overview:'Research overview', free:'Free numerical laboratory',
  simulation:'Reference simulation & AI', structure:'Multi-scale biology',
  rhodopsin:'Rhodopsin model', optics:'Optical experimentation',
  mass:'Virtual mass spectrometry', instrument:'Local instrument data analysis',
  notebook:'Evidence notebook', projects:'Private research projects',
  laboratory:'Laboratory pilot planner', desktop:'Desktop VirtualLab & integration',
};
const tierNames: Record<StudioTier,string> = {free:'Free',researcher:'Researcher',laboratory:'Laboratory'};
const activeTools = studioModules.filter(m => cockpitSections.has(m.id));
const isCockpit = (section: StudioSection): section is CockpitTab => cockpitSections.has(section);

export default function VirtualLabStudio({
  tier, accountState, accessToken, privateReaderEnabled, accessError,
}: {
  tier: StudioTier; accountState: AccountState; accessToken: string | null;
  privateReaderEnabled: boolean; accessError?: string;
}) {
  const [section, setSection] = useState<StudioSection>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const availability = studioAvailability(tier, section, privateReaderEnabled);
  const paid = tier !== 'free' && accountState === 'allowed' && Boolean(accessToken);
  const role = accountState === 'allowed' ? tierNames[tier] : accountState === 'guest' ? 'Guest · Free'
    : accountState === 'free' ? 'GIC Free' : 'Free · Access unverified';
  useEffect(() => {
    // Research project names/metadata must not be included in behavioral analytics.
    // Once a private view opens, remain opted out during this lab session.
    if (section === 'projects') setWorkspaceAnalytics(false);
  }, [section]);

  function open(sectionId: StudioSection) {
    setSection(sectionId);
    setMobileMenu(false);
  }
  const explanation = (state: StudioAvailability) => state === 'upgrade'
    ? section === 'laboratory'
      ? 'This local protocol planner is reserved for an active VirtualLab Laboratory subscription. Existing general GIC plans still have their previously supported scientific cockpit access.'
      : 'Sign in with a qualifying GIC subscription or an active VirtualLab Researcher/Laboratory plan to use the paid scientific cockpit.'
    : 'This view requires a separately qualified private research host with account/project grants. It is not activated by a website build or subscription alone.';

  return <div className="min-w-0 bg-[#f5f8fd] pb-12 text-slate-950" data-ph-mask="true" data-ph-no-capture="true">
    <div className="mx-auto max-w-[1550px] px-3 pt-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-700 text-white"><Atom size={23}/></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-blue-700">Global Intent Company / VirtualLab</p>
            <p className="text-lg font-semibold tracking-tight">Scientific research workspace</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">{role} access</span>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">Research beta</span>
          <Link href="/virtual-lab/plans" className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white">Compare tiers</Link>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-5">
          <button type="button" onClick={()=>setMobileMenu(v=>!v)} aria-expanded={mobileMenu}
            aria-controls="virtual-lab-studio-nav" className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold lg:hidden">
            <span className="flex items-center gap-2"><PanelLeft size={18}/> Workspace navigation</span>
            <span className="text-blue-700">{mobileMenu?'Hide':'Show'}</span>
          </button>
          <nav id="virtual-lab-studio-nav" aria-label="VirtualLab scientific workspaces"
            className={mobileMenu ? 'mt-3 block' : 'hidden lg:block'}>
            {groups.map(group => <div key={group} className="mb-4">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">{groupNames[group]}</p>
              <div className="space-y-1">{studioModules.filter(m=>m.group===group).map(m=>{
                const Icon = icons[m.id];
                const status = studioAvailability(tier, m.id, privateReaderEnabled);
                const current = section === m.id;
                return <button key={m.id} type="button" aria-current={current?'page':undefined}
                  onClick={()=>open(m.id)}
                  className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                    (current?'bg-blue-700 text-white':'text-slate-700 hover:bg-slate-100')}>
                  <Icon size={18} className="shrink-0"/>
                  <span className="min-w-0 flex-1">{m.label}</span>
                  {status !== 'open' && <LockKeyhole size={13} className="shrink-0 opacity-60" aria-label={status==='upgrade'?'Requires another tier':'Private host not enabled'}/>}
                </button>;
              })}</div>
            </div>)}
          </nav>
          <div className="hidden rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 lg:block">
            <ShieldCheck size={18} className="mb-2 text-emerald-700"/>
            **Research integrity**
            <p className="mt-1">SIMULATED is not MEASURED. Imported data remains unverified until its source is established.</p>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-7">
            <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-700">VirtualLab / {tierNames[tier]}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title[section]}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{descriptions[section]}</p>
            </div>
            {section !== 'overview' && <button type="button" onClick={()=>open('overview')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-800">Back to overview</button>}
          </div>

          {section==='overview' && <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-100 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">One workspace · Multiple scientific tools</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">From assumptions to inspectable evidence.</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">Navigate numerical studies, cell and structure viewers, optical demonstrations, isotope calculations, imported numeric data and research records from one light-mode workspace. Access depends on your verified subscription and the service behind each tool.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={()=>open(paid?'simulation':'free')} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white">
                      {paid?'Open research workbench':'Start free experiment'} <ArrowRight size={16}/>
                    </button>
                    <button type="button" onClick={()=>open('desktop')} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">Desktop comparison</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:w-60">
                  <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-blue-700">{activeTools.length}</p><p className="text-xs text-slate-500">Scientific modules</p></div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-blue-700">3</p><p className="text-xs text-slate-500">Access tiers</p></div>
                  <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-600">Explicit approval · Evidence labels · SHA-256 checks</div>
                </div>
              </div>
            </div>
            {accessError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Paid access verification is unavailable: {accessError}. The local Free experiment remains available.</p>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {studioModules.filter(m=>m.id!=='overview').map(m=>{
                const Icon=icons[m.id], state=studioAvailability(tier,m.id,privateReaderEnabled);
                return <button key={m.id} type="button" onClick={()=>open(m.id)}
                  className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30">
                  <div className="flex w-full items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={21}/></span>
                    <span className={'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide '+(state==='open'?'bg-emerald-50 text-emerald-800':'bg-slate-100 text-slate-500')}>
                      {state==='open'?'Available':state==='upgrade'?'Tier locked':'Host off'}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold">{m.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{m.description}</p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-semibold text-blue-700">Inspect workspace <ArrowRight size={14}/></span>
                </button>;
              })}
            </div>
          </div>}

          {section==='free' && <VirtualLabFreeWorkbench/>}

          {paid && <div className={isCockpit(section)?'block':'hidden'} aria-hidden={!isCockpit(section)}>
            <ScientificCockpit accessToken={accessToken!} activeTab={isCockpit(section)?section:undefined}
              onTabChange={next=>setSection(next)} embedded/>
          </div>}

          {section==='projects' && availability==='open' && <ResearchWorkspace/>}
          {section==='laboratory' && availability==='open' && <LaboratoryPilotPlanner/>}

          {section==='desktop' && <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-xl font-semibold">Desktop architecture in the browser</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">VirtualLab desktop is a separate Python/Qt application. The browser reuses supported numerical and evidence concepts; it does not run the native Qt software or directly open desktop SQLite workspaces.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ['Browser calculation','Available','Free numerical parameter sweep, plus the qualified paid simulations.'],
                  ['Research navigation','Available','Shared light-mode navigation around supported browser tools.'],
                  ['Evidence and imports','Available','Session notebook, calculated spectra and local numeric file inspection for paid users.'],
                  ['Hosted ResearchEngine','Private gate','Requires a separately qualified host and explicit project permissions.'],
                  ['Desktop pairing and sync','Not connected','No silent local-file transfer, shared database or desktop pairing.'],
                  ['Native instruments and signed builds','Desktop qualification','Requires supported hardware, OS acceptance and independently reviewed installers.'],
                ].map(([name,status,description])=><div key={name} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2"><strong className="text-sm">{name}</strong><span className="text-[10px] font-semibold uppercase text-blue-700">{status}</span></div>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{description}</p>
                </div>)}
              </div>
              <div className="mt-6 flex flex-wrap gap-3"><Link href="/virtual-lab/beta" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white">Desktop beta & feedback <ArrowRight size={16}/></Link><Link href="/virtual-lab/plans" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">Feature plans</Link></div>
            </div>
          </section>}

          {section!=='overview' && section!=='free' && section!=='desktop' && availability!=='open' && <section className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-600">{availability==='upgrade'?<LockKeyhole/>:<Database/>}</span>
            <h2 className="mt-5 text-xl font-semibold">{availability==='upgrade'?'This workspace requires a higher tier':'Private research host not active'}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{explanation(availability)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {availability==='upgrade' && accountState==='guest' && <Link href="/intent?signin=1&return_to=virtual-lab-demo" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white">Sign in to GIC</Link>}
              {availability==='upgrade' && <Link href="/virtual-lab/plans" className="rounded-xl border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700">Compare plans</Link>}
              <button type="button" onClick={()=>open(tier==='free'?'free':'simulation')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">Open an available tool</button>
            </div>
          </section>}

          <footer className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-500">
            <div className="flex items-start gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700"/> Checksums establish byte integrity, not scientific validation.</div>
            <div className="flex items-start gap-2"><CircleHelp size={17} className="mt-0.5 shrink-0"/> Imported data and outputs keep their actual epistemic status.</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/> Unavailable features are never simulated as active backend services.</div>
          </footer>
        </main>
      </div>
    </div>
  </div>;
}
