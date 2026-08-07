'use client';

import {
  ArrowLeftOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CopyOutlined,
  CreditCardOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Skeleton, Tag } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { banks } from '../../../page';

type Detail = {
  id: number;
  bank_code: string;
  login?: string;
  account_number?: string;
  owner?: string;
  api_token?: string;
  ocb_username?: string;
  binance_api_key?: string;
  binance_api_secret?: string;
  updated_at?: number | string;
};
const formatTime = (value: Detail['updated_at']) => {
  if (!value) return 'Chưa cập nhật';
  if (/^\d+$/.test(String(value)))
    return new Date(Number(value) * 1000).toLocaleString('vi-VN');
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('vi-VN');
};

function CopyValue({
  value,
  secret = false,
}: {
  value?: string;
  secret?: boolean;
}) {
  const { message } = App.useApp();
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    message.success('Đã sao chép vào bộ nhớ tạm');
  };
  return (
    <div className={`account-value ${secret ? 'account-value-secret' : ''}`}>
      <span>{value || 'Chưa có dữ liệu'}</span>
      {value && (
        <Button
          aria-label="Sao chép"
          type="text"
          icon={<CopyOutlined />}
          onClick={copy}
        />
      )}
    </div>
  );
}

export default function AccountDetail() {
  const params = useParams<{ bank: string; id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState<Detail | null>(null);
  const bank = banks.find((item) => item.code === params.bank) || banks[0];
  useEffect(() => {
    let active = true;
    api<{ data: Detail }>(`/bank-accounts/${params.bank}/${params.id}`)
      .then((result) => {
        if (active) setData(result.data);
      })
      .catch((error) =>
        message.error(
          error instanceof Error ? error.message : 'Không tải được tài khoản'
        )
      );
    return () => {
      active = false;
    };
  }, [message, params.bank, params.id]);
  if (!data)
    return (
      <div className="account-detail-loading">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  const back = () => router.push(`/dashboard/banks/${bank.code}`);
  return (
    <div className="account-detail-page">
      <Button
        className="account-back-link"
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={back}
      >
        Quay lại danh sách
      </Button>
      <section className="account-hero">
        <div className="account-bank-mark">
          <BankOutlined />
        </div>
        <div className="account-hero-copy">
          <div className="account-eyebrow">Cổng thanh toán</div>
          <h1>{bank.name}</h1>
          <p>Thông tin kết nối và quyền truy cập API của tài khoản</p>
        </div>
        <Tag
          className="account-status"
          icon={<CheckCircleFilled />}
          color="success"
        >
          Đang kết nối
        </Tag>
      </section>
      <div className="account-detail-grid">
        <Card className="account-info-card" variant="borderless">
          <div className="account-section-heading">
            <div>
              <span>Thông tin tài khoản</span>
              <h2>Chi tiết kết nối</h2>
            </div>
            <CreditCardOutlined />
          </div>
          <div className="account-field-grid">
            <div className="account-field">
              <label>
                <UserOutlined />{' '}
                {bank.code === 'binance'
                  ? 'API Key Binance'
                  : 'Tên đăng nhập / SĐT'}
              </label>
              <CopyValue
                value={
                  bank.code === 'binance' ? data.binance_api_key : data.login
                }
              />
            </div>
            <div className="account-field">
              <label>
                <CreditCardOutlined />{' '}
                {bank.code === 'binance' ? 'Tài khoản Binance' : 'Số tài khoản'}
              </label>
              <CopyValue value={data.account_number} />
            </div>
            {bank.code === 'binance' ? (
              <div className="account-field">
                <label>
                  <KeyOutlined /> API Secret Binance
                </label>
                <CopyValue value={data.binance_api_secret} secret />
              </div>
            ) : (
              <div className="account-field">
                <label>
                  <UserOutlined /> Chủ tài khoản
                </label>
                <CopyValue value={data.owner} />
              </div>
            )}
            <div className="account-field">
              <label>
                <CalendarOutlined /> Cập nhật lần cuối
              </label>
              <div className="account-value">
                <span>{formatTime(data.updated_at)}</span>
              </div>
            </div>
            {data.ocb_username && (
              <div className="account-field account-field-wide">
                <label>
                  <UserOutlined /> Tên đăng nhập OCB
                </label>
                <CopyValue value={data.ocb_username} />
              </div>
            )}
          </div>
        </Card>
        <Card className="account-security-card" variant="borderless">
          <div className="account-security-icon">
            <SafetyCertificateOutlined />
          </div>
          <span className="account-eyebrow">Bảo mật API</span>
          <h2>Token riêng tư</h2>
          <p>Dùng token này để xác thực các yêu cầu API của riêng bạn.</p>
          <div className="account-field token-private">
            <label>
              <KeyOutlined /> Token API (Private)
            </label>
            <CopyValue value={data.api_token || 'N/A'} secret />
          </div>
          <div className="account-token-warning">
            <SafetyCertificateOutlined />
            <span>
              Tuyệt đối không chia sẻ token này. Nếu bị lộ, hãy tạo token mới
              ngay.
            </span>
          </div>
        </Card>
      </div>
      <div className="account-footer-actions">
        <Button size="large" icon={<ArrowLeftOutlined />} onClick={back}>
          Quay lại danh sách {bank.name}
        </Button>
      </div>
    </div>
  );
}
