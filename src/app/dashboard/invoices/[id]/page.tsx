/* eslint-disable @next/next/no-img-element */
'use client';
import {
  ArrowLeftOutlined,
  StopOutlined,
  CopyOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Result,
  Row,
  Skeleton,
} from 'antd';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';
type Detail = {
  invoice: {
    id: number;
    trans_id: string;
    payment_method: string;
    amount: number;
    description?: string;
    status: number;
  };
  bank: { short_name: string; accountName: string; accountNumber: string };
  qr_url: string;
  expires_at: number;
};
export default function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    router = useRouter(),
    { message, modal } = App.useApp();
  const [data, setData] = useState<Detail>(),
    [seconds, setSeconds] = useState(0),
    [canceling, setCanceling] = useState(false),
    notifiedPayment = useRef(false);
  const load = useCallback(
    () =>
      api<Detail>(`/billing/invoices/${id}`).then((r) => {
        const normalized = {
          ...r,
          invoice: { ...r.invoice, status: Number(r.invoice.status) },
        };
        setData(normalized);
        setSeconds(Math.max(0, r.expires_at - Math.floor(Date.now() / 1000)));
      }),
    [id]
  );
  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load]);
  useEffect(() => {
    if (
      Number(data?.invoice.status) !== 1 ||
      notifiedPayment.current ||
      !data?.invoice
    )
      return;
    notifiedPayment.current = true;
    modal.success({
      title: 'Nạp tiền thành công',
      content: `Hệ thống đã ghi nhận ${formatMoney(data.invoice.amount)} vào tài khoản của bạn.`,
      okText: 'Đóng',
      centered: true,
    });
  }, [data, modal]);
  useEffect(() => {
    if (!data?.invoice || data.invoice.status !== 0) return;
    const timer = setInterval(
      () => setSeconds((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [data]);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    message.success('Đã sao chép vào bộ nhớ tạm!');
  };
  const cancel = () =>
    modal.confirm({
      title: 'Xác nhận hủy hóa đơn?',
      content: 'Bạn có chắc chắn muốn hủy hóa đơn nạp tiền này không?',
      okText: 'Hủy hóa đơn',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      onOk: async () => {
        setCanceling(true);
        try {
          const r = await api<{ message: string }>(
            `/billing/invoices/${id}/cancel`,
            { method: 'POST' }
          );
          message.success(r.message);
          await load();
        } finally {
          setCanceling(false);
        }
      },
    });
  if (!data) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!data.invoice || !data.bank)
    return (
      <Result
        status="error"
        title="Dữ liệu hóa đơn không hợp lệ"
        subTitle="API không trả về đầy đủ invoice và thông tin ngân hàng."
      />
    );
  const pending = data.invoice.status === 0,
    paymentContent = data.invoice.description?.trim() || 'Đang cập nhật...';
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0'),
    ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="invoice-detail">
      <div className="page-title">
        <h1>Thanh toán hóa đơn</h1>
        <p>Mã hóa đơn: {data.invoice.trans_id}</p>
      </div>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={10}>
          <Card
            title="THÔNG TIN THANH TOÁN"
            extra={
              pending && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  loading={canceling}
                  onClick={cancel}
                >
                  Hủy hóa đơn
                </Button>
              )
            }
            variant="borderless"
          >
            <Descriptions
              column={1}
              bordered
              items={[
                {
                  key: 'bank',
                  label: 'Cổng nạp',
                  children: <b>{data.bank.short_name}</b>,
                },
                {
                  key: 'name',
                  label: 'Chủ tài khoản',
                  children: <b>{data.bank.accountName}</b>,
                },
                {
                  key: 'account',
                  label: 'Số tài khoản',
                  children: (
                    <span>
                      {data.bank.accountNumber}{' '}
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => copy(data.bank.accountNumber)}
                      />
                    </span>
                  ),
                },
                {
                  key: 'memo',
                  label: 'Nội dung',
                  children: (
                    <span>
                      <b>{paymentContent}</b>
                      {data.invoice.description && (
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => copy(data.invoice.description!)}
                        />
                      )}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  label: 'Số tiền',
                  children: (
                    <span>
                      <b>{formatMoney(data.invoice.amount)}</b>{' '}
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => copy(String(data.invoice.amount))}
                      />
                    </span>
                  ),
                },
              ]}
            />
            <div className="invoice-status">
              {pending ? (
                <>
                  <span>Hóa đơn sẽ hết hạn sau</span>
                  <div className="countdown">
                    <b>
                      {mm}
                      <small>Phút</small>
                    </b>
                    <b>
                      {ss}
                      <small>Giây</small>
                    </b>
                  </div>
                </>
              ) : data.invoice.status === 1 ? (
                <Result status="success" title="ĐÃ THANH TOÁN" />
              ) : (
                <Result status="error" title="HÓA ĐƠN ĐÃ HỦY" />
              )}
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/dashboard/invoices')}
              >
                Quay về
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="qr-payment" variant="borderless">
            <h2>
              <QrcodeOutlined /> Quét mã QR để thanh toán
            </h2>
            <p>Vui lòng không đóng trang cho đến khi hoàn tất thanh toán</p>
            {pending ? (
              <img src={data.qr_url} alt="Mã QR thanh toán" />
            ) : (
              <div className="qr-disabled">QR KHÔNG CÒN HIỆU LỰC</div>
            )}
            <small>
              Sử dụng ứng dụng ngân hàng hoặc ví điện tử hỗ trợ VietQR để quét
              mã.
            </small>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
