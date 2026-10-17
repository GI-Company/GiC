import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
const tools = [
  { title: 'Chat, research, and reusable reports', label: 'LooseMouth · Google Gemini', access: 'Guest chat available', text: 'Start with a question. Create a free account to save conversations; Paid adds reports and Enhanced adds interactive applets.', href: '/intent', action: 'Try LooseMouth' },
  { title: 'Test a model trained by GIC', label: 'INTENT RLSE-v2 · 187.3M parameters', access: 'Public research demo', text: 'Compare Facts-500 and SFT-1000 with streaming output and adjustable decoding. These experimental checkpoints are not production assistants.', href: '/intent/mini', action: 'Test the checkpoints' },
  { title: 'Inspect a learning system in motion', label: 'BitVision Cell · v0.2', access: 'Free · browser-local inference', text: 'Load an ONNX checkpoint and inspect its actions and episode trajectory. Runtime and model files download before computation runs in your browser.', href: '/virtual-lab/bitvision-cell', action: 'Run BitVision Cell' },
  { title: 'Explore a scientific workflow', label: 'Virtual Lab · research cockpit', access: 'Paid / Enhanced subscription', text: 'Approve assumption-based kinetics, inspect reference structures, generate synthetic frames, and check exported hashes. No clinical prediction or hardware measurement is implied.', href: '/virtual-lab/demo', action: 'Open the paid Virtual Lab' },
  { title: 'Reproduce a request', label: 'Developer quickstart', access: 'Public documentation', text: 'Copy working streaming examples, inspect limits and output formats, and follow implementation notes with source links and known limitations.', href: '/developers', action: 'Read the developer quickstart' },
  { title: 'Inspect the architecture', label: 'Research & private infrastructure', access: 'Source, experiments, and design goals', text: 'Read the evidence behind INTENT and the PLMH / PLMN infrastructure program. Research goals are distinguished from deployed capabilities.', href: '/research', action: 'Inspect research and evidence' },
];
export default function LandingDirectory() {
  return <section aria-labelledby="gic-directory" className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Choose your next step</p>
      <h2 id="gic-directory" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Working tools, with their scope in view.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Start with a free experiment, inspect the implementation, or open a subscription workspace when you need more.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{tools.map(tool => <article key={tool.href} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{tool.label}</p>
        <h3 className="mt-3 text-lg font-semibold">{tool.title}</h3>
        <p className="mt-2 text-xs font-semibold text-slate-500">{tool.access}</p>
        <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{tool.text}</p>
        <Link href={tool.href} className="mt-5 inline-flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:border-blue-500 hover:text-blue-700">{tool.action}<ArrowRight size={16} className="shrink-0"/></Link>
      </article>)}</div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-blue-200 bg-blue-50 p-6"><div><h3 className="text-xl font-semibold">Keep the work you start.</h3><p className="mt-2 text-sm leading-6 text-slate-600">Create a free account to save LooseMouth conversations. Compare Paid and Enhanced for reports, applets, and Virtual Lab access.</p></div><div className="flex flex-wrap gap-3"><Link href="/intent?signup=1" className="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Create free account</Link><Link href="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800">Compare access plans</Link></div></div>
    </div>
  </section>;
}
