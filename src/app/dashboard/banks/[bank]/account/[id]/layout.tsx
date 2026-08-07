import { createPrivatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return createPrivatePageMetadata(
    'Chi tiết tài khoản ngân hàng',
    'Thông tin tài khoản ngân hàng đã liên kết.'
  );
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
