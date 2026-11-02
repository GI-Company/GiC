import type { Metadata } from 'next';
import MarketingShell from '@/components/landing/MarketingShell';
import ResearchWorkspace from '@/components/virtual-lab/ResearchWorkspace';

export const metadata: Metadata = {
  title: 'Private Research Workspace | VirtualLab | Global Intent Company',
  description: 'Authorized research projects, experiments and checksum-verified reports inside the Global Intent Company VirtualLab website.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/virtual-lab/research' },
};

export default function ResearchWorkspacePage() {
  return <MarketingShell>
    <main className="bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">Global Intent Company / VirtualLab / Private Research</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Research projects and evidence</h1>
        <p className="mb-8 mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Access is limited to subscribed GIC accounts explicitly granted project membership by a private research host.
          This review-stage interface is read-only and remains unavailable until the operator enables and qualifies the backend.
        </p>
        <ResearchWorkspace/>
      </div>
    </main>
  </MarketingShell>;
}
