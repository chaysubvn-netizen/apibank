import type { Metadata } from 'next';
import AppShell from '@/components/app-shell';
import { getSiteConfig } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = `Tổng Quan| ${site.name}`;
  const description =
    'Quản lý tài khoản ngân hàng, theo dõi giao dịch, cấu hình webhook và tích hợp API ngân hàng trên một dashboard tập trung.';
  return {
    title: { absolute: title },
    description,
    keywords: [
      ...site.keywords,
      'dashboard API ngân hàng',
      'quản lý giao dịch ngân hàng',
      'quản lý webhook',
    ],
    alternates: { canonical: '/dashboard' },
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
    openGraph: {
      type: 'website',
      locale: site.locale,
      url: '/dashboard',
      siteName: site.name,
      title,
      description,
      images: site.og_image
        ? [{ url: site.og_image, alt: site.name }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: site.og_image ? [site.og_image] : undefined,
    },
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
