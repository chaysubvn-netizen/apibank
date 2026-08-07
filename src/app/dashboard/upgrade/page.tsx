/* eslint-disable @next/next/no-img-element */
'use client';
import {
  BankOutlined,
  CheckCircleFilled,
  CrownFilled,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Checkbox,
  Divider,
  Modal,
  Skeleton,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
type Package = {
  id: number;
  name: string;
  price: number;
  discounted_price: number;
  vip_discount: number;
  description?: string;
  limit_accounts: number;
  limit_transactions: number;
  allowed_banks: string[];
};
type Duration = { months: number; rate: number; discount: number };
type Current = {
  package: Package | null;
  expires_at: string | null;
  active: boolean;
  balance: number;
};
const defaultBanks = [
  'acb',
  'viettin',
  'vietcombank',
  'viettel',
  'mbbank',
  'bidv',
  'thesieure',
  'techcombank',
  'seabank',
  'tpbank',
  'binance',
  'paypal',
  'zalopay',
  'trc20',
  'bep20',
];
const logos: Record<string, string> = {
  acb: '/banks/acb.svg',
  viettin: '/banks/vietinbank.svg',
  vcb: '/banks/vietcombank.svg',
  vietcombank: '/banks/vietcombank.svg',
  viettel: '/banks/viettelpay.svg',
  mbbank: '/banks/mbbank.svg',
  bidv: '/banks/bidv.svg',
  thesieure: '/banks/thesieure.svg',
  techcombank: '/banks/techcombank.jpg',
  seabank: '/banks/seabank.png',
  tpbank: '/banks/tpbank.png',
  ocb: '/banks/ocb.png',
  vpbank: '/banks/vpbank.jpg',
  binance: '/banks/binace.png',
  paypal: 'https://www.paypalobjects.com/webstatic/icon/pp258.png',
  zalopay:
    'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png',
  trc20: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  bep20: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
};
const durationLabel = (m: number) =>
  m === 12 ? '1 Năm' : m === 24 ? '2 Năm' : `${m} Tháng`;
export default function PackagesPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<Package[]>([]),
    [durations, setDurations] = useState<Duration[]>([]),
    [current, setCurrent] = useState<Current>(),
    [selected, setSelected] = useState<Package>(),
    [months, setMonths] = useState(1),
    [accepted, setAccepted] = useState(true),
    [loading, setLoading] = useState(true),
    [paying, setPaying] = useState(false);
  const load = () =>
    Promise.all([
      api<{ data: Package[]; durations: Duration[] }>('/packages'),
      api<Current>('/subscription'),
    ])
      .then(([p, c]) => {
        setItems(p.data);
        setDurations(p.durations);
        setCurrent(c);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const duration = durations.find((d) => d.months === months) ?? {
    months: 1,
    rate: 1,
    discount: 0,
  };
  const total = selected
    ? Math.round(selected.discounted_price * duration.rate * months)
    : 0;
  const open = (p: Package) => {
    setSelected(p);
    setMonths(1);
    setAccepted(true);
  };
  const pay = async () => {
    if (!selected || !accepted) return;
    setPaying(true);
    try {
      const r = await api<{
        message: string;
        data: { expires_at: string; balance: number };
      }>('/subscription/purchase', {
        method: 'POST',
        body: JSON.stringify({
          package_id: selected.id,
          months,
          accepted_terms: accepted,
        }),
      });
      message.success(r.message);
      setSelected(undefined);
      await load();
    } finally {
      setPaying(false);
    }
  };
  if (loading) return <Skeleton active paragraph={{ rows: 16 }} />;
  return (
    <div className="packages-page">
      <div className="page-title">
        <h1>Gia hạn API</h1>
        <p>Chọn gói và thời hạn phù hợp với quy mô vận hành của bạn.</p>
      </div>
      <div className="pricing-grid">
        {items.map((p, i) => {
          const banks = p.allowed_banks?.length
            ? p.allowed_banks
            : defaultBanks;
          return (
            <Card
              key={p.id}
              className={`pricing-card ${i === 1 ? 'popular' : ''}`}
              variant="borderless"
            >
              {i === 1 && <div className="popular-ribbon">PHỔ BIẾN</div>}
              <div className="pricing-header">
                <h2>{p.name}</h2>
                {p.vip_discount > 0 && <del>{formatMoney(p.price)}</del>}
                <div className="pricing-price">
                  {formatMoney(p.discounted_price)} <small>/ 1 tháng</small>
                </div>
                {p.vip_discount > 0 && (
                  <Tag color="success">
                    <CrownFilled /> VIP giảm {p.vip_discount}%
                  </Tag>
                )}
                <span className="support-label">
                  <BankOutlined /> CỔNG BANK HỖ TRỢ
                </span>
              </div>
              <div className="pricing-body">
                <div className="package-bank-icons">
                  {banks.slice(0, 10).map((code) => (
                    <span key={code} title={code.toUpperCase()}>
                      {logos[code] ? (
                        <img src={logos[code]} alt={code} />
                      ) : (
                        code.slice(0, 2).toUpperCase()
                      )}
                    </span>
                  ))}
                  {banks.length > 10 && <span>+{banks.length - 10}</span>}
                </div>
                <div className="package-limits">
                  <b>Giới hạn {p.limit_accounts} tài khoản/ngân hàng</b>
                  <b>
                    {Number(p.limit_transactions) === -1
                      ? 'Không giới hạn giao dịch/tháng'
                      : `${Number(p.limit_transactions).toLocaleString('vi-VN')} giao dịch/tháng`}
                  </b>
                  {p.description && <p>{p.description}</p>}
                </div>
                <ul>
                  <li>
                    <CheckCircleFilled /> Hỗ trợ Webhook, API
                  </li>
                  <li>
                    <CheckCircleFilled /> Thông báo biến động số dư
                  </li>
                  <li>
                    <CheckCircleFilled /> Tất cả tính năng trên API
                  </li>
                </ul>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => open(p)}
                >
                  Chọn gói
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal
        className="renew-modal"
        width={560}
        open={!!selected}
        title={selected?.name}
        onCancel={() => setSelected(undefined)}
        footer={null}
        destroyOnHidden
      >
        {selected && (
          <>
            <p className="modal-package-desc">
              Giới hạn {selected.limit_accounts} tài khoản/ngân hàng
              <br />
              {Number(selected.limit_transactions) === -1
                ? 'Không giới hạn giao dịch'
                : `${selected.limit_transactions} giao dịch/tháng`}
            </p>
            <b className="field-caption">CHỌN THỜI HẠN</b>
            <div className="duration-grid">
              {durations.map((d) => (
                <button
                  key={d.months}
                  className={months === d.months ? 'active' : ''}
                  onClick={() => setMonths(d.months)}
                >
                  <b>{durationLabel(d.months)}</b>
                  <span>
                    {formatMoney(
                      Math.round(selected.discounted_price * d.rate)
                    )}
                    /tháng
                  </span>
                  {d.discount > 0 && <em>Giảm {d.discount}%</em>}
                </button>
              ))}
            </div>
            <div className="renew-summary">
              <span>
                Gói đã chọn <b>{selected.name}</b>
              </span>
              <span>
                Thời hạn <b>{durationLabel(months)}</b>
              </span>
              {selected.vip_discount > 0 && (
                <span>
                  Ưu đãi VIP <b>-{selected.vip_discount}%</b>
                </span>
              )}
              {duration.discount > 0 && (
                <span>
                  Ưu đãi thời hạn <b>-{duration.discount}%</b>
                </span>
              )}
              <Divider />
              <span className="total">
                Tổng thanh toán <strong>{formatMoney(total)}</strong>
              </span>
              <span>
                Số dư sau thanh toán{' '}
                <b
                  className={
                    (current?.balance ?? 0) < total ? 'insufficient' : ''
                  }
                >
                  {formatMoney((current?.balance ?? 0) - total)}
                </b>
              </span>
            </div>
            <Checkbox
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            >
              Tôi đồng ý với chính sách bảo mật và điều khoản sử dụng API.
            </Checkbox>
            {(current?.balance ?? 0) < total && (
              <div className="balance-warning">
                Số dư không đủ. Vui lòng nạp thêm{' '}
                {formatMoney(total - (current?.balance ?? 0))}.
              </div>
            )}
            <Button
              className="confirm-renew"
              type="primary"
              size="large"
              block
              icon={<SafetyCertificateOutlined />}
              disabled={!accepted || (current?.balance ?? 0) < total}
              loading={paying}
              onClick={pay}
            >
              Xác nhận thanh toán
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
