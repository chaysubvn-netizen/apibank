'use client';
import {
  CalendarOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Col, Empty, Row, Spin, Table, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';
type Period = {
  members: number;
  orders: number;
  revenue: number;
  profit: number;
};
type Recent = Record<string, unknown> & { id: number };
type Data = {
  periods: { all: Period; month: Period; week: Period; today: Period };
  chart: { labels: string[]; orders: number[]; recharges: number[] };
  month: string;
  recent_orders: Recent[];
  recent_invoices: Recent[];
};
function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const width = 760,
    height = 270,
    left = 42,
    right = 18,
    top = 22,
    bottom = 52,
    max = Math.max(1, ...values),
    innerW = width - left - right,
    innerH = height - top - bottom,
    point = (value: number, index: number) =>
      [
        left + index * Math.max(innerW / (labels.length - 1), 0),
        top + innerH - (value / max) * innerH,
      ] as const,
    points = values.map((v, i) => point(v, i)),
    line = points.map((p) => p.join(',')).join(' '),
    area = points.length
      ? `M ${points[0][0]} ${top + innerH} L ${points.map((p) => p.join(' ')).join(' L ')} L ${points.at(-1)![0]} ${top + innerH} Z`
      : '';
  return (
    <div className="php-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={width - right}
              y1={top + innerH - v * innerH}
              y2={top + innerH - v * innerH}
            />
            <text x={left - 9} y={top + innerH - v * innerH + 4}>
              {Math.round(max * v)}
            </text>
          </g>
        ))}
        <path className="line-area" d={area} />
        <polyline className="line-path" points={line} />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={values[i] ? 3.5 : 2.2}>
            <title>
              {labels[i]}: {values[i]} đơn hàng
            </title>
          </circle>
        ))}
        {labels.map((label, i) => (
          <text
            className="x-label"
            key={label}
            x={point(0, i)[0]}
            y={height - 18}
            transform={`rotate(-48 ${point(0, i)[0]} ${height - 18})`}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const width = 760,
    height = 270,
    left = 48,
    right = 18,
    top = 22,
    bottom = 52,
    max = Math.max(1, ...values),
    innerW = width - left - right,
    innerH = height - top - bottom,
    slot = innerW / Math.max(labels.length, 1),
    bar = Math.max(4, slot * 0.58);
  return (
    <div className="php-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={width - right}
              y1={top + innerH - v * innerH}
              y2={top + innerH - v * innerH}
            />
            <text x={left - 9} y={top + innerH - v * innerH + 4}>
              {max * v >= 1000
                ? `${Math.round((max * v) / 1000)}k`
                : Math.round(max * v)}
            </text>
          </g>
        ))}
        {values.map((value, i) => {
          const h = (value / max) * innerH,
            x = left + i * slot + (slot - bar) / 2,
            y = top + innerH - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={bar}
              height={Math.max(h, 1)}
              rx="2"
            >
              <title>
                {labels[i]}: {formatMoney(value)}
              </title>
            </rect>
          );
        })}
        {labels.map((label, i) => (
          <text
            className="x-label"
            key={label}
            x={left + i * slot + slot / 2}
            y={height - 18}
            transform={`rotate(-48 ${left + i * slot + slot / 2} ${height - 18})`}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
export default function AdminDashboard() {
  const { message } = App.useApp(),
    router = useRouter(),
    [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    api<Data>('/admin/dashboard')
      .then(setData)
      .catch((error) => message.error(error.message))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(() => {
    load();
  }, [load]);
  const cards = data
    ? [
        {
          key: 'all',
          title: 'TOÀN THỜI GIAN',
          tone: 'all',
          icon: <SyncOutlined />,
          value: data.periods.all,
        },
        {
          key: 'month',
          title: `THÁNG ${data.month}`,
          tone: 'month',
          icon: <CalendarOutlined />,
          value: data.periods.month,
        },
        {
          key: 'week',
          title: 'TUẦN NÀY',
          tone: 'week',
          icon: <AppstoreOutlined />,
          value: data.periods.week,
        },
        {
          key: 'today',
          title: 'HÔM NAY',
          tone: 'today',
          icon: <ThunderboltOutlined />,
          value: data.periods.today,
        },
      ]
    : [];
  return (
    <div className="admin-page php-admin-dashboard">
      <div className="php-dashboard-title">
        <div>
          <h1>Bảng điều khiển</h1>
          <p>Tổng quan hoạt động hệ thống theo thời gian thực</p>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
          Làm mới
        </Button>
      </div>
      <Spin spinning={loading}>
        {data && (
          <>
            <Row gutter={[14, 14]}>
              {cards.map((card) => (
                <Col xs={24} sm={12} xl={6} key={card.key}>
                  <div className={`php-stat-card ${card.tone}`}>
                    <div className="php-stat-title">
                      {card.title}
                      <i>{card.icon}</i>
                    </div>
                    <div className="php-stat-grid">
                      <span>
                        <small>Thành viên</small>
                        <b>{card.value.members.toLocaleString('vi-VN')}</b>
                      </span>
                      <span>
                        <small>Đơn hàng</small>
                        <b>{card.value.orders.toLocaleString('vi-VN')}</b>
                      </span>
                      <span>
                        <small>Doanh thu</small>
                        <b>{formatMoney(card.value.revenue)}</b>
                      </span>
                      <span>
                        <small>Lợi nhuận</small>
                        <b>{formatMoney(card.value.profit)}</b>
                      </span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <Row gutter={[14, 14]} className="php-dashboard-row">
              <Col xs={24} xl={12}>
                <Card
                  className="php-dashboard-card orders-chart-card"
                  title={`THỐNG KÊ ĐƠN HÀNG THÁNG ${data.month}`}
                  variant="borderless"
                >
                  <LineChart
                    labels={data.chart.labels}
                    values={data.chart.orders}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card
                  className="php-dashboard-card recharge-chart-card"
                  title={`THỐNG KÊ NẠP TIỀN THÁNG ${data.month}`}
                  variant="borderless"
                >
                  <BarChart
                    labels={data.chart.labels}
                    values={data.chart.recharges}
                  />
                </Card>
              </Col>
            </Row>
            <Row gutter={[14, 14]} className="php-dashboard-row">
              <Col xs={24} xl={12}>
                <Card
                  className="php-dashboard-card recent-orders-card"
                  title={
                    <span>
                      <ShoppingCartOutlined /> ĐƠN HÀNG GẦN ĐÂY
                    </span>
                  }
                  variant="borderless"
                >
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={data.recent_orders}
                    locale={{
                      emptyText: <Empty description="Chưa có đơn hàng" />,
                    }}
                    columns={[
                      {
                        title: 'Khách hàng',
                        dataIndex: 'username',
                        render: (v, r) => (
                          <a
                            onClick={() =>
                              router.push(`/admin/users/${r.user_id}`)
                            }
                          >
                            {v || `#${r.user_id}`}
                          </a>
                        ),
                      },
                      {
                        title: 'Gói',
                        dataIndex: 'content',
                        ellipsis: true,
                        render: (v) => (
                          <Tag color="cyan">
                            {String(v || '').split('#')[0]}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Giá',
                        dataIndex: 'money_change',
                        render: (v) => (
                          <b>{formatMoney(Math.abs(Number(v)))}</b>
                        ),
                      },
                      {
                        title: 'Thời gian',
                        dataIndex: 'time',
                        render: (v) => <small>{String(v || '')}</small>,
                      },
                    ]}
                    scroll={{ x: 650 }}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card
                  className="php-dashboard-card recent-recharges-card"
                  title={
                    <span>
                      <WalletOutlined /> NẠP TIỀN TỰ ĐỘNG GẦN ĐÂY
                    </span>
                  }
                  variant="borderless"
                >
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={data.recent_invoices}
                    locale={{
                      emptyText: (
                        <Empty description="Chưa có giao dịch nạp tiền" />
                      ),
                    }}
                    columns={[
                      {
                        title: 'Khách hàng',
                        dataIndex: 'username',
                        render: (v, r) => (
                          <a
                            onClick={() =>
                              router.push(`/admin/users/${r.user_id}`)
                            }
                          >
                            {v || `#${r.user_id}`}
                          </a>
                        ),
                      },
                      {
                        title: 'Ngân hàng',
                        dataIndex: 'payment_method',
                        render: (v) => <Tag color="green">{v}</Tag>,
                      },
                      {
                        title: 'Số tiền',
                        dataIndex: 'amount',
                        render: (v) => <b>{formatMoney(Number(v))}</b>,
                      },
                      {
                        title: 'Thời gian',
                        dataIndex: 'create_time',
                        render: (v) => (
                          <small>
                            {/^\\d+$/.test(String(v))
                              ? new Date(Number(v) * 1000).toLocaleString(
                                  'vi-VN'
                                )
                              : String(v || '')}
                          </small>
                        ),
                      },
                    ]}
                    scroll={{ x: 650 }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
}
