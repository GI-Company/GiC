'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { flushConversionEvents } from '@/lib/conversion-events';
import { analyticsAllowed, PRIVACY_EVENT } from '@/lib/workspace-privacy';

declare global {
  interface Window {
    posthog?: {
      capture?: (event: string, properties?: Record<string, unknown>) => void;
      init: (token: string, config: Record<string, unknown>) => void;
      opt_in_capturing?: () => void;
      opt_out_capturing?: () => void;
      start_session_recording?: () => void;
      stop_session_recording?: () => void;
    };
  }
}

export default function PostHogAnalytics({ token, host = 'https://us.i.posthog.com' }: { token?: string; host?: string }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const sdkReady = useRef(false);
  const lastPageview = useRef<string | null>(null);
  useEffect(() => {
    function sync() {
      const allowed = analyticsAllowed();
      setEnabled(allowed);
      if (allowed) {
        window.posthog?.opt_in_capturing?.();
        window.posthog?.start_session_recording?.();
        if (sdkReady.current && lastPageview.current !== window.location.pathname) {
          lastPageview.current = window.location.pathname;
          window.posthog?.capture?.('$pageview', {
            $current_url: window.location.origin + window.location.pathname,
            $pathname: window.location.pathname,
          });
        }
        flushConversionEvents();
      } else {
        window.posthog?.stop_session_recording?.();
        window.posthog?.opt_out_capturing?.();
      }
    }
    sync();
    window.addEventListener(PRIVACY_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PRIVACY_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [pathname]);

  const assetHost = host.replace('.i.posthog.com', '-assets.i.posthog.com');
  return <>
    {enabled && token && <Script
      id="posthog-sdk"
      src={`${assetHost}/static/array.js`}
      strategy="afterInteractive"
      onLoad={() => {
        const allowed = analyticsAllowed();
        window.posthog?.init(token, {
          api_host: host,
          defaults: '2026-05-30',
          person_profiles: 'identified_only',
          opt_out_capturing_by_default: true,
          disable_session_recording: true,
          before_send: (event: { properties?: Record<string, unknown> }) => {
            if (!analyticsAllowed()) return null;
            const properties = { ...event.properties };
            for (const key of ['$current_url', '$initial_current_url', '$referrer', '$initial_referrer']) {
              if (typeof properties[key] === 'string') {
                try { const url = new URL(properties[key] as string, window.location.origin); properties[key] = url.origin + url.pathname; }
                catch { delete properties[key]; }
              }
            }
            return { ...event, properties };
          },
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: { element_attribute_ignorelist: ['value'], capture_copied_text: false },
          session_recording: { maskAllInputs: true, maskTextSelector: '[data-ph-mask]' },
          loaded: () => { sdkReady.current = true; window.dispatchEvent(new Event(PRIVACY_EVENT)); },
        });
        if (!allowed) window.posthog?.opt_out_capturing?.();
      }}
    />}
    <Analytics beforeSend={(event) => {
      if (!analyticsAllowed()) return null;
      try { const url = new URL(event.url); return { ...event, url: url.origin + url.pathname }; }
      catch { return null; }
    }} />
  </>;
}
