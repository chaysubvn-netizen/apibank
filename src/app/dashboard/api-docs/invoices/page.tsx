'use client';

import {
  ApiOutlined,
  CheckCircleFilled,
  CopyOutlined,
  FileAddOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Table, Tag } from 'antd';
import styles from './invoice-docs.module.css';

const base = (
  process.env.NEXT_PUBLIC_API_PUBLIC_URL || 'https://gateway.spay5s.com/api'
).replace(/\/$/, '');
const endpoints = [
  {
    method: 'POST',
    endpoint: '/auth/deposit/invoices',
    auth: 'bankToken body',
    purpose: 'Tạo invoice local theo kiểu VNPAY payment intent.',
  },
  {
    method: 'POST',
    endpoint: '/deposit/public/invoices/list',
    auth: 'bankToken body',
    purpose: 'Lấy danh sách hóa đơn theo token bank.',
  },
  {
    method: 'POST',
    endpoint: '/deposit/public/invoices/{invoiceCode}/cancel',
    auth: 'cancelToken query hoặc X-RPay-Cancel-Token',
    purpose: 'Hủy invoice pending từ checkout public.',
  },
  {
    method: 'POST',
    endpoint: '/qr/vietqr',
    auth: 'No auth',
    purpose: 'Tạo QR-only payload khi merchant tự quản lý order.',
  },
  {
    method: 'GET',
    endpoint: '/deposit/public/invoices/{invoiceCode}',
    auth: 'No auth',
    purpose: 'Kiểm tra và đồng bộ trạng thái public theo invoiceCode.',
  },
];
const createBody = {
  bankToken: 'BANK_TOKEN',
  amount: 150000,
  orderId: 'ORDER-1001',
  description: 'Thanh toán đơn hàng ORDER-1001',
  callbackUrl: 'https://merchant.example/webhooks/rpay',
  successUrl: 'https://merchant.example/payment/success',
  cancelUrl: 'https://merchant.example/payment/cancel',
  expiresInMinutes: 30,
};
const createResponse = {
  status: 'success',
  data: {
    invoiceCode: 'INV7A0B1C2D3E4F5A',
    orderId: 'ORDER-1001',
    amount: 150000,
    currency: 'VND',
    paymentContent: 'RP12A34B56C78D',
    bank: {
      code: 'mbbank',
      bin: '970422',
      accountNumber: '0123456789',
      accountName: 'NGUYEN VAN A',
    },
    vietqr: {
      imageUrl:
        'https://img.vietqr.io/image/970422-0123456789-compact2.png?...',
    },
    status: 'pending',
    checkoutUrl:
      'https://spay5s.com/deposit/INV7A0B1C2D3E4F5A?cancelToken=...',
    cancelToken: '...',
    expiresAt: '2026-08-06 10:30:00',
  },
};
const statusResponse = {
  status: 'success',
  data: {
    invoiceCode: 'INV7A0B1C2D3E4F5A',
    orderId: 'ORDER-1001',
    amount: 150000,
    paymentContent: 'RP12A34B56C78D',
    status: 'paid',
    matchedTransactionId: 'FT26218ABC123',
    paidAt: '2026-08-06 10:10:18',
  },
};

