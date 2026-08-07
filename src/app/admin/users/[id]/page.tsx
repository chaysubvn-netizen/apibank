'use client';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Table,
  Tag,
} from 'antd';
import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';
type Data = Record<string, unknown> & { id: number };
type PageData = { data: Data[] };
export default function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    router = useRouter(),
    { message } = App.useApp(),
    [user, setUser] = useState<Data | null>(null),
    [logs, setLogs] = useState<Data[]>([]),
    [balances, setBalances] = useState<Data[]>([]),
    [packages, setPackages] = useState<Data[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [now] = useState(() => new Date().getTime());
  const [profileForm] = Form.useForm();
  const load = useCallback(
    () =>
      Promise.all([
        api<{ data: Data }>(`/admin/resources/users/${id}`),
        api<PageData>(
          `/admin/resources/balance-logs?user_id=${id}&per_page=100`
        ),
        api<PageData>(
          `/admin/resources/activity-logs?user_id=${id}&per_page=100`
        ),
        api<PageData>('/admin/resources/packages?per_page=100'),
      ])
        .then(([u, b, l, p]) => {
          setUser(u.data);
          setBalances(b.data);
          setLogs(l.data);
          setPackages(p.data);
          profileForm.setFieldsValue(u.data);
        })
        .catch((e) => message.error(e.message))
        .finally(() => setLoading(false)),
    [id, message, profileForm]
  );
  useEffect(() => {
    load();
  }, [load]);
  const saveProfile = async (v: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api(`/admin/resources/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(v),
      });
      message.success('Đã cập nhật thành viên');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };
  const balance = async (v: { amount: number; reason: string }) => {
    await api(`/admin/users/${id}/balance`, {
      method: 'POST',
      body: JSON.stringify(v),
    });
    message.success('Đã cập nhật số dư');
    load();
  };
  const subscription = async (v: {
    expires_at: string;
    api_plan_id: number;
  }) => {
    await api(`/admin/users/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(v),
    });
    message.success('Đã cập nhật thời hạn');
    load();
  };
  const addMonths = async (v: { months: number }) => {
    const current = Number(user?.time_momo || Math.floor(now / 1000));
    const base = new Date(Math.max(current * 1000, now));
    base.setMonth(base.getMonth() + v.months);
    await subscription({
      expires_at: base.toISOString(),
      api_plan_id: Number(user?.api_plan_id || 0),
    });
  };
  if (loading || !user)
    return (
      <div className="admin-loading">
        <Spin size="large" />
      </div>
    );
  return (
    <div className="admin-page">
      <div className="admin-heading compact">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/users')}
          >
            Danh sách thành viên
          </Button>
          <h1>
            Thành viên #{id} — {String(user.username)}
          </h1>
          <p>
            Số dư hiện tại: <b>{formatMoney(Number(user.money || 0))}</b> · Tổng
            nạp: <b>{formatMoney(Number(user.total_money || 0))}</b>
          </p>
        </div>
      </div>
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={12}>
          <Card
            className="admin-setting-card"
            title="Thông tin tài khoản"
            variant="borderless"
          >
            <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
              <Form.Item name="username" label="Tên đăng nhập">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="level" label="Quyền">
                    <Select
                      options={[
                        { label: 'Thành viên', value: 0 },
                        { label: 'Quản trị viên', value: 1 },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="banned" label="Trạng thái">
                    <Select
                      options={[
                        { label: 'Hoạt động', value: 0 },
                        { label: 'Khóa', value: 1 },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="api_plan_id" label="Gói API">
                <Select
                  allowClear
                  options={packages.map((p) => ({
                    label: String(p.name),
                    value: Number(p.id),
                  }))}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Lưu tài khoản
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            className="admin-setting-card"
            title="Cộng / trừ số dư"
            variant="borderless"
          >
            <Form layout="vertical" onFinish={balance}>
              <Form.Item
                name="amount"
                label="Số tiền (âm để trừ)"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} size="large" />
              </Form.Item>
              <Form.Item
                name="reason"
                label="Nội dung"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<DollarOutlined />}
              >
                Cập nhật số dư
              </Button>
            </Form>
          </Card>
          <Card
            className="admin-setting-card admin-cycle-card"
            title="Chu kỳ API"
            variant="borderless"
          >
            <p>
              Hết hạn:{' '}
              <Tag
                color={
                  Number(user.time_momo) > now / 1000 ? 'success' : 'error'
                }
              >
                {new Date(Number(user.time_momo || 0) * 1000).toLocaleString(
                  'vi-VN'
                )}
              </Tag>
            </p>
            <Form layout="inline" onFinish={addMonths}>
              <Form.Item name="months" rules={[{ required: true }]}>
                <InputNumber min={1} placeholder="Số tháng" />
              </Form.Item>
              <Button htmlType="submit" icon={<CalendarOutlined />}>
                Cộng chu kỳ
              </Button>
            </Form>
            <Form
              className="admin-date-form"
              layout="inline"
              onFinish={subscription}
              initialValues={{ api_plan_id: Number(user.api_plan_id || 0) }}
            >
              <Form.Item name="expires_at" rules={[{ required: true }]}>
                <Input type="datetime-local" />
              </Form.Item>
              <Form.Item name="api_plan_id">
                <InputNumber min={0} placeholder="ID gói" />
              </Form.Item>
              <Button htmlType="submit">Chỉnh thời gian</Button>
            </Form>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            className="admin-table-card"
            title="Lịch sử biến động số dư"
            variant="borderless"
          >
            <Table
              rowKey="id"
              dataSource={balances}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Trước',
                  dataIndex: 'money_before',
                  render: (v) => formatMoney(v),
                },
                {
                  title: 'Thay đổi',
                  dataIndex: 'money_change',
                  render: (v) => (
                    <b className={Number(v) >= 0 ? 'money-in' : 'money-out'}>
                      {formatMoney(v)}
                    </b>
                  ),
                },
                {
                  title: 'Sau',
                  dataIndex: 'money_after',
                  render: (v) => formatMoney(v),
                },
                { title: 'Nội dung', dataIndex: 'content' },
                { title: 'Thời gian', dataIndex: 'time' },
              ]}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card
            className="admin-table-card"
            title="Nhật ký hoạt động"
            variant="borderless"
          >
            <Table
              rowKey="id"
              dataSource={logs}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '#', dataIndex: 'id' },
                { title: 'Hoạt động', dataIndex: 'action' },
                { title: 'Thời gian', dataIndex: 'create_date' },
                { title: 'IP', dataIndex: 'ip' },
                { title: 'Thiết bị', dataIndex: 'device', ellipsis: true },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
