import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
import { Activity, BrainCircuit, Download, FlaskConical, FolderOpen, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'VirtualLab Research — Web, Desktop and ChatGPT',
  description: 'VirtualLab scientific workflows: web simulation, reproducible evidence, experimental desktop workstations and forthcoming ChatGPT integration.',
  alternates: { canonical: '/virtual-lab' },
};
const modules=[
  {title:'Mass spectrometry',description:'Imported spectra, validation, provenance and reports in the desktop beta.',icon:Activity,status:'Desktop beta'},
  {title:'Scientific simulation',description:'Open the unified light-mode VirtualLab studio: Free numerical demonstrations and subscription-gated biological, optical and mass-spec workbenches.',icon:FlaskConical,status:'Web studio'},
  {title:'Project workstations',description:'Domain-based project libraries and experiment evidence. A separate, read-only private web workspace is under review and disabled until a hosted research service is qualified.',icon:FolderOpen,status:'Desktop beta / Private review'},
  {title:'INTENT experimental learning',description:'Guarded prediction and weight updates, distinct from verified measurements.',icon:BrainCircuit,status:'Experimental desktop'},
];
export default function VirtualLabPage(){
 return <MarketingShell>
  <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6">
   <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">Global Intent Company / VirtualLab</p>
    <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Scientific workflows with evidence at every step.</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">A developing research environment spanning web-based simulations, experimental desktop workstations, reproducible artifacts and governed AI integrations. Tools are labeled by their actual availability.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/virtual-lab/free" className="rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Try VirtualLab free</Link><Link href="/virtual-lab/demo" className="rounded-lg border border-slate-500 px-5 py-3 font-semibold">Open VirtualLab studio</Link><Link href="/virtual-lab/plans" className="rounded-lg border border-slate-500 px-5 py-3 font-semibold">VirtualLab plans</Link>{process.env.VLAB_RESEARCH_READER_ENABLED === "true" && <Link href="/virtual-lab/research" className="rounded-lg border border-slate-500 px-5 py-3 font-semibold">Private research workspace</Link>}<Link href="/virtual-lab/beta" className="rounded-lg border border-slate-500 px-5 py-3 font-semibold">Desktop beta & feedback</Link></div>
   </div>
  </section>
  <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><h2 className="text-3xl font-semibold">Choose a research workflow</h2>
    <p className="mt-3 max-w-3xl text-slate-600">The unified browser studio offers Free, Researcher and Laboratory experiences. Supported scientific tools run in the browser; native desktop and private-host features stay separately gated.</p>
    <div className="mt-7 grid gap-4 md:grid-cols-2">{modules.map(item=><article key={item.title} className="rounded-2xl border border-slate-200 p-6">
      <item.icon className="h-7 w-7 text-blue-700"/><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-700">{item.status}</p>
      <h3 className="mt-2 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
    </article>)}</div>
  </section>
  <section className="bg-slate-50 px-4 py-14 sm:px-6"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
   <div><ShieldCheck className="text-emerald-700"/><h2 className="mt-3 text-xl font-semibold">Research integrity</h2><p className="mt-2 text-sm leading-7 text-slate-600">Preserve the distinction between simulations, imported reference data and independently verified measurements.</p></div>
   <div><Download className="text-emerald-700"/><h2 className="mt-3 text-xl font-semibold">Desktop beta & feedback</h2><p className="mt-2 text-sm leading-7 text-slate-600">A single destination for upcoming signed-off Mac builds, checksums, testing instructions and feedback.</p><Link href="/virtual-lab/beta" className="mt-3 inline-block font-semibold text-blue-700">Beta releases →</Link></div>
   <div><BrainCircuit className="text-emerald-700"/><h2 className="mt-3 text-xl font-semibold">ChatGPT integration</h2><p className="mt-2 text-sm leading-7 text-slate-600">The planned VirtualLab MCP integration will expose approved research records and verification tools, not unrestricted computer access. Public publication is subject to plugin review.</p></div>
  </div></section>
 </MarketingShell>;
}
