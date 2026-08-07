import Link from 'next/link';
import { getSiteConfig } from '@/lib/seo';

type Package = {
  id: number;
  name: string;
  price: number;
  limit_accounts: number;
  limit_transactions: number;
  allowed_banks: string[];
  description?: string;
  images: string[];
};
const publicApiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/next.php',
  apiUrl = process.env.INTERNAL_API_URL || publicApiUrl,
  apiOrigin = new URL(publicApiUrl, 'http://localhost').origin;
const money = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ';
const imageUrl = (src: string) =>
  /^https?:\/\//.test(src)
    ? src
    : `${apiOrigin}${src.startsWith('/') ? '' : '/'}${src}`;
async function getPackages(): Promise<Package[]> {
  try {
    const response = await fetch(
      `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=public/packages`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!response.ok) return [];
    const payload = await response.json();
    const data = payload?.status === 'success' ? payload.data : payload;
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];
  } catch {
    return [];
  }
}
const features = [
  [
    'API',
    'API Bank đa nền tảng',
    'Kết nối nhiều cổng ngân hàng và đồng bộ giao dịch theo thời gian thực.',
  ],
  [
    '↗',
    'Webhooks thông minh',
    'Nhận giao dịch tức thì qua HTTP Webhook, hỗ trợ kiểm tra callback.',
  ],
  [
    'TG',
    'Thông báo Telegram',
    'Nhận thông báo biến động số dư qua Telegram Bot mọi lúc, mọi nơi.',
  ],
  [
    '✓',
    'eCaptcha tiên tiến',
    'Tự động giải captcha ngân hàng, hỗ trợ quy trình đồng bộ ổn định.',
  ],
  [
    '#',
    'Thống kê chi tiết',
    'Theo dõi dòng tiền, lịch sử giao dịch và hiệu suất trong một màn hình.',
  ],
  [
    '</>',
    'API và tài liệu',
    'Tài liệu nhiều phiên bản, endpoint rõ ràng và triển khai nhanh chóng.',
  ],
];
const banks = [
  ['ACB', '/banks/acb.svg'],
  ['OCB', '/banks/ocb.png'],
  ['VPBank', '/banks/vpbank.jpg'],
  ['VietinBank', '/banks/vietinbank.svg'],
  ['Vietcombank', '/banks/vietcombank.svg'],
  ['Viettel Money', '/banks/viettelpay.svg'],
  ['MBBank', '/banks/mbbank.svg'],
  ['BIDV', '/banks/bidv.svg'],
  ['TheSieuRe', '/banks/thesieure.svg'],
  ['Techcombank', '/banks/techcombank.jpg'],
  ['SeABank', '/banks/seabank.png'],
  ['TPBank', '/banks/tpbank.png'],
  ['Binance Pay', '/banks/binace.png'],
] as const;
export default async function Home() {
  const [site, packages] = await Promise.all([getSiteConfig(), getPackages()]);
  const brand = (
    <Link
      className="landing-brand"
      href="/"
      aria-label={`${site.name} - Trang chủ`}
    >
      {site.logo ? (
        <img src={site.logo} alt={`Logo ${site.name}`} />
      ) : (
        <span>A</span>
      )}
      <strong>{site.name}</strong>
    </Link>
  );
  return (
    <main className="landing-page">
      <div className="landing-announcement" role="status">
        Hệ Thống Giải Pháp Cổng Thanh Toán Tự Động STC. Cung Cấp Giải Pháp Thanh
        Toán Cá Nhân
      </div>
      <header className="landing-header">
        {brand}
        <nav aria-label="Điều hướng chính">
          <a href="#tinh-nang">Tính năng</a>
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#bang-gia">Bảng giá</a>
        </nav>
        <div className="landing-auth">
          <Link className="landing-login" href="/login">
            Đăng nhập
          </Link>
          <Link className="landing-primary small" href="/register">
            Đăng ký miễn phí
          </Link>
        </div>
      </header>
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="landing-pill">
            NỀN TẢNG API NGÂN HÀNG CHO DOANH NGHIỆP
          </span>
          <h1>Tự động hóa giao dịch ngân hàng trong một API duy nhất</h1>
          <p>
            Kết nối tài khoản ngân hàng, đồng bộ giao dịch và nhận Webhook theo
            thời gian thực. Triển khai nhanh, quản lý tập trung và bảo mật.
          </p>
          <div className="landing-cta">
            <Link className="landing-primary" href="/register">
              Bắt đầu miễn phí <span>→</span>
            </Link>
            <Link className="landing-secondary" href="/login">
              Vào không gian làm việc
            </Link>
          </div>
          <div className="landing-trust">
            <span>✓ Tích hợp nhanh</span>
            <span>✓ Webhook tự động</span>
            <span>✓ Quản lý tập trung</span>
          </div>
        </div>
        <div className="hero-console">
          <div className="console-head">
            <span />
            <span />
            <span />
            <b>api/transactions</b>
          </div>
          <pre>{`{
  "status": "success",
  "bank": "ACB",
  "transaction": {
    "type": "IN",
    "amount": 500000
  }
}`}</pre>
          <div className="console-status">
            <span>● API đang hoạt động</span>
            <b>200 OK</b>
          </div>
        </div>
      </section>
      <section className="landing-banks">
        <p>Kết nối đầy đủ các cổng ngân hàng phổ biến</p>
        <div>
          {banks.map(([name, image]) => (
            <article key={name}>
              <img src={image} alt={`Logo ${name}`} loading="lazy" />
              <span>{name}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-features" id="tinh-nang">
        <Heading
          label="TÍNH NĂNG"
          title="Mọi công cụ bạn cần"
          text="Xây dựng hệ thống thanh toán chuyên nghiệp với bộ công cụ mạnh mẽ và dễ tích hợp."
        />
        <div className="feature-grid">
          {features.map(([icon, title, text]) => (
            <article key={title}>
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-steps" id="cach-hoat-dong">
        <Heading
          label="CÁCH HOẠT ĐỘNG"
          title="Triển khai chỉ trong 5 phút"
          text="Ba bước đơn giản để bắt đầu sử dụng hệ thống."
        />
        <div className="step-grid">
          {[
            [
              '1',
              'Đăng ký tài khoản',
              'Tạo tài khoản miễn phí và lựa chọn gói phù hợp.',
            ],
            [
              '2',
              'Liên kết ngân hàng',
              'Thêm tài khoản ngân hàng và xác thực kết nối.',
            ],
            [
              '3',
              'Kết nối và tự động',
              'Cấu hình Webhook để nhận giao dịch thời gian thực.',
            ],
          ].map(([number, title, text]) => (
            <article key={number}>
              <b>{number}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-pricing" id="bang-gia">
        <Heading
          label="BẢNG GIÁ"
          title="Gói dịch vụ linh hoạt"
          text="Chọn gói phù hợp với nhu cầu và quy mô doanh nghiệp của bạn."
        />
        {packages.length ? (
          <div className="pricing-grid">
            {packages.map((pkg, index) => (
              <article className={index === 1 ? 'featured' : ''} key={pkg.id}>
                {index === 1 && <em>PHỔ BIẾN</em>}
                {pkg.images?.[0] && (
                  <img
                    className="package-image"
                    src={imageUrl(pkg.images[0])}
                    alt={`Ảnh gói ${pkg.name}`}
                  />
                )}
                <h3>{pkg.name}</h3>
                <div className="package-price">
                  <strong>{money(pkg.price)}</strong>
                  <span>/ 1 tháng</span>
                </div>
                <p>
                  {pkg.description ||
                    'Gói API ngân hàng dành cho hệ thống thanh toán tự động.'}
                </p>
                <ul>
                  <li>✓ Giới hạn {pkg.limit_accounts} tài khoản ngân hàng</li>
                  <li>
                    ✓{' '}
                    {pkg.limit_transactions === -1
                      ? 'Không giới hạn'
                      : new Intl.NumberFormat('vi-VN').format(
                          pkg.limit_transactions
                        )}{' '}
                    giao dịch/tháng
                  </li>
                  <li>✓ Webhook thời gian thực</li>
                  <li>✓ Thông báo Telegram</li>
                </ul>
                <Link href="/register">Chọn gói này</Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="pricing-empty">Chưa có gói dịch vụ hiển thị.</p>
        )}
      </section>
      <section className="landing-integration">
        <div>
          <span>TÍCH HỢP NHANH</span>
          <h2>Sẵn sàng kết nối hệ thống?</h2>
          <p>Tạo tài khoản, lấy API Token và bắt đầu nhận dữ liệu giao dịch.</p>
        </div>
        <Link className="landing-primary" href="/register">
          Tạo tài khoản ngay →
        </Link>
      </section>
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-about">
            {brand}
            <p>
              {site.description ||
                'Giải pháp kết nối ngân hàng và tự động hóa quy trình thanh toán.'}
            </p>
          </div>
          <Footer
            title="Sản phẩm"
            links={[
              ['Tính năng', '#tinh-nang'],
              ['Bảng giá', '#bang-gia'],
              ['Tài liệu API', '/dashboard/api-docs'],
            ]}
          />
          <Footer
            title="Hỗ trợ"
            links={[
              ['Điều khoản sử dụng', '/register'],
              ['Chính sách bảo mật', '/register'],
            ]}
          />
          <div className="landing-footer-column landing-footer-contact">
            <h3>Liên hệ</h3>
            {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
            {site.hotline && (
              <a href={`tel:${site.hotline.replace(/\s/g, '')}`}>
                {site.hotline}
              </a>
            )}
          </div>
        </div>
        <div className="landing-footer-bottom">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
function Heading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="section-heading">
      <span>{label}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function Footer({ title, links }: { title: string; links: string[][] }) {
  return (
    <div className="landing-footer-column">
      <h3>{title}</h3>
      {links.map(([label, href]) => (
        <Link key={label} href={href}>
          {label}
        </Link>
      ))}
    </div>
  );
}
