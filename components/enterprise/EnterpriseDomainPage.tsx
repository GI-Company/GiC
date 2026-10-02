import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
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
}

export default function EnterpriseDomainPage({
  domain,
  eyebrow,
  title,
  description,
  narrative,
  highlights,
}: EnterpriseDomainPageProps) {
  const nodes = RESEARCH_NODES.filter((node) => node.domain === domain);
  const prefix = DOMAIN_URL_PREFIXES[domain];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`/explorer?domain=${encodeURIComponent(domain)}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Open technical explorer <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Company overview <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold text-blue-700">Scope</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">What this domain is for.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">{narrative}</p>
            </div>
            <div className="grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
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
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{node.statusLabel}</span>
                      <span className="text-xs text-slate-400">{node.classification}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-slate-950">{node.name}</h3>
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
      </main>
      <EnterpriseFooter />
    </div>
  );
}
