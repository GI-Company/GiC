'use client';

import { useEffect } from 'react';

const legacySections: Record<string, string> = {
  '#the-problem': '/technology#the-problem',
  '#the-stack': '/technology#the-stack',
  '#intent-models': '/models#intent-models',
  '#bitvision': '/bitvision#bitvision',
  '#plmh': '/infrastructure#plmh',
  '#plmn': '/infrastructure#plmn',
  '#research-engine': '/technology#research-engine',
  '#principles': '/company#principles',
  '#company': '/company#company',
  '#vision': '/company#vision',
  '#plans': '/pricing#plans',
  '#pricing': '/pricing#plans',
  '#fund-research': '/pricing#fund-research',
  '#apparel': '/shop#apparel',
  '#contact': '/contact#contact',
};

export default function LandingAuthRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Preserve the Supabase OAuth callback flow before checking old page anchors.
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.get('access_token') && params.get('refresh_token')) {
      window.location.replace('/intent' + window.location.search + hash);
      return;
    }

    const destination = legacySections[hash.toLowerCase()];
    if (destination) window.location.replace(destination);
  }, []);

  return null;
}
