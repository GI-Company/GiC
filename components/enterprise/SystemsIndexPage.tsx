import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { RESEARCH_NODES } from '@/lib/research-data';
import { NODE_ID_TO_SLUG } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

export default function SystemsIndexPage() {
  const nodes = RESEARCH_NODES.filter((node) => node.domain === 'systems_research');

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">Systems</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Infrastructure, protocols, and runtime architecture.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Systems documents the engineering behind private model operation: access boundaries, verification, runtimes, protocols, orchestration, and the prototypes that informed the current architecture.
            </p>
            <Link href="/explorer?domain=systems_research" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              Technical explorer <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold text-blue-700">System families</p>
              <h2 className="mt-2 text-2xl font-semibold">What has been built.</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {nodes.map((node) => {
                const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                const objective = node.engineeringObjective || node.productPurpose || node.summary;
                return (
                  <Link key={node.id} href={`/systems/${slug}`} className="group grid gap-4 py-7 sm:grid-cols-[180px_1fr_auto] sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{node.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{node.statusLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{objective}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {node.architecture.components?.length || 0} components · {node.artifacts.length} artifacts
                        {node.repositories?.length ? ' · source available' : ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-slate-950">
                      View system <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">How to read Systems</p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Each system page leads with its engineering objective and architecture. Implementation status, components, source provenance, and deeper interactive inspection follow after the core explanation.
            </p>
          </div>
        </section>
      </main>
      <EnterpriseFooter />
    </div>
  );
}
