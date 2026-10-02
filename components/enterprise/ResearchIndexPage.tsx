import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { RESEARCH_NODES } from '@/lib/research-data';
import { NODE_ID_TO_SLUG } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

export default function ResearchIndexPage() {
  const nodes = RESEARCH_NODES.filter((node) => node.domain === 'machine_learning');

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">Research</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Questions, experiments, and measured results.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Research at Global Intent Company documents what is being tested, how it was tested, what was observed, and what remains unresolved.
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm">
              <Link href="/research/log" className="font-semibold text-slate-800 hover:text-slate-950">Research chronology</Link>
              <Link href="/explorer?domain=machine_learning" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-950">
                Technical explorer <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold text-blue-700">Research projects</p>
              <h2 className="mt-2 text-2xl font-semibold">What we are investigating.</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {nodes.map((node) => {
                const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                const question = node.researchQuestion || node.summary;
                return (
                  <Link key={node.id} href={`/research/${slug}`} className="group grid gap-4 py-7 sm:grid-cols-[180px_1fr_auto] sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{node.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{node.statusLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {node.experiments?.length || 0} experiments · {node.findings?.length || 0} findings · {node.artifacts.length} artifacts
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-slate-950">
                      View research <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">Evidence standard</p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Public research pages distinguish implementation, measured results, null results, author-reported observations, and open hypotheses so readers can see what has actually been demonstrated.
            </p>
          </div>
        </section>
      </main>
      <EnterpriseFooter />
    </div>
  );
}