export default function InvoiceDocs() {
  const { message } = App.useApp();
  const copy = async (v: string) => {
    await navigator.clipboard.writeText(v);
    void message.success('Đã sao chép');
  };
  const curl = `curl --request POST '${base}/auth/deposit/invoices' \\\n+  --header 'Content-Type: application/json' \\\n+  --data '${JSON.stringify(createBody)}'`;
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span>APIBANK · VIETQR PAYMENT</span>
          <h1>API Invoice ngân hàng Việt Nam</h1>
          <p>
            Tạo payment intent, hiển thị VietQR và tự động đối soát giao dịch
            ngân hàng.
          </p>
        </div>
        <Tag color="success" icon={<SafetyCertificateOutlined />}>
          Production ready
        </Tag>
      </section>
      <section className={styles.checklist}>
        <Card>
          <FileAddOutlined />
          <b>Tạo invoice</b>
          <CheckCircleFilled />
        </Card>
        <Card>
          <QrcodeOutlined />
          <b>Hiển thị VietQR</b>
          <CheckCircleFilled />
        </Card>
        <Card>
          <SafetyCertificateOutlined />
          <b>Đối soát giao dịch</b>
          <CheckCircleFilled />
        </Card>
        <Card>
          <ReloadOutlined />
          <b>Đồng bộ trạng thái</b>
          <CheckCircleFilled />
        </Card>
      </section>
      <Card
        className={styles.section}
        title={
          <>
            <ApiOutlined /> Danh sách endpoint
          </>
        }
      >
        <Table
          rowKey="endpoint"
          pagination={false}
          scroll={{ x: 850 }}
          dataSource={endpoints}
          columns={[
            {
              title: 'Method',
              dataIndex: 'method',
              width: 90,
              render: (v) => (
                <Tag color={v === 'GET' ? 'success' : 'blue'}>{v}</Tag>
              ),
            },
            {
              title: 'Endpoint',
              dataIndex: 'endpoint',
              width: 390,
              render: (v) => (
                <code>
                  {base}
                  {v}
                </code>
              ),
            },
            {
              title: 'Auth',
              dataIndex: 'auth',
              width: 230,
              render: (v) => <b>{v}</b>,
            },
            { title: 'Mục đích', dataIndex: 'purpose' },
          ]}
        />
      </Card>
      <div className={styles.grid}>
        <Doc
          title="1. Tạo invoice"
          endpoint={`${base}/auth/deposit/invoices`}
          body={createBody}
          response={createResponse}
          onCopy={copy}
        />
        <Doc
          title="2. Kiểm tra trạng thái"
          endpoint={`${base}/deposit/public/invoices/{invoiceCode}`}
          response={statusResponse}
          onCopy={copy}
        />
      </div>
      <Card
        className={styles.section}
        title="cURL tạo invoice"
        extra={
          <Button icon={<CopyOutlined />} onClick={() => void copy(curl)}>
            Copy
          </Button>
        }
      >
        <pre>{curl}</pre>
      </Card>
      <Card className={styles.section} title="Cơ chế đối soát và đồng bộ">
        <ol>
          <li>
            Merchant gửi <code>bankToken</code>, số tiền và mã đơn hàng để tạo
            invoice.
          </li>
          <li>
            Khách được chuyển đến <code>checkoutUrl</code> và thanh toán bằng
            VietQR.
          </li>
          <li>
            Lịch sử ngân hàng được đồng bộ vào hệ thống; API khớp đúng tài
            khoản, số tiền và <code>paymentContent</code>.
          </li>
          <li>
            Trạng thái chuyển từ <code>pending</code> sang <code>paid</code>,
            sau đó gửi callback có header <code>X-RPay-Signature</code>.
          </li>
          <li>
            Checkout và endpoint public tự kiểm tra trạng thái mỗi 5 giây.
          </li>
        </ol>
        <AlertText />
      </Card>
    </div>
  );
}
function Doc({
  title,
  endpoint,
  body,
  response,
  onCopy,
}: {
  title: string;
  endpoint: string;
  body?: unknown;
  response: unknown;
  onCopy: (v: string) => void;
}) {
  return (
    <Card className={styles.section} title={title}>
      <div className={styles.endpoint}>
        <code>{endpoint}</code>
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={() => void onCopy(endpoint)}
        />
      </div>
      {body !== undefined && (
        <>
          <h3>Request JSON</h3>
          <pre>{JSON.stringify(body, null, 2)}</pre>
        </>
      )}
      <h3>Response JSON</h3>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </Card>
  );
}
function AlertText() {
  return (
    <div className={styles.note}>
      <SafetyCertificateOutlined />
      <span>
        Chỉ hỗ trợ tài khoản ngân hàng Việt Nam đã liên kết. Không đưa{' '}
        <b>bankToken</b> vào mã JavaScript hoặc ứng dụng phía khách hàng.
      </span>
    </div>
  );
}
