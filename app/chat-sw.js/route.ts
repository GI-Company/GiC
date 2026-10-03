import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'local-development';

  const source = `
const VERSION = ${JSON.stringify(version)};

self.addEventListener('install', () => {
  // Wait for explicit user approval before replacing an open chat.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Supabase, inference, auth, or other cross-origin traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-only by design: installation/update lifecycle without stale chat data.
  if (
    url.pathname.startsWith('/intent') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(fetch(request));
  }
});
`;

  return new NextResponse(source, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/intent',
      'X-LooseMouth-App-Version': version,
    },
  });
}
