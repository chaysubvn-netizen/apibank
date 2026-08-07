import type { Metadata } from 'next';
import Providers from '@/components/providers';
import { createJsonLd, createRootMetadata, getSiteConfig } from '@/lib/seo';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  return createRootMetadata(await getSiteConfig());
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = createJsonLd(await getSiteConfig());
  return (
    <html lang="vi">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
