'use client';

import { QrcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Checkbox, Form, Input, Segmented, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type StartResult = {
  flow_id: string;
  status: string;
  image: string;
  expires_in: number;
};
type ApiResult = { status: string | number; message?: string; msg?: string };

export function ZaloPayQrConnect({ onConnected }: { onConnected: () => void }) {
  const { message } = App.useApp();
  const [mode, setMode] = useState<string>('qr');
  const [account, setAccount] = useState('');
  const [cookie, setCookie] = useState('');
  const [agree, setAgree] = useState(false);
  const [flow, setFlow] = useState<StartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    'Nhấn Lấy mã QR, sau đó dùng ứng dụng Zalo quét mã.'
  );
  const polling = useRef(false);

  useEffect(() => {
    if (!flow || mode !== 'qr') return;
    polling.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!polling.current) return;
      try {
        const result = await api<ApiResult>('/bank-accounts/zalopay/qr/poll', {
          method: 'POST',
          body: JSON.stringify({ flow_id: flow.flow_id }),
        });
        if (
          String(result.status) === '2' ||
          result.status === 'success' ||
          result.status === 'confirmed'
        ) {
          polling.current = false;
          message.success(
            result.msg || result.message || 'Đã kết nối ZaloPay thành công.'
          );
          onConnected();
          return;
        }
        if (result.status === 'expired' || result.status === 'error') {
          polling.current = false;
          setFlow(null);
          setStatus(result.message || 'Mã QR đã hết hạn. Vui lòng tạo mã mới.');
          return;
        }
        setStatus(
          result.message ||
            (result.status === 'waiting_confirm'
              ? 'Đã quét mã. Hãy xác nhận đăng nhập trên điện thoại.'
              : 'Đang chờ quét mã QR...')
        );
        timer = setTimeout(poll, 2000);
      } catch (error) {
        polling.current = false;
        setFlow(null);
        setStatus(
          error instanceof Error ? error.message : 'Không thể kiểm tra mã QR.'
        );
      }
    };
    timer = setTimeout(poll, 1500);
    return () => {
      polling.current = false;
      clearTimeout(timer);
    };
  }, [flow, message, mode, onConnected]);

  const requireAgreement = () => {
    if (agree) return true;
    message.warning(
      'Bạn phải đồng ý điều khoản sử dụng và chính sách bảo mật.'
    );
    return false;
  };

  const startQr = async () => {
    if (!requireAgreement()) return;
    setLoading(true);
    try {
      const result = await api<StartResult>('/bank-accounts/zalopay/qr/start', {
        method: 'POST',
        body: JSON.stringify({ account }),
      });
      setFlow(result);
      setStatus('Đang chờ bạn quét mã QR bằng ứng dụng Zalo...');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể tạo mã QR Zalo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const connectCookie = async () => {
    if (!requireAgreement()) return;
    if (!account.trim() || !cookie.trim()) {
      message.warning('Vui lòng nhập tài khoản và Cookie ZaloPay.');
      return;
    }
    setLoading(true);
    try {
      const result = await api<ApiResult>('/bank-accounts/zalopay/connect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'LOGIN',
          fields: { account: account.trim(), cookie: cookie.trim() },
        }),
      });
      if (String(result.status) === '2' || result.status === 'success') {
        message.success(
          result.msg || result.message || 'Đã kết nối ZaloPay thành công.'
        );
        onConnected();
      } else {
        message.error(
          result.msg || result.message || 'Cookie ZaloPay không hợp lệ.'
        );
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể kết nối ZaloPay.'
      );
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (value: string | number) => {
    polling.current = false;
    setFlow(null);
    setMode(String(value));
  };

  return (
    <div className="zalopay-qr-connect">
      <Segmented
        block
        value={mode}
        onChange={changeMode}
        options={[
          { label: 'Quét mã QR', value: 'qr' },
          { label: 'Nhập Cookie thủ công', value: 'cookie' },
        ]}
        style={{ marginBottom: 20 }}
      />

      <Form layout="vertical">
        <Form.Item
          label="Tài khoản hoặc số điện thoại"
          required={mode === 'cookie'}
        >
          <Input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder={
              mode === 'qr'
                ? 'Có thể để trống, hệ thống sẽ lấy từ ZaloPay'
                : 'Nhập số điện thoại ZaloPay'
            }
          />
        </Form.Item>
        {mode === 'cookie' && (
          <Form.Item label="Cookie ZaloPay" required>
            <Input.TextArea
              rows={6}
              value={cookie}
              onChange={(event) => setCookie(event.target.value)}
              placeholder="Dán đầy đủ Cookie lấy từ phiên đăng nhập ZaloPay"
            />
          </Form.Item>
        )}
      </Form>

      {mode === 'qr' ? (
        flow ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              padding: '20px 0',
              textAlign: 'center',
            }}
          >
            <img
              src={flow.image}
              alt="QR đăng nhập Zalo"
              style={{
                display: 'block',
                width: 260,
                height: 260,
                maxWidth: '100%',
                objectFit: 'contain',
                margin: '0 auto',
                borderRadius: 12,
              }}
            />
            <div style={{ margin: '16px 0' }}>
              <Spin size="small" /> <span>{status}</span>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={startQr}
              loading={loading}
            >
              Tạo mã QR mới
            </Button>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 24,
              border: '2px dashed #16b875',
              borderRadius: 14,
              marginTop: 16,
            }}
          >
            <QrcodeOutlined style={{ fontSize: 42, color: '#16b875' }} />
            <h3>Lấy Cookie Tự Động</h3>
            <p>{status}</p>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={startQr}
              loading={loading}
            >
              Lấy mã QR
            </Button>
          </div>
        )
      ) : (
        <Button block type="primary" onClick={connectCookie} loading={loading}>
          Kiểm tra và thêm tài khoản bằng Cookie
        </Button>
      )}

      <Checkbox
        checked={agree}
        onChange={(event) => setAgree(event.target.checked)}
        style={{ marginTop: 18 }}
      >
        Tôi đồng ý điều khoản sử dụng và chính sách bảo mật
      </Checkbox>
    </div>
  );
}
