import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { RESEARCH_NODES, ResearchDomain } from '@/lib/research-data';
import { DOMAIN_URL_PREFIXES, NODE_ID_TO_SLUG } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

interface EnterpriseDomainPageProps {
  domain: ResearchDomain;
  eyebrow: string;
  title: string;
  description: string;
  narrative: string;
  highlights: string[];
  simplified?: boolean;
}

export default function EnterpriseDomainPage({
  domain,
  eyebrow,
  title,
  description,
  narrative,
  highlights,
  simplified = false,
}: EnterpriseDomainPageProps) {
  const nodes = RESEARCH_NODES.filter((node) => node.domain === domain);
  const prefix = DOMAIN_URL_PREFIXES[domain];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/explorer?domain=${encodeURIComponent(domain)}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Technical explorer <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {simplified ? (
          <>
            <section className="border-b border-slate-200">
              <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <p className="max-w-3xl text-base leading-7 text-slate-600">{narrative}</p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                  {highlights.map((item) => <span key={item}>• {item}</span>)}
                </div>
              </div>
            </section>

            <section className="py-14 sm:py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Projects</p>
                    <h2 className="mt-2 text-2xl font-semibold">Choose a project.</h2>
                  </div>
                  <span className="text-sm text-slate-400">{nodes.length} total</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {nodes.map((node) => {
                    const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                    return (
                      <Link key={node.id} href={`${prefix}/${slug}`} className="group grid gap-3 py-7 transition sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-slate-950">{node.name}</h3>
                            <span className="text-xs text-slate-400">{node.statusLabel}</span>
                          </div>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{node.summary}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-slate-950">
                          View project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="border-b border-slate-200 py-16 sm:py-20">
              <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Scope</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">What this domain is for.</h2>
                  <p className="mt-5 text-base leading-7 text-slate-600">{narrative}</p>
                </div>
                <div className="grid gap-3">
                  {highlights.map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-slate-50 py-16 sm:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Projects & evidence</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Inspect the work behind the domain.</h2>
                  </div>
                  <p className="text-sm text-slate-500">{nodes.length} registered project{nodes.length === 1 ? '' : 's'}</p>
                </div>
                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {nodes.map((node) => {
                    const slug = NODE_ID_TO_SLUG[node.id] || node.id;
                    return (
                      <Link key={node.id} href={`${prefix}/${slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <span className="text-xs font-semibold text-blue-700">{node.statusLabel}</span>
                        <h3 className="mt-5 text-xl font-semibold text-slate-950">{node.name}</h3>
                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{node.summary}</p>
                        <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          View dossier <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <EnterpriseFooter />
    </div>
  );
}
