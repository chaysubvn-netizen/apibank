import type { Metadata } from 'next';
import AdminShell from '@/components/admin-shell';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...privateMetadata,
  title: 'Bảng điều khiển',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
