'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import type { ReactNode } from 'react';
import CurrencyProvider from '@/components/currency-provider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#0f766e',
            colorInfo: '#0f766e',
            borderRadius: 10,
            fontFamily: 'var(--font-sans)',
          },
          components: {
            Layout: { siderBg: '#083c3a', headerBg: '#ffffff' },
            Menu: { darkItemBg: '#083c3a', darkItemSelectedBg: '#0f766e' },
            Card: { headerBg: 'transparent' },
          },
        }}
      >
        <App>
          <CurrencyProvider>{children}</CurrencyProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
