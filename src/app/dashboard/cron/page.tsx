'use client';

import {
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { api, formatMoney } from '@/lib/api';

type Server = { id: number; name: string; price: number };
type Job = {
  id: number;
  url: string;
  sogiay: number;
  ngay_het: number;
  trangthai: string;
  server_id: number;
};
export default function CronPage() {
  const { message: messageApi } = App.useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(
    () =>
      Promise.all([
        api<Job[]>('/cron/jobs'),
        api<Server[]>('/cron/servers'),
      ]).then(([j, s]) => {
        setJobs(j);
        setServers(s);
      }),
    []
  );
  useEffect(() => {
    load();
  }, [load]);
  const create = async (v: Record<string, unknown>) => {
    await api('/cron/jobs', { method: 'POST', body: JSON.stringify(v) });
    messageApi.success('Đã thuê cron');
    setOpen(false);
    load();
  };
  const status = async (id: number, current: string) => {
    await api(`/cron/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: current === 'hoatdong' ? 'tamdung' : 'hoatdong',
      }),
    });
    load();
  };
  const remove = async (id: number) => {
    await api(`/cron/jobs/${id}`, { method: 'DELETE' });
    messageApi.success('Đã xóa cron');
    load();
  };
  return (
    <>
      <div className="page-title">
        <h1>Thuê Cron Job</h1>
        <p>Gọi URL tự động theo chu kỳ và theo dõi phản hồi.</p>
      </div>
      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            Thuê cron
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={jobs}
          columns={[
            { title: 'URL', dataIndex: 'url', ellipsis: true },
            {
              title: 'Chu kỳ',
              dataIndex: 'sogiay',
              render: (v) => `${v} giây`,
            },
            {
              title: 'Hết hạn',
              dataIndex: 'ngay_het',
              render: (v) => new Date(v * 1000).toLocaleDateString('vi-VN'),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'trangthai',
              render: (v) => (
                <Tag color={v === 'hoatdong' ? 'success' : 'default'}>
                  {v === 'hoatdong' ? 'Hoạt động' : 'Tạm dừng'}
                </Tag>
              ),
            },
            {
              title: 'Thao tác',
              render: (_, r) => (
                <Space>
                  <Button
                    icon={
                      r.trangthai === 'hoatdong' ? (
                        <PauseCircleOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={() => status(r.id, r.trangthai)}
                  />
                  <Popconfirm
                    title="Xóa cron này?"
                    onConfirm={() => remove(r.id)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="Thuê Cron Job mới"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          onFinish={create}
          initialValues={{ interval_seconds: 60, duration_days: 30 }}
        >
          <Form.Item
            name="server_id"
            label="Server"
            rules={[{ required: true }]}
          >
            <Select
              options={servers.map((s) => ({
                value: s.id,
                label: `${s.name} — ${formatMoney(s.price)}/ngày`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL cần gọi"
            rules={[{ required: true }, { type: 'url' }]}
          >
            <Input placeholder="https://example.com/cron" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item
              name="interval_seconds"
              label="Chu kỳ (giây)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="duration_days"
              label="Số ngày"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={3650} />
            </Form.Item>
          </Space>
          <Button block type="primary" htmlType="submit">
            Xác nhận thuê
          </Button>
        </Form>
      </Modal>
    </>
  );
}
