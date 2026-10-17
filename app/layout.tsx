import type { Metadata } from 'next';
import PostHogAnalytics from '@/components/PostHogAnalytics';
import './globals.css';

const siteUrl = 'https://www.globalintentcompany.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Global Intent Company — Private AI Infrastructure & Research',
    template: '%s | Global Intent Company',
  },
  description: 'Try AI chat, experimental GIC models, and browser-local BitVision. Inspect the research and explore the subscription Virtual Lab.',
  icons: {
    icon: '/images/global-intent-company-icon.png',
    apple: '/images/global-intent-company-icon.png',
  },
  openGraph: {
    title: 'Global Intent Company — Private AI Infrastructure & Research',
    description: 'Try AI chat, experimental GIC models, and browser-local BitVision. Inspect the research and explore the subscription Virtual Lab.',
    url: siteUrl,
    siteName: 'Global Intent Company',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Global Intent Company — Try the tools. Inspect the research.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Intent Company — Private AI Infrastructure & Research',
    description: 'Try AI chat, experimental GIC models, and browser-local BitVision. Inspect the research and explore the subscription Virtual Lab.',
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
  sameAs: ['https://github.com/GI-Company', 'https://www.linkedin.com/company/146743901/'],
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
