import type { Metadata } from 'next';
import EnterpriseDomainPage from '@/components/enterprise/EnterpriseDomainPage';

export const metadata: Metadata = {
  title: 'Systems',
  description: 'Systems research and engineering across private AI infrastructure, runtimes, protocols, and computing architecture.',
  alternates: { canonical: '/systems' },
};

export default function SystemsDomainPage() {
  return (
    <EnterpriseDomainPage
      domain="systems_research"
      eyebrow="Systems engineering"
      title="Inspectable infrastructure from protocol to runtime."
      description="Explore the systems work behind private model operation, authenticated access, runtime orchestration, cognitive interfaces, and experimental computing architecture."
      narrative="The systems domain captures the engineering work that supports GIC’s private-AI direction. It includes protocol design, runtime boundaries, verification states, orchestration layers, and historical prototypes that informed the current PLM infrastructure."
      highlights={[
        'Private model access, authentication, readiness, and protocol-boundary research.',
        'Runtime and operating-system experiments including AetherOS, KernOS, and related work.',
        'Source-level architecture evidence separated from design goals and historical prototypes.',
      ]}
    />
  );
}
