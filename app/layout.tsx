import type { Metadata } from 'next';
import PostHogAnalytics from '@/components/PostHogAnalytics';
import './globals.css';

const siteUrl = 'https://globalintentcompany.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Global Intent Company — Private AI Infrastructure & Research',
    template: '%s | Global Intent Company',
  },
  description: 'Global Intent Company develops language models, private AI infrastructure, and scientific computing systems for direct control over models, compute, and data.',
  icons: {
    icon: '/images/global-intent-company-icon.png',
    apple: '/images/global-intent-company-icon.png',
  },
  openGraph: {
    title: 'Global Intent Company — Private AI Infrastructure & Research',
    description: 'Language models, private AI infrastructure, and scientific computing systems designed for ownership, verification, and control.',
    url: siteUrl,
    siteName: 'Global Intent Company',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Global Intent Company — Private AI. Owned infrastructure. Verifiable systems.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Intent Company — Private AI Infrastructure & Research',
    description: 'Language models, private AI infrastructure, and scientific computing systems designed for ownership, verification, and control.',
    images: ['/opengraph-image'],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Global Intent Company',
  url: siteUrl,
  logo: `${siteUrl}/images/global-intent-company-icon.png`,
  founder: {
    '@type': 'Person',
    name: 'Cory Tortorici',
  },
  description: 'Independent AI and systems engineering company developing language models, private AI infrastructure, and scientific computing systems.',
  sameAs: ['https://github.com/GI-Company'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <PostHogAnalytics token={process.env.NEXT_POSTHOG_PROJECT_TOKEN} host={process.env.NEXT_POSTHOG_HOST} />
      </body>
    </html>
  );
}
