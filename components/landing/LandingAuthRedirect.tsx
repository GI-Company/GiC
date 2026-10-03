'use client';

import { useEffect } from 'react';

export default function LandingAuthRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.get('access_token') && params.get('refresh_token')) {
      window.location.replace(`/intent${window.location.search}${hash}`);
    }
  }, []);

  return null;
}
