import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
import InferenceExamples from '@/components/intent/InferenceExamples';

export const metadata: Metadata = {
  title: 'Developer quickstart & reproducible examples',
  description: 'Try GIC streaming inference with cURL or Python. Inspect model limits, source code, local BitVision inference, and paid Virtual Lab evidence workflows.',
  alternates: { canonical: '/developers' },
};
const source = 'https://github.com/GI-Company/GiC/blob/main/';
export default function DevelopersPage() {
  return <MarketingShell><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Build with evidence</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Try it. Inspect it. Reproduce it.</h1>
    <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">Start with a small streaming request, then inspect the implementation and its limits. GIC&apos;s experimental checkpoints, Gemini-backed LooseMouth, and local BitVision inference are separate systems.</p>
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/intent/mini" className="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white">Open the model playground</Link><a href="https://github.com/GI-Company/GiC" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold">Inspect website source</a></div>

    <section aria-labelledby="streaming" className="mt-12 min-w-0">
      <h2 id="streaming" className="text-2xl font-semibold">1. Make a streaming request</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">The public research API supports Facts-500 and SFT-1000. Examples use a short prompt and a low temperature for a small reproducible smoke test. A successful request demonstrates serving, not general model quality.</p>
      <InferenceExamples/>
      <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Research inference API limits</caption><thead><tr className="border-b border-slate-300"><th className="p-3">Field</th><th className="p-3">Supported values</th></tr></thead><tbody>{[['checkpoint', 'facts500 or sft1000'], ['message', '1–8000 characters; the model has a 512-token serving context'], ['temperature', '0–10; playground default 9'], ['topK', 'Integer 1–100; default 80'], ['maxTokens', 'Integer 1–128; playground default 96'], ['Limits', '8 requests per IP per hour, plus the shared HF account’s ZeroGPU quota']].map(([name, value]) => <tr key={name} className="border-b border-slate-200"><th scope="row" className="p-3 font-mono text-xs">{name}</th><td className="p-3 leading-6">{value}</td></tr>)}</tbody></table></div>
      <p className="mt-4 text-sm leading-7 text-slate-600">Set the Origin header to the site origin shown in the example. The browser never receives the server&apos;s HF_TOKEN. There is no uptime or throughput guarantee. HTTP 400 indicates invalid input, 403 an origin mismatch, 429 a quota limit, and 502/503 an upstream or configuration issue. Stream errors may also arrive after HTTP 200.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">For requests using your own Hugging Face quota, call the Space with your own token using the <a href="https://huggingface.co/spaces/Hdhhhgfc/INTENT-RLSE-v2" className="font-semibold text-blue-700 underline">Space&apos;s Use via API instructions</a>. Keep that token on your server. Authentication does not provide unlimited GPU time.</p>
    </section>

    <section className="mt-12" aria-labelledby="compute"><h2 id="compute" className="text-2xl font-semibold">2. Know where computation happens</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{[
        ['LooseMouth', 'Google Gemini handles hosted chat and research. Guest chat is available; saved conversations require an account.', '/intent', 'Try guest chat'],
        ['INTENT Mini', 'Vercel forwards each prompt to GIC’s custom checkpoint on Hugging Face ZeroGPU. Each generation is independent.', '/intent/mini', 'Try the research checkpoints'],
        ['BitVision Cell', 'The browser downloads ONNX Runtime and model weights, then performs inference locally via WebGPU or WASM. Local computation still requires initial network downloads; the surrounding site may use analytics.', '/virtual-lab/bitvision-cell', 'Run the browser experiment'],
        ['Virtual Lab', 'Paid / Enhanced access is checked on the server. RHO and reference runs use bounded server solvers; synthetic optics and file inspection run in the browser. Optional AI uses Gemini.', '/virtual-lab/demo', 'Open the subscription cockpit'],
      ].map(([title, text, href, action]) => <article key={title} className="rounded-xl border border-slate-200 p-5"><h3 className="font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p><Link href={href} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline underline-offset-4">{action}</Link></article>)}</div>
    </section>

    <section id="engineering-notes" className="mt-12 scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8"><p className="text-xs font-semibold text-blue-700">Engineering note · October 16, 2026</p><h2 className="mt-3 text-2xl font-semibold">From an anonymous embed to authenticated streaming</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">The first website integration embedded the public Space. Adding HF_TOKEN to Vercel could not authenticate requests originating inside that iframe. The native panel instead submits a validated prompt to a server route, which authenticates both Gradio job submission and SSE retrieval. The browser receives cumulative text snapshots as newline-delimited JSON.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">A production test exposed a Gradio compatibility issue: a custom session identifier prevented completed jobs from being found by the result endpoint. Letting the /call API manage its own job session fixed retrieval. A short production smoke test then streamed “Paris.” for a capital-of-France prompt. This is evidence that serving worked for that request, not a benchmark of factual accuracy.</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">The regression suite checks token forwarding without disclosure, both checkpoints, fragmented Unicode streams, input and origin validation, persistent quotas, safe errors, incomplete streams, and cancellation. Stopping the web stream does not guarantee that a GPU task already running will stop.</p>
      <ul className="mt-4 space-y-3 text-sm text-blue-700"><li><a className="underline" href={source + 'app/api/intent/mini/route.ts'}>Inspect the server route</a></li><li><a className="underline" href={source + 'scripts/verify-intent-hf.cjs'}>Inspect and run the inference checks</a> <code className="ml-2 text-xs text-slate-700">node --test scripts/verify-intent-hf.cjs</code></li><li><a className="underline" href="https://github.com/GI-Company/GiC/commit/2072c8153852e916ba917f78470465c374559535">Inspect the session compatibility fix</a></li></ul>
    </section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">3. Share settings and inspect evidence</h2><p className="mt-4 text-sm leading-7 text-slate-600">In the paid Lab, copy a RHO or optical settings link to reproduce the configuration. Links contain only bounded numeric settings, never access tokens, imported files, results, or approval. Recipients still need an active subscription. Restored settings do not run automatically.</p><p className="mt-3 text-sm leading-7 text-slate-600">Export RHO evidence, synthetic optical packets, or a model answer. Simulation output remains labeled SIMULATED. SHA-256 and hash links detect changes to the supplied bytes; unsigned exports do not establish author identity, hardware provenance, clinical validity, or an immutable record.</p><div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><a className="underline" href={source + 'docs/virtual-lab-cockpit.md'}>Read the Lab methodology</a><Link href="/research/log" className="underline">Read the research chronology</Link><Link href="/pricing" className="underline">Compare workspace access</Link></div></section>
  </div></MarketingShell>;
}
