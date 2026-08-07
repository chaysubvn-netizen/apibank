'use client';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleFilled,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, API_URL, formatMoney } from '@/lib/api';
type Package = Record<string, unknown> & {
  id: number;
  name: string;
  price: number;
  limit_accounts: number;
  limit_transactions: number;
  allowed_banks?: string;
  description?: string;
  image?: string;
  status: number;
};
type PageData = { data: Package[] };
const bankOptions = [
  ['acb', 'ACB'],
  ['viettin', 'VIETTIN BANK'],
  ['vietcombank', 'VIETCOMBANK'],
  ['viettel', 'VIETTEL MONEY'],
  ['mbbank', 'MBBANK'],
  ['ocb', 'OCB'],
  ['vpbank', 'VPBANK'],
  ['bidv', 'BIDV'],
  ['thesieure', 'THESIEURE'],
  ['techcombank', 'TECHCOMBANK'],
  ['seabank', 'SEABANK'],
  ['tpbank', 'TPBANK'],
  ['binance', 'BINANCE PAY'],
  ['paypal', 'PAYPAL'],
  ['trc20', 'TRC20 (USDT)'],
  ['bep20', 'BEP20 (USDT)'],
  ['zalopay', 'ZALOPAY'],
].map(([value, label]) => ({ value, label }));
const parseBanks = (value?: string) => {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};
const parseImages = (value?: string) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};
export default function AdminPackages() {
  const router = useRouter(),
    { message, modal } = App.useApp(),
    [form] = Form.useForm(),
    formRef = useRef<HTMLDivElement>(null),
    [data, setData] = useState<Package[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [editing, setEditing] = useState<Package | null>(null),
    [files, setFiles] = useState<UploadFile[]>([]);
  const load = useCallback(
    () =>
      api<PageData>('/admin/resources/packages?per_page=100')
        .then((r) => setData(r.data))
        .catch((e) => message.error(e.message))
        .finally(() => setLoading(false)),
    [message]
  );
  useEffect(() => {
    load();
  }, [load]);
  const reset = () => {
    setEditing(null);
    setFiles([]);
    form.resetFields();
    form.setFieldsValue({
      limit_accounts: 1,
      limit_transactions: 500,
      status: 1,
    });
  };
  const edit = (row: Package) => {
    setEditing(row);
    setFiles([]);
    form.setFieldsValue({
      ...row,
      allowed_banks: parseBanks(row.allowed_banks),
      status: Number(row.status),
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const save = async (v: Record<string, unknown>) => {
    setSaving(true);
    try {
      const body = new FormData();
      for (const key of [
        'name',
        'price',
        'limit_accounts',
        'limit_transactions',
        'description',
        'status',
      ])
        body.append(key, String(v[key] ?? ''));
      for (const bank of (v.allowed_banks as string[]) || [])
        body.append('allowed_banks[]', bank);
      for (const file of files)
        if (file.originFileObj) body.append('images[]', file.originFileObj);
      if (editing) body.append('_method', 'PUT');
      await api(`/admin/resources/packages${editing ? `/${editing.id}` : ''}`, {
        method: 'POST',
        body,
      });
      message.success(editing ? 'Đã cập nhật gói API' : 'Đã thêm gói API');
      reset();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể lưu gói');
    } finally {
      setSaving(false);
    }
  };
  const remove = (row: Package) =>
    modal.confirm({
      title: `Xóa gói ${row.name}?`,
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api(`/admin/resources/packages/${row.id}`, { method: 'DELETE' });
        message.success('Đã xóa gói');
        load();
      },
    });
  const origin = new URL(API_URL).origin;
  return (
    <div className="admin-page admin-packages-page" ref={formRef}>
      <div className="admin-simple-title">
        <div>
          <h1>Cài đặt API</h1>
          <span>Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Cài đặt API</span>
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin')}
        >
          Dashboard
        </Button>
      </div>
      <Card
        className="admin-php-card package-form-card"
        title={
          <span>
            <PlusCircleFilled />{' '}
            {editing ? `CHỈNH SỬA GÓI #${editing.id}` : 'THÊM GÓI API MỚI'}
          </span>
        }
        variant="borderless"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            limit_accounts: 1,
            limit_transactions: 500,
            status: 1,
          }}
          onFinish={save}
        >
          <div className="package-main-fields">
            <Form.Item name="name" label="Tên gói" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Giá tiền (VND)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="limit_accounts"
              label="Giới hạn tài khoản ngân hàng"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="limit_transactions"
              label="Giới hạn giao dịch/tháng"
              extra="Nhập -1 nếu muốn không giới hạn."
              rules={[{ required: true }]}
            >
              <InputNumber min={-1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label="Trạng thái"
            className="package-status"
          >
            <Select
              options={[
                { label: 'Hiển thị', value: 1 },
                { label: 'Tạm ẩn', value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item name="allowed_banks" label="Ngân hàng cho phép">
            <Select
              className="package-bank-select"
              mode="multiple"
              optionFilterProp="label"
              options={bankOptions}
              placeholder="Chọn các ngân hàng được phép thêm"
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả gói">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Ảnh đại diện gói (Có thể chọn nhiều ảnh)">
            <Upload
              multiple
              accept="image/*"
              beforeUpload={() => false}
              fileList={files}
              onChange={({ fileList }) => setFiles(fileList)}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            {editing && parseImages(editing.image).length > 0 && (
              <div className="package-current-images">
                {parseImages(editing.image).map((src) => (
                  <a key={src} href={`${origin}${src}`} target="_blank">
                    Ảnh hiện tại
                  </a>
                ))}
              </div>
            )}
          </Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              {editing ? 'Lưu thay đổi' : 'Thêm Ngay'}
            </Button>
            {editing && <Button onClick={reset}>Hủy</Button>}
          </Space>
        </Form>
      </Card>
      <Card
        className="admin-php-card package-list-card"
        title="DANH SÁCH GÓI API"
        variant="borderless"
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          scroll={{ x: 900 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 65 },
            {
              title: 'Ảnh',
              dataIndex: 'image',
              width: 90,
              render: (v) => {
                const src = parseImages(v)[0];
                return src ? (
                  <span
                    className="package-thumb"
                    style={{ backgroundImage: `url(${origin}${src})` }}
                    aria-label="Ảnh gói"
                  />
                ) : (
                  '—'
                );
              },
            },
            { title: 'Tên gói', dataIndex: 'name', render: (v) => <b>{v}</b> },
            {
              title: 'Giá tiền',
              dataIndex: 'price',
              render: (v) => <b>{formatMoney(v)}</b>,
            },
            {
              title: 'Giới hạn',
              render: (_, r) => (
                <span>
                  {r.limit_accounts} tài khoản
                  <br />
                  {Number(r.limit_transactions) === -1
                    ? 'Không giới hạn'
                    : `${r.limit_transactions} giao dịch/tháng`}
                </span>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (v) => (
                <Tag color={Number(v) === 1 ? 'success' : 'default'}>
                  {Number(v) === 1 ? 'Hiển thị' : 'Tạm ẩn'}
                </Tag>
              ),
            },
            {
              title: 'Hành động',
              fixed: 'right',
              width: 130,
              render: (_, r) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => edit(r)} />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(r)}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
