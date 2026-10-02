import type { MetadataRoute } from 'next';

const base = 'https://globalintentcompany.space';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/intent',
    '/research',
    '/research/log',
    '/software',
    '/systems',
    '/virtual-lab',
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/research' || route === '/virtual-lab' || route === '/intent' ? 0.9 : 0.7,
  }));
}
