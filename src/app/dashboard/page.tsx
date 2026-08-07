'use client';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CrownFilled,
  CreditCardOutlined,
  DollarOutlined,
  DownOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  LineChartOutlined,
  SafetyCertificateFilled,
  StarFilled,
  WalletFilled,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Skeleton,
  Tag,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
import SafeHtml from '@/components/safe-html';
type Tier = { level: number; name: string; minimum: number; discount: number };
type Log = {
  id: number;
  action: string;
  ip: string;
  device: string;
  create_date: string;
};
type Overview = {
  finance: {
    balance: number;
    total_deposit: number;
    used: number;
    package: string;
  };
  vip: { current: Tier; next?: Tier; progress: number; remaining: number };
  vip_tiers: Tier[];
  subscription: {
    package?: string;
    active: boolean;
    expires_at?: string;
    allowed_banks: string[];
  };
  activity: Log[];
  bank_counts: Record<string, number>;
  notifications: Array<{
    id: number;
    title: string;
    content: string;
    create_date: string;
  }>;
};
const banks = [
  ['acb', 'ACB', '/banks/acb.svg'],
  ['ocb', 'OCB', '/banks/ocb.png'],
  ['vpbank', 'VPBank', '/banks/vpbank.jpg'],
  ['viettin', 'VietinBank', '/banks/vietinbank.svg'],
  ['vietcombank', 'Vietcombank', '/banks/vietcombank.svg'],
  ['viettel', 'ViettelPay', '/banks/viettelpay.svg'],
  ['mbbank', 'MBBank', '/banks/mbbank.svg'],
  ['bidv', 'BIDV', '/banks/bidv.svg'],
  ['thesieure', 'TheSieuRe', '/banks/thesieure.svg'],
  ['techcombank', 'Techcombank', '/banks/techcombank.jpg'],
  ['seabank', 'SeABank', '/banks/seabank.png'],
  ['tpbank', 'TPBank', '/banks/tpbank.png'],
  ['binance', 'Binance', '/banks/binace.png'],
  [
    'paypal',
    'PayPal',
    'https://www.paypalobjects.com/webstatic/icon/pp258.png',
  ],
  [
    'zalopay',
    'ZaloPay',
    'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png',
  ],
  [
    'trc20',
    'TRC20 (USDT)',
    'https://cryptologos.cc/logos/tether-usdt-logo.png',
  ],
  ['bep20', 'BEP20 (USDT)', 'https://cryptologos.cc/logos/bnb-bnb-logo.png'],
] as const;
const tones = ['blue', 'purple', 'cyan', 'orange'];
export default function DashboardPage() {
  const router = useRouter(),
    [data, setData] = useState<Overview>(),
    [showTiers, setShowTiers] = useState(false);
  useEffect(() => {
    api<Overview>('/overview').then(setData);
  }, []);
  if (!data) return <Skeleton active paragraph={{ rows: 16 }} />;
  const metrics = [
    [
      'SỐ DƯ HIỆN TẠI',
      formatMoney(data.finance.balance),
      <WalletFilled key="balance" />,
    ],
    [
      'TỔNG NẠP',
      formatMoney(data.finance.total_deposit),
      <CreditCardOutlined key="deposit" />,
    ],
    [
      'ĐÃ SỬ DỤNG',
      formatMoney(data.finance.used),
      <SafetyCertificateFilled key="used" />,
    ],
    ['GÓI', data.finance.package, <StarFilled key="package" />],
  ];
  return (
    <div className="legacy-dashboard">
      <div className="dashboard-hero">
        <div>
          <span className="hero-eyebrow">APIBANK WORKSPACE</span>
          <h1>Tổng quan tài chính</h1>
          <p>
            Theo dõi số dư, dịch vụ API và toàn bộ cổng thanh toán trong một
            nơi.
          </p>
        </div>
        <div className="hero-actions">
          <Button
            size="large"
            onClick={() => router.push('/dashboard/invoices')}
          >
            Nạp tiền
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push('/dashboard/upgrade')}
          >
            Gia hạn API <ArrowRightOutlined />
          </Button>
        </div>
      </div>
      <Row className="metric-row" gutter={[20, 18]}>
        {metrics.map((m, i) => (
          <Col xs={24} sm={12} xl={6} key={String(m[0])}>
            <Card
              className={`legacy-metric tone-${tones[i]}`}
              variant="borderless"
            >
              <div>
                <small>{m[0]}</small>
                <b>{m[1]}</b>
              </div>
              <span>{m[2]}</span>
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="vip-panel" variant="borderless">
        <div className="vip-main">
          <Avatar
            className={`vip-avatar vip-level-${data.vip.current.level}`}
            icon={<CrownFilled />}
            alt={`Cấp VIP ${data.vip.current.name}`}
          />
          <div className="vip-name">
            <b>{data.vip.current.name}</b>
            <Tag color="success">Giảm giá {data.vip.current.discount}%</Tag>
            <small>
              Tổng nạp:{' '}
              <strong>{formatMoney(data.finance.total_deposit)}</strong>
            </small>
          </div>
          <div className="vip-progress">
            <div>
              <span>
                Tiến trình lên {data.vip.next?.name || 'cấp cao nhất'}
              </span>
              <b>{data.vip.progress}%</b>
            </div>
            <Progress
              percent={data.vip.progress}
              showInfo={false}
              strokeColor="#22c55e"
            />
            <p>
              {data.vip.next ? (
                <>
                  Bạn cần nạp thêm <b>{formatMoney(data.vip.remaining)}</b> để
                  thăng hạng <strong>{data.vip.next.name}</strong> và hưởng
                  chiết khấu <strong>{data.vip.next.discount}%</strong> gia hạn
                  API trọn đời!
                </>
              ) : (
                'Bạn đã đạt cấp VIP cao nhất.'
              )}
            </p>
          </div>
        </div>
        <div className="vip-footer" onClick={() => setShowTiers((v) => !v)}>
          <b>
            <CrownFilled /> Chi tiết đặc quyền các cấp độ VIP{' '}
            <DownOutlined className={showTiers ? 'rotated' : ''} />
          </b>
          <a href="/dashboard/upgrade" onClick={(e) => e.stopPropagation()}>
            Xem thêm <ArrowRightOutlined />
          </a>
        </div>
        {showTiers && (
          <div className="vip-tier-grid">
            {data.vip_tiers.map((t) => (
              <div
                key={t.level}
                className={t.level === data.vip.current.level ? 'active' : ''}
              >
                {t.level === data.vip.current.level && <em>Đang đạt</em>}
                <span className={`tier-crown tier-${t.level}`}>
                  <CrownFilled />
                </span>
                <b>{t.name}</b>
                <small>
                  Tổng nạp từ:
                  <br />
                  {formatMoney(t.minimum)}
                </small>
                <strong>Giảm {t.discount}%</strong>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Row gutter={[22, 22]} className="legacy-sections">
        <Col xs={24} xl={12}>
          <Card
            className="legacy-section-card"
            variant="borderless"
            title="Thông Báo Hệ Thống"
          >
            {data.notifications.length ? (
              data.notifications.map((n) => (
                <div className="notice" key={n.id}>
                  <div className="notice-admin">
                    <Avatar
                      src="https://ui-avatars.com/api/?name=ADMIN"
                      alt="Ảnh đại diện quản trị viên"
                    >
                      AD
                    </Avatar>
                    <b>ADMIN</b>
                  </div>
                  <div>
                    <div className="notice-bubble">
                      <b>{n.title}</b>
                      <SafeHtml className="notice-html" html={n.content} />
                    </div>
                    <small>{n.create_date}</small>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Chưa có thông báo nào" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            className="legacy-section-card"
            variant="borderless"
            title="Cổng Bank Online"
          >
            <div className="bank-grid">
              {banks.map(([code, name, image]) => (
                <button
                  className="bank-tile"
                  key={code}
                  onClick={() => router.push(`/dashboard/banks/${code}`)}
                >
                  {data.bank_counts[code] > 0 && (
                    <em>{data.bank_counts[code]}</em>
                  )}
                  <span className="bank-logo">
                    {image ? (
                      <img src={image} alt={name} />
                    ) : (
                      <DollarOutlined />
                    )}
                  </span>
                  <b>{name}</b>
                </button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[22, 22]} className="dashboard-bottom">
        <Col xs={24} xl={17}>
          <Card
            className="activity-card activity-card-dark"
            variant="borderless"
            title={
              <span className="activity-title">
                <HistoryOutlined /> Lịch sử hoạt động
              </span>
            }
          >
            {data.activity.length ? (
              <div className="activity-list">
                {data.activity.map((log) => (
                  <article className="activity-item" key={log.id}>
                    <span className="activity-icon">
                      <LineChartOutlined />
                    </span>
                    <div className="activity-details">
                      <b>{log.action}</b>
                      <span>
                        <ClockCircleOutlined /> {log.create_date}
                      </span>
                      <small>
                        <EnvironmentOutlined /> IP: {log.ip || 'Không xác định'}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty description="Chưa có hoạt động nào" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={7}>
          <Card
            className="service-card"
            variant="borderless"
            title="Gói dịch vụ"
          >
            <div className="service-content">
              <span>
                <StarFilled />
              </span>
              {data.subscription.active ? (
                <>
                  <h3>GÓI {data.subscription.package}</h3>
                  <p>
                    Hạn dùng:{' '}
                    <b>
                      {data.subscription.expires_at
                        ? new Date(
                            data.subscription.expires_at
                          ).toLocaleDateString('vi-VN')
                        : '—'}
                    </b>
                  </p>
                  <Button
                    type="primary"
                    block
                    onClick={() => router.push('/dashboard/upgrade')}
                  >
                    Gia hạn ngay <ArrowRightOutlined />
                  </Button>
                </>
              ) : (
                <>
                  <h3>Chưa có gói dịch vụ</h3>
                  <p>
                    Thuê gói để mở khóa thêm ngân hàng và tính năng nâng cao.
                  </p>
                  <Button
                    type="primary"
                    block
                    onClick={() => router.push('/dashboard/upgrade')}
                  >
                    Xem các gói <ArrowRightOutlined />
                  </Button>
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
