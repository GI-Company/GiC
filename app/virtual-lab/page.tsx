import type { Metadata } from 'next';
import EnterpriseDomainPage from '@/components/enterprise/EnterpriseDomainPage';

export const metadata: Metadata = {
  title: 'Virtual Lab',
  description: 'Scientific computing, instrumentation, simulation, evidence packaging, and reproducible research workflows from Global Intent Company.',
  alternates: { canonical: '/virtual-lab' },
};

export default function VirtualLabDomainPage() {
  return (
    <EnterpriseDomainPage
      domain="virtual_lab"
      eyebrow="Virtual Lab"
      title="Scientific computing with evidence built into the workflow."
      description="Virtual Lab brings simulation, instrumentation, model execution, artifact integrity, and reproducible evidence into one technical environment."
      narrative="Virtual Lab is GIC’s primary scientific-computing product direction. The work combines simulation and model execution with sensor-linked experimentation, evidence packaging, integrity checks, and portable study artifacts so technical results can remain inspectable after an experiment ends."
      highlights={[
        'Simulation and scientific model execution with reusable experiment structure.',
        'Sensor and instrumentation work designed to connect physical observations to digital studies.',
        'Evidence packaging, artifact verification, and reproducible project exchange as first-class concerns.',
      ]}
    />
  );
}
