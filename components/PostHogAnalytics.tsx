'use client';

import Script from 'next/script';

declare global {
  interface Window {
    posthog?: {
      init: (token: string, config: Record<string, unknown>) => void;
    };
  }
}

type PostHogAnalyticsProps = {
  token?: string;
  host?: string;
};

export default function PostHogAnalytics({ token, host = 'https://us.i.posthog.com' }: PostHogAnalyticsProps) {
  if (!token) return null;

  const assetHost = host.replace('.i.posthog.com', '-assets.i.posthog.com');

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
