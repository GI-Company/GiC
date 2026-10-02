import type { Metadata } from 'next';
import EnterpriseDomainPage from '@/components/enterprise/EnterpriseDomainPage';

export const metadata: Metadata = {
  title: 'Software',
  description: 'Shipped software and product engineering from Global Intent Company.',
  alternates: { canonical: '/software' },
};

export default function SoftwareDomainPage() {
  return (
    <EnterpriseDomainPage
      domain="shipped_software"
      eyebrow="Software"
      title="Working software that turns research into usable systems."
      description="Browse deployed and shipped applications developed by Global Intent Company, with source and implementation context kept alongside the product surface."
      narrative="This domain covers software that moved beyond an isolated experiment into an application or public implementation. Each dossier keeps the product purpose connected to the underlying architecture and source provenance."
      highlights={[
        'Publicly shipped applications and implementation-focused engineering work.',
        'Product purpose presented alongside architecture and repository provenance.',
        'A clearer boundary between deployed software, active research, and infrastructure experiments.',
      ]}
    />
  );
}
