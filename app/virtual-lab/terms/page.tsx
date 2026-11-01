import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
export const metadata:Metadata={title:'VirtualLab Free Demonstration Terms',description:'Use terms and experimental limitations for VirtualLab Free public simulation and MCP tools.',alternates:{canonical:'/virtual-lab/terms'}};
export default function TermsPage(){return <MarketingShell><section className="mx-auto max-w-3xl px-5 py-14">
<p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Global Intent Company / VirtualLab Free</p>
<h1 className="mt-3 text-4xl font-semibold">Public demonstration terms</h1>
<p className="mt-3 text-sm text-slate-500">Version 1.0 · October 31, 2026</p>
<p className="mt-6 leading-8 text-slate-700">VirtualLab Free provides a public experimental numerical research demonstration. The free browser and MCP tools are offered for educational evaluation of software workflows and can change or become unavailable during beta testing.</p>
<h2 className="mt-8 text-xl font-semibold">Scientific limitations</h2>
<p className="mt-3 leading-7 text-slate-700">Reference calculations are based on assumed parameters, and outputs are labeled SIMULATED. They are not laboratory measurements, calibrated biological models, diagnoses, clinical guidance, regulatory evidence or a substitute for independent scientific assessment. A matching software checksum establishes only that a payload matches its digest; it does not establish scientific correctness.</p>
<h2 className="mt-8 text-xl font-semibold">Permitted use and boundaries</h2>
<p className="mt-3 leading-7 text-slate-700">Do not rely on public demonstration output for patient care, clinical diagnostics, safety-critical systems, physical instrument operation or production laboratory decisions. Do not attempt unauthorized access, circumvent tool restrictions, overload endpoints, or submit sensitive records, credentials or third-party confidential data to the demo.</p>
<h2 className="mt-8 text-xl font-semibold">Availability and separate services</h2>
<p className="mt-3 leading-7 text-slate-700">The public tools are provided on an experimental, as-available basis. The free demonstration does not include access to paid accounts, private research workspaces, desktop laboratory files, model training, hardware control or subscription purchases. Paid software, if offered, has separate checkout disclosures and applicable terms.</p>
<h2 className="mt-8 text-xl font-semibold">Contact</h2>
<p className="mt-3 leading-7 text-slate-700">Questions about these public demo terms may be sent to <a href="mailto:cory.tortorici@globalintentcompany.space?subject=VirtualLab%20Terms" className="text-blue-700 underline">cory.tortorici@globalintentcompany.space</a>. These terms should be reviewed before a wider commercial or laboratory launch.</p>
<p className="mt-8 text-sm"><Link href="/virtual-lab" className="font-semibold text-blue-700 underline">Return to VirtualLab</Link></p>
</section></MarketingShell>}
