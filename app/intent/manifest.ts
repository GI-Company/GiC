import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LooseMouth — Global Intent Company',
    short_name: 'LooseMouth',
    description: 'Private conversational inference through the INTENT model family.',
    start_url: '/intent?source=installed-app',
    scope: '/intent',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/images/global-intent-company-icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
