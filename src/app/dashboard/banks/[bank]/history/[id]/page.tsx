'use client';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
import { banks } from '../../../page';
type Tx = {
  id: number;
  bank_code: string;
  transaction_id: string;
  type: string;
  amount: number;
  description?: string;
  icon?: string | null;
  created_at: string;
};
export default function BankHistory() {
  const params = useParams<{ bank: string; id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const bank = banks.find((item) => item.code === params.bank) || banks[0];
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [searchBy, setSearchBy] = useState<
    'transaction_id' | 'type' | 'description'
  >('transaction_id');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const result = await api<{ data: Tx[] }>(
      `/bank-accounts/${bank.code}/${encodeURIComponent(params.id)}/history?per_page=100`
    );
    setData(result.data);
  };
  useEffect(() => {
    let active = true;
    api<{ data: Tx[] }>(
      `/bank-accounts/${bank.code}/${encodeURIComponent(params.id)}/history?per_page=100`
    )
      .then((result) => {
        if (active) setData(result.data);
      })
      .catch((error) => {
        if (active)
          message.error(
            error instanceof Error
              ? error.message
              : 'Không tải được lịch sử giao dịch'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bank.code, params.id, message]);
  const rows = useMemo(
    () =>
      data
        .filter((row) => {
          const value = dayjs(row.created_at);
          const query = keyword.trim().toLocaleLowerCase();
          const searchable =
            searchBy === 'transaction_id'
              ? row.transaction_id
              : searchBy === 'type'
                ? row.type === 'IN'
                  ? 'in tiền vào nhận vào'
                  : 'out tiền ra chuyển đi'
                : row.description || '';
          return (
            (!from || !value.isBefore(from.startOf('day'))) &&
            (!to || !value.isAfter(to.endOf('day'))) &&
            (!query || searchable.toLocaleLowerCase().includes(query))
          );
        })
        .sort(
          (a, b) =>
            dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
        ),
    [data, from, to, keyword, searchBy]
  );
  const query = async () => {
    setLoading(true);
    try {
      await load();
      message.success('Đã tải các giao dịch mới nhất');
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không lấy được lịch sử giao dịch'
      );
    } finally {
      setLoading(false);
    }
  };
  const isUsdt = ['binance', 'trc20', 'bep20'].includes(bank.code);
  const columns = isUsdt
    ? [
        {
          title: 'THỜI GIAN',
          dataIndex: 'created_at',
          render: (value: string) => (
            <b>{dayjs(value).format('HH:mm:ss DD-MM-YYYY')}</b>
          ),
        },
        {
          title: 'MÃ GIAO DỊCH',
          dataIndex: 'transaction_id',
          render: (value: string) => <b>{value}</b>,
        },
        {
          title: 'LOẠI GIAO DỊCH',
          dataIndex: 'type',
          render: (value: string) => (
            <b className={value === 'IN' ? 'amount-in' : 'amount-out'}>
              {value === 'IN' ? 'Pay: Nhận vào' : 'Pay: Chuyển đi'}
            </b>
          ),
        },
        {
          title: 'SỐ TIỀN',
          render: (_: unknown, row: Tx) => (
            <b className={row.type === 'IN' ? 'amount-in' : 'amount-out'}>
              {row.type === 'IN' ? '+' : '-'}
              {new Intl.NumberFormat('vi-VN', {
                maximumFractionDigits: 8,
              }).format(Number(row.amount))}{' '}
              USDT
            </b>
          ),
        },
        {
          title: 'NỘI DUNG',
          dataIndex: 'description',
          render: (value: string) => <b>{value || '—'}</b>,
        },
        {
          title: 'TRẠNG THÁI',
          render: () => <b className="amount-in">Thành công</b>,
        },
      ]
    : [
        { title: 'THỜI GIAN', dataIndex: 'created_at' },
        { title: 'MÃ GIAO DỊCH', dataIndex: 'transaction_id' },
        {
          title: 'LOẠI GIAO DỊCH',
          dataIndex: 'type',
          render: (value: string) => (
            <Tag color={value === 'IN' ? 'success' : 'error'}>
              {value === 'IN' ? 'Tiền vào' : 'Tiền ra'}
            </Tag>
          ),
        },
        {
          title: 'SỐ TIỀN',
          dataIndex: 'amount',
          render: (value: number) => <b>{formatMoney(value)}</b>,
        },
        {
          title: 'NỘI DUNG',
          render: (_: unknown, row: Tx) => (
            <div className="zalopay-transaction-content">
              {row.icon && <img src={row.icon} alt="" />}
              <span>{row.description || '—'}</span>
            </div>
          ),
        },
      ];
  return (
    <div className="bank-history-page">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/dashboard/banks/${bank.code}`)}
      >
        Danh sách tài khoản {bank.name}
      </Button>
      <div className="page-title">
        <h1>Lịch Sử Giao Dịch {bank.name}</h1>
        <p>
          Tổng quan&nbsp;&nbsp;/&nbsp;&nbsp;Danh Sách Tài Khoản {bank.name}
          &nbsp;&nbsp;/&nbsp;&nbsp;<b>Lịch Sử Giao Dịch</b>
        </p>
      </div>
      <Card className="history-bank-card" variant="borderless">
        <Space className="history-query" wrap>
          <DatePicker
            className="history-date"
            value={from}
            onChange={setFrom}
            placeholder="Chọn thời điểm"
            format="YYYY-MM-DD"
          />
          <DatePicker
            className="history-date"
            value={to}
            onChange={setTo}
            placeholder="Chọn thời điểm"
            format="YYYY-MM-DD"
          />
          <Select
            className="history-search-type"
            value={searchBy}
            onChange={setSearchBy}
            options={[
              { value: 'transaction_id', label: 'Mã giao dịch' },
              { value: 'type', label: 'Loại giao dịch' },
              { value: 'description', label: 'Nội dung' },
            ]}
          />
          <Input
            className="history-search-input"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => void query()}
            placeholder={
              searchBy === 'transaction_id'
                ? 'Nhập mã giao dịch'
                : searchBy === 'type'
                  ? 'IN, OUT, tiền vào...'
                  : 'Nhập nội dung giao dịch'
            }
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={query}>
            Truy vấn
          </Button>
        </Space>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            dataSource={rows}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              placement: ['bottomStart'],
            }}
            locale={{
              emptyText: <Empty description='Nhấn "Truy vấn" để tải dữ liệu' />,
            }}
            columns={columns}
            scroll={{ x: 900 }}
          />
        </Spin>
      </Card>
    </div>
  );
}
