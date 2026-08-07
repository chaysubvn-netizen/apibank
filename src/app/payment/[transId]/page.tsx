'use client';

import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CopyOutlined,
  SafetyCertificateFilled,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, QRCode, Skeleton, Tag } from 'antd';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from './payment.module.css';
type Payment = {
  trans_id: string;
  request_id?: string;
  title: string;
  description?: string;
  shop_name: string;
  amount: string;
  currency: string;
  network: string;
  receiver_address: string;
  blockchain_tx?: string;
  status: 'waiting' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  success_url?: string;
  cancel_url?: string;
};
export default function PaymentPage() {
  const { message } = App.useApp(),
    { transId } = useParams<{ transId: string }>(),
    [data, setData] = useState<Payment | null>(null),
    [error, setError] = useState(''),
    [seconds, setSeconds] = useState(0);
  const load = useCallback(async () => {
    try {
      setData(
        await api<Payment>(`/public/payment/${encodeURIComponent(transId)}`, {
          authenticated: false,
          cache: 'no-store',
        })
      );
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được hóa đơn.');
    }
  }, [transId]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (!data) return;
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
        )
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);
  useEffect(() => {
    if (data?.status !== 'completed' || !data.success_url) return;
    const timer = setTimeout(() => location.assign(data.success_url!), 3000);
    return () => clearTimeout(timer);
  }, [data]);
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    void message.success(`Đã sao chép ${label}`);
  };
  if (!data && !error)
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </section>
      </main>
    );
  if (!data)
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <Alert
            type="error"
            showIcon
            message="Không mở được hóa đơn"
            description={error}
          />
        </section>
      </main>
    );
  const done = data.status === 'completed',
    ended = data.status === 'expired' || data.status === 'cancelled',
    countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <SafetyCertificateFilled /> Thanh toán an toàn
          </div>
          <b>{data.shop_name}</b>
        </header>
        <div className={styles.content}>
          <div className={styles.summary}>
            <p className={styles.eyebrow}>Hóa đơn</p>
            <h1>{data.title}</h1>
            {data.description && (
              <p className={styles.description}>{data.description}</p>
            )}
            <div className={styles.amount}>
              <span>Số tiền cần thanh toán</span>
              <strong>
                {Number(data.amount).toFixed(4)} <small>USDT</small>
              </strong>
            </div>
            <dl>
              <div>
                <dt>Mã giao dịch</dt>
                <dd>{data.trans_id}</dd>
              </div>
              {data.request_id && (
                <div>
                  <dt>Mã đơn hàng</dt>
                  <dd>{data.request_id}</dd>
                </div>
              )}
              <div>
                <dt>Mạng lưới</dt>
                <dd>
                  <Tag color="cyan">{data.network}</Tag>
                </dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  {done ? (
                    <Tag color="success">Đã thanh toán</Tag>
                  ) : ended ? (
                    <Tag color="error">Đã kết thúc</Tag>
                  ) : (
                    <Tag color="processing">Đang chờ</Tag>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <div className={styles.checkout}>
            {done ? (
              <Result
                icon={<CheckCircleFilled className={styles.success} />}
                title="Thanh toán thành công"
                text="Giao dịch đã được xác nhận trên blockchain."
                url={data.success_url}
              />
            ) : ended ? (
              <Result
                icon={<StopOutlined className={styles.ended} />}
                title="Hóa đơn đã hết hạn"
                text="Vui lòng quay lại cửa hàng và tạo hóa đơn mới."
                url={data.cancel_url}
              />
            ) : (
              <>
                <div className={styles.timer}>
                  <ClockCircleOutlined /> Hết hạn sau{' '}
                  <strong>{countdown}</strong>
                </div>
                <div className={styles.qr}>
                  <QRCode
                    value={`tron:${data.receiver_address}?amount=${data.amount}`}
                    size={210}
                    bordered={false}
                  />
                </div>
                <p className={styles.scan}>Quét bằng ví hỗ trợ USDT TRC20</p>
                <CopyField
                  label="Địa chỉ ví nhận"
                  value={data.receiver_address}
                  onCopy={copy}
                />
                <CopyField
                  label="Số tiền chính xác"
                  value={`${Number(data.amount).toFixed(4)} USDT`}
                  onCopy={copy}
                />
                <Alert
                  className={styles.notice}
                  type="warning"
                  showIcon
                  message="Chỉ gửi USDT qua mạng TRC20 và đúng số tiền hiển thị."
                />
              </>
            )}
          </div>
        </div>
        <footer>Được bảo vệ bởi APIBANK · Tự động cập nhật mỗi 5 giây</footer>
      </section>
    </main>
  );
}
function CopyField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div>
        <span>{value}</span>
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={() => onCopy(value.replace(' USDT', ''), label)}
        />
      </div>
    </div>
  );
}
function Result({
  icon,
  title,
  text,
  url,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  url?: string;
}) {
  return (
    <div className={styles.result}>
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
      {url && (
        <Button
          type="primary"
          size="large"
          onClick={() => location.assign(url)}
        >
          Quay lại cửa hàng
        </Button>
      )}
    </div>
  );
}
