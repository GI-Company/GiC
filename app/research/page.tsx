import type { Metadata } from 'next';
import EnterpriseDomainPage from '@/components/enterprise/EnterpriseDomainPage';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Machine-learning research, experiments, measured results, and technical evidence from Global Intent Company.',
  alternates: { canonical: '/research' },
};

export default function ResearchDomainPage() {
  return (
    <EnterpriseDomainPage
      domain="machine_learning"
      eyebrow="Research"
      title="Model research built around measured evidence."
      description="Explore Global Intent Company’s machine-learning work, from compact language-model experiments to applied scientific model systems and controlled evaluations."
      narrative="This domain collects the model-development and machine-learning research behind GIC. The public surface emphasizes the question being tested, the implementation, the measured result, and the limitations; the interactive explorer remains available when deeper architecture and experiment detail is useful."
      highlights={[
        'Compact-model architecture, scaling, tokenization, and training experiments.',
        'Measured results and null results presented separately from design hypotheses.',
        'Source-linked project dossiers with experiments, artifacts, and research chronology.',
      ]}
    />
  );
}
