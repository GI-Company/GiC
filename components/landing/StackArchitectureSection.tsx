import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const layers = [
  { n: '01', name: 'INTENT', label: 'Model layer', text: 'Language-model research focused on efficient architectures, inspectability, and private execution.', href: '/intent' },
  { n: '02', name: 'PLMH', label: 'Execution layer', text: 'A private hub for hosting model runtimes and exposing controlled inference capabilities on operator-managed infrastructure.', href: '/infrastructure#plmh' },
  { n: '03', name: 'PLMN', label: 'Access layer', text: 'The node layer for discovery, authentication, capability negotiation, readiness verification, and inference streaming.', href: '/infrastructure#plmn' },
  { n: '04', name: 'Organization', label: 'Control boundary', text: 'The deployment boundary in which an operator controls models, compute, access policy, and application data.', href: '/company#principles' },
];

export default function StackArchitectureSection() {
  return (
    <section id="the-stack" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-blue-700">Technology architecture</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">A private AI stack designed as one system.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              GIC is developing the model, runtime, access, and verification layers together. The objective is straightforward: make private model operation easier to inspect, authenticate, and control.
            </p>
            <div className="mt-8 space-y-3">
              {['Model and infrastructure developed together', 'Explicit readiness and authentication states', 'Evidence separated from architectural objectives'].map((x) => (
                <div key={x} className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="h-4 w-4 text-blue-600" />{x}</div>
              ))}
            </div>
            <Link href="/research" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">Review the research evidence <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {layers.map((layer, i) => (
              <div key={layer.name}>
                <a href={layer.href} className="group grid gap-3 rounded-xl p-5 transition hover:bg-slate-50 sm:grid-cols-[52px_1fr_auto] sm:items-center">
                  <span className="text-sm font-semibold text-blue-700">{layer.n}</span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold text-slate-950">{layer.name}</h3>
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{layer.label}</span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{layer.text}</p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 sm:block" />
                </a>
                {i < layers.length - 1 && <div className="mx-5 border-t border-slate-100" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
