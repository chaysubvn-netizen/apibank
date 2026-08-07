'use client';

import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import GuestGuard from '@/components/guest-guard';
import AuthHero from '@/components/auth-hero';

type RegisterResponse = { token: string; user: Record<string, unknown> };
export default function RegisterPage() {
  const router = useRouter(),
    { message } = App.useApp(),
    [loading, setLoading] = useState(false),
    trackedReferral = useRef(false);
  useEffect(() => {
    const referralId = Number(
      new URLSearchParams(location.search).get('ref') || 0
    );
    if (!trackedReferral.current && referralId > 0) {
      trackedReferral.current = true;
      api('/referrals/click', {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({ referral_id: referralId }),
      }).catch(() => undefined);
    }
  }, []);
  const submit = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const result = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          ...values,
          referral_id:
            Number(new URLSearchParams(location.search).get('ref') || 0) ||
            undefined,
        }),
      });
      localStorage.setItem('apibank_token', result.token);
      localStorage.removeItem('spay5s_token');
      localStorage.setItem('apibank_user', JSON.stringify(result.user));
      message.success('Đăng ký tài khoản thành công');
      router.replace('/dashboard');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Đăng ký thất bại.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <GuestGuard>
      <main className="login-page">
        <AuthHero
          title={
            <>
              Bắt đầu cùng
              <br />
              API Bank.
            </>
          }
          description="Tạo tài khoản để kết nối ngân hàng, quản lý giao dịch và tự động hóa webhook."
        />
        <section className="login-panel">
          <Card className="login-card" variant="borderless">
            <Typography.Title level={2}>Tạo tài khoản</Typography.Title>
            <Typography.Paragraph type="secondary">
              Điền thông tin bên dưới để bắt đầu.
            </Typography.Paragraph>
            <Form layout="vertical" size="large" onFinish={submit}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true }, { min: 4 }]}
              >
                <Input prefix={<UserOutlined />} autoComplete="username" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true }, { type: 'email' }]}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true }, { min: 6 }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="password_confirmation"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return !value || getFieldValue('password') === value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error('Mật khẩu xác nhận không khớp')
                          );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Button block type="primary" htmlType="submit" loading={loading}>
                Đăng ký
              </Button>
              <Divider plain>Đã có tài khoản?</Divider>
              <Button block onClick={() => router.push('/login')}>
                Quay lại đăng nhập
              </Button>
            </Form>
          </Card>
        </section>
      </main>
    </GuestGuard>
  );
}
