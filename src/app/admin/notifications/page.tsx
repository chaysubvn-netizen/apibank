'use client';

import {
  BellOutlined,
  BoldOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  OrderedListOutlined,
  PlusOutlined,
  RedoOutlined,
  SaveOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
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
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Notification = {
  id: number;
  title: string;
  content: string;
  status: number;
  create_date: string;
};

type PageData = { data: Notification[]; total: number };
type FormValues = { title: string; status: number };

function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value)
      editor.current.innerHTML = value || '';
  }, [value]);

  const command = (name: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editor.current?.innerHTML || '');
  };

  return (
    <div className="notification-editor">
      <div className="notification-editor-toolbar">
        <Tooltip title="In đậm">
          <Button
            type="text"
            icon={<BoldOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('bold');
            }}
          />
        </Tooltip>
        <Tooltip title="Gạch chân">
          <Button
            type="text"
            icon={<UnderlineOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('underline');
            }}
          />
        </Tooltip>
        <Tooltip title="Danh sách">
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('insertUnorderedList');
            }}
          />
        </Tooltip>
        <Tooltip title="Danh sách số">
          <Button
            type="text"
            icon={<OrderedListOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('insertOrderedList');
            }}
          />
        </Tooltip>
        <Select
          aria-label="Kiểu tiêu đề"
          defaultValue="p"
          onChange={(tag) => command('formatBlock', tag)}
          options={[
            { value: 'p', label: 'Đoạn văn' },
            { value: 'h2', label: 'Tiêu đề lớn' },
            { value: 'h3', label: 'Tiêu đề nhỏ' },
          ]}
        />
        <input
          aria-label="Màu chữ"
          type="color"
          defaultValue="#172b38"
          onChange={(event) => command('foreColor', event.target.value)}
        />
        <Tooltip title="Hoàn tác">
          <Button
            type="text"
            icon={<RedoOutlined rotate={180} />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('undo');
            }}
          />
        </Tooltip>
        <Tooltip title="Làm lại">
          <Button
            type="text"
            icon={<RedoOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('redo');
            }}
          />
        </Tooltip>
        <Tooltip title="Xóa định dạng">
          <Button
            type="text"
            icon={<ClearOutlined />}
            onMouseDown={(event) => {
              event.preventDefault();
              command('removeFormat');
            }}
          />
        </Tooltip>
      </div>
      <div
        ref={editor}
        className="notification-editor-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Điền nội dung thông báo..."
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}

export default function AdminNotificationsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const formAnchor = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Notification[]>([]);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<PageData>(
        '/admin/resources/notifications?per_page=100'
      );
      setRows(result.data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể tải thông báo'
      );
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setContent('');
    form.resetFields();
    form.setFieldValue('status', 1);
  };

  const edit = (row: Notification) => {
    setEditing(row);
    setContent(row.content || '');
    form.setFieldsValue({ title: row.title, status: Number(row.status) });
    formAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const save = async (values: FormValues) => {
    if (!content.replace(/<[^>]*>/g, '').trim()) {
      message.warning('Vui lòng nhập nội dung thông báo');
      return;
    }
    setSaving(true);
    try {
      await api(
        `/admin/resources/notifications${editing ? `/${editing.id}` : ''}`,
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({ ...values, content }),
        }
      );
      message.success(
        editing ? 'Đã cập nhật thông báo' : 'Đã thêm thông báo mới'
      );
      reset();
      await load();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể lưu thông báo'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api(`/admin/resources/notifications/${id}`, { method: 'DELETE' });
      message.success('Đã xóa thông báo');
      if (editing?.id === id) reset();
      await load();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể xóa thông báo'
      );
    }
  };

  const data = rows.filter((row) =>
    `${row.title} ${row.content}`
      .toLocaleLowerCase('vi')
      .includes(search.toLocaleLowerCase('vi'))
  );
  const columns: ColumnsType<Notification> = [
    { title: 'STT', width: 70, render: (_, __, index) => index + 1 },
    {
      title: 'TIÊU ĐỀ',
      dataIndex: 'title',
      width: 260,
      render: (value) => <b>{value}</b>,
    },
    {
      title: 'NỘI DUNG',
      dataIndex: 'content',
      render: (value) => (
        <div
          className="notification-content-preview"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      width: 130,
      render: (value) =>
        Number(value) === 1 ? (
          <Tag color="success">Hiển thị</Tag>
        ) : (
          <Tag>Đang ẩn</Tag>
        ),
    },
    { title: 'THỜI GIAN', dataIndex: 'create_date', width: 190 },
    {
      title: 'THAO TÁC',
      fixed: 'right',
      width: 165,
      render: (_, row) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => edit(row)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa thông báo này?"
            description={`Thông báo #${row.id} sẽ bị xóa vĩnh viễn.`}
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
    <div className="admin-page admin-notifications-page" ref={formAnchor}>
      <div className="admin-simple-title">
        <div>
          <h1>Quản lý thông báo</h1>
          <span>Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Quản lý thông báo</span>
        </div>
      </div>
      <Card
        className="admin-php-card notification-form-card"
        title={
          <Space>
            <BellOutlined />
            {editing
              ? `CHỈNH SỬA THÔNG BÁO #${editing.id}`
              : 'THÊM THÔNG BÁO MỚI'}
          </Space>
        }
        variant="borderless"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 1 }}
          onFinish={save}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề" />
          </Form.Item>
          <Form.Item label="Thông báo" required>
            <RichEditor value={content} onChange={setContent} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 1, label: 'Hiển thị' },
                { value: 0, label: 'Ẩn' },
              ]}
            />
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
        className="admin-php-card notification-list-card"
        title={
          <Space>
            <BellOutlined />
            DANH SÁCH THÔNG BÁO
          </Space>
        }
        extra={
          <Input.Search
            allowClear
            placeholder="Tìm thông báo..."
            onSearch={setSearch}
            onChange={(event) => setSearch(event.target.value)}
          />
        }
        variant="borderless"
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
          }}
          locale={{ emptyText: 'Chưa có thông báo nào' }}
        />
      </Card>
    </div>
  );
}
