import { createPrivatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return createPrivatePageMetadata(
    'Cài đặt hệ thống',
    'Quản lý toàn bộ cấu hình hệ thống.'
  );
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
