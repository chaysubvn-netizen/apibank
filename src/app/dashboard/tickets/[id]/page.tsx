'use client';

import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { App, Avatar, Button, Card, Input, Spin, Tag, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, API_URL } from '@/lib/api';

type Ticket = {
  id: number;
  title: string;
  status: number;
  update_time: number;
};
type TicketMessage = {
  id: number;
  message: string;
  image?: string | null;
  is_admin: number;
  create_time: number;
};
type Payload = { ticket: Ticket; messages: TicketMessage[] };
const formatTime = (v: number) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(v * 1000));
const statusMeta = (v: number) =>
  v === 0
    ? { color: 'warning', text: 'Đang chờ xử lý' }
    : v === 1
      ? { color: 'success', text: 'Đã phản hồi' }
      : { color: 'error', text: 'Đã đóng' };

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    router = useRouter(),
    { message } = App.useApp(),
    bottomRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Payload | null>(null),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [text, setText] = useState(''),
    [files, setFiles] = useState<UploadFile[]>([]);
  const load = useCallback(() => {
    api<Payload>(`/tickets/${id}`)
      .then(setData)
      .catch((e) => {
        message.error(e.message);
        router.push('/dashboard/tickets');
      })
      .finally(() => setLoading(false));
  }, [id, message, router]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);
  const send = async () => {
    if (!text.trim()) return message.warning('Vui lòng nhập nội dung phản hồi');
    setSending(true);
    try {
      const body = new FormData();
      body.append('message', text.trim());
      if (files[0]?.originFileObj) body.append('image', files[0].originFileObj);
      const result = await api<{ message: string }>(`/tickets/${id}/reply`, {
        method: 'POST',
        body,
      });
      message.success(result.message);
      setText('');
      setFiles([]);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể gửi phản hồi');
    } finally {
      setSending(false);
    }
  };
  if (loading && !data)
    return (
      <div className="ticket-loading">
        <Spin size="large" />
      </div>
    );
  if (!data) return null;
  const state = statusMeta(data.ticket.status);
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return (
    <div className="ticket-detail-page">
      <div className="page-title ticket-detail-head">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/dashboard/tickets')}
          >
            Danh sách ticket
          </Button>
          <h1>Hỗ trợ Ticket #{data.ticket.id}</h1>
        </div>
      </div>
      <Card
        className="ticket-chat-card"
        variant="borderless"
        title={<span>{data.ticket.title}</span>}
        extra={<Tag color={state.color}>{state.text}</Tag>}
      >
        <div className="ticket-chat-messages">
          {data.messages.map((item) => (
            <div
              key={item.id}
              className={`ticket-message ${item.is_admin ? 'admin' : 'user'}`}
            >
              <Avatar
                size={42}
                className="ticket-avatar"
                icon={item.is_admin ? <CustomerServiceOutlined /> : undefined}
              >
                {item.is_admin ? null : 'B'}
              </Avatar>
              <div className="ticket-message-wrap">
                <div className="ticket-message-meta">
                  <strong>{item.is_admin ? 'Admin Hỗ Trợ' : 'Bạn'}</strong>
                  <small>
                    <ClockCircleOutlined /> {formatTime(item.create_time)}
                  </small>
                </div>
                <div className="ticket-bubble">
                  <p>{item.message}</p>
                  {item.image && (
                    <a
                      className="ticket-attachment"
                      href={`${origin}${item.image}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <PaperClipOutlined /> Xem ảnh đính kèm
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {data.ticket.status !== 2 ? (
          <div className="ticket-reply">
            <Input.TextArea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn phản hồi của bạn..."
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="ticket-reply-actions">
              <Upload
                accept="image/*"
                maxCount={1}
                beforeUpload={() => false}
                fileList={files}
                onChange={({ fileList }) => setFiles(fileList)}
              >
                <Button icon={<PaperClipOutlined />}>Đính kèm ảnh</Button>
              </Upload>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                onClick={send}
              >
                Gửi tin nhắn
              </Button>
            </div>
          </div>
        ) : (
          <div className="ticket-closed">
            <LockOutlined /> Yêu cầu này đã được đóng lại!
          </div>
        )}
      </Card>
    </div>
  );
}
