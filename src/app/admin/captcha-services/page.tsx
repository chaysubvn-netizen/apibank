'use client';

import { RobotOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, InputNumber, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Service = {
  id: number;
  type: string;
  name: string;
  price: number;
  status: number;
  image?: string;
};
type PageData = { data: Service[] };
type Draft = { price: number; status: number };
export default function AdminCaptchaServicesPage() {
  const { message } = App.useApp(),
    [data, setData] = useState<Service[]>([]),
    [drafts, setDrafts] = useState<Record<number, Draft>>({}),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState<number | null>(null);
  const load = useCallback(
    () =>
      api<PageData>('/admin/resources/captcha-services?per_page=100')
        .then((r) => {
          const rows = [...r.data].sort((a, b) => a.id - b.id);
          setData(rows);
          setDrafts(
            Object.fromEntries(
              rows.map((x) => [
                x.id,
                { price: Number(x.price), status: Number(x.status) },
              ])
            )
          );
        })
        .catch((e) => message.error(e.message))
        .finally(() => setLoading(false)),
    [message]
  );
  useEffect(() => {
    load();
  }, [load]);
  const change = (id: number, patch: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || { price: 0, status: 1 }), ...patch },
    }));
  const save = async (row: Service) => {
    const draft = drafts[row.id];
    if (!draft) return;
    setSaving(row.id);
    try {
      await api(`/admin/resources/captcha-services/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      message.success(`Đã lưu dịch vụ ${row.name}`);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể lưu dịch vụ');
    } finally {
      setSaving(null);
    }
  };
  const columns: ColumnsType<Service> = [
    { title: 'ID', dataIndex: 'id', width: 90, align: 'center' },
    {
      title: 'MÃ DV (TYPE)',
      dataIndex: 'type',
      width: 240,
      align: 'center',
      render: (v) => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: 'TÊN HIỂN THỊ',
      dataIndex: 'name',
      width: 260,
      align: 'center',
      render: (v) => <b>{v}</b>,
    },
    {
      title: 'GIÁ / LƯỢT (đ)',
      width: 260,
      align: 'center',
      render: (_, row) => (
        <InputNumber
          min={0}
          step={0.1}
          precision={2}
          value={drafts[row.id]?.price}
          onChange={(value) => change(row.id, { price: Number(value || 0) })}
        />
      ),
    },
    {
      title: 'TRẠNG THÁI',
      width: 280,
      align: 'center',
      render: (_, row) => (
        <Select
          value={drafts[row.id]?.status}
          onChange={(value) => change(row.id, { status: value })}
          options={[
            { value: 1, label: 'Hoạt động' },
            { value: 0, label: 'Bảo trì' },
          ]}
        />
      ),
    },
    {
      title: 'THAO TÁC',
      width: 180,
      align: 'center',
      render: (_, row) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving === row.id}
          onClick={() => save(row)}
        >
          Lưu
        </Button>
      ),
    },
  ];
  return (
    <div className="admin-page admin-captcha-page">
      <div className="admin-simple-title">
        <div>
          <h1>Dịch vụ giải Captcha</h1>
          <span>
            Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Cấu hình dịch vụ Captcha
          </span>
        </div>
      </div>
      <Card
        className="admin-php-card captcha-service-card"
        title={
          <span>
            <RobotOutlined /> CẤU HÌNH GIÁ DỊCH VỤ
          </span>
        }
        variant="borderless"
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={false}
          scroll={{ x: 1050 }}
          locale={{ emptyText: 'Chưa có dịch vụ Captcha' }}
        />
      </Card>
    </div>
  );
}
