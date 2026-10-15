import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Cpu, FlaskConical, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LooseMouth Mini | INTENT-F Research Studio',
  description: 'Try INTENT Foundation RLSE-v2, an experimental 187.3M parameter language model trained from scratch, with live recurrent-search telemetry.',
  alternates: { canonical: '/intent/mini' },
};

const SPACE_URL = 'https://huggingface.co/spaces/Hdhhhgfc/INTENT-RLSE-v2';
const EMBED_URL = 'https://hdhhhgfc-intent-rlse-v2.hf.space/';

export default function IntentMiniPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Model workspace navigation" className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/intent" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-blue-800 hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <ArrowLeft size={17} aria-hidden="true" /> Back to LooseMouth Workspace
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">Global Intent Company</Link>
        </nav>

        <header className="py-7 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Global Intent Company · Foundation architecture research</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">LooseMouth Mini <span className="text-slate-600">/ INTENT-F RLSE-v2</span></h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700 sm:text-base">
            Explore a 187.3M-parameter research language model trained from random initialization on a single NVIDIA L4 GPU. This checkpoint follows 10,000 pretraining steps and 1,000 ChatML supervised fine-tuning steps.
            Its architecture combines 10 causal encoder blocks, four shared-weight recurrent controller blocks repeated across four search passes, three candidate branches per pass, 512 learned memory slots, a two-block auxiliary JEPA-style world model, and a latent critic.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Cpu size={16} aria-hidden="true" /> Model size</div>
              <p className="mt-1 text-2xl font-semibold text-slate-950">187.3M <span className="text-sm font-medium">parameters</span></p>
            </div>
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FlaskConical size={16} aria-hidden="true" /> Recurrent search</div>
              <p className="mt-1 text-2xl font-semibold text-slate-950">4 <span className="text-sm font-medium">passes · 3 candidates</span></p>
            </div>
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FlaskConical size={16} aria-hidden="true" /> Current checkpoint</div>
              <p className="mt-1 text-2xl font-semibold text-slate-950">SFT-1000</p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="note">
            <ShieldAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
            <p><strong>Experimental model:</strong> responses can repeat, hallucinate, or produce incorrect code. The displayed critic values are uncalibrated internal scores, not correctness probabilities. The demo runs on Hugging Face ZeroGPU, not GIC's usual LooseMouth inference backend. Avoid entering private or sensitive information.</p>
          </div>
        </header>

        <section aria-labelledby="intent-mini-test-heading" className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <h2 id="intent-mini-test-heading" className="text-lg font-semibold text-slate-950">Live model testing studio</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Chat · Recurrent telemetry · Inference profile and anti-loop controls</p>
            </div>
            <a href={SPACE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 text-sm font-semibold text-blue-900 hover:bg-blue-100">
              Open on Hugging Face <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <iframe
            title="INTENT RLSE-v2 interactive chat, decoding controls and recurrent telemetry"
            src={EMBED_URL}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="block h-[900px] w-full border-0 bg-white sm:h-[980px] xl:h-[850px]"
            allow="clipboard-write"
          />
        </section>
        <p className="mt-4 pb-8 text-xs leading-5 text-slate-600">Hosted research demo and availability are controlled by Hugging Face. If the embedded studio does not load, use the direct Hugging Face link above. Access here does not require a GIC subscription.</p>
      </div>
    </main>
  );
}
