import type { MetadataRoute } from 'next';
import { RESEARCH_NODES } from '@/lib/research-data';
import { DOMAIN_URL_PREFIXES, NODE_ID_TO_SLUG } from '@/lib/spatial-router';

const base = 'https://globalintentcompany.space';

export default function sitemap(): MetadataRoute.Sitemap {
  const topLevel = [
    '',
    '/intent',
    '/research',
    '/research/log',
    '/software',
    '/systems',
    '/virtual-lab',
  ];

  const projectRoutes = RESEARCH_NODES.map((node) => {
    const prefix = DOMAIN_URL_PREFIXES[node.domain];
    const slug = NODE_ID_TO_SLUG[node.id] || node.id;
    return `${prefix}/${slug}`;
  });

  return [...new Set([...topLevel, ...projectRoutes])].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority:
      route === ''
        ? 1
        : route === '/research' || route === '/virtual-lab' || route === '/intent'
          ? 0.9
          : route.split('/').filter(Boolean).length > 1
            ? 0.6
            : 0.7,
  }));
}
