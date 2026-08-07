'use client';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  InfoCircleFilled,
  ReloadOutlined,
  SafetyCertificateFilled,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Button, Card, Result, Skeleton, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
type Package = {
  id: number;
  name: string;
  description?: string;
  limit_accounts: number;
  limit_transactions: number;
};
type Current = {
  package: Package | null;
  expires_at: string | null;
  active: boolean;
  balance: number;
};
export default function CurrentPackagePage() {
  const router = useRouter(),
    [data, setData] = useState<Current>(),
    [loading, setLoading] = useState(true),
    [loadedAt, setLoadedAt] = useState(0);
  useEffect(() => {
    api<Current>('/subscription')
      .then((result) => {
        setLoadedAt(Date.now());
        setData(result);
      })
      .finally(() => setLoading(false));
  }, []);
  const days = data?.expires_at
    ? Math.max(
        0,
        Math.ceil((new Date(data.expires_at).getTime() - loadedAt) / 86400000)
      )
    : 0;
  if (loading) return <Skeleton active paragraph={{ rows: 12 }} />;
  return (
    <div className="current-package-page">
      <div className="page-title">
        <h1>Gói đang sử dụng</h1>
        <p>Thông tin và trạng thái gói API hiện tại của bạn.</p>
      </div>
      <Card
        className="current-package-card"
        title="Thông tin gói sử dụng"
        variant="borderless"
      >
        {data?.active && data.package ? (
          <div className="active-package">
            <div className="package-state-icon active">
              <SafetyCertificateFilled />
            </div>
            <Tag color="success">ĐANG HOẠT ĐỘNG</Tag>
            <h2>{data.package.name}</h2>
            <p>
              Gói của bạn đang hoạt động bình thường.
              <br />
              Hạn sử dụng còn <strong>{days} ngày</strong>.
            </p>
            <div className="package-detail-box">
              <div>
                <CheckCircleFilled />
                <span>Trạng thái</span>
                <b>Hoạt động</b>
              </div>
              <div>
                <ClockCircleFilled />
                <span>Ngày hết hạn</span>
                <b>
                  {data.expires_at
                    ? new Date(data.expires_at).toLocaleString('vi-VN')
                    : '—'}
                </b>
              </div>
              <div>
                <ThunderboltFilled />
                <span>Lượt giao dịch</span>
                <b>
                  {Number(data.package.limit_transactions) === -1
                    ? 'Không giới hạn'
                    : Number(data.package.limit_transactions).toLocaleString(
                        'vi-VN'
                      ) + '/tháng'}
                </b>
              </div>
              <div>
                <InfoCircleFilled />
                <span>Tài khoản</span>
                <b>{data.package.limit_accounts} tài khoản/ngân hàng</b>
              </div>
            </div>
            {data.package.description && (
              <p className="current-package-description">
                {data.package.description}
              </p>
            )}
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => router.push('/dashboard/upgrade')}
            >
              Gia hạn thêm
            </Button>
          </div>
        ) : (
          <Result
            className="empty-package"
            icon={
              <div className="package-state-icon empty">
                <InfoCircleFilled />
              </div>
            }
            title="Bạn chưa có gói dịch vụ đang hoạt động"
            subTitle="Đăng ký gói API để mở khóa các tính năng và kết nối ngân hàng của bạn."
            extra={
              <Button
                type="primary"
                size="large"
                onClick={() => router.push('/dashboard/upgrade')}
              >
                Đăng ký gói ngay
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}
