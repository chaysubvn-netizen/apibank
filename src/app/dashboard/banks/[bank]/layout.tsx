import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';

const bankNames: Record<string, string> = {
  acb: 'ACB',
  ocb: 'OCB',
  vpbank: 'VPBank',
  vietinbank: 'VietinBank',
  vietcombank: 'Vietcombank',
  viettelmoney: 'Viettel Money',
  mbbank: 'MBBank',
  bidv: 'BIDV',
  thesieure: 'TheSieuRe',
  seabank: 'SeABank',
  tpbank: 'TPBank',
  techcombank: 'Techcombank',
  binance: 'Binance Pay',
  trc20: 'TRC20 (USDT)',
  bep20: 'BEP20 (USDT)',
  paypal: 'PayPal',
  zalopay: 'ZaloPay',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bank: string }>;
}): Promise<Metadata> {
  const { bank } = await params;
  const name = bankNames[bank.toLowerCase()] ?? bank.toUpperCase();

  return createPrivatePageMetadata(
    `Cổng thanh toán ${name}`,
    `Quản lý tài khoản và giao dịch ngân hàng ${name}.`
  );
}

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
