import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Global Intent Company — Independent Research & Systems Engineering',
  description: 'Independent software research and engineering company founded by Cory Tortorici, developing inspectable computational architectures, mass-spectrometry learning systems, and verified evidence infrastructure.',
  openGraph: {
    title: 'Global Intent Company — Independent Research & Systems Engineering',
    description: 'Independent software research and engineering company founded by Cory Tortorici, developing inspectable computational architectures, mass-spectrometry learning systems, and verified evidence infrastructure.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Intent Company — Independent Research & Systems Engineering',
    description: 'Independent software research and engineering company founded by Cory Tortorici, developing inspectable computational architectures, mass-spectrometry learning systems, and verified evidence infrastructure.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
