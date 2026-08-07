'use client';

import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CopyOutlined,
  SafetyCertificateFilled,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Skeleton, Tag } from 'antd';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from './deposit.module.css';
type Invoice = {
  invoiceCode: string;
  orderId?: string;
  amount: number;
  description?: string;
  paymentContent: string;
  bank: {
    code: string;
    bin: string;
    accountNumber: string;
    accountName: string;
  };
  vietqr: { imageUrl: string };
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  expiresAt: string;
  successUrl?: string;
  cancelUrl?: string;
};
export default function DepositCheckout() {
  const { message } = App.useApp(),
    { invoiceCode } = useParams<{ invoiceCode: string }>(),
    search = useSearchParams();
  const [data, setData] = useState<Invoice | null>(null),
    [error, setError] = useState(''),
    [seconds, setSeconds] = useState(0),
    [cancelling, setCancelling] = useState(false),
    cancelToken = search.get('cancelToken') || '';
  const load = useCallback(async () => {
    try {
      setData(
        await api<Invoice>(
          `/deposit/public/invoices/${encodeURIComponent(invoiceCode)}`,
          { authenticated: false, cache: 'no-store' }
        )
      );
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được hóa đơn.');
    }
  }, [invoiceCode]);
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
          Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
        )
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);
  useEffect(() => {
    if (data?.status !== 'paid' || !data.successUrl) return;
    const timer = setTimeout(() => location.assign(data.successUrl!), 3000);
    return () => clearTimeout(timer);
  }, [data]);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    void message.success('Đã sao chép');
  };
  const cancel = async () => {
    if (!cancelToken) return;
    setCancelling(true);
    try {
      await api(
        `/deposit/public/invoices/${encodeURIComponent(invoiceCode)}/cancel`,
        {
          method: 'POST',
          authenticated: false,
          headers: { 'X-RPay-Cancel-Token': cancelToken },
        }
      );
      await load();
    } catch (e) {
      void message.error(
        e instanceof Error ? e.message : 'Không thể hủy hóa đơn'
      );
    } finally {
      setCancelling(false);
    }
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
  const paid = data.status === 'paid',
    ended = data.status === 'expired' || data.status === 'cancelled',
    countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header>
          <div>
            <SafetyCertificateFilled /> Thanh toán bảo mật
          </div>
          <b>VIETQR</b>
        </header>
        <div className={styles.content}>
          <aside>
            <p>HÓA ĐƠN THANH TOÁN</p>
            <h1>{data.description || 'Thanh toán đơn hàng'}</h1>
            <div className={styles.amount}>
              <small>Số tiền cần thanh toán</small>
              <strong>
                {new Intl.NumberFormat('vi-VN').format(data.amount)} ₫
              </strong>
            </div>
            <dl>
              <div>
                <dt>Mã hóa đơn</dt>
                <dd>{data.invoiceCode}</dd>
              </div>
              {data.orderId && (
                <div>
                  <dt>Mã đơn hàng</dt>
                  <dd>{data.orderId}</dd>
                </div>
              )}
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  {paid ? (
                    <Tag color="success">Đã thanh toán</Tag>
                  ) : ended ? (
                    <Tag color="error">Đã kết thúc</Tag>
                  ) : (
                    <Tag color="processing">Chờ thanh toán</Tag>
                  )}
                </dd>
              </div>
            </dl>
          </aside>
          <article>
            {paid ? (
              <Result
                paid
                title="Thanh toán thành công"
                text="Giao dịch ngân hàng đã được đối soát."
                url={data.successUrl}
              />
            ) : ended ? (
              <Result
                title={
                  data.status === 'cancelled'
                    ? 'Hóa đơn đã hủy'
                    : 'Hóa đơn đã hết hạn'
                }
                text="Vui lòng quay lại cửa hàng và tạo hóa đơn mới."
                url={data.cancelUrl}
              />
            ) : (
              <>
                <div className={styles.timer}>
                  <ClockCircleOutlined /> Hết hạn sau{' '}
                  <strong>{countdown}</strong>
                </div>
                <img
                  className={styles.qr}
                  src={data.vietqr.imageUrl}
                  alt="Mã VietQR thanh toán"
                />
                <p className={styles.hint}>
                  Mở ứng dụng ngân hàng và quét mã VietQR
                </p>
                <Field label="Ngân hàng" value={data.bank.code.toUpperCase()} />
                <Field
                  label="Số tài khoản"
                  value={data.bank.accountNumber}
                  copy={copy}
                />
                <Field
                  label="Chủ tài khoản"
                  value={data.bank.accountName || '—'}
                />
                <Field
                  label="Nội dung bắt buộc"
                  value={data.paymentContent}
                  copy={copy}
                />
                <Alert
                  className={styles.notice}
                  type="warning"
                  showIcon
                  message="Chuyển đúng số tiền và giữ nguyên nội dung để hệ thống tự đối soát."
                />
                {cancelToken && (
                  <Button
                    danger
                    block
                    loading={cancelling}
                    onClick={() => void cancel()}
                  >
                    Hủy thanh toán
                  </Button>
                )}
              </>
            )}
          </article>
        </div>
        <footer>
          APIBANK Payment · Trạng thái tự động cập nhật mỗi 5 giây
        </footer>
      </section>
    </main>
  );
}
function Field({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy?: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <small>{label}</small>
      <span>
        {value}
        {copy && (
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => void copy(value)}
          />
        )}
      </span>
    </div>
  );
}
function Result({
  paid,
  title,
  text,
  url,
}: {
  paid?: boolean;
  title: string;
  text: string;
  url?: string;
}) {
  return (
    <div className={styles.result}>
      {paid ? (
        <CheckCircleFilled className={styles.success} />
      ) : (
        <StopOutlined className={styles.stop} />
      )}
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
