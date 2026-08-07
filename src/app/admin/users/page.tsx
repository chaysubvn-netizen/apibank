'use client';

import {
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Input, Skeleton, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatMoney } from '@/lib/api';

type Summary = {
  users: number;
  admins: number;
  balance: number;
  deposited: number;
  banned: number;
  links: { active: number; expired: number; total: number; users: number };
};
type BankStat = {
  code: string;
  name: string;
  active: number;
  expired: number;
  total: number;
};
type Overview = { summary: Summary; banks: BankStat[] };
type User = {
  id: number;
  username: string;
  email?: string;
  level: number;
  banned: number;
  money: number;
  total_money: number;
  ip?: string;
  time_session?: number;
  create_date?: string;
  api_plan_id?: number;
};
type UserPage = {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
const tones = ['blue', 'green', 'orange', 'purple', 'cyan', 'red'];
const bankIcon = (code: string) =>
  ['binance', 'trc20', 'bep20'].includes(code) ? (
    <WalletOutlined />
  ) : (
    <BankOutlined />
  );
const timeValue = (value?: number | string) => {
  if (!value) return '—';
  const date =
    typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('vi-VN');
};

export default function AdminUsersPage() {
  const router = useRouter(),
    { message, modal } = App.useApp();
  const [overview, setOverview] = useState<Overview | null>(null),
    [users, setUsers] = useState<User[]>([]),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, u] = await Promise.all([
        api<Overview>('/admin/users-overview'),
        api<UserPage>(
          `/admin/resources/users?page=${page}&per_page=10&search=${encodeURIComponent(search)}`
        ),
      ]);
      setOverview(o);
      setUsers(u.data);
      setTotal(u.total);
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : 'Không tải được danh sách thành viên'
      );
    } finally {
      setLoading(false);
    }
  }, [message, page, search]);
  useEffect(() => {
    load();
  }, [load]);
  const remove = (user: User) =>
    modal.confirm({
      title: `Xóa thành viên ${user.username}?`,
      content:
        'Tài khoản sẽ bị xóa khỏi hệ thống. Hãy kiểm tra dữ liệu liên quan trước khi tiếp tục.',
      okText: 'Xóa thành viên',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api(`/admin/resources/users/${user.id}`, { method: 'DELETE' });
        message.success('Đã xóa thành viên');
        load();
      },
    });
  const columns: ColumnsType<User> = [
    {
      title: 'STT',
      width: 65,
      render: (_, __, index) => (page - 1) * 10 + index + 1,
    },
    {
      title: 'TÀI KHOẢN',
      width: 300,
      render: (_, u) => (
        <div className="member-cell">
          <span className="member-avatar">
            {u.username.slice(0, 1).toUpperCase()}
          </span>
          <ul>
            <li>
              Tên đăng nhập: <b>{u.username}</b> <em>#{u.id}</em>
            </li>
            <li>
              Email: <strong>{u.email || 'Chưa cập nhật'}</strong>
            </li>
            <li>
              Vai trò:{' '}
              <Tag color={Number(u.level) === 1 ? 'gold' : 'blue'}>
                {Number(u.level) === 1 ? 'ADMIN' : 'THÀNH VIÊN'}
              </Tag>
            </li>
            <li>
              Tình trạng:{' '}
              <Tag color={Number(u.banned) === 1 ? 'error' : 'success'}>
                {Number(u.banned) === 1 ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}
              </Tag>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'VÍ',
      width: 245,
      render: (_, u) => (
        <ul className="member-list">
          <li>
            Số dư khả dụng:{' '}
            <b className="wallet-balance">
              {formatMoney(Number(u.money || 0))}
            </b>
          </li>
          <li>
            Tổng tiền nạp:{' '}
            <b className="wallet-deposit">
              {formatMoney(Number(u.total_money || 0))}
            </b>
          </li>
          <li>
            Gói API: <b>#{u.api_plan_id || '—'}</b>
          </li>
        </ul>
      ),
    },
    {
      title: 'BẢO MẬT',
      width: 290,
      render: (_, u) => (
        <ul className="member-list">
          <li>
            IP: <b>{u.ip || '—'}</b>
          </li>
          <li>
            Trạng thái:{' '}
            <Tag
              color={
                Number(u.time_session || 0) > Date.now() / 1000 - 300
                  ? 'success'
                  : 'default'
              }
            >
              {Number(u.time_session || 0) > Date.now() / 1000 - 300
                ? 'Online'
                : 'Offline'}
            </Tag>
          </li>
          <li>
            Ngày tham gia: <b>{timeValue(u.create_date)}</b>
          </li>
          <li>
            Hoạt động gần đây: <b>{timeValue(u.time_session)}</b>
          </li>
        </ul>
      ),
    },
    {
      title: 'THAO TÁC',
      fixed: 'right',
      width: 155,
      render: (_, u) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/users/${u.id}`)}
          >
            Sửa
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(u)} />
        </Space>
      ),
    },
  ];
  if (!overview && loading) return <Skeleton active paragraph={{ rows: 18 }} />;
  const s = overview?.summary;
  const top = [
    {
      label: 'Tổng thành viên',
      value: (
        <>
          {s?.users || 0} thành viên <small>/ {s?.admins || 0} Admin</small>
        </>
      ),
      icon: <TeamOutlined />,
      tone: 'yellow',
    },
    {
      label: 'Số dư thành viên',
      value: (
        <>
          {formatMoney(s?.balance || 0)}{' '}
          <small>/ {formatMoney(s?.deposited || 0)}</small>
        </>
      ),
      icon: <WalletOutlined />,
      tone: 'green',
    },
    {
      label: 'Tài khoản bị vô hiệu hóa',
      value: <>{s?.banned || 0} tài khoản</>,
      icon: <LockOutlined />,
      tone: 'red',
    },
    {
      label: 'Tổng All Liên Kết',
      value: (
        <>
          {s?.links.active || 0} Token{' '}
          <small>
            / {s?.links.expired || 0} hết hạn / {s?.links.users || 0} tài khoản
          </small>
        </>
      ),
      icon: <LinkOutlined />,
      tone: 'gray',
    },
  ];
  return (
    <div className="admin-page admin-members-page">
      <div className="admin-simple-title">
        <div>
          <h1>Quản lý thành viên</h1>
          <span>Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Danh sách thành viên</span>
        </div>
      </div>
      <div className="member-summary-grid">
        {top.map((x) => (
          <Card
            key={x.label}
            className={`member-stat ${x.tone}`}
            variant="borderless"
          >
            <span>{x.icon}</span>
            <div>
              <small>{x.label}</small>
              <strong>{x.value}</strong>
            </div>
          </Card>
        ))}
      </div>
      <div className="bank-link-grid">
        {overview?.banks.map((bank, i) => (
          <Card key={bank.code} className="bank-link-stat" variant="borderless">
            <span className={`tone-${tones[i % tones.length]}`}>
              {bankIcon(bank.code)}
            </span>
            <div>
              <small>Tổng Liên Kết {bank.name}</small>
              <strong>
                <i>{bank.active} Token</i>
                <em>{bank.expired} hết hạn</em>
                <b>{bank.total} tổng</b>
              </strong>
            </div>
          </Card>
        ))}
      </div>
      <Card
        className="admin-php-card member-table-card"
        title={
          <Space>
            <TeamOutlined /> DANH SÁCH THÀNH VIÊN
          </Space>
        }
        variant="borderless"
      >
        <div className="member-table-tools">
          <span>Hiển thị 10 thành viên mỗi trang</span>
          <Input.Search
            allowClear
            placeholder="Tìm tài khoản hoặc email..."
            defaultValue={search}
            onSearch={(v) => {
              setPage(1);
              setSearch(v.trim());
            }}
            enterButton="Tìm kiếm"
          />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={users}
          scroll={{ x: 1120 }}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (n) => `${n} thành viên`,
          }}
        />
      </Card>
    </div>
  );
}
