import { NextResponse } from 'next/server';

type ExchangeResponse = {
  base: string;
  date: string;
  time_last_updated: number;
  rates: Record<string, number>;
};
const endpoint = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function GET() {
  try {
    const response = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!response.ok)
      throw new Error(`Exchange rate API returned ${response.status}`);
    const data = (await response.json()) as ExchangeResponse;
    if (data.base !== 'USD' || !data.rates?.USD || !data.rates?.VND)
      throw new Error('Invalid exchange rate response');
    return NextResponse.json({
      base: data.base,
      date: data.date,
      time_last_updated: data.time_last_updated,
      rates: data.rates,
    });
  } catch {
    return NextResponse.json(
      { message: 'Không thể tải dữ liệu tỷ giá.' },
      { status: 502 }
    );
  }
}
