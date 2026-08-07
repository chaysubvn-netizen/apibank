'use client';
import { Spin } from 'antd';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { BankGatewayContent } from '../page';
function Content() {
  const params = useParams<{ bank: string }>();
  return <BankGatewayContent bankCode={params.bank} />;
}
export default function BankPage() {
  return (
    <Suspense fallback={<Spin fullscreen />}>
      <Content />
    </Suspense>
  );
}
