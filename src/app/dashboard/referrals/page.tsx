'use client';
import {
  BarChartOutlined,
  BankOutlined,
  CopyOutlined,
  DollarOutlined,
  GiftOutlined,
  LinkOutlined,
  RiseOutlined,
  TeamOutlined,
  UserAddOutlined,
  WalletOutlined,
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
  Tabs,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
type Referred = { id: number; username: string; create_date: string };
type Commission = {
  id: number;
  referred_username?: string;
  amount: number;
  description: string;
  create_date: string;
};
type Withdrawal = {
  id: number;
  bank_name: string;
  bank_number: string;
  bank_owner: string;
  amount: number;
  status: number;
  create_date: string;
};
type Data = {
  stats: {
    rate: number;
    clicks: number;
    referrals: number;
    available: number;
    withdrawn: number;
    total: number;
  };
  referral_code: number;
  minimum_withdraw: number;
  referred: Referred[];
  commissions: Commission[];
  withdrawals: Withdrawal[];
};
const status = (v: number) =>
  v === 0 ? (
    <Tag color="warning">Đang chờ</Tag>
  ) : v === 1 ? (
    <Tag color="success">Thành công</Tag>
  ) : (
    <Tag color="error">Đã hủy</Tag>
  );
export default function ReferralsPage() {
  const { message } = App.useApp(),
    [data, setData] = useState<Data>(),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const load = () =>
    api<Data>('/referrals')
      .then(setData)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  if (loading || !data) return <Skeleton active paragraph={{ rows: 16 }} />;
  const referralUrl =
    typeof window === 'undefined'
      ? `/register?ref=${data.referral_code}`
      : `${window.location.origin}/register?ref=${data.referral_code}`;
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    message.success('Đã sao chép liên kết!');
  };
  const withdraw = async (values: {
    bank_name: string;
    bank_number: string;
    bank_owner: string;
    amount: number;
  }) => {
    setSending(true);
    try {
      const r = await api<{ message: string }>('/referrals/withdraw', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      message.success(r.message);
      form.resetFields();
      await load();
    } finally {
      setSending(false);
    }
  };
  const overview = (
    <>
      <Row gutter={[16, 16]} className="affiliate-stats">
        {[
          [
            `${data.stats.rate}%`,
            '% thưởng',
            <GiftOutlined key="rate" />,
            'blue',
          ],
          [
            data.stats.clicks,
            'Lượt click',
            <RiseOutlined key="click" />,
            'cyan',
          ],
          [
            data.stats.referrals,
            'Đã giới thiệu',
            <UserAddOutlined key="users" />,
            'purple',
          ],
          [
            formatMoney(data.stats.available),
            'Số dư hoa hồng',
            <WalletOutlined key="balance" />,
            'orange',
          ],
          [
            formatMoney(data.stats.withdrawn),
            'Đã rút',
            <BankOutlined key="withdrawn" />,
            'green',
          ],
          [
            formatMoney(data.stats.total),
            'Tổng tiền thưởng',
            <DollarOutlined key="total" />,
            'red',
          ],
        ].map(([value, label, icon, tone]) => (
          <Col xs={24} sm={12} xl={8} key={String(label)}>
            <Card
              className={`affiliate-stat affiliate-${tone}`}
              variant="borderless"
            >
              <div className="affiliate-stat-copy">
                <small>{String(label)}</small>
                <strong>{String(value)}</strong>
              </div>
              <span className="affiliate-stat-icon">{icon}</span>
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="referral-link-card" variant="borderless">
        <div className="referral-promo">
          <span>
            <TeamOutlined />
          </span>
          <div>
            <h2>Mời bạn bè, nhận hoa hồng trọn đời</h2>
            <p>
              Nhận <strong>{data.stats.rate}% hoa hồng</strong> khi người được
              mời nạp tiền lần đầu và tiếp tục nhận thưởng cho các lần nạp sau.
            </p>
          </div>
        </div>
        <Row gutter={[18, 18]}>
          <Col xs={24} md={8}>
            <label>Mã liên kết</label>
            <Input
              size="large"
              value={String(data.referral_code)}
              readOnly
              prefix={<LinkOutlined />}
            />
          </Col>
          <Col xs={24} md={16}>
            <label>Liên kết giới thiệu của bạn</label>
            <Space.Compact block className="referral-copy-group">
              <Input size="large" value={referralUrl} readOnly />
              <Button
                type="primary"
                size="large"
                icon={<CopyOutlined />}
                onClick={() => copy(referralUrl)}
              >
                Sao chép
              </Button>
            </Space.Compact>
          </Col>
        </Row>
      </Card>
    </>
  );
  const users = (
    <Card
      className="affiliate-table-card"
      title="LỊCH SỬ GIỚI THIỆU"
      variant="borderless"
    >
      <Table
        rowKey="id"
        dataSource={data.referred}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: (
            <Empty description="Bạn chưa giới thiệu được người dùng nào" />
          ),
        }}
        columns={[
          { title: '#', render: (_, __, i) => i + 1, width: 80 },
          {
            title: 'Người dùng',
            dataIndex: 'username',
            render: (v) => <b className="ref-user">{v}</b>,
          },
          {
            title: 'Thời gian đăng ký',
            dataIndex: 'create_date',
            align: 'center',
          },
        ]}
      />
    </Card>
  );
  const commissions = (
    <Card
      className="affiliate-table-card"
      title="LỊCH SỬ HOA HỒNG"
      variant="borderless"
    >
      <Table
        rowKey="id"
        dataSource={data.commissions}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 760 }}
        locale={{ emptyText: <Empty description="Chưa có dữ liệu hoa hồng" /> }}
        columns={[
          {
            title: 'Người được giới thiệu',
            dataIndex: 'referred_username',
            render: (v) => <b>{v || 'Ẩn danh'}</b>,
          },
          {
            title: 'Số tiền nhận',
            dataIndex: 'amount',
            align: 'center',
            render: (v) => <Tag color="success">+{formatMoney(v)}</Tag>,
          },
          { title: 'Nội dung', dataIndex: 'description' },
          { title: 'Thời gian', dataIndex: 'create_date', align: 'right' },
        ]}
      />
    </Card>
  );
  const withdrawals = (
    <Row gutter={[22, 22]}>
      <Col xs={24} xl={8}>
        <Card
          className="withdraw-form-card"
          title="TẠO YÊU CẦU RÚT TIỀN"
          variant="borderless"
        >
          <div className="available-commission">
            Số dư khả dụng <b>{formatMoney(data.stats.available)}</b>
          </div>
          <Form form={form} layout="vertical" onFinish={withdraw}>
            <Form.Item
              name="bank_name"
              label="Ngân hàng"
              rules={[{ required: true, message: 'Vui lòng nhập ngân hàng' }]}
            >
              <Input size="large" placeholder="Ví dụ: MB Bank" />
            </Form.Item>
            <Form.Item
              name="bank_number"
              label="Số tài khoản"
              rules={[{ required: true }]}
            >
              <Input size="large" placeholder="Nhập số tài khoản" />
            </Form.Item>
            <Form.Item
              name="bank_owner"
              label="Chủ tài khoản"
              rules={[{ required: true }]}
            >
              <Input size="large" placeholder="NGUYEN VAN A" />
            </Form.Item>
            <Form.Item
              name="amount"
              label="Số tiền rút"
              rules={[
                { required: true },
                {
                  type: 'number',
                  min: data.minimum_withdraw,
                  message: `Tối thiểu ${formatMoney(data.minimum_withdraw)}`,
                },
              ]}
            >
              <Space.Compact block className="withdraw-amount-group">
                <InputNumber
                  size="large"
                  className="withdraw-amount"
                  min={data.minimum_withdraw}
                  max={data.stats.available}
                  formatter={(v) =>
                    String(v ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  }
                  parser={(v) => Number((v || '').replace(/\./g, '')) as 0}
                  placeholder={`Tối thiểu ${Number(data.minimum_withdraw).toLocaleString('vi-VN')}`}
                />
                <Input className="withdraw-currency" value="VNĐ" readOnly />
              </Space.Compact>
            </Form.Item>
            <Button
              block
              type="primary"
              size="large"
              htmlType="submit"
              loading={sending}
            >
              Rút tiền ngay
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} xl={16}>
        <Card
          className="affiliate-table-card"
          title="LỊCH SỬ RÚT TIỀN"
          variant="borderless"
        >
          <Table
            rowKey="id"
            dataSource={data.withdrawals}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 680 }}
            locale={{
              emptyText: <Empty description="Chưa có lịch sử rút tiền" />,
            }}
            columns={[
              {
                title: 'Ngân hàng',
                key: 'bank',
                render: (_, r) => (
                  <div>
                    <b>{r.bank_name}</b>
                    <small className="bank-account-copy">
                      {r.bank_number} · {r.bank_owner}
                    </small>
                  </div>
                ),
              },
              {
                title: 'Số tiền',
                dataIndex: 'amount',
                align: 'center',
                render: (v) => (
                  <b className="withdraw-money">{formatMoney(v)}</b>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                align: 'center',
                render: status,
              },
              { title: 'Thời gian', dataIndex: 'create_date', align: 'right' },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
  return (
    <div className="affiliate-page">
      <div className="page-title">
        <h1>Tiếp thị liên kết</h1>
        <p>Chia sẻ APIBANK, xây dựng mạng lưới và nhận hoa hồng lâu dài.</p>
      </div>
      <Tabs
        className="affiliate-tabs"
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <BarChartOutlined /> Tổng quan
              </span>
            ),
            children: overview,
          },
          {
            key: 'users',
            label: (
              <span>
                <TeamOutlined /> Người dùng đã giới thiệu
              </span>
            ),
            children: users,
          },
          {
            key: 'commissions',
            label: (
              <span>
                <DollarOutlined /> Lịch sử hoa hồng
              </span>
            ),
            children: commissions,
          },
          {
            key: 'withdraw',
            label: (
              <span>
                <WalletOutlined /> Rút tiền
              </span>
            ),
            children: withdrawals,
          },
        ]}
      />
    </div>
  );
}
