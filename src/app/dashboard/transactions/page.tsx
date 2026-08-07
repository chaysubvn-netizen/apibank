'use client';
import {
  CalendarOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  FallOutlined,
  RiseOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
type Tx = {
  id: number;
  bank_code: string;
  transaction_id: string;
  type: 'IN' | 'OUT';
  amount: number;
  description?: string;
  created_at: string;
};
type Revenue = {
  summary: {
    total: number;
    total_in: number;
    total_out: number;
    today_in: number;
    count_in: number;
    count_out: number;
    profit: number;
  };
  daily: Array<{ day: string; amount_in: number; amount_out: number }>;
  by_bank: Array<{ bank_code: string; total: number }>;
  transactions: {
    data: Tx[];
    current_page: number;
    total: number;
    per_page: number;
  };
};
type Filters = {
  keyword: string;
  bank?: string;
  type?: string;
  from: Dayjs | null;
  to: Dayjs | null;
};
const EMPTY_FILTERS: Filters = { keyword: '', from: null, to: null };
const bankOptions = [
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
  'trc20',
  'bep20',
  'paypal',
  'zalopay',
].map((value) => ({ value, label: value.toUpperCase() }));
const colors = [
  '#118be8',
  '#ff405b',
  '#0aa878',
  '#d99100',
  '#8066d6',
  '#19b7ca',
  '#ef7c25',
  '#5269e8',
];
const queryString = (filters: Filters, page = 1, perPage = 20) => {
  const p = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (filters.keyword) p.set('keyword', filters.keyword);
  if (filters.bank) p.set('bank_code', filters.bank);
  if (filters.type) p.set('type', filters.type);
  if (filters.from) p.set('from', filters.from.format('YYYY-MM-DD'));
  if (filters.to) p.set('to', filters.to.format('YYYY-MM-DD'));
  return p.toString();
};
export default function RevenuePage() {
  const { message } = App.useApp();
  const [syncing, setSyncing] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [data, setData] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async (next: Filters, page = 1, perPage = 20) => {
    setLoading(true);
    try {
      setData(
        await api<Revenue>(`/revenue?${queryString(next, page, perPage)}`)
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    api<Revenue>(`/revenue?${queryString(EMPTY_FILTERS)}`)
      .then((result) => {
        if (active) setData(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const days = useMemo(() => {
    const map = new Map((data?.daily || []).map((row) => [row.day, row]));
    return Array.from({ length: 30 }, (_, index) => {
      const date = dayjs().subtract(29 - index, 'day');
      return (
        map.get(date.format('YYYY-MM-DD')) || {
          day: date.format('YYYY-MM-DD'),
          amount_in: 0,
          amount_out: 0,
        }
      );
    });
  }, [data]);
  const chartMax = Math.max(
    1,
    ...days.flatMap((row) => [Number(row.amount_in), Number(row.amount_out)])
  );
  const bankTotal = (data?.by_bank || []).reduce(
    (sum, row) => sum + Number(row.total),
    0
  );
  const pieStops = (data?.by_bank || [])
    .map((row, index, all) => {
      const start = bankTotal
        ? (all
            .slice(0, index)
            .reduce((sum, item) => sum + Number(item.total), 0) /
            bankTotal) *
          100
        : 0;
      const end =
        start + (bankTotal ? (Number(row.total) / bankTotal) * 100 : 0);
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(',');
  const syncAll = async () => {
    setSyncing(true);
    const hide = message.loading(
      'Đang đồng bộ giao dịch từ các cổng ngân hàng...',
      0
    );
    try {
      const result = await api<{ message: string }>('/transactions/sync-all', {
        method: 'POST',
      });
      message.success(result.message);
      await load(applied);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Đồng bộ giao dịch thất bại'
      );
    } finally {
      hide();
      setSyncing(false);
    }
  };
  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  };
  const apply = () => {
    setApplied(filters);
    load(filters);
  };
  const exportCsv = () => {
    if (!data) return;
    const lines = [
      ['Thời gian', 'Ngân hàng', 'Mã giao dịch', 'Loại', 'Số tiền', 'Nội dung'],
      ...data.transactions.data.map((row) => [
        row.created_at,
        row.bank_code,
        row.transaction_id,
        row.type,
        String(row.amount),
        row.description || '',
      ]),
    ];
    const csv =
      '\uFEFF' +
      lines
        .map((row) =>
          row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
        )
        .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    link.download = `doanh-thu-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  if (!data) return <Skeleton active paragraph={{ rows: 14 }} />;
  const cards = [
    {
      label: 'Tổng tiền vào (IN)',
      value: data.summary.total_in,
      note: `${data.summary.count_in} giao dịch`,
      icon: <RiseOutlined />,
      tone: 'in',
    },
    {
      label: 'Tổng tiền ra (OUT)',
      value: data.summary.total_out,
      note: `${data.summary.count_out} giao dịch`,
      icon: <FallOutlined />,
      tone: 'out',
    },
    {
      label: 'Tổng giao dịch',
      value: data.summary.total,
      note: 'Tất cả ngân hàng',
      icon: <DatabaseOutlined />,
      tone: 'total',
      count: true,
    },
    {
      label: 'Hôm nay (IN)',
      value: data.summary.today_in,
      note: 'giao dịch hôm nay',
      icon: <CalendarOutlined />,
      tone: 'today',
    },
  ];
  return (
    <div className="revenue-page">
      <div className="revenue-head">
        <div>
          <h1>Doanh thu</h1>
          <p>Thống kê dòng tiền từ tất cả cổng thanh toán.</p>
        </div>
        <Button
          type="primary"
          icon={<SyncOutlined spin={syncing} />}
          loading={syncing}
          onClick={syncAll}
        >
          Đồng bộ giao dịch
        </Button>
      </div>
      <Row gutter={[20, 18]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} xl={6} key={card.label}>
            <Card
              className={`revenue-stat stat-${card.tone}`}
              variant="borderless"
            >
              <span>{card.icon}</span>
              <div>
                <small>{card.label}</small>
                <b>{card.count ? card.value : formatMoney(card.value)}</b>
                <em>{card.note}</em>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[20, 20]} className="revenue-charts">
        <Col xs={24} xl={16}>
          <Card
            title="Doanh thu 30 ngày gần nhất"
            className="revenue-chart-card"
            variant="borderless"
          >
            <div className="bar-chart">
              {days.map((row) => (
                <div
                  className="bar-day"
                  key={row.day}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredDay(row.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() => setHoveredDay(row.day)}
                  onBlur={() => setHoveredDay(null)}
                  onClick={() =>
                    setHoveredDay(hoveredDay === row.day ? null : row.day)
                  }
                >
                  {hoveredDay === row.day && (
                    <div className="chart-tooltip">
                      <b>{dayjs(row.day).format('DD/MM/YYYY')}</b>
                      <span>
                        Tiền vào: <strong>{formatMoney(row.amount_in)}</strong>
                      </span>
                      <span>
                        Tiền ra: <em>{formatMoney(row.amount_out)}</em>
                      </span>
                    </div>
                  )}
                  <div className="bars">
                    <i
                      className="bar-in"
                      style={{
                        height: `${(Number(row.amount_in) / chartMax) * 100}%`,
                      }}
                    />
                    <i
                      className="bar-out"
                      style={{
                        height: `${(Number(row.amount_out) / chartMax) * 100}%`,
                      }}
                    />
                  </div>
                  <small>{dayjs(row.day).format('DD/MM')}</small>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span>
                <i className="green" />
                Tiền vào (IN)
              </span>
              <span>
                <i className="red" />
                Tiền ra (OUT)
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card
            title="Theo ngân hàng"
            className="revenue-chart-card bank-chart"
            variant="borderless"
          >
            <div className="pie-wrap">
              <div
                className="pie"
                style={{
                  background: pieStops
                    ? `conic-gradient(${pieStops})`
                    : '#edf1f5',
                }}
              />
              <div className="pie-legend">
                {data.by_bank.map((row, index) => (
                  <span key={row.bank_code}>
                    <i style={{ background: colors[index % colors.length] }} />
                    {row.bank_code.toUpperCase()}{' '}
                    <b>
                      {bankTotal
                        ? ((Number(row.total) / bankTotal) * 100).toFixed(1)
                        : 0}
                      %
                    </b>
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      <Card className="revenue-table-card" variant="borderless">
        <div className="revenue-filters">
          <label>
            Nội dung
            <Input
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
              placeholder="Tìm nội dung..."
            />
          </label>
          <label>
            Ngân hàng
            <Select
              allowClear
              value={filters.bank}
              onChange={(bank) => setFilters({ ...filters, bank })}
              placeholder="-- Tất cả --"
              options={bankOptions}
            />
          </label>
          <label>
            Loại
            <Select
              allowClear
              value={filters.type}
              onChange={(type) => setFilters({ ...filters, type })}
              placeholder="-- Tất cả --"
              options={[
                { value: 'IN', label: 'Tiền vào' },
                { value: 'OUT', label: 'Tiền ra' },
              ]}
            />
          </label>
          <label>
            Từ ngày
            <DatePicker
              value={filters.from}
              onChange={(from) => setFilters({ ...filters, from })}
              format="DD/MM/YYYY"
            />
          </label>
          <label>
            Đến ngày
            <DatePicker
              value={filters.to}
              onChange={(to) => setFilters({ ...filters, to })}
              format="DD/MM/YYYY"
            />
          </label>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={apply}>
              Lọc
            </Button>
            <Button icon={<CloseOutlined />} onClick={reset}>
              Reset
            </Button>
          </Space>
        </div>
        <div className="result-strip">
          <Space wrap>
            <b>Kết quả: {data.summary.total} giao dịch</b>
            <strong>Tiền vào: {formatMoney(data.summary.total_in)}</strong>
            <em>Tiền ra: {formatMoney(data.summary.total_out)}</em>
            <span>Lợi nhuận: {formatMoney(data.summary.profit)}</span>
          </Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportCsv}
          >
            Xuất Tất cả (Excel)
          </Button>
        </div>
        <Table
          loading={loading}
          rowKey="id"
          dataSource={data.transactions.data}
          scroll={{ x: 1000 }}
          pagination={{
            current: data.transactions.current_page,
            total: data.transactions.total,
            pageSize: data.transactions.per_page,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, size) => load(applied, page, size),
          }}
          columns={[
            { title: 'THỜI GIAN', dataIndex: 'created_at' },
            {
              title: 'NGÂN HÀNG',
              dataIndex: 'bank_code',
              render: (value) => (
                <Tag className="revenue-bank">
                  {String(value).toUpperCase()}
                </Tag>
              ),
            },
            {
              title: 'MÃ GIAO DỊCH',
              dataIndex: 'transaction_id',
              render: (value) => <b className="transaction-code">{value}</b>,
            },
            {
              title: 'LOẠI',
              dataIndex: 'type',
              render: (value) => (
                <Tag color={value === 'IN' ? 'success' : 'error'}>{value}</Tag>
              ),
            },
            {
              title: 'SỐ TIỀN',
              render: (_, row) => (
                <b className={row.type === 'IN' ? 'amount-in' : 'amount-out'}>
                  {row.type === 'IN' ? '+' : '-'}
                  {formatMoney(row.amount)}
                </b>
              ),
            },
            { title: 'NỘI DUNG', dataIndex: 'description' },
          ]}
        />
      </Card>
    </div>
  );
}
