'use client';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  Input,
  Select,
  Spin,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, API_URL } from '@/lib/api';
type Item = Record<string, unknown> & { id: number };
type Payload = { ticket: Item; messages: Item[] };
const time = (v: unknown) =>
  new Date(Number(v || 0) * 1000).toLocaleString('vi-VN');
export default function AdminTicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    router = useRouter(),
    { message, modal } = App.useApp(),
    bottom = useRef<HTMLDivElement>(null),
    [data, setData] = useState<Payload | null>(null),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [text, setText] = useState(''),
    [status, setStatus] = useState(1),
    [files, setFiles] = useState<UploadFile[]>([]);
  const load = useCallback(
    () =>
      api<Payload>(`/admin/tickets/${id}`)
        .then(setData)
        .catch((e) => message.error(e.message))
        .finally(() => setLoading(false)),
    [id, message]
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    bottom.current?.scrollIntoView();
  }, [data?.messages.length]);
  const send = async () => {
    if (!text.trim()) return message.warning('Vui lòng nhập phản hồi');
    setSending(true);
    try {
      const body = new FormData();
      body.append('message', text);
      body.append('status', String(status));
      if (files[0]?.originFileObj) body.append('image', files[0].originFileObj);
      const r = await api<{ message: string }>(`/admin/tickets/${id}/reply`, {
        method: 'POST',
        body,
      });
      message.success(r.message);
      setText('');
      setFiles([]);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể gửi');
    } finally {
      setSending(false);
    }
  };
  const remove = () =>
    modal.confirm({
      title: 'Xóa ticket này?',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api(`/admin/resources/tickets/${id}`, { method: 'DELETE' });
        message.success('Đã xóa ticket');
        router.push('/admin/tickets');
      },
    });
  if (loading || !data)
    return (
      <div className="admin-loading">
        <Spin size="large" />
      </div>
    );
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return (
    <div className="admin-page">
      <div className="admin-heading compact">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/tickets')}
          >
            Danh sách Tickets
          </Button>
          <h1>Chi tiết hỗ trợ #{id}</h1>
          <p>
            Khách hàng: <b>{String(data.ticket.username)}</b> ·{' '}
            {String(data.ticket.title)}
          </p>
        </div>
        <Button danger onClick={remove}>
          Xóa Ticket
        </Button>
      </div>
      <Card
        className="admin-ticket-chat"
        variant="borderless"
        title={String(data.ticket.title)}
        extra={
          <Tag
            color={
              Number(data.ticket.status) === 0
                ? 'warning'
                : Number(data.ticket.status) === 1
                  ? 'success'
                  : 'error'
            }
          >
            {Number(data.ticket.status) === 0
              ? 'Đang chờ'
              : Number(data.ticket.status) === 1
                ? 'Đã trả lời'
                : 'Đã đóng'}
          </Tag>
        }
      >
        <div className="admin-chat-list">
          {data.messages.map((m) => {
            const admin = Number(m.is_admin) === 1;
            return (
              <div
                key={m.id}
                className={`admin-chat-message ${admin ? 'staff' : 'customer'}`}
              >
                <Avatar icon={admin ? <CustomerServiceOutlined /> : undefined}>
                  {admin ? null : String(data.ticket.username || 'U')[0]}
                </Avatar>
                <div>
                  <span>
                    <b>
                      {admin ? 'Admin hỗ trợ' : String(data.ticket.username)}
                    </b>
                    <small>
                      <ClockCircleOutlined /> {time(m.create_time)}
                    </small>
                  </span>
                  <p>{String(m.message)}</p>
                  {Boolean(m.image) && (
                    <a href={`${origin}${String(m.image)}`} target="_blank">
                      <PaperClipOutlined /> Xem ảnh
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
        <div className="admin-chat-reply">
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Nhập câu trả lời..."
          />
          <div>
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={() => false}
              fileList={files}
              onChange={({ fileList }) => setFiles(fileList)}
            >
              <Button icon={<PaperClipOutlined />}>Đính kèm</Button>
            </Upload>
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { label: 'Đã trả lời', value: 1 },
                { label: 'Đóng ticket', value: 2 },
              ]}
            />
            <Button
              type="primary"
              icon={status === 2 ? <LockOutlined /> : <SendOutlined />}
              loading={sending}
              onClick={send}
            >
              {status === 2 ? 'Trả lời & đóng' : 'Gửi trả lời'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
