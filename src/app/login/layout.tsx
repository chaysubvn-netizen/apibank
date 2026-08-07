import type { Metadata } from 'next';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...privateMetadata,
  title: 'Đăng nhập',
  description: 'Đăng nhập vào hệ thống APIBANK.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
