import { createPrivatePageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return createPrivatePageMetadata(
    'Dịch vụ Captcha',
    'Cấu hình giá dịch vụ Captcha.'
  );
}

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
