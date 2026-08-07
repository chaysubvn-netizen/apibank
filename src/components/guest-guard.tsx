'use client';

import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('apibank_token');
    if (!token) {
      queueMicrotask(() => setChecking(false));
      return;
    }
    api('/auth/me')
      .then(() => router.replace('/dashboard'))
      .catch(() => {
        localStorage.removeItem('apibank_token');
        localStorage.removeItem('apibank_user');
        setChecking(false);
      });
  }, [router]);
  if (checking)
    return (
      <main className="guest-checking">
        <Spin size="large" />
        <span></span>
      </main>
    );
  return <>{children}</>;
}
