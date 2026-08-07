'use client';

import { EyeOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Ticket = {
  id: number;
  title: string;
  status: number;
  create_time: number;
  update_time: number;
};
const statusMeta = (status: number) =>
  status === 0
    ? { color: 'warning', text: 'Đang chờ xử lý' }
    : status === 1
      ? { color: 'success', text: 'Đã trả lời' }
      : { color: 'error', text: 'Đã đóng' };
const formatTime = (value: number) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value * 1000));

export default function TicketsPage() {
  const { message } = App.useApp(),
    router = useRouter();
  const [data, setData] = useState<Ticket[]>([]),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [files, setFiles] = useState<UploadFile[]>([]);
  const load = useCallback(() => {
    api<{ data: Ticket[] }>('/tickets')
      .then((r) => setData(r.data))
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(() => {
    load();
  }, [load]);
  const add = async (values: { title: string; message: string }) => {
    setSaving(true);
    try {
      const body = new FormData();
      body.append('title', values.title);
      body.append('message', values.message);
      if (files[0]?.originFileObj) body.append('image', files[0].originFileObj);
      const result = await api<{ message: string; id: number }>('/tickets', {
        method: 'POST',
        body,
      });
      message.success(result.message);
      setOpen(false);
      setFiles([]);
      load();
      router.push(`/dashboard/tickets/${result.id}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể tạo ticket');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="tickets-page">
      <div className="page-title ticket-page-head">
        <div>
          <h1>Danh sách hỗ trợ</h1>
          <p>Theo dõi và trao đổi trực tiếp với đội ngũ hỗ trợ APIBANK.</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          Gửi yêu cầu mới
        </Button>
      </div>
      <Card
        className="ticket-list-card"
        title="Hỗ trợ khách hàng"
        variant="borderless"
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          locale={{
            emptyText: (
              <div className="ticket-empty">
                <InboxOutlined />
                <b>Chưa có yêu cầu hỗ trợ nào</b>
                <span>Nhấn “Gửi yêu cầu mới” để bắt đầu.</span>
              </div>
            ),
          }}
          columns={[
            {
              title: 'Mã Ticket',
              dataIndex: 'id',
              width: 130,
              render: (v) => <b className="ticket-code">#{v}</b>,
            },
            {
              title: 'Tiêu đề',
              dataIndex: 'title',
              render: (v) => <strong>{v}</strong>,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 170,
              render: (v) => {
                const x = statusMeta(v);
                return <Tag color={x.color}>{x.text}</Tag>;
              },
            },
            {
              title: 'Cập nhật cuối',
              dataIndex: 'update_time',
              width: 190,
              render: formatTime,
            },
            {
              title: 'Thao tác',
              key: 'action',
              align: 'right',
              width: 120,
              render: (_, r) => (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => router.push(`/dashboard/tickets/${r.id}`)}
                >
                  Xem
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="Gửi yêu cầu hỗ trợ mới"
        open={open}
        footer={null}
        centered
        destroyOnHidden
        onCancel={() => {
          setOpen(false);
          setFiles([]);
        }}
      >
        <Form layout="vertical" onFinish={add} requiredMark="optional">
          <Form.Item
            name="title"
            label="Tiêu đề (Vấn đề bạn gặp phải)"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input size="large" placeholder="VD: Nạp tiền chưa thấy cộng..." />
          </Form.Item>
          <Form.Item
            name="message"
            label="Nội dung chi tiết"
            rules={[{ required: true, message: 'Vui lòng mô tả vấn đề' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Mô tả chi tiết vấn đề kèm mã giao dịch (nếu có)"
            />
          </Form.Item>
          <Form.Item label="Đính kèm ảnh (Tùy chọn)">
            <Upload.Dragger
              accept="image/*"
              maxCount={1}
              beforeUpload={() => false}
              fileList={files}
              onChange={({ fileList }) => setFiles(fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Kéo ảnh vào đây hoặc nhấn để chọn</p>
              <small>Tối đa 5 MB</small>
            </Upload.Dragger>
          </Form.Item>
          <Button
            block
            size="large"
            type="primary"
            htmlType="submit"
            loading={saving}
          >
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
