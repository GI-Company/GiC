import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
export const metadata: Metadata={title:'VirtualLab Free Privacy Notice',description:'Scope and privacy practices for the public VirtualLab Free browser and fixed-reference MCP demonstrations.',alternates:{canonical:'/virtual-lab/privacy'}};
export default function PrivacyPage(){return <MarketingShell><section className="mx-auto max-w-3xl px-5 py-14">
<p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Global Intent Company / VirtualLab Free</p>
<h1 className="mt-3 text-4xl font-semibold">Privacy notice</h1>
<p className="mt-3 text-sm text-slate-500">Public reference demo · Version 1.0 · October 31, 2026</p>
<p className="mt-6 leading-8 text-slate-700">This notice describes the public, no-account VirtualLab Free browser simulation and its fixed-reference MCP tools. It does not describe every authenticated or paid Global Intent Company service.</p>
<h2 className="mt-8 text-xl font-semibold">Information used by the demo</h2>
<p className="mt-3 leading-7 text-slate-700">The browser demo runs a deterministic reference calculation in your browser. The public MCP tools accept only a fixed preset identifier and, for verification, a software SHA-256 digest. They are not designed to receive names, patient data, credentials, uploaded laboratory files, or private research project records.</p>
<h2 className="mt-8 text-xl font-semibold">Service and security information</h2>
<p className="mt-3 leading-7 text-slate-700">When you access the website or MCP endpoint, hosting and infrastructure providers may process normal request information such as IP address, request time, URL, error details and security telemetry needed for delivery, performance, diagnostics and abuse prevention. Applicable provider settings and policies may govern retention. Do not send confidential research content or personal information to the public demo.</p>
<h2 className="mt-8 text-xl font-semibold">ChatGPT and other clients</h2>
<p className="mt-3 leading-7 text-slate-700">If you invoke these tools from ChatGPT or another MCP client, that client also handles your conversation and tool results under its own terms and privacy practices. The public demo returns only fixed reference model information and derived simulated outputs. Connecting a client does not grant access to your desktop files or laboratory projects.</p>
<h2 className="mt-8 text-xl font-semibold">Your requests</h2>
<p className="mt-3 leading-7 text-slate-700">For questions about handling or removal of service-related information, contact <a href="mailto:cory.tortorici@globalintentcompany.space?subject=VirtualLab%20Privacy" className="text-blue-700 underline">cory.tortorici@globalintentcompany.space</a>. We will review requests in light of records available to us and applicable requirements.</p>
<p className="mt-8 text-sm text-slate-500">The public beta may change as functionality and policies are reviewed. Any future account-linked research service requires its own clear authorization and privacy disclosures.</p>
<p className="mt-8 text-sm"><Link href="/virtual-lab" className="font-semibold text-blue-700 underline">Return to VirtualLab</Link></p>
</section></MarketingShell>}
