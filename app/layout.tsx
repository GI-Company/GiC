import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Global Intent Company — Private AI, from model to infrastructure',
  description: 'Global Intent Company develops efficient language-model architectures and the infrastructure required to privately deploy, verify, and operate them.',
  openGraph: {
    title: 'Global Intent Company — Private AI, from model to infrastructure',
    description: 'Global Intent Company develops efficient language-model architectures and the infrastructure required to privately deploy, verify, and operate them.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Intent Company — Private AI, from model to infrastructure',
    description: 'Global Intent Company develops efficient language-model architectures and the infrastructure required to privately deploy, verify, and operate them.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
