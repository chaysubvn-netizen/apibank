'use client';
import {
  BankOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Spin,
} from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
const { Sider, Header, Content } = Layout;
type Me = {
  user: { id: number; username: string; email: string; level: number };
};
type Stats = { pending_tickets: number; pending_withdrawals: number };
const nav = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Thành viên' },
  { key: '/admin/banks', icon: <BankOutlined />, label: 'Ngân hàng' },
  {
    key: '/admin/packages',
    icon: <ThunderboltOutlined />,
    label: 'Cấu hình API',
  },
  {
    key: '/admin/cron-servers',
    icon: <ClockCircleOutlined />,
    label: 'Server Cron',
  },
  {
    key: '/admin/cron-jobs',
    icon: <ClockCircleOutlined />,
    label: 'Cron Job của user',
  },
  {
    key: '/admin/captcha-services',
    icon: <RobotOutlined />,
    label: 'Dịch vụ Captcha',
  },
  { key: '/admin/notifications', icon: <BellOutlined />, label: 'Thông báo' },
  {
    key: '/admin/withdrawals',
    icon: <DollarOutlined />,
    label: 'Duyệt rút tiền',
  },
  {
    key: '/admin/tickets',
    icon: <CustomerServiceOutlined />,
    label: 'Hỗ trợ / Tickets',
  },
  { key: '/admin/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
];
export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter(),
    pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [checking, setChecking] = useState(true),
    [user, setUser] = useState<Me['user'] | null>(null),
    [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    api<Me>('/auth/me')
      .then((r) => {
        if (Number(r.user.level) !== 1) {
          router.replace('/dashboard');
          return;
        }
        setUser(r.user);
        setChecking(false);
        api<Stats>('/admin/dashboard')
          .then(setStats)
          .catch(() => {});
      })
      .catch(() => {
        localStorage.removeItem('apibank_token');
        localStorage.removeItem('apibank_user');
        router.replace('/login');
      });
  }, [router]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    const sync = () => {
      setMobile(media.matches);
      if (media.matches) setCollapsed(true);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('apibank_token');
    localStorage.removeItem('apibank_user');
    router.replace('/login');
  };
  if (checking)
    return (
      <div className="admin-auth-loading">
        <Spin size="large" />
        <span>Đang xác minh quyền quản trị...</span>
      </div>
    );
  const items = nav.map((item) =>
    item.key === '/admin/tickets' && stats?.pending_tickets
      ? {
          ...item,
          label: (
            <span className="admin-nav-label">
              {item.label}
              <Badge count={stats.pending_tickets} />
            </span>
          ),
        }
      : item
  );
  return (
    <Layout className="admin-layout">
      <Sider
        width={255}
        collapsedWidth={mobile ? 0 : 76}
        collapsed={collapsed}
        className="admin-sider"
      >
        <div className="admin-brand">
          <div>A</div>
          {!collapsed && (
            <span>
              <b>APIBANK</b>
              <small>ADMIN PANEL</small>
            </span>
          )}
        </div>
        <div className="admin-menu-label">
          {!collapsed && 'QUẢN TRỊ HỆ THỐNG'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={items}
          onClick={({ key }) => {
            if (mobile) setCollapsed(true);
            router.push(key);
          }}
        />
        <div className="admin-sider-bottom">
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push('/dashboard')}
          >
            {!collapsed && 'Về trang khách'}
          </Button>
          <Button danger type="text" icon={<LogoutOutlined />} onClick={logout}>
            {!collapsed && 'Đăng xuất'}
          </Button>
        </div>
      </Sider>
      {mobile && !collapsed && (
        <button
          type="button"
          className="mobile-sider-mask admin-mask"
          aria-label="Đóng menu quản trị"
          onClick={() => setCollapsed(true)}
        />
      )}
      <Layout>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
          />
          <div className="admin-header-title">
            <b>Admin Panel</b>
            <span>/</span>
            <small>
              {nav.find((x) => x.key === pathname)?.label || 'Quản trị'}
            </small>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'site',
                  icon: <HomeOutlined />,
                  label: 'Trang khách hàng',
                  onClick: () => router.push('/dashboard'),
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Đăng xuất',
                  danger: true,
                  onClick: logout,
                },
              ],
            }}
          >
            <Space className="admin-user">
              <Avatar
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'Admin')}&background=1677ff&color=fff`}
                alt={`Ảnh đại diện ${user?.username || 'quản trị viên'}`}
                icon={<UserOutlined />}
              />
              <div>
                <b>{user?.username}</b>
                <small>Quản trị viên</small>
              </div>
            </Space>
          </Dropdown>
        </Header>
        <Content className="admin-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
