import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://www.globalintentcompany.space/sitemap.xml',
    host: 'https://www.globalintentcompany.space',
  };
}
