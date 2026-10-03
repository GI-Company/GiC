import type { Metadata, Viewport } from 'next';
import { IntentPwaProvider } from '@/components/intent/IntentPwaProvider';

const PYSCRIPT_VERSION = '2026.7.3';

export const metadata: Metadata = {
  manifest: '/intent/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'LooseMouth',
    statusBarStyle: 'default',
  },
  icons: {
    apple: {
      url: '/intent/pwa-icon/180',
      sizes: '180x180',
      type: 'image/png',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function IntentLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntentPwaProvider>
      <link rel="stylesheet" href={`https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.css`} />
      <script type="module" src={`https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.js`} />

      {children}

      <div hidden aria-hidden="true">
        <textarea id="gic-search-enrichment-input" readOnly />
        <textarea id="gic-search-enrichment-output" readOnly />
        <button id="gic-search-enrichment-run" type="button" tabIndex={-1}>enrich</button>
      </div>
      <script type="mpy" src="/pyscript/search_enrichment.py" />
    </IntentPwaProvider>
  );
}
