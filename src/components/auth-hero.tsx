'use client';

import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

const banks = [
  ['ACB', '/banks/acb.svg'],
  ['MBBank', '/banks/mbbank.svg'],
  ['Vietcombank', '/banks/vietcombank.svg'],
  ['VietinBank', '/banks/vietinbank.svg'],
  ['OCB', '/banks/ocb.png'],
  ['TPBank', '/banks/tpbank.png'],
  ['VPBank', '/banks/vpbank.jpg'],
] as const;
export default function AuthHero({
  title,
  description,
  secure = false,
}: {
  title: ReactNode;
  description: string;
  secure?: boolean;
}) {
  const [site, setSite] = useState<{ name: string; logo: string | null }>({
    name: 'APIBANK',
    logo: null,
  });
  useEffect(() => {
    api<{ name: string; logo: string | null }>('/site-config', {
      authenticated: false,
    })
      .then(setSite)
      .catch(() => {});
  }, []);
  return (
    <section className="login-hero">
      <div className="auth-bank-orbit" aria-hidden="true">
        {banks.map(([name, src], index) => (
          <span
            key={name}
            style={{ '--bank-index': index } as React.CSSProperties}
          >
            <img src={src} alt="" />
          </span>
        ))}
      </div>
      <div className="auth-hero-glow" />
      <div className="auth-hero-content">
        <Link className="auth-site-brand" href="/">
          {site.logo ? (
            <img src={site.logo} alt={`Logo ${site.name}`} />
          ) : (
            <>
              <b>A</b>
              <strong>{site.name}</strong>
            </>
          )}
        </Link>
        <h1>{title}</h1>
        <p>{description}</p>
        {secure && (
          <Space>
            <SafetyCertificateOutlined /> Dữ liệu được bảo vệ và phân quyền chặt
            chẽ
          </Space>
        )}
        <div className="auth-bank-strip" aria-label="Các ngân hàng hỗ trợ">
          {banks.slice(0, 5).map(([name, src]) => (
            <span key={name} title={name}>
              <img src={src} alt={`Logo ${name}`} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
