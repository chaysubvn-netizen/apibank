'use client';

import {
  ApiOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Col, Input, Row, Space, Table, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

type Param = {
  name: string;
  type: string;
  description: string;
  required?: boolean;
};
type Endpoint = {
  key: string;
  group: string;
  title: string;
  description: string;
  method?: 'GET' | 'POST' | 'DELETE';
  path?: string;
  legacy?: boolean;
  gateway?: boolean;
  bankCode?: string;
  params?: Param[];
  body?: unknown;
  response?: unknown;
  note?: string;
};
type Profile = { api_token?: string };

const laravelOrigin = (
  process.env.NEXT_PUBLIC_LARAVEL_URL ?? 'https://gateway.spay5s.com'
).replace(/\/$/, '');
const laravelApiUrl = `${laravelOrigin}/api/v1`;
const gatewayUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://gateway.spay5s.com/api/v1/bank';

const banks = [
  ['mbbank', 'MBBank'],
  ['ocb', 'OCB'],
  ['vpbank', 'VPBank'],
  ['acb', 'ACB'],
  ['vietcombank', 'Vietcombank'],
  ['viettel', 'Viettel Money'],
  ['viettin', 'VietinBank'],
  ['bidv', 'BIDV'],
  ['thesieure', 'TheSieuRe'],
  ['techcombank', 'Techcombank'],
  ['seabank', 'SeABank'],
  ['tpbank', 'TPBank'],
  ['binance', 'Binance Pay'],
  ['paypal', 'PayPal'],
  ['trc20', 'TRC20 (USDT)'],
  ['bep20', 'BEP20 (USDT)'],
  ['zalopay', 'ZaloPay'],
] as const;

const legacyAliases: Record<string, Record<string, string>> = {
  V1: {
    vpbank: 'historyapivpbank',
    mbbank: 'historymbbank',
    ocb: 'historyocb',
    acb: 'historyapiacb',
    vietcombank: 'historyapivcb',
    viettel: 'historyapiviettel',
    viettin: 'historyapiviettin',
    bidv: 'historyapibidv',
    thesieure: 'historyapithesieure',
    techcombank: 'historytechcombank',
    seabank: 'historyseabank',
    tpbank: 'historytpbank',
    binance: 'historybinance',
    paypal: 'historypaypal',
    trc20: 'historytrc20',
    bep20: 'historybep20',
    zalopay: 'historyzalopay',
  },
  V2: {
    vpbank: 'historyapivpbankv2',
    mbbank: 'historyapimbbankv2',
    ocb: 'historyapiocbv2',
    acb: 'historyapiacbv2',
    vietcombank: 'historyapivcbv2',
    viettel: 'historyapiviettelv2',
    viettin: 'historyapiviettinv2',
    bidv: 'historyapibidvv2',
    thesieure: 'historyapithesieurev2',
    techcombank: 'historyapitechcombankv2',
    seabank: 'historyapiseabankv2',
    tpbank: 'historyapitpbankv2',
    binance: 'historybinancev2',
    paypal: 'historypaypalv2',
    trc20: 'historytrc20v2',
    bep20: 'historybep20v2',
    zalopay: 'historyzalopayv2',
  },
  V3: {
    vpbank: 'historyapivpbankv3',
    mbbank: 'historyapimbbankv3',
    ocb: 'historyapiocbv3',
    acb: 'historyapiacbv3',
    vietcombank: 'historyapivcbv3',
    viettel: 'historyapiviettelv3',
    viettin: 'historyapiviettinv3',
    bidv: 'historyapibidvv3',
    thesieure: 'historyapithesieurev3',
    techcombank: 'historyapitechcombankv3',
    seabank: 'historyapiseabankv3',
    tpbank: 'historyapitpbankv3',
    binance: 'historybinancev3',
    paypal: 'historypaypalv3',
    trc20: 'historytrc20v3',
    bep20: 'historybep20v3',
    zalopay: 'historyzalopayv3',
  },
};
const commonParams: Param[] = [
  {
    name: 'token',
    type: 'string',
    description: 'Token PRIVATE của tài khoản ngân hàng',
    required: true,
  },
  {
    name: 'limit',
    type: 'integer',
    description: 'Số giao dịch cần lấy, từ 1 đến 100',
  },
];

function versionEndpoints(version: 'V1' | 'V2' | 'V3'): Endpoint[] {
  const slug = version.toLowerCase();
  const intro: Endpoint = {
    key: 'intro',
    group: 'Tổng quan',
    title: `Giới thiệu API ${version}`,
    description:
      version === 'V1'
        ? 'API V1 trả dữ liệu lịch sử gần với cấu trúc lưu trữ gốc của từng cổng thanh toán.'
        : version === 'V2'
          ? 'API V2 chuẩn hóa giao dịch của mọi ngân hàng về cùng cấu trúc transactions để tích hợp đơn giản hơn.'
          : 'API V3 dùng cấu trúc chuẩn hóa, bổ sung meta và thông tin phân trang/phiên bản cho hệ thống mới.',
    response:
      version === 'V1'
        ? {
            status: 'success',
            bank: 'ACB',
            data: [
              {
                transaction_id: 'TX123',
                type: 'IN',
                amount: '100000',
                description: 'Chuyển khoản',
                created_at: '2026-07-29 10:30:00',
              },
            ],
          }
        : version === 'V2'
          ? {
              status: 'success',
              message: 'Thành công',
              transactions: [
                {
                  transactionID: 'TX123',
                  amount: 100000,
                  description: 'Chuyển khoản',
                  transactionDate: '2026-07-29 10:30:00',
                  type: 'IN',
                },
              ],
            }
          : {
              status: 'success',
              message: 'Thành công',
              transactions: [
                {
                  transactionID: 'TX123',
                  amount: 100000,
                  description: 'Chuyển khoản',
                  transactionDate: '2026-07-29 10:30:00',
                  type: 'IN',
                },
              ],
              meta: { bank: 'ACB', count: 1, limit: 20, version: 'v3' },
            },
  };
  const auth: Endpoint = {
    key: 'auth',
    group: 'Tổng quan',
    title: 'Xác thực',
    description:
      'Endpoint được bảo vệ bởi  Sanctum. Gửi access token trong Authorization header.',
    note: 'Authorization: Bearer {ACCESS_TOKEN}. Không đặt token trong mã nguồn công khai.',
  };
  return [
    intro,
    auth,
    ...banks.map(([code, name]) => ({
      key: `${slug}-${code}`,
      group: `Endpoints ${version}`,
      title: `Lịch sử giao dịch ${name} ${version}`,
      description: `Lấy các giao dịch mới nhất của cổng ${name}, sắp xếp mới nhất ở đầu.`,
      method: 'GET' as const,
      path: `/${legacyAliases[version][code]}/{token}`,
      legacy: true,
      bankCode: code,
      params: commonParams,
      response: intro.response,
    })),
  ];
}

const generalEndpoints: Endpoint[] = [
  {
    key: 'intro',
    group: 'Bắt đầu',
    title: 'Giới thiệu API ',
    description:
      'API quản trị tài khoản, ngân hàng, giao dịch và Cron Job của hệ thống .',
    response: { status: 'success', message: 'Kết nối APIBANK thành công' },
  },
  {
    key: 'auth',
    group: 'Bắt đầu',
    title: 'Xác thực API',
    description: 'Mọi yêu cầu cần access token  Sanctum.',
    note: 'Sử dụng header Authorization: Bearer {ACCESS_TOKEN}.',
  },
  {
    key: 'banks',
    group: 'Ngân hàng',
    title: 'Danh sách tài khoản ngân hàng',
    description: 'Lấy các tài khoản ngân hàng đã liên kết.',
    method: 'GET',
    path: '/bank-accounts',
  },
  {
    key: 'transactions',
    group: 'Giao dịch',
    title: 'Danh sách giao dịch',
    description:
      'Lấy giao dịch mới nhất, hỗ trợ lọc ngân hàng và loại giao dịch.',
    method: 'GET',
    path: '/transactions',
    params: [
      { name: 'bank_code', type: 'string', description: 'Mã ngân hàng' },
      { name: 'type', type: 'IN | OUT', description: 'Loại giao dịch' },
      {
        name: 'per_page',
        type: 'integer',
        description: 'Số bản ghi mỗi trang',
      },
    ],
  },
  {
    key: 'profile',
    group: 'Tài khoản',
    title: 'Thông tin tài khoản',
    description: 'Lấy hồ sơ người dùng đang đăng nhập.',
    method: 'GET',
    path: '/profile',
  },
  {
    key: 'cron',
    group: 'Cron Job',
    title: 'Danh sách Cron Job',
    description: 'Lấy danh sách Cron Job đã thuê.',
    method: 'GET',
    path: '/cron/jobs',
  },
  {
    key: 'invoice-create',
    group: 'Invoice USDT',
    title: 'Tạo hóa đơn thanh toán',
    description:
      'Tạo invoice USDT TRC20 và nhận đường dẫn giao diện thanh toán để chuyển khách hàng tới.',
    method: 'POST',
    path: '?action=merchant/invoices',
    gateway: true,
    note: 'merchant_id và api_key chỉ được gửi từ backend của cửa hàng. Không để API Key trong JavaScript phía trình duyệt.',
    params: [
      {
        name: 'merchant_id',
        type: 'string',
        description: 'Merchant ID của cửa hàng',
        required: true,
      },
      {
        name: 'api_key',
        type: 'string',
        description: 'API Key bí mật của cửa hàng',
        required: true,
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Số USDT gốc của đơn hàng',
        required: true,
      },
      {
        name: 'name',
        type: 'string',
        description: 'Tên hiển thị trên trang thanh toán',
      },
      { name: 'description', type: 'string', description: 'Mô tả đơn hàng' },
      {
        name: 'request_id',
        type: 'string',
        description: 'Mã đơn hàng duy nhất phía cửa hàng',
        required: true,
      },
      {
        name: 'callback_url',
        type: 'URL',
        description: 'Webhook nhận kết quả thanh toán',
      },
      {
        name: 'success_url',
        type: 'URL',
        description: 'Trang chuyển về khi thành công',
      },
      {
        name: 'cancel_url',
        type: 'URL',
        description: 'Trang chuyển về khi hết hạn/hủy',
      },
    ],
    body: {
      merchant_id: 'YOUR_MERCHANT_ID',
      api_key: 'YOUR_API_KEY',
      amount: 10,
      name: 'Thanh toán đơn hàng',
      description: 'Đơn hàng #DH1001',
      request_id: 'DH1001',
      callback_url: 'https://merchant.example/webhooks/apibank',
      success_url: 'https://merchant.example/payment/success',
      cancel_url: 'https://merchant.example/payment/cancel',
    },
    response: {
      status: 'success',
      data: {
        trans_id: 'TX8952C4C5EF7CCDF2',
        request_id: 'DH1001',
        amount: '10.1234',
        status: 'waiting',
        url_payment: 'https://spay5s.com/payment/TX8952C4C5EF7CCDF2',
        expires_at: '2026-08-06T01:59:23+07:00',
      },
    },
  },
  {
    key: 'invoice-status',
    group: 'Invoice USDT',
    title: 'Kiểm tra trạng thái Invoice',
    description:
      'Chủ động kiểm tra trạng thái hóa đơn bằng thông tin merchant và trans_id.',
    method: 'POST',
    path: '?action=merchant/invoices/status',
    gateway: true,
    params: [
      {
        name: 'merchant_id',
        type: 'string',
        description: 'Merchant ID của cửa hàng',
        required: true,
      },
      {
        name: 'api_key',
        type: 'string',
        description: 'API Key bí mật',
        required: true,
      },
      {
        name: 'trans_id',
        type: 'string',
        description: 'Mã giao dịch nhận khi tạo invoice',
        required: true,
      },
    ],
    body: {
      merchant_id: 'YOUR_MERCHANT_ID',
      api_key: 'YOUR_API_KEY',
      trans_id: 'TX8952C4C5EF7CCDF2',
    },
    response: {
      status: 'success',
      data: {
        trans_id: 'TX8952C4C5EF7CCDF2',
        request_id: 'DH1001',
        amount: '10.1234',
        network: 'Tron (TRC20)',
        receiver_address: 'T...',
        blockchain_tx: null,
        status: 'waiting',
        expires_at: '2026-08-06 01:59:23',
      },
    },
  },
  {
    key: 'invoice-payment',
    group: 'Invoice USDT',
    title: 'Giao diện thanh toán',
    description:
      'Chuyển trình duyệt khách hàng đến url_payment nhận từ API tạo invoice. Trang hiển thị QR, số tiền chính xác và tự cập nhật mỗi 5 giây.',
    note: 'Đây là giao diện Next.js, không gọi từ backend. Luôn chuyển khách đến nguyên giá trị data.url_payment mà API trả về.',
    response: {
      flow: [
        'Khách mở url_payment',
        'Quét QR và gửi đúng USDT TRC20',
        'Hệ thống xác nhận giao dịch',
        'Chuyển về success_url',
      ],
    },
  },
  {
    key: 'invoice-callback',
    group: 'Invoice USDT',
    title: 'Webhook xác nhận thanh toán',
    description:
      'Khi giao dịch hoàn tất, APIBANK gửi HTTP POST JSON đến callback_url của cửa hàng.',
    note: 'Kiểm tra header X-APIBANK-Signature bằng HMAC-SHA256 của raw JSON body với API Key. Xử lý idempotent theo trans_id hoặc request_id.',
    response: {
      trans_id: 'TX8952C4C5EF7CCDF2',
      request_id: 'DH1001',
      amount: '10.1234',
      received: '10.1234',
      status: 'completed',
      network: 'TRON',
      transaction_id: 'BLOCKCHAIN_TX_HASH',
      from_address: 'T...',
      to_address: 'T...',
      confirmed_at: '2026-08-06 01:35:00',
    },
  },
];

export function ApiDocsPage({ version = 'Tổng hợp' }: { version?: string }) {
  const { message } = App.useApp();
  const [active, setActive] = useState('intro');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const endpoints = useMemo(
    () =>
      version === 'V1' || version === 'V2' || version === 'V3'
        ? versionEndpoints(version)
        : generalEndpoints,
    [version]
  );
  useEffect(() => {
    api<Profile>('/profile')
      .then((r) => setToken(r.api_token || ''))
      .catch(() => setToken(''));
  }, []);
  const endpoint = endpoints.find((e) => e.key === active) ?? endpoints[0];
  const groups = Array.from(new Set(endpoints.map((e) => e.group)));
  const url = endpoint.path
    ? (endpoint.gateway
        ? gatewayUrl
        : endpoint.legacy
          ? laravelOrigin
          : laravelApiUrl) + endpoint.path
    : '';
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    message.success('Đã sao chép!');
  };
  const requestUrl = endpoint.legacy
    ? url.replace('{token}', '{BANK_TOKEN}')
    : url;
  const curl =
    endpoint.method && url
      ? `curl --request ${endpoint.method} '${requestUrl}' \
  --header 'Accept: application/json'${
    endpoint.body
      ? ` \
  --header 'Content-Type: application/json' \
  --data '${JSON.stringify(endpoint.body)}'`
      : endpoint.legacy || endpoint.gateway
        ? ''
        : ` \
  --header 'Authorization: Bearer ${token || '{ACCESS_TOKEN}'}'`
  }`
      : '';
  const isVersioned = version === 'V1' || version === 'V2' || version === 'V3';
  const bankLogos: Record<string, string> = {
    acb: '/banks/acb.svg',
    bidv: '/banks/bidv.svg',
    binance: '/banks/binace.png',
    mbbank: '/banks/mbbank.svg',
    ocb: '/banks/ocb.png',
    vpbank: '/banks/vpbank.jpg',
    seabank: '/banks/seabank.png',
    techcombank: '/banks/techcombank.jpg',
    thesieure: '/banks/thesieure.svg',
    tpbank: '/banks/tpbank.png',
    vietcombank: '/banks/vietcombank.svg',
    viettin: '/banks/vietinbank.svg',
    viettel: '/banks/viettelpay.svg',
  };
  const endpointIcon =
    endpoint.bankCode && bankLogos[endpoint.bankCode] ? (
      <Image
        src={bankLogos[endpoint.bankCode]}
        width={36}
        height={36}
        alt={endpoint.title}
      />
    ) : (
      <ApiOutlined />
    );
  return (
    <div
      className={`api-docs-page ${isVersioned ? `legacy-api-docs docs-${version.toLowerCase()}` : ''}`}
    >
      <div className="api-docs-hero">
        <div>
          <span>APIBANK DEVELOPERS</span>
          <h1>Tài liệu tích hợp API {version}</h1>
          <p>
            {version === 'Tổng hợp'
              ? 'Các API quản trị chạy trực tiếp trên Laravel backend.'
              : `Danh sách endpoint ngân hàng và cấu trúc phản hồi riêng của ${version}.`}
          </p>
        </div>
        <Tag color="success" icon={<CheckCircleOutlined />}>
          Tài Liệu API
        </Tag>
      </div>
      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={7} xl={6}>
          <aside className="api-docs-sidebar">
            <div className="docs-search">
              <Input placeholder="Tìm endpoint..." prefix={<ApiOutlined />} />
            </div>
            {groups.map((group) => (
              <div className="docs-nav-group" key={group}>
                <b>{group}</b>
                {endpoints
                  .filter((e) => e.group === group)
                  .map((e) => (
                    <button
                      key={e.key}
                      className={active === e.key ? 'active' : ''}
                      onClick={() => setActive(e.key)}
                    >
                      <span>
                        {e.bankCode && bankLogos[e.bankCode] ? (
                          <Image
                            src={bankLogos[e.bankCode]}
                            width={25}
                            height={25}
                            alt=""
                          />
                        ) : e.key === 'auth' ? (
                          <LockOutlined />
                        ) : (
                          <BankOutlined />
                        )}
                      </span>
                      {e.title}
                      {e.method && (
                        <em className={e.method.toLowerCase()}>{e.method}</em>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </aside>
        </Col>
        <Col xs={24} lg={17} xl={18}>
          <main className="api-docs-content">
            <Card className="docs-auth-card" variant="borderless">
              <div>
                <KeyOutlined />
                <span>
                  <small>ACCESS TOKEN CỦA BẠN</small>
                  <b>
                    {showToken
                      ? token || 'N/A'
                      : '•'.repeat(Math.min(token.length || 24, 40))}
                  </b>
                </span>
              </div>
              <Space>
                <Button
                  icon={showToken ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowToken((v) => !v)}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copy(token)}
                  disabled={!token}
                >
                  Sao chép
                </Button>
              </Space>
            </Card>
            <Card className="docs-section" variant="borderless">
              <div className="docs-section-heading">
                <span>{endpointIcon}</span>
                <div>
                  <small>{endpoint.group}</small>
                  <h2>{endpoint.title}</h2>
                </div>
              </div>
              <p className="docs-description">{endpoint.description}</p>
              {endpoint.note && (
                <div className="docs-note">{endpoint.note}</div>
              )}
              {url && (
                <div className="endpoint-url">
                  <strong className={endpoint.method?.toLowerCase()}>
                    {endpoint.method}
                  </strong>
                  <code>{url}</code>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copy(url)}
                  >
                    Copy
                  </Button>
                </div>
              )}
              {endpoint.params && (
                <div className="docs-block">
                  <h3>{endpoint.body ? 'Request Body' : 'Query Parameters'}</h3>
                  <Table
                    rowKey="name"
                    pagination={false}
                    dataSource={endpoint.params}
                    columns={[
                      {
                        title: 'Tham số',
                        dataIndex: 'name',
                        render: (v, r) => (
                          <code className="param-name">
                            {v}
                            {r.required && <i>*</i>}
                          </code>
                        ),
                      },
                      {
                        title: 'Loại',
                        dataIndex: 'type',
                        render: (v) => <Tag>{v}</Tag>,
                      },
                      { title: 'Mô tả', dataIndex: 'description' },
                    ]}
                  />
                </div>
              )}
              {curl && (
                <div className="docs-block">
                  <div className="block-title">
                    <h3>cURL Request</h3>
                    <Button icon={<CopyOutlined />} onClick={() => copy(curl)}>
                      Copy code
                    </Button>
                  </div>
                  <pre className="api-code request">
                    <code>{curl}</code>
                  </pre>
                </div>
              )}
              {endpoint.response !== undefined && (
                <div className="docs-block">
                  <div className="block-title">
                    <h3>
                      {endpoint.key === 'invoice-callback'
                        ? 'JSON Callback'
                        : 'JSON Response'}
                    </h3>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copy(JSON.stringify(endpoint.response, null, 2))
                      }
                    >
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="api-code response">
                    <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                  </pre>
                </div>
              )}
            </Card>
          </main>
        </Col>
      </Row>
    </div>
  );
}
