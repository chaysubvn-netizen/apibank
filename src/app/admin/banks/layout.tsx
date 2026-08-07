import { createPrivatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return createPrivatePageMetadata(
    'Quản lý ngân hàng',
    'Cấu hình ngân hàng nạp tiền.'
  );
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
