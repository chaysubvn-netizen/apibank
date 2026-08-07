'use client';

import {
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Bank = {
  id: number;
  short_name: string;
  linkcron: string;
  accountNumber: string;
  accountName: string;
  image?: string;
};
type PageData = { data: Bank[]; total: number };
const bankOptions = [
  'ACB',
  'VIETTEL',
  'VIETTIN',
  'VIETCOMBANK',
  'BIDV',
  'MBBANK',
  'OCB',
  'VPBANK',
  'TECHCOMBANK',
  'SEABANK',
  'TPBANK',
  'THESIEURE',
  'BINANCE',
  'PAYPAL',
  'ZALOPAY',
  'TRC20',
  'BEP20',
].map((value) => ({ value, label: value }));

export default function AdminBanksPage() {
  const { message } = App.useApp(),
    [form] = Form.useForm(),
    formRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Bank[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [editing, setEditing] = useState<Bank | null>(null);
  const load = useCallback(
    () =>
      api<PageData>('/admin/resources/banks?per_page=100')
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
    form.resetFields();
    form.setFieldsValue({ image: '' });
  };
  const edit = (row: Bank) => {
    setEditing(row);
    form.setFieldsValue({ ...row, image: row.image || '' });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const save = async (values: Omit<Bank, 'id'>) => {
    setSaving(true);
    try {
      await api(`/admin/resources/banks${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({ ...values, image: values.image || '' }),
      });
      message.success(editing ? 'Đã cập nhật ngân hàng' : 'Đã thêm ngân hàng');
      reset();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể lưu ngân hàng');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: number) => {
    await api(`/admin/resources/banks/${id}`, { method: 'DELETE' });
    message.success('Đã xóa ngân hàng');
    load();
  };
  const columns: ColumnsType<Bank> = [
    { title: 'STT', width: 70, render: (_, __, i) => i + 1 },
    {
      title: 'NGÂN HÀNG',
      dataIndex: 'short_name',
      render: (v) => (
        <Tag color="blue" icon={<BankOutlined />}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'SỐ TÀI KHOẢN',
      dataIndex: 'accountNumber',
      render: (v) => <b>{v}</b>,
    },
    {
      title: 'CHỦ TÀI KHOẢN',
      dataIndex: 'accountName',
      render: (v) => <b>{v}</b>,
    },
    {
      title: 'LINK CRON',
      dataIndex: 'linkcron',
      ellipsis: true,
      render: (v) => <code>{v}</code>,
    },
    {
      title: 'TÙY CHỌN',
      fixed: 'right',
      width: 150,
      render: (_, row) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => edit(row)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa ngân hàng này?"
            description="Dữ liệu cổng nạp tương ứng sẽ không còn hiển thị."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => remove(row.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <div className="admin-page admin-banks-page" ref={formRef}>
      <div className="admin-simple-title">
        <div>
          <h1>Quản lý ngân hàng</h1>
          <span>Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Quản lý ngân hàng</span>
        </div>
      </div>
      <Card
        className="admin-php-card bank-admin-form"
        title={
          <Space>
            <BankOutlined />
            {editing ? `CHỈNH SỬA NGÂN HÀNG #${editing.id}` : 'THÊM NGÂN HÀNG'}
          </Space>
        }
        variant="borderless"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ image: '' }}
          onFinish={save}
        >
          <Form.Item
            name="short_name"
            label="Ngân hàng"
            rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={bankOptions}
              placeholder="-- Chọn ngân hàng --"
            />
          </Form.Item>
          <Form.Item
            name="linkcron"
            label="Link cron"
            extra={<i>Lưu ý chỉ nhập cron/... Vui lòng không nhập https://</i>}
            rules={[
              { required: true, message: 'Vui lòng nhập link cron' },
              {
                pattern: /^cron\//,
                message: 'Link cron phải bắt đầu bằng cron/',
              },
            ]}
          >
            <Input placeholder="Ví dụ: cron/acb.php" />
          </Form.Item>
          <div className="bank-form-grid">
            <Form.Item
              name="accountNumber"
              label="Số tài khoản"
              rules={[
                { required: true, message: 'Vui lòng nhập số tài khoản' },
              ]}
            >
              <Input placeholder="Nhập số tài khoản" />
            </Form.Item>
            <Form.Item
              name="accountName"
              label="Tên chủ tài khoản"
              rules={[
                { required: true, message: 'Vui lòng nhập tên chủ tài khoản' },
              ]}
            >
              <Input placeholder="Nhập tên chủ tài khoản" />
            </Form.Item>
          </div>
          <Form.Item name="image" hidden>
            <Input />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={editing ? <SaveOutlined /> : <PlusOutlined />}
            >
              {editing ? 'Lưu thay đổi' : 'Thêm Ngay'}
            </Button>
            {editing && <Button onClick={reset}>Hủy chỉnh sửa</Button>}
          </Space>
        </Form>
      </Card>
      <Card
        className="admin-php-card bank-admin-list"
        title={
          <Space>
            <TeamOutlined />
            DANH SÁCH NGÂN HÀNG
          </Space>
        }
        variant="borderless"
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
          }}
          locale={{ emptyText: 'Chưa có ngân hàng nạp tiền nào' }}
        />
      </Card>
    </div>
  );
}
