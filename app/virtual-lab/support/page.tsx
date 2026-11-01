import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';

export const metadata: Metadata={title:'VirtualLab Free Support',description:'Support and troubleshooting for the VirtualLab public reference demo and ChatGPT MCP integration.',alternates:{canonical:'/virtual-lab/support'}};
export default function SupportPage(){return <MarketingShell><section className="mx-auto max-w-3xl px-5 py-14">
<p className="text-xs font-semibold uppercase tracking-wider text-blue-700">VirtualLab Free</p>
<h1 className="mt-3 text-4xl font-semibold">Support</h1>
<p className="mt-5 text-base leading-8 text-slate-700">VirtualLab Free is an experimental numerical reference demonstration. It does not access personal research projects, instruments, scientific training runs, private laboratory measurements or purchased plans through the public MCP tools.</p>
<h2 className="mt-9 text-xl font-semibold">Using the public demo</h2>
<p className="mt-3 leading-7 text-slate-700">Open the <Link href="/virtual-lab/free" className="text-blue-700 underline">browser reference workbench</Link>, select a supported parameter and run the model. You can download an evidence JSON file, compare simulated outcomes, and recompute its SHA-256 checksum. For ChatGPT integration, the public MCP service is only available after deployment and connection testing; its availability is not guaranteed during beta.</p>
<h2 className="mt-9 text-xl font-semibold">Troubleshooting and feedback</h2>
<p className="mt-3 leading-7 text-slate-700">If a reference run fails, record the chosen preset, approximate time and the visible error. Do not include private datasets, access tokens, clinical information or account credentials in feedback.</p>
<p className="mt-3 leading-7 text-slate-700">Contact <a href="mailto:cory.tortorici@globalintentcompany.space?subject=VirtualLab%20Free%20Support" className="font-semibold text-blue-700 underline">cory.tortorici@globalintentcompany.space</a> for support or privacy questions.</p>
<div className="mt-8 flex gap-5 text-sm"><Link href="/virtual-lab/privacy" className="text-blue-700 underline">Privacy</Link><Link href="/virtual-lab/terms" className="text-blue-700 underline">Demo terms</Link></div>
</section></MarketingShell>}
