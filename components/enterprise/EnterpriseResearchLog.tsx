import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
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
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">Research log</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Research chronology.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">A chronological record of implementation, experiments, results, failures, and iterations.</p>
            <Link href="/explorer" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
              Interactive explorer <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {events.map(({ node, event }) => {
                const prefix = DOMAIN_URL_PREFIXES[node.domain];
                const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                return (
                  <article key={`${node.id}:${event.id}`} className="grid gap-3 py-6 sm:grid-cols-[120px_1fr]">
                    <div className="text-sm text-slate-400">{event.date || event.phase}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-slate-950">{event.title}</h2>
                        <span className="text-xs text-slate-400">{event.epistemicStatus}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
                      <Link href={`${prefix}/${slug}`} className="mt-3 inline-block text-sm font-semibold text-slate-700 hover:text-slate-950">{node.name}</Link>
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
