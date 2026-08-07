import { createPrivatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return createPrivatePageMetadata(
    'Doanh thu và giao dịch',
    'Thống kê và tra cứu toàn bộ giao dịch.'
  );
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
