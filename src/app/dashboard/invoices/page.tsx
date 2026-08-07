/* eslint-disable @next/next/no-img-element */
'use client';
import {
  CopyOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';

type Bank = {
  id: number;
  short_name: string;
  accountNumber: string;
  accountName: string;
};
type Invoice = {
  id: number;
  trans_id: string;
  payment_method: string;
  amount: number;
  description: string;
  status: number;
  create_time: string;
};
const quick = [10000, 20000, 50000, 100000, 300000, 500000, 1000000, 10000000];
type AmountInputProps = {
  value?: number | null;
  onChange?: (value: number | null) => void;
  id?: string;
};
function AmountInput({ value, onChange, id }: AmountInputProps) {
  return (
    <Space.Compact block className="deposit-amount-compact">
      <Input
        className="deposit-currency"
        value="VND"
        readOnly
        aria-label="Đơn vị tiền tệ"
      />
      <InputNumber<number>
        id={id}
        value={value}
        onChange={onChange}
        className="deposit-amount"
        min={10000}
        max={100000000}
        step={10000}
        placeholder="Nhập số tiền"
        formatter={(amount) =>
          String(amount ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
        parser={(amount) => Number((amount || '').replace(/\./g, ''))}
      />
    </Space.Compact>
  );
}
const status = (value: number) =>
  value === 1 ? (
    <Tag color="success">Hoàn thành</Tag>
  ) : value === 0 ? (
    <Tag color="warning">Chờ xử lý</Tag>
  ) : (
    <Tag color="error">Đã hủy</Tag>
  );
export default function InvoicesPage() {
  const { message, modal } = App.useApp(),
    router = useRouter();
  const [form] = Form.useForm();
  const [banks, setBanks] = useState<Bank[]>([]),
    [invoices, setInvoices] = useState<Invoice[]>([]),
    [selected, setSelected] = useState<number>(),
    [loading, setLoading] = useState(true),
    [creating, setCreating] = useState(false);
  const previousStatuses = useRef<Map<number, number> | null>(null);
  const load = useCallback(() =>
    api<{ banks: Bank[]; invoices: Invoice[] }>('/billing')
      .then((r) => {
        const normalized = r.invoices.map((invoice) => ({ ...invoice, status: Number(invoice.status) }));
        const currentStatuses = new Map(normalized.map((invoice) => [Number(invoice.id), invoice.status]));
        if (previousStatuses.current) {
          const paid = normalized.find((invoice) => previousStatuses.current?.get(Number(invoice.id)) === 0 && invoice.status === 1);
          if (paid) modal.success({ title: "Nạp tiền thành công", content: `Hóa đơn ${paid.trans_id} đã thanh toán thành công. Số tiền ${formatMoney(paid.amount)} đã được ghi nhận vào tài khoản.`, okText: "Đã hiểu", centered: true });
        }
        previousStatuses.current = currentStatuses;
        setBanks(r.banks);
        setInvoices(normalized);
      })
      .finally(() => setLoading(false)), [modal]);
  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(poll);
  }, [load]);
  const create = async (v: { amount: number }) => {
    if (!selected) {
      message.warning('Vui lòng chọn cổng thanh toán');
      return;
    }
    setCreating(true);
    try {
      const r = await api<{ message: string; id: number }>(
        '/billing/invoices',
        {
          method: 'POST',
          body: JSON.stringify({ bank_id: selected, amount: v.amount }),
        }
      );
      message.success(r.message);
      router.push(`/dashboard/invoices/${r.id}`);
    } finally {
      setCreating(false);
    }
  };
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    message.success('Đã sao chép vào bộ nhớ tạm!');
  };
  if (loading) return <Skeleton active paragraph={{ rows: 14 }} />;
  return (
    <div className="deposit-page">
      <div className="page-title">
        <h1>Nạp tiền vào tài khoản</h1>
        <p>Chọn cổng nạp, nhập số tiền và thanh toán bằng mã QR.</p>
      </div>
      <Row className="deposit-top-section" gutter={[24, 24]} align="top">
        <Col xs={24} xl={16}>
          <div className="deposit-bank-grid">
            {banks.map((bank) => (
              <button
                type="button"
                key={bank.id}
                className={`deposit-bank ${selected === bank.id ? 'selected' : ''}`}
                onClick={() => setSelected(bank.id)}
              >
                <img
                  src={`https://api.vietqr.io/img/${encodeURIComponent(bank.short_name)}.png`}
                  alt={bank.short_name}
                />
                <span>
                  <b>{bank.short_name}</b>
                  <small>{bank.accountName}</small>
                  <strong>{bank.accountNumber}</strong>
                </span>
                {selected === bank.id && <i>✓</i>}
              </button>
            ))}
          </div>
          {banks.length === 0 && (
            <Card>
              <Empty description="Chưa cấu hình cổng nạp tiền" />
            </Card>
          )}
          {selected && (
            <Card className="deposit-amount-card" variant="borderless">
              <Form form={form} layout="vertical" onFinish={create}>
                <Form.Item
                  name="amount"
                  label="Số tiền muốn nạp"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số tiền' },
                    {
                      type: 'number',
                      min: 10000,
                      message: 'Số tiền tối thiểu là 10.000đ',
                    },
                  ]}
                >
                  <AmountInput />
                </Form.Item>
                <div className="quick-amounts">
                  {quick.map((v) => (
                    <Button
                      key={v}
                      onClick={() => {
                        form.setFieldValue('amount', v);
                        void form.validateFields(['amount']);
                      }}
                    >
                      {Number(v).toLocaleString('vi-VN')}đ
                    </Button>
                  ))}
                </div>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={creating}
                  icon={<PlusOutlined />}
                >
                  Tạo hóa đơn
                </Button>
              </Form>
            </Card>
          )}
        </Col>
        <Col xs={24} xl={8}>
          <Card
            className="deposit-guide"
            title={
              <>
                <InfoCircleOutlined /> HƯỚNG DẪN NẠP HÓA ĐƠN
              </>
            }
            variant="borderless"
          >
            <ol>
              <li>
                <b>Chọn cổng nạp</b>
              </li>
              <li>
                <b>Nhập số tiền nạp</b>
                <p>Số tiền tối thiểu là 10.000 VNĐ.</p>
              </li>
              <li>
                <b>Ấn “Tạo hóa đơn”</b>
                <p>Hệ thống tạo nội dung chuyển khoản riêng.</p>
              </li>
              <li>
                <b>Quét QR để chuyển khoản</b>
                <p>Giữ nguyên số tiền và nội dung để được cộng tiền tự động.</p>
              </li>
            </ol>
          </Card>
        </Col>
      </Row>
      <Card
        className="invoice-history"
        title={
          <>
            <FileTextOutlined /> Hóa đơn
          </>
        }
        variant="borderless"
      >
        <Table
          rowKey="id"
          dataSource={invoices}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="Chưa có hóa đơn" /> }}
          columns={[
            {
              title: 'Thao tác',
              key: 'action',
              width: 110,
              render: (_, r) => (
                <Button
                  type="primary"
                  ghost
                  onClick={() => router.push(`/dashboard/invoices/${r.id}`)}
                >
                  Chi tiết
                </Button>
              ),
            },
            {
              title: 'Cổng',
              dataIndex: 'payment_method',
              width: 110,
              render: (v) => <Tag color="cyan">{v}</Tag>,
            },
            {
              title: 'Mã hóa đơn',
              dataIndex: 'trans_id',
              width: 180,
              render: (v) => (
                <Typography.Link onClick={() => copy(v)}>
                  <CopyOutlined /> {v}
                </Typography.Link>
              ),
            },
            {
              title: 'Số tiền',
              dataIndex: 'amount',
              width: 140,
              render: (v) => <b>{formatMoney(v)}</b>,
            },
            {
              title: 'Thực nhận',
              dataIndex: 'amount',
              width: 140,
              render: (v) => <b className="money-in">{formatMoney(v)}</b>,
            },
            { title: 'Ghi chú', dataIndex: 'description', ellipsis: true },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 120,
              render: status,
            },
            {
              title: 'Thời gian',
              dataIndex: 'create_time',
              width: 180,
              render: (v) =>
                /^\d+$/.test(String(v))
                  ? new Date(Number(v) * 1000).toLocaleString('vi-VN')
                  : v,
            },
          ]}
        />
      </Card>
    </div>
  );
}
