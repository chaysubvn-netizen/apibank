import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteConfig();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/login', '/register'],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
