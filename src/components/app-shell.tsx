'use client';

import {
  ApiOutlined,
  BankOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  LinkOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  UserOutlined,
  WalletOutlined,
  SettingOutlined,
  TeamOutlined,
  RobotOutlined,
  GiftOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Modal,
  Space,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import LanguageSwitcher from '@/components/language-switcher';
import SafeHtml from '@/components/safe-html';

const { Header, Sider, Content } = Layout;
const subscribeToUser = () => () => {};
const getUserSnapshot = () => localStorage.getItem('apibank_user');
const getServerUserSnapshot = () => null;
const gatewayChildren: NonNullable<MenuProps['items']> = [
  ['acb', 'ACB'],
  ['viettel', 'Viettel Money'],
  ['viettin', 'VietinBank'],
  ['mbbank', 'Mbbank'],
  ['ocb', 'OCB'],
  ['vpbank', 'VPBank'],
  ['vietcombank', 'Vietcombank'],
  ['bidv', 'BIDV'],
  ['thesieure', 'Thesieure'],
  ['techcombank', 'Techcombank'],
  ['seabank', 'Seabank'],
  ['tpbank', 'TPBank'],
  ['binance', 'Binance Pay'],
  ['trc20', 'TRC20 (USDT)'],
  ['bep20', 'BEP20 (USDT)'],
  ['paypal', 'PayPal'],
  ['zalopay', 'ZaloPay'],
].map(([code, label]) => ({ key: `/dashboard/banks/${code}`, label }));
const pageTitles: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/dashboard/transactions': 'Doanh thu',
  '/dashboard/profile': 'Thông tin tài khoản',
  '/dashboard/invoices': 'Nạp tiền',
  '/dashboard/upgrade': 'Gia hạn API',
  '/dashboard/cron': 'Cron Job',
  '/dashboard/captcha': 'Giải eCaptcha',
  '/dashboard/referrals': 'Tiếp thị liên kết',
  '/dashboard/packages': 'Gói đang sử dụng',
  '/dashboard/webhooks': 'Webhooks',
  '/dashboard/tickets': 'Hỗ trợ / Tickets',
  '/dashboard/api-docs': 'Tài liệu API',
  '/dashboard/api-docs/v1': 'Tài liệu API V1',
  '/dashboard/api-docs/v2': 'Tài liệu API V2',
  '/dashboard/api-docs/v3': 'Tài liệu API V3',
  '/dashboard/api-docs/invoices': 'API Invoice VietQR',
  '/dashboard/settings': 'Cài đặt',
  '/admin': 'Trang quản trị viên',
};
const items: NonNullable<MenuProps['items']> = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
  {
    key: '/dashboard/transactions',
    icon: <SwapOutlined />,
    label: 'Doanh thu',
  },
  {
    key: '/dashboard/profile',
    icon: <UserOutlined />,
    label: 'Thông tin tài khoản',
  },
  {
    key: 'gateway',
    icon: <BankOutlined />,
    label: 'Cổng Thanh Toán',
    children: gatewayChildren,
  },
  { key: '/dashboard/invoices', icon: <WalletOutlined />, label: 'Nạp tiền' },
  {
    key: '/dashboard/upgrade',
    icon: <SafetyCertificateOutlined />,
    label: 'Gia hạn API',
  },
  { key: '/dashboard/cron', icon: <ClockCircleOutlined />, label: 'Cron Job' },
  {
    key: '/dashboard/captcha',
    icon: <RobotOutlined />,
    label: 'Giải eCaptcha',
  },
  {
    key: '/dashboard/referrals',
    icon: <TeamOutlined />,
    label: 'Tiếp thị liên kết',
  },
  {
    key: '/dashboard/packages',
    icon: <CrownOutlined />,
    label: 'Gói đang sử dụng',
  },
  { key: '/dashboard/webhooks', icon: <LinkOutlined />, label: 'Webhooks' },
  {
    key: '/dashboard/tickets',
    icon: <MessageOutlined />,
    label: 'Hỗ trợ / Tickets',
  },
  {
    key: 'api-docs',
    icon: <ApiOutlined />,
    label: 'Tài liệu API',
    children: [
      { key: '/dashboard/api-docs/v1', label: 'Tài liệu API V1' },
      { key: '/dashboard/api-docs/v2', label: 'Tài liệu API V2' },
      { key: '/dashboard/api-docs/v3', label: 'Tài liệu API V3' },
      { key: '/dashboard/api-docs/invoices', label: 'API Invoice VietQR' },
      { key: '/dashboard/api-docs', label: 'Tài liệu API' },
    ],
  },
  { key: '/dashboard/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
  { key: '/admin', icon: <GiftOutlined />, label: 'Trang quản trị viên' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [site, setSite] = useState<{
    name: string;
    logo: string | null;
    notification?: string | null;
  }>({ name: 'APIBANK', logo: null });
  const [noticeOpen, setNoticeOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const userSnapshot = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );
  const user = useMemo(() => {
    try {
      return userSnapshot ? JSON.parse(userSnapshot) : null;
    } catch {
      return null;
    }
  }, [userSnapshot]);
  useEffect(() => {
    if (!localStorage.getItem('apibank_token')) router.replace('/login');
  }, [router]);
  useEffect(() => {
    api<{ name: string; logo: string | null; notification?: string | null }>(
      '/site-config',
      { authenticated: false }
    )
      .then((value) => {
        setSite(value);
        const notice = (value.notification || '').trim();
        const hiddenUntil = Number(
          localStorage.getItem('apibank_notice_hidden_until') || 0
        );
        if (notice && Date.now() >= hiddenUntil) setNoticeOpen(true);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 991px)');
    const sync = () => {
      setMobile(media.matches);
      if (media.matches) setCollapsed(true);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  const packageItems = items;
  const menuItems =
    user?.level === 1
      ? packageItems
      : packageItems.filter(
          (item) => item && 'key' in item && item.key !== 'admin'
        );
  const bankTitle = gatewayChildren.find(
    (item) => item && 'key' in item && pathname.startsWith(String(item.key))
  ) as { label?: ReactNode } | undefined;
  const currentTitle =
    pageTitles[pathname] ||
    (pathname.startsWith('/dashboard/banks/')
      ? `Cổng thanh toán ${String(bankTitle?.label || '')}`
      : pathname.startsWith('/dashboard/invoices/')
        ? 'Chi tiết hóa đơn'
        : pathname.startsWith('/dashboard/tickets/')
          ? 'Chi tiết Ticket'
          : 'Không gian làm việc');
  const logout = () => {
    localStorage.removeItem('apibank_token');
    localStorage.removeItem('apibank_user');
    router.replace('/login');
  };
  const hideNotice = () => {
    localStorage.setItem(
      'apibank_notice_hidden_until',
      String(Date.now() + 2 * 60 * 60 * 1000)
    );
    setNoticeOpen(false);
  };
  return (
    <Layout className="app-layout">
      <Sider
        className="app-sider"
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={270}
      >
        <div className="brand">
          {site.logo ? (
            <img
              className="brand-admin-logo"
              src={site.logo}
              alt={`Logo ${site.name}`}
            />
          ) : (
            <div className="brand-mark">A</div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={
            pathname.startsWith('/dashboard/banks')
              ? ['gateway']
              : pathname.startsWith('/dashboard/api-docs')
                ? ['api-docs']
                : pathname.startsWith('/admin')
                  ? ['admin']
                  : []
          }
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => {
            if (mobile) setCollapsed(true);
            key === 'logout' ? logout() : router.push(key);
          }}
        />
        <div className="sider-help">
          <MessageOutlined />
          <div>
            <b>Cần hỗ trợ?</b>
            <small>Đội ngũ luôn sẵn sàng</small>
          </div>
        </div>
      </Sider>
      {mobile && !collapsed && (
        <button
          type="button"
          className="mobile-sider-mask"
          aria-label="Đóng menu"
          onClick={() => setCollapsed(true)}
        />
      )}
      <Layout>
        <Header className="app-header">
          <div className="header-page-name">
            <Button
              className="collapse-btn"
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <h1>{currentTitle}</h1>
          </div>
          <Space size="middle" className="header-actions">
            <LanguageSwitcher />
            <Badge dot>
              <Button type="text" shape="circle" icon={<BellOutlined />} />
            </Badge>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: 'Hồ sơ',
                    onClick: () => router.push('/dashboard/profile'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    danger: true,
                    label: 'Đăng xuất',
                    onClick: logout,
                  },
                ],
              }}
            >
              <Space className="user-menu">
                <Avatar
                  className="user-avatar"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(String(user?.username || 'User'))}`}
                  alt={`Ảnh đại diện ${String(user?.username || 'tài khoản')}`}
                >
                  {String(user?.username || 'U')
                    .slice(0, 1)
                    .toUpperCase()}
                </Avatar>
                <div className="user-copy">
                  <Typography.Text strong>
                    {user?.username || 'Tài khoản'}
                  </Typography.Text>
                  <small>Thành viên</small>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">{children}</Content>
        <Modal
          className="system-notice-modal"
          open={noticeOpen}
          onCancel={() => setNoticeOpen(false)}
          title={
            <span className="system-notice-title">
              <i>
                <BellOutlined />
              </i>
              Thông Báo Hệ Thống
            </span>
          }
          footer={
            <div className="system-notice-actions">
              <Button icon={<ClockCircleOutlined />} onClick={hideNotice}>
                Tạm ẩn 2 giờ
              </Button>
              <Button type="primary" onClick={() => setNoticeOpen(false)}>
                Đóng
              </Button>
            </div>
          }
          centered
          width={500}
        >
          <SafeHtml
            className="system-notice-content"
            html={site.notification}
          />
        </Modal>
      </Layout>
    </Layout>
  );
}
