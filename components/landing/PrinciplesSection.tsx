'use client';

import { Eye, Gauge, LockKeyhole, Scale, ShieldCheck } from 'lucide-react';

const principles = [
  { icon: LockKeyhole, title: 'Private by architecture', text: 'Design deployment so operators can keep inference, model assets, and application context inside infrastructure they control.' },
  { icon: Gauge, title: 'Efficiency over brute force', text: 'Investigate capability per parameter, memory footprint, runtime overhead, and practical deployment constraints.' },
  { icon: ShieldCheck, title: 'Verify before execution', text: 'Treat reachability, protocol compatibility, authentication, model readiness, and stream readiness as distinct states.' },
  { icon: Eye, title: 'Inspectable systems', text: 'Prefer architectures and tooling that expose meaningful runtime state instead of hiding every layer behind a remote API.' },
  { icon: Scale, title: 'Evidence before claims', text: 'Separate implemented behavior, measured results, design objectives, and open hypotheses so readers can tell what has actually been demonstrated.' },
];

export default function PrinciplesSection() {
  return (
    <section id="principles" className="border-b border-slate-200 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">Engineering principles</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Technical ambition backed by explicit evidence.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">The standard is not whether a claim sounds advanced. It is whether the implementation, experiment, or documentation makes the claim inspectable.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-white p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
