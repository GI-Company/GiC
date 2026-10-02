import Link from 'next/link';
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from 'lucide-react';
import { RESEARCH_NODES, ResearchDomain } from '@/lib/research-data';
import { DOMAIN_URL_PREFIXES } from '@/lib/spatial-router';
import { EnterpriseFooter, EnterpriseHeader } from './EnterpriseChrome';

interface ProjectDossierPageProps {
  nodeId: string;
  expectedDomain: ResearchDomain;
}

export default function ProjectDossierPage({ nodeId, expectedDomain }: ProjectDossierPageProps) {
  const node = RESEARCH_NODES.find((item) => item.id === nodeId && item.domain === expectedDomain);
  if (!node) return null;

  const prefix = DOMAIN_URL_PREFIXES[node.domain];
  const repo = node.repositories?.[0];
  const simplified = node.domain === 'machine_learning' || node.domain === 'systems_research';
  const purpose = node.researchQuestion || node.engineeringObjective || node.productPurpose || node.classificationNote;
  const isResearch = node.domain === 'machine_learning';
  const isSystems = node.domain === 'systems_research';
  const purposeLabel = isResearch ? 'Research question' : isSystems ? 'Engineering objective' : 'Purpose';
  const architectureLabel = isResearch ? 'Method & architecture' : isSystems ? 'Architecture' : 'How it works';
  const findingsLabel = isResearch ? 'Results & findings' : isSystems ? 'Implementation evidence' : 'Key findings';
  const technicalItems = [
    ...(node.architecture.principles || []),
    ...(node.architecture.components || []).map((item) => `${item.name}: ${item.description}`),
  ].slice(0, simplified ? 4 : 6);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <EnterpriseHeader />
      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <Link href={prefix} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <p className="mt-8 text-sm font-semibold text-blue-700">{node.domainLabel}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{node.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{node.summary}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{node.statusLabel}</span>
              <span>{node.classification}</span>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
              <div className="space-y-10">
                {purpose && (
                  <section>
                    <p className="text-sm font-semibold text-blue-700">{purposeLabel}</p>
                    <p className="mt-3 text-base leading-7 text-slate-700">{purpose}</p>
                  </section>
                )}

                <section>
                  <p className="text-sm font-semibold text-blue-700">{architectureLabel}</p>
                  <p className="mt-3 text-base leading-7 text-slate-700">{node.architecture.overview}</p>
                  {technicalItems.length > 0 && (
                    <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                      {technicalItems.map((item) => <li key={item} className="border-l-2 border-slate-200 pl-4">{item}</li>)}
                    </ul>
                  )}
                </section>

                {node.findings?.length ? (
                  <section>
                    <p className="text-sm font-semibold text-blue-700">{findingsLabel}</p>
                    <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                      {node.findings.slice(0, simplified ? 4 : 5).map((finding) => (
                        <div key={finding.title} className="py-5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="font-semibold text-slate-950">{finding.title}</h2>
                            <span className="text-xs text-slate-400">{finding.type}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-5 lg:border-l lg:border-slate-200 lg:pl-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Evidence</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {node.experiments?.length || 0} experiments · {node.findings?.length || 0} findings · {node.artifacts.length} artifacts
                  </p>
                </div>
                {node.architecture.techStack?.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Technology</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{node.architecture.techStack.slice(0, 8).join(' · ')}</p>
                  </div>
                ) : null}
                <div className="space-y-2 pt-2">
                  {repo && (
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                      <Code2 className="h-4 w-4" /> Source repository
                    </a>
                  )}
                  <Link href={`/explorer?domain=${encodeURIComponent(node.domain)}&node=${encodeURIComponent(node.id)}`} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
                    <ExternalLink className="h-4 w-4" /> Technical explorer
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 py-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href={prefix} className="text-sm font-semibold text-slate-600 hover:text-slate-950">More projects</Link>
            <Link href={`/explorer?domain=${encodeURIComponent(node.domain)}&node=${encodeURIComponent(node.id)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              Open technical detail <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <EnterpriseFooter />
    </div>
  );
}
