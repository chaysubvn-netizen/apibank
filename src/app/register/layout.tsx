import type { Metadata } from 'next';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...privateMetadata,
  title: 'Đăng ký',
  description: 'Đăng ký tài khoản APIBANK.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
