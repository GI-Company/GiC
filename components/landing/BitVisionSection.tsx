import Link from 'next/link';
import { BrainCircuit, Crosshair, Gauge, LockKeyhole } from 'lucide-react';

export default function BitVisionSection() {
  return (
    <section id="bitvision" className="border-b border-slate-200 bg-slate-950 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-300">BitVision learning model</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Highly focused learned behavior at 60.63M parameters.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              BitVision is Global Intent Company&apos;s proprietary learning-model research program focused on a simple question:
              how capable can a compact model become when its training, feedback, and environment are aligned around a clear intent?
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              In self-play, BitVision learns to make decisions, pursue objectives, adapt to an opponent, and improve measurable task
              performance without needing to become a general-purpose model. The architecture and implementation details remain proprietary.
            </p>

            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">New live experiment</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                BitVision-Cell v0.2 runs an 8.75M-parameter checkpoint directly in the browser and lets the learned policy control a
                synthetic tissue/pathogen environment in real time.
              </p>
              <Link
                href="/virtual-lab/bitvision-cell"
                className="mt-4 inline-flex rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Launch live checkpoint inference
              </Link>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {[
                [BrainCircuit, '60.63M parameters', 'Compact enough to study specialization without relying on massive model scale.'],
                [Crosshair, 'Intent-focused', 'Optimized around defined behavior and measurable objectives instead of broad general knowledge.'],
                [Gauge, 'Learning through self-play', 'Behavior emerges through repeated interaction, competition, feedback, and evaluation.'],
                [LockKeyhole, 'Proprietary research', 'Public results show what the model can do without exposing the architecture that makes it work.'],
              ].map(([Icon, title, text]: any) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <Icon className="h-5 w-5 text-blue-300" />
                  <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-blue-950/20">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Learning in motion</p>
                <p className="mt-1 text-sm text-slate-400">Recorded BitVision self-play development run</p>
              </div>
              {/* Animated export of the original demo video, hosted on GIC's Shopify CDN for lightweight delivery. */}
              <img
                src="https://cdn.shopify.com/s/files/1/0848/5096/6743/files/bitvision-60m-demo.gif?v=1791217272"
                alt="BitVision 60.63M self-play learning demonstration"
                className="mx-auto block h-auto max-h-[720px] w-full bg-black object-contain"
                loading="lazy"
              />
              <div className="grid grid-cols-3 gap-px bg-white/10">
                <div className="bg-slate-950 px-4 py-4">
                  <p className="text-xs text-slate-500">Model size</p>
                  <p className="mt-1 text-sm font-semibold text-white">60.63M</p>
                </div>
                <div className="bg-slate-950 px-4 py-4">
                  <p className="text-xs text-slate-500">Training mode</p>
                  <p className="mt-1 text-sm font-semibold text-white">Self-play</p>
                </div>
                <div className="bg-slate-950 px-4 py-4">
                  <p className="text-xs text-slate-500">Focus</p>
                  <p className="mt-1 text-sm font-semibold text-white">Specialized intent</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Demonstration footage is presented to show observed behavior and training progress. Internal model architecture,
              representation, and optimization details are intentionally not disclosed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
