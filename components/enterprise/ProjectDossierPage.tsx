import Link from 'next/link';
import { ArrowLeft, ArrowRight, Beaker, Code2, ExternalLink, FileText, Layers3 } from 'lucide-react';
import { RESEARCH_NODES, ResearchDomain } from '@/lib/research-data';
import { DOMAIN_URL_PREFIXES, NODE_ID_TO_SLUG } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

interface ProjectDossierPageProps {
  nodeId: string;
  expectedDomain: ResearchDomain;
}

export default function ProjectDossierPage({ nodeId, expectedDomain }: ProjectDossierPageProps) {
  const node = RESEARCH_NODES.find((item) => item.id === nodeId && item.domain === expectedDomain);
  if (!node) return null;

  const prefix = DOMAIN_URL_PREFIXES[node.domain];
  const slug = NODE_ID_TO_SLUG[node.id] || node.id;
  const repo = node.repositories?.[0];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <Link href={prefix} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Back to {node.domainLabel}
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{node.statusLabel}</span>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{node.classification}</span>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{node.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{node.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/explorer?domain=${encodeURIComponent(node.domain)}&node=${encodeURIComponent(node.id)}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Open interactive technical view <ExternalLink className="h-4 w-4" />
              </Link>
              {repo && (
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  Source repository <Code2 className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <article className="rounded-2xl border border-slate-200 p-6">
              <Layers3 className="h-5 w-5 text-blue-700" />
              <h2 className="mt-5 font-semibold">Architecture</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{node.architecture.overview}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-6">
              <Beaker className="h-5 w-5 text-blue-700" />
              <h2 className="mt-5 font-semibold">Evidence</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {node.experiments?.length || 0} experiment{node.experiments?.length === 1 ? '' : 's'}, {node.findings?.length || 0} finding{node.findings?.length === 1 ? '' : 's'}, and {node.artifacts.length} registered artifact{node.artifacts.length === 1 ? '' : 's'}.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-6">
              <FileText className="h-5 w-5 text-blue-700" />
              <h2 className="mt-5 font-semibold">Purpose</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {node.researchQuestion || node.engineeringObjective || node.productPurpose || node.classificationNote || 'Technical work documented through source, experiments, and project artifacts.'}
              </p>
            </article>
          </div>
        </section>

        {(node.architecture.principles?.length || node.architecture.components?.length || node.architecture.techStack?.length) && (
          <section className="border-y border-slate-200 bg-slate-50 py-14 sm:py-18">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div>
                <p className="text-sm font-semibold text-blue-700">Technical structure</p>
                <h2 className="mt-3 text-2xl font-semibold">How the system is organized.</h2>
                <div className="mt-6 grid gap-3">
                  {(node.architecture.principles || []).slice(0, 6).map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">{item}</div>
                  ))}
                  {(node.architecture.components || []).slice(0, 6).map((item) => (
                    <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700">Implementation context</p>
                <h2 className="mt-3 text-2xl font-semibold">Inspectable technical evidence.</h2>
                {node.architecture.techStack?.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {node.architecture.techStack.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">{item}</span>
                    ))}
                  </div>
                ) : null}
                {node.findings?.length ? (
                  <div className="mt-8 grid gap-3">
                    {node.findings.slice(0, 5).map((finding) => (
                      <div key={finding.title} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-950">{finding.title}</p>
                          <span className="text-xs font-semibold text-blue-700">{finding.type}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        <section className="py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
              <p className="text-sm font-semibold text-blue-300">Technical depth</p>
              <h2 className="mt-3 text-2xl font-semibold">The enterprise page is the readable dossier. The explorer remains the workbench.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Open the interactive view for architecture tabs, experiments, simulators, research logs, and the spatial project graph.
              </p>
              <Link href={`/explorer?domain=${encodeURIComponent(node.domain)}&node=${encodeURIComponent(node.id)}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Open technical explorer <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <EnterpriseFooter />
    </div>
  );
}
