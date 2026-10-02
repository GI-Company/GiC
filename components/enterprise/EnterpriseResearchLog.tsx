import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { RESEARCH_NODES } from '@/lib/research-data';
import { DOMAIN_URL_PREFIXES, NODE_ID_TO_SLUG } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

export default function EnterpriseResearchLog() {
  const events = RESEARCH_NODES.flatMap((node) =>
    (node.timelineEvents || []).map((event) => ({ node, event }))
  ).sort((a, b) => (b.event.date || '').localeCompare(a.event.date || ''));

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">Research chronology</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Questions, experiments, results, failures, and iterations.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              A registry-driven chronology of Global Intent Company research milestones. Entries retain their epistemic status so implementation, measurement, inference, hypothesis, and null results are not presented as equivalent evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explorer" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Open interactive explorer <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/research" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Research overview <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {events.map(({ node, event }) => {
                const prefix = DOMAIN_URL_PREFIXES[node.domain];
                const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                return (
                  <article key={`${node.id}:${event.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {event.date && <span className="text-sm font-semibold text-slate-950">{event.date}</span>}
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{event.epistemicStatus}</span>
                        <span className="text-xs uppercase tracking-[0.1em] text-slate-400">{event.kind.replaceAll('_', ' ')}</span>
                      </div>
                      <Link href={`${prefix}/${slug}`} className="text-sm font-semibold text-slate-600 hover:text-slate-950">{node.name}</Link>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">{event.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>{event.phase}</span>
                      {event.lineageStage && <span>{event.lineageStage}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <EnterpriseFooter />
    </div>
  );
}
