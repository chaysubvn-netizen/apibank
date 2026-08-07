'use client';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';
type RowData = Record<string, unknown> & { id: number };
type PageData = { data: RowData[]; current_page: number; total: number };
type Field = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'textarea' | 'select' | 'multi';
  options?: { label: string; value: number | string }[];
  required?: boolean;
};
const configs: Record<
  string,
  {
    title: string;
    resource: string;
    fields: Field[];
    columns: string[];
    mutable?: boolean;
    deletable?: boolean;
  }
> = {
  users: {
    title: 'Quản lý thành viên',
    resource: 'users',
    columns: [
      'id',
      'username',
      'email',
      'money',
      'api_plan_id',
      'level',
      'banned',
    ],
    mutable: true,
    fields: [
      { name: 'username', label: 'Tên đăng nhập' },
      { name: 'email', label: 'Email' },
      {
        name: 'level',
        label: 'Quyền',
        type: 'select',
        options: [
          { label: 'Thành viên', value: 0 },
          { label: 'Quản trị viên', value: 1 },
        ],
      },
      { name: 'banned', label: 'Khóa tài khoản', type: 'boolean' },
      { name: 'api_plan_id', label: 'ID gói API', type: 'number' },
    ],
  },
  banks: {
    title: 'Quản lý ngân hàng',
    resource: 'banks',
    columns: ['id', 'short_name', 'accountNumber', 'accountName', 'linkcron'],
    mutable: true,
    fields: [
      {
        name: 'short_name',
        label: 'Ngân hàng',
        type: 'select',
        required: true,
        options: [
          'ACB',
          'VIETTEL',
          'VIETTIN',
          'MBBANK',
          'OCB',
          'VPBANK',
          'VCB',
          'BIDV',
          'THESIEURE',
          'TECHCOMBANK',
          'SEABANK',
          'TPBANK',
          'BINANCE',
          'PAYPAL',
          'TRC20',
          'BEP20',
          'ZALOPAY',
        ].map((v) => ({ label: v, value: v })),
      },
      { name: 'accountNumber', label: 'Số tài khoản', required: true },
      { name: 'accountName', label: 'Chủ tài khoản', required: true },
      { name: 'image', label: 'URL logo' },
      { name: 'linkcron', label: 'Cron URL' },
    ],
  },
  packages: {
    title: 'Quản lý gói API',
    resource: 'packages',
    columns: [
      'id',
      'name',
      'price',
      'limit_accounts',
      'limit_transactions',
      'status',
    ],
    mutable: true,
    fields: [
      { name: 'name', label: 'Tên gói', required: true },
      { name: 'price', label: 'Giá', type: 'number', required: true },
      {
        name: 'limit_accounts',
        label: 'Giới hạn tài khoản',
        type: 'number',
        required: true,
      },
      {
        name: 'limit_transactions',
        label: 'Giới hạn giao dịch',
        type: 'number',
        required: true,
      },
      {
        name: 'allowed_banks',
        label: 'Ngân hàng được phép',
        type: 'multi',
        options: [
          'acb',
          'viettel',
          'viettin',
          'mbbank',
          'ocb',
          'vpbank',
          'vietcombank',
          'bidv',
          'thesieure',
          'techcombank',
          'seabank',
          'tpbank',
          'binance',
          'paypal',
          'trc20',
          'bep20',
          'zalopay',
        ].map((v) => ({ label: v.toUpperCase(), value: v })),
      },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
      { name: 'image', label: 'URL ảnh gói' },
      { name: 'status', label: 'Hoạt động', type: 'boolean' },
    ],
  },
  'cron-jobs': {
    title: 'Danh sách Cron Job của user',
    resource: 'cron-jobs',
    columns: [
      'id',
      'username',
      'url',
      'server_id',
      'sogiay',
      'trangthai',
      'ngay_het',
      'time_his',
    ],
    fields: [],
    deletable: true,
  },
  'cron-servers': {
    title: 'Quản lý Server Cron',
    resource: 'cron-servers',
    columns: ['id', 'name', 'price', 'status'],
    mutable: true,
    fields: [
      { name: 'name', label: 'Tên server', required: true },
      { name: 'price', label: 'Giá thuê', type: 'number', required: true },
      { name: 'status', label: 'Hoạt động', type: 'boolean' },
    ],
  },
  'captcha-services': {
    title: 'Quản lý dịch vụ Captcha',
    resource: 'captcha-services',
    columns: ['id', 'type', 'name', 'price', 'status'],
    mutable: true,
    fields: [
      { name: 'price', label: 'Đơn giá', type: 'number', required: true },
      { name: 'status', label: 'Hoạt động', type: 'boolean' },
    ],
  },
  notifications: {
    title: 'Quản lý thông báo',
    resource: 'notifications',
    columns: ['id', 'title', 'content', 'status', 'create_date'],
    mutable: true,
    fields: [
      { name: 'title', label: 'Tiêu đề', required: true },
      { name: 'content', label: 'Nội dung', type: 'textarea', required: true },
      { name: 'status', label: 'Trạng thái', type: 'number', required: true },
    ],
  },
  withdrawals: {
    title: 'Quản lý rút tiền hoa hồng',
    resource: 'withdrawals',
    columns: [
      'id',
      'username',
      'amount',
      'bank_name',
      'bank_number',
      'bank_owner',
      'status',
      'create_date',
    ],
    fields: [],
  },
  tickets: {
    title: 'Quản lý Tickets',
    resource: 'tickets',
    columns: ['id', 'username', 'title', 'status', 'update_time'],
    fields: [],
  },
};
const labels: Record<string, string> = {
  id: 'ID',
  username: 'Tên đăng nhập',
  email: 'Email',
  money: 'Số dư',
  api_plan_id: 'Gói API',
  level: 'Quyền',
  banned: 'Trạng thái',
  short_name: 'Ngân hàng',
  accountNumber: 'Số tài khoản',
  accountName: 'Chủ tài khoản',
  linkcron: 'Cron URL',
  name: 'Tên',
  price: 'Giá',
  limit_accounts: 'Tài khoản',
  limit_transactions: 'Giao dịch',
  status: 'Trạng thái',
  create_date: 'Ngày tạo',
  update_time: 'Cập nhật',
  user_id: 'Thành viên',
  amount: 'Số tiền',
  bank_name: 'Ngân hàng',
  bank_number: 'Số tài khoản',
  bank_owner: 'Chủ tài khoản',
  content: 'Nội dung',
  server_id: 'Server ID',
  sogiay: 'Số giây',
  trangthai: 'Trạng thái',
  ngay_het: 'Hạn sử dụng',
  time_his: 'Cập nhật cuối',
  title: 'Tiêu đề',
};
function renderValue(key: string, value: unknown) {
  if (['money', 'price', 'amount'].includes(key))
    return <b>{formatMoney(Number(value || 0))}</b>;
  if (key === 'status' || key === 'banned')
    return (
      <Tag
        color={
          Number(value) === 0
            ? 'warning'
            : Number(value) === 1
              ? 'success'
              : 'error'
        }
      >
        {key === 'banned'
          ? Number(value)
            ? 'Đã khóa'
            : 'Hoạt động'
          : Number(value) === 0
            ? 'Chờ xử lý'
            : Number(value) === 1
              ? 'Hoạt động / Đã duyệt'
              : 'Đã từ chối / Đóng'}
      </Tag>
    );
  if (key === 'level')
    return (
      <Tag color={Number(value) === 1 ? 'purple' : 'blue'}>
        {Number(value) === 1 ? 'Admin' : 'Thành viên'}
      </Tag>
    );
  if (key.includes('time') && typeof value === 'number')
    return new Date(value * 1000).toLocaleString('vi-VN');
  return String(value ?? '—');
}
export default function AdminSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params),
    router = useRouter(),
    { message, modal } = App.useApp(),
    config = configs[section];
  const [data, setData] = useState<RowData[]>([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(''),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<RowData | null>(null),
    [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const load = useCallback(() => {
    if (!config) return;
    api<PageData>(
      `/admin/resources/${config.resource}?per_page=100&search=${encodeURIComponent(search)}`
    )
      .then((r) => setData(r.data))
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [config, search, message]);
  useEffect(() => {
    load();
  }, [load]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () =>
      config
        ? [
            ...config.columns.map((key) => ({
              title: labels[key] || key,
              dataIndex: key,
              key,
              ellipsis: true,
              render: (v: unknown) => renderValue(key, v),
            })),
            {
              title: 'Thao tác',
              key: 'actions',
              fixed: 'right' as const,
              width: section === 'withdrawals' ? 190 : 130,
              render: (_: unknown, row: RowData) => (
                <Space>
                  {section === 'withdrawals' && Number(row.status) === 0 ? (
                    <>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => processWithdrawal(row.id, 1)}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<StopOutlined />}
                        onClick={() => processWithdrawal(row.id, 2)}
                      />
                    </>
                  ) : section === 'tickets' ? (
                    <>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => router.push(`/admin/tickets/${row.id}`)}
                      >
                        Xem
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(row.id)}
                      />
                    </>
                  ) : section === 'users' ? (
                    <>
                      <Button
                        title="Chi tiết thành viên"
                        icon={<EyeOutlined />}
                        onClick={() => router.push(`/admin/users/${row.id}`)}
                      />
                      <Button
                        title="Cộng/trừ số dư"
                        icon={<DollarOutlined />}
                        onClick={() => changeBalance(row)}
                      />
                      <Button
                        title="Gia hạn gói"
                        icon={<CalendarOutlined />}
                        onClick={() => changeSubscription(row)}
                      />
                    </>
                  ) : config.deletable ? (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(row.id)}
                    />
                  ) : config.mutable ? (
                    <>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => edit(row)}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(row.id)}
                      />
                    </>
                  ) : null}
                </Space>
              ),
            },
          ]
        : [],
    [config, section]
  );
  if (!config) return <Card>Chức năng không tồn tại.</Card>;
  const changeBalance = (row: RowData) => {
    let amount = 0,
      reason = '';
    modal.confirm({
      title: `Thay đổi số dư - ${row.username}`,
      width: 520,
      content: (
        <div className="admin-action-form">
          <label>Số tiền (dùng số âm để trừ)</label>
          <InputNumber
            style={{ width: '100%' }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            onChange={(v) => (amount = Number(v || 0))}
          />
          <label>Lý do thay đổi</label>
          <Input.TextArea
            rows={3}
            onChange={(e) => (reason = e.target.value)}
          />
        </div>
      ),
      okText: 'Cập nhật số dư',
      onOk: async () => {
        if (!amount || !reason.trim())
          throw new Error('Vui lòng nhập số tiền và lý do');
        const r = await api<{ message: string }>(
          `/admin/users/${row.id}/balance`,
          { method: 'POST', body: JSON.stringify({ amount, reason }) }
        );
        message.success(r.message);
        load();
      },
    });
  };
  const changeSubscription = (row: RowData) => {
    let expires_at = '',
      api_plan_id = Number(row.api_plan_id || 0);
    modal.confirm({
      title: `Cập nhật gói API - ${row.username}`,
      width: 520,
      content: (
        <div className="admin-action-form">
          <label>Ngày hết hạn</label>
          <Input
            type="datetime-local"
            onChange={(e) => (expires_at = e.target.value)}
          />
          <label>ID gói API</label>
          <InputNumber
            min={0}
            defaultValue={api_plan_id}
            style={{ width: '100%' }}
            onChange={(v) => (api_plan_id = Number(v || 0))}
          />
        </div>
      ),
      okText: 'Lưu thời hạn',
      onOk: async () => {
        if (!expires_at) throw new Error('Vui lòng chọn ngày hết hạn');
        const r = await api<{ message: string }>(
          `/admin/users/${row.id}/subscription`,
          { method: 'PUT', body: JSON.stringify({ expires_at, api_plan_id }) }
        );
        message.success(r.message);
        load();
      },
    });
  };
  const edit = (row?: RowData) => {
    setEditing(row || null);
    const values: Record<string, unknown> = { ...(row || { status: true }) };
    if (section === 'packages' && typeof values.allowed_banks === 'string') {
      try {
        values.allowed_banks = JSON.parse(values.allowed_banks as string);
      } catch {
        values.allowed_banks = [];
      }
    }
    form.setFieldsValue(values);
    setOpen(true);
  };
  const save = async (v: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api(
        `/admin/resources/${config.resource}${editing ? `/${editing.id}` : ''}`,
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(v) }
      );
      message.success('Đã lưu dữ liệu');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };
  const remove = (id: number) =>
    modal.confirm({
      title: 'Xóa dữ liệu này?',
      content: 'Thao tác không thể hoàn tác.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api(`/admin/resources/${config.resource}/${id}`, {
          method: 'DELETE',
        });
        message.success('Đã xóa dữ liệu');
        load();
      },
    });
  const processWithdrawal = async (id: number, status: number) => {
    await api(`/admin/withdrawals/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    message.success('Đã xử lý yêu cầu');
    load();
  };
  return (
    <div className="admin-page">
      <div className="admin-heading compact">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin')}
          >
            Quản trị
          </Button>
          <h1>{config.title}</h1>
          <p>Quản lý dữ liệu và thao tác nghiệp vụ giống trang PHP.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Làm mới
          </Button>
          {config.mutable && section !== 'users' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => edit()}
            >
              Thêm mới
            </Button>
          )}
        </Space>
      </div>
      <Card className="admin-table-card" variant="borderless">
        <div className="admin-table-toolbar">
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm..."
          />
          <span>{data.length} bản ghi</span>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </Card>
      <Modal
        title={editing ? 'Cập nhật dữ liệu' : 'Thêm dữ liệu'}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={save}>
          {config.fields.map((f) => (
            <Form.Item
              key={f.name}
              name={f.name}
              label={f.label}
              valuePropName={f.type === 'boolean' ? 'checked' : 'value'}
              rules={f.required ? [{ required: true }] : undefined}
            >
              {f.type === 'number' ? (
                <InputNumber style={{ width: '100%' }} />
              ) : f.type === 'boolean' ? (
                <Switch />
              ) : f.type === 'textarea' ? (
                <Input.TextArea rows={4} />
              ) : f.type === 'select' ? (
                <Select options={f.options} />
              ) : f.type === 'multi' ? (
                <Select mode="multiple" options={f.options} />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
          <Button block type="primary" htmlType="submit" loading={saving}>
            Lưu thay đổi
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
