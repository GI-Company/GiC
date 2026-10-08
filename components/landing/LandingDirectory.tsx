import Link from 'next/link';
import { ArrowRight, BrainCircuit, Building2, CircleDollarSign, FlaskConical, Network, ShieldCheck } from 'lucide-react';

const areas = [
  { title: 'Technology', label: 'Architecture', description: 'The INTENT model layer, private runtimes, and the evidence that supports the design.', href: '/technology', icon: Network },
  { title: 'Model research', label: 'INTENT', description: 'Research on recurrent models, inference, and the path toward private language AI.', href: '/models', icon: BrainCircuit },
  { title: 'BitVision', label: 'Learning systems', description: 'Decision-oriented model research and an interactive, browser-local Cell experiment.', href: '/bitvision', icon: FlaskConical },
  { title: 'Private infrastructure', label: 'PLM', description: 'Operator-hosted model hubs, connected nodes, authentication, and verification.', href: '/infrastructure', icon: ShieldCheck },
  { title: 'Company', label: 'Mission', description: 'Why GIC exists, how the research is being built, and the operating principles.', href: '/company', icon: Building2 },
  { title: 'Plans & support', label: 'Access', description: 'Compare LooseMouth access levels and support continued model research.', href: '/pricing', icon: CircleDollarSign },
];

export default function LandingDirectory() {
  return (
    <section aria-labelledby="gic-directory" className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Explore GIC</p>
          <h2 id="gic-directory" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Each program has its own page.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">Find the work you need without scrolling through every project on the homepage.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map(({ title, label, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="group flex min-h-48 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">{label}</span>
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-900">
                Open page <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
