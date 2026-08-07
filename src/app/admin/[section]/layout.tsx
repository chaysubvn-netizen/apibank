import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';

const sectionTitles: Record<string, string> = {
  'cron-servers': 'Quản lý máy chủ Cron',
  'cron-jobs': 'Quản lý Cron Job',
  withdrawals: 'Quản lý yêu cầu rút tiền',
  invoices: 'Quản lý hóa đơn',
  webhooks: 'Quản lý Webhooks',
  transactions: 'Quản lý giao dịch',
  'balance-logs': 'Lịch sử biến động số dư',
  'activity-logs': 'Nhật ký hoạt động',
  'telegram-logs': 'Lịch sử gửi Telegram',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const title =
    sectionTitles[section] ??
    section
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return createPrivatePageMetadata(title, `${title} trong trung tâm quản trị.`);
}

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
