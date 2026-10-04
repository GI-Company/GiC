'use client';

import Script from 'next/script';

declare global {
  interface Window {
    posthog?: {
      init: (token: string, config: Record<string, unknown>) => void;
    };
  }
}

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const assetHost = host.replace('.i.posthog.com', '-assets.i.posthog.com');

export default function PostHogAnalytics() {
  if (!token) return null;

  return (
    <Script
      id="posthog-sdk"
      src={`${assetHost}/static/array.js`}
      strategy="afterInteractive"
      onLoad={() => {
        window.posthog?.init(token, {
          api_host: host,
          defaults: '2026-05-30',
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          session_recording: {
            maskAllInputs: true,
            maskTextSelector: '[data-ph-mask]',
          },
        });
      }}
    />
  );
}
