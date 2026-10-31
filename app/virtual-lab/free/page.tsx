import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
import VirtualLabFreeWorkbench from '@/components/virtual-lab/VirtualLabFreeWorkbench';

export const metadata:Metadata={
  title:'VirtualLab Free — Browser Research Demo',
  description:'Try a free, browser-only scientific parameter sweep with visible assumptions, simulated results, a checksum and downloadable evidence. No account or payment required.',
  alternates:{canonical:'/virtual-lab/free'},
};
export default function FreeLabPage(){
  return <MarketingShell><section className="mx-auto max-w-7xl px-4 py-11 sm:px-6 lg:px-8">
    <Link href="/virtual-lab" className="text-sm font-semibold text-blue-700">← VirtualLab home</Link>
    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">VirtualLab / Free Research Demo</p>
    <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">Explore the research workflow. Free.</h1>
    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Run a deterministic, uncalibrated gene-expression simulation directly in your browser. Compare scenarios, inspect numerical outputs, verify the SHA-256 digest and export a report. No login, subscription, laboratory data or AI provider is required.</p>
    <div className="mt-5 flex flex-wrap gap-4 text-sm"><Link href="/virtual-lab/plans" className="font-semibold text-blue-700 underline">Compare the two paid plans</Link><Link href="/virtual-lab/beta" className="font-semibold text-blue-700 underline">Desktop beta & feedback</Link></div>
    <div className="mt-8"><VirtualLabFreeWorkbench/></div>
    <p className="mt-7 text-sm leading-7 text-slate-600">This free workflow demonstrates reproducible software calculations, not measurement accuracy, biological validation or a signed Genesis Ledger research artifact. ChatGPT integration is a separate MCP service and must pass connection and access-control testing before publication.</p>
  </section></MarketingShell>;
}
