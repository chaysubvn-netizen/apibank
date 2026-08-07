'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import GuestGuard from '@/components/guest-guard';
import AuthHero from '@/components/auth-hero';

type LoginResponse = { token: string; user: Record<string, unknown> };
export default function LoginPage() {
  const router = useRouter(),
    { message } = App.useApp(),
    [loading, setLoading] = useState(false);
  const submit = async (values: { login: string; password: string }) => {
    setLoading(true);
    try {
      const result = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({ ...values, device_name: 'Next.js Web' }),
      });
      localStorage.setItem('apibank_token', result.token);
      localStorage.removeItem('spay5s_token');
      localStorage.setItem('apibank_user', JSON.stringify(result.user));
      message.success('Đăng nhập thành công');
      router.replace('/dashboard');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Đăng nhập thất bại.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <GuestGuard>
      <main className="login-page">
        <AuthHero
          secure
          title={
            <>
              Kết nối ngân hàng.
              <br />
              Vận hành tự động.
            </>
          }
          description="Quản lý nhiều tài khoản ngân hàng, theo dõi giao dịch tức thời và gửi webhook an toàn từ một nền tảng duy nhất."
        />
        <section className="login-panel">
          <Card className="login-card" variant="borderless">
            <Typography.Title level={2}>Chào mừng trở lại</Typography.Title>
            <Typography.Paragraph type="secondary">
              Đăng nhập để quản lý hệ thống API Bank.
            </Typography.Paragraph>
            <Form layout="vertical" size="large" onFinish={submit}>
              <Form.Item
                name="login"
                label="Tên đăng nhập hoặc email"
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập tài khoản"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Button block type="primary" htmlType="submit" loading={loading}>
                Đăng nhập
              </Button>
              <Divider plain>hoặc</Divider>
              <Button block onClick={() => router.push('/register')}>
                Đăng ký tài khoản mới
              </Button>
            </Form>
          </Card>
        </section>
      </main>
    </GuestGuard>
  );
}
