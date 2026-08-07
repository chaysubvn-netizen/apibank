import type { Metadata } from 'next';

export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  keywords: string[];
  author: string;
  logo: string | null;
  favicon: string | null;
  og_image: string | null;
  hotline: string | null;
  email: string | null;
  socials: string[];
  url: string;
  locale: string;
};

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://spay5s.com'
).replace(/\/$/, '');
const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'https://gateway.spay5s.com/api/v1/bank';
const apiUrl = process.env.INTERNAL_API_URL || publicApiUrl;
const phpOrigin = new URL(publicApiUrl, siteUrl).origin;
const resolvePhpMediaUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const path = value.trim();
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith('/') ? path : `/${path}`, phpOrigin).toString();
};

const fallback: SiteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'APIBANK',
  title:
    process.env.NEXT_PUBLIC_SITE_TITLE ||
    'APIBANK - Nền tảng tích hợp API ngân hàng',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Nền tảng tích hợp ngân hàng, đồng bộ giao dịch, webhook và tự động hóa thanh toán dành cho doanh nghiệp.',
  keywords: [
    'API ngân hàng',
    'bank API',
    'API giao dịch',
    'webhook ngân hàng',
    'đồng bộ giao dịch',
    'thanh toán tự động',
    'APIBANK',
  ],
  author: process.env.NEXT_PUBLIC_SITE_NAME || 'APIBANK',
  logo: null,
  favicon: null,
  og_image: null,
  hotline: null,
  email: null,
  socials: [],
  url: siteUrl,
  locale: 'vi_VN',
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch(
      `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=site-config`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!response.ok) return fallback;
    const payload = await response.json();
    const data = payload?.status === 'success' ? payload.data : payload;
    return {
      ...fallback,
      ...data,
      logo: resolvePhpMediaUrl(data.logo),
      favicon: resolvePhpMediaUrl(data.favicon),
      og_image: resolvePhpMediaUrl(data.og_image),
      keywords:
        Array.isArray(data.keywords) && data.keywords.length
          ? data.keywords
          : fallback.keywords,
      socials: Array.isArray(data.socials) ? data.socials : [],
      url:
        typeof data.url === 'string' && /^https?:\/\//.test(data.url)
          ? data.url.replace(/\/$/, '')
          : siteUrl,
      locale: 'vi_VN',
    };
  } catch {
    return fallback;
  }
}

export function createRootMetadata(site: SiteConfig): Metadata {
  const logo =
    site.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(site.name)}&background=0f766e&color=ffffff&bold=true&size=512`;
  const favicon = site.favicon || logo;
  const shareImage = site.og_image || logo;
  return {
    metadataBase: new URL(site.url),
    applicationName: site.name,
    title: { default: site.title, template: `%s | ${site.name}` },
    description: site.description,
    keywords: site.keywords,
    authors: [{ name: site.author, url: site.url }],
    creator: site.author,
    publisher: site.name,
    category: 'technology',
    alternates: { canonical: '/', languages: { 'vi-VN': '/' } },
    openGraph: {
      type: 'website',
      locale: site.locale,
      url: '/',
      siteName: site.name,
      title: site.title,
      description: site.description,
      images: [{ url: shareImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.title,
      description: site.description,
      images: [shareImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  alternates: null,
};

export async function createPrivatePageMetadata(
  title: string,
  description?: string
): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    ...privateMetadata,
    title: { absolute: `${title} | ${site.name}` },
    ...(description ? { description } : {}),
  };
}
export function createJsonLd(site: SiteConfig) {
  const logo =
    site.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(site.name)}&background=0f766e&color=ffffff&bold=true&size=512`;
  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: { '@type': 'ImageObject', url: logo },
  };
  if (site.email) organization.email = site.email;
  if (site.hotline) organization.telephone = site.hotline;
  if (site.socials.length) organization.sameAs = site.socials;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: site.url,
        name: site.name,
        description: site.description,
        inLanguage: 'vi-VN',
        publisher: { '@id': `${site.url}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${site.url}/#application`,
        name: site.name,
        url: site.url,
        description: site.description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'vi-VN',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
          availability: 'https://schema.org/InStock',
        },
        provider: { '@id': `${site.url}/#organization` },
      },
    ],
  };
}

export const siteConfig = fallback;
