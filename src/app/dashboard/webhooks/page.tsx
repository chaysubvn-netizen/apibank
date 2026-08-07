'use client';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  HistoryOutlined,
  EyeOutlined,
  KeyOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
type Hook = {
  id: number;
  bank_type: string;
  account_number: string;
  webhook_url: string;
  status: number;
  last_callback?: string;
};
type Log = {
  id: number;
  url: string;
  payload?: string;
  response?: string;
  status_code?: number;
  create_date: string;
};
type TelegramLog = {
  id: number;
  type?: string;
  chat_id?: string;
  message?: string;
  response?: string;
  create_date: string;
};
type Payload = {
  data: Hook[];
  logs: Log[];
  telegram_logs: TelegramLog[];
  signature: string;
  transactions_endpoint: string;
};
const banks = [
  {
    label: 'Ngân hàng',
    options: [
      ['ACB', 'ACB - Ngân hàng Á Châu'],
      ['VCB', 'VCB - Vietcombank'],
      ['BIDV', 'BIDV'],
      ['MB', 'MB - MBBank'],
      ['OCB', 'OCB - Ngân hàng Phương Đông'],
      ['VPBANK', 'VPBank - Ngân hàng Việt Nam Thịnh Vượng'],
      ['TCB', 'TCB - Techcombank'],
      ['VTB', 'VTB - VietinBank'],
      ['TPB', 'TPB - TPBank'],
      ['SEA', 'SEA - SeaBank'],
    ].map(([value, label]) => ({ value, label })),
  },
  {
    label: 'Ví điện tử',
    options: [
      ['VIETTEL', 'Viettel Money'],
      ['TSR', 'TheSieuRe'],
      ['ZALOPAY', 'ZaloPay'],
      ['PAYPAL', 'PayPal'],
    ].map(([value, label]) => ({ value, label })),
  },
  {
    label: 'Tiền điện tử',
    options: [
      ['BINANCE', 'Binance'],
      ['TRC20', 'USDT (TRC20)'],
      ['BEP20', 'USDT (BEP20)'],
    ].map(([value, label]) => ({ value, label })),
  },
];
const pretty = (value?: string) => {
  if (!value) return '(Phản hồi trống)';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};
export default function WebhooksPage() {
  const { message, modal } = App.useApp(),
    [data, setData] = useState<Payload>(),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [viewer, setViewer] = useState<{ title: string; content: string }>();
  const [form] = Form.useForm();
  const load = useCallback(() => api<Payload>('/webhooks').then(setData), []);
  useEffect(() => {
    load();
  }, [load]);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    message.success('Đã sao chép!');
  };
  const add = async (v: Hook) => {
    setSaving(true);
    try {
      const r = await api<{ message: string }>('/webhooks', {
        method: 'POST',
        body: JSON.stringify(v),
      });
      message.success(r.message);
      setOpen(false);
      form.resetFields();
      await load();
    } finally {
      setSaving(false);
    }
  };
  const toggle = async (r: Hook, v: boolean) => {
    await api(`/webhooks/${r.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: v }),
    });
    message.success(v ? 'Đã bật Webhook' : 'Đã tắt Webhook');
    load();
  };
  const del = async (id: number) => {
    const r = await api<{ message: string }>(`/webhooks/${id}`, {
      method: 'DELETE',
    });
    message.success(r.message);
    load();
  };
  const regenerate = () =>
    modal.confirm({
      title: 'Tạo Signature mới?',
      content:
        'Signature cũ sẽ không còn hợp lệ. Bạn phải cập nhật lại code trên server nhận Webhook.',
      okText: 'Tạo mới ngay',
      okButtonProps: { danger: true },
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        const r = await api<{ message: string; signature: string }>(
          '/webhooks/signature',
          { method: 'POST' }
        );
        setData((d) => (d ? { ...d, signature: r.signature } : d));
        message.success(r.message);
      },
    });
  const phpCode = useMemo(
    () =>
      `<?php\nheader('Content-Type: application/json; charset=utf-8');\n$signature = '${data?.signature ?? ''}';\n$payload = file_get_contents('php://input');\n$headers = getallheaders();\n\nif (($headers['Signature'] ?? '') === $signature) {\n    $result = json_decode($payload, true);\n    foreach ($result['transactions'] as $transaction) {\n        $id = $transaction['transactionID'];\n        $amount = $transaction['amount'];\n        $description = $transaction['description'];\n        // Xử lý giao dịch tại đây\n    }\n    echo json_encode(['status' => 'success']);\n} else {\n    http_response_code(401);\n    echo json_encode(['status' => 'error', 'message' => 'Sai Signature']);\n}`,
    [data?.signature]
  );
  if (!data) return <Card loading />;
  const management = (
    <div className="webhook-management-stack">
      <div className="webhook-alerts">
        <Alert
          type="warning"
          showIcon
          title="Cấu hình Telegram để nhận cảnh báo biến động số dư song song với Webhook."
        />
        <Alert
          type="error"
          showIcon
          title="Nếu Webhook không hoạt động, hãy kiểm tra tường lửa và bảo đảm server của bạn trả về HTTP 200."
        />
      </div>
      <Card
        className="webhook-table-card"
        variant="borderless"
        title={
          <>
            <DeploymentUnitOutlined /> Quản lý Webhooks
          </>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            Thêm mới
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={data.data}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <Empty description="Bạn chưa tạo Webhook nào. Nhấn “Thêm mới” để bắt đầu!" />
            ),
          }}
          columns={[
            {
              title: 'Ngân hàng',
              dataIndex: 'bank_type',
              render: (v) => <Tag color="blue">{v}</Tag>,
            },
            {
              title: 'Số tài khoản',
              dataIndex: 'account_number',
              render: (v) => <b>{v}</b>,
            },
            {
              title: 'Webhook URL',
              dataIndex: 'webhook_url',
              ellipsis: true,
              render: (v) => (
                <a href={v} target="_blank" rel="noreferrer">
                  {v}
                </a>
              ),
            },
            {
              title: 'Callback gần nhất',
              dataIndex: 'last_callback',
              align: 'center',
              render: (v) =>
                v || <span className="muted">Chưa có dữ liệu</span>,
            },
            {
              title: 'Trạng thái',
              align: 'center',
              render: (_, r) => (
                <Space>
                  <Switch checked={!!r.status} onChange={(v) => toggle(r, v)} />
                  <Tag color={r.status ? 'success' : 'error'}>
                    {r.status ? 'Hoạt động' : 'Tắt'}
                  </Tag>
                </Space>
              ),
            },
            {
              title: 'Thao tác',
              align: 'right',
              render: (_, r) => (
                <Popconfirm
                  title="Xóa Webhook này?"
                  description="Cấu hình đã xóa không thể khôi phục."
                  okButtonProps={{ danger: true }}
                  onConfirm={() => del(r.id)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
      <Card
        className="signature-card"
        variant="borderless"
        title={
          <>
            <KeyOutlined /> Signature bảo mật
          </>
        }
      >
        <Alert
          type="info"
          showIcon
          title="Signature dùng để xác thực request do APIBANK gửi đến server của bạn. Hãy giữ khóa này bí mật tuyệt đối."
        />
        <label>WEBHOOK SIGNATURE</label>
        <Space.Compact block>
          <Input.Password value={data.signature} readOnly visibilityToggle />
          <Button icon={<CopyOutlined />} onClick={() => copy(data.signature)}>
            Sao chép
          </Button>
          <Button danger icon={<ReloadOutlined />} onClick={regenerate}>
            Tạo mới
          </Button>
        </Space.Compact>
      </Card>
    </div>
  );
  const history = (
    <Card
      className="webhook-table-card"
      variant="borderless"
      title={
        <>
          <HistoryOutlined /> Lịch sử đẩy Webhook
        </>
      }
    >
      <Table
        rowKey="id"
        dataSource={data.logs}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 960 }}
        locale={{
          emptyText: <Empty description="Chưa có dữ liệu đẩy Webhook" />,
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', render: (v) => <b>#{v}</b> },
          { title: 'Webhook URL', dataIndex: 'url', ellipsis: true },
          {
            title: 'Payload',
            render: (_, r) => (
              <Button
                type="link"
                onClick={() =>
                  setViewer({
                    title: `Payload #${r.id}`,
                    content: pretty(r.payload),
                  })
                }
              >
                Xem Payload
              </Button>
            ),
          },
          {
            title: 'Response',
            render: (_, r) => (
              <Button
                type="link"
                onClick={() =>
                  setViewer({
                    title: `Response #${r.id}`,
                    content: pretty(r.response),
                  })
                }
              >
                Xem Response
              </Button>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'status_code',
            align: 'center',
            render: (v) => (
              <Tag color={v === 200 ? 'success' : 'error'}>
                {v === 200 ? 'Thành công' : 'Lỗi'} ({v ?? '—'})
              </Tag>
            ),
          },
          { title: 'Thời gian', dataIndex: 'create_date' },
        ]}
      />
    </Card>
  );
  const telegramHistory = (
    <Card
      className="webhook-table-card"
      variant="borderless"
      title={
        <>
          <HistoryOutlined /> Nhật ký hệ thống Bot
        </>
      }
    >
      <Table
        rowKey="id"
        dataSource={data.telegram_logs}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        locale={{
          emptyText: (
            <Empty description="Chưa có lịch sử gửi tin nhắn Telegram nào" />
          ),
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', render: (v) => <b>#{v}</b> },
          {
            title: 'Loại',
            dataIndex: 'type',
            align: 'center',
            render: (v) =>
              v === 'group' ? (
                <Tag color="cyan" icon={<TeamOutlined />}>
                  Nhóm
                </Tag>
              ) : (
                <Tag color="blue" icon={<UserOutlined />}>
                  Cá nhân
                </Tag>
              ),
          },
          {
            title: 'Chat ID',
            dataIndex: 'chat_id',
            render: (v) => <span className="muted">{v || '—'}</span>,
          },
          { title: 'Nội dung', dataIndex: 'message', ellipsis: true },
          {
            title: 'Phản hồi',
            align: 'center',
            render: (_, r) => (
              <Button
                icon={<EyeOutlined />}
                onClick={() =>
                  setViewer({
                    title: `Telegram Response #${r.id}`,
                    content: pretty(r.response),
                  })
                }
              >
                Xem
              </Button>
            ),
          },
          { title: 'Thời gian', dataIndex: 'create_date', align: 'right' },
        ]}
      />
    </Card>
  );
  const integration = (
    <Row gutter={[22, 22]}>
      <Col xs={24} xl={12}>
        <Card
          className="webhook-doc-card"
          title={
            <>
              <CodeOutlined /> Code PHP nhận Webhook
            </>
          }
          variant="borderless"
        >
          <p>Sao chép đoạn code mẫu này vào file xử lý trên server của bạn.</p>
          <div className="code-block">
            <Button icon={<CopyOutlined />} onClick={() => copy(phpCode)}>
              Copy code
            </Button>
            <pre>{phpCode}</pre>
          </div>
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card
          className="webhook-doc-card"
          title={
            <>
              <ApiOutlined /> Mẫu dữ liệu JSON
            </>
          }
          variant="borderless"
        >
          <p>Dữ liệu giao dịch được gửi bằng phương thức HTTP POST.</p>
          <div className="code-block">
            <pre>
              {pretty(
                JSON.stringify({
                  status: 'success',
                  message: 'Thành công',
                  transactions: [
                    {
                      type: 'IN',
                      transactionID: '24213',
                      amount: '100000',
                      description: 'NAP14838 GD 941234',
                    },
                  ],
                })
              )}
            </pre>
          </div>
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card
          className="webhook-doc-card"
          title={
            <>
              <LinkOutlined /> Chủ động lấy lịch sử API
            </>
          }
          variant="borderless"
        >
          <p>Endpoint lấy danh sách giao dịch khi cần đồng bộ chủ động.</p>
          <Space.Compact block>
            <Input value={data.transactions_endpoint} readOnly />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => copy(data.transactions_endpoint)}
            >
              Copy
            </Button>
          </Space.Compact>
          <div className="code-block compact">
            <pre>{`Authorization: Bearer ${data.signature}\nGET ${data.transactions_endpoint}?limit=20&page=1`}</pre>
          </div>
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card
          className="webhook-doc-card webhook-rules"
          title={
            <>
              <SafetyCertificateOutlined /> Quy định sử dụng hệ thống
            </>
          }
          variant="borderless"
        >
          <div>
            <CheckCircleOutlined />
            <span>
              <b>Cơ chế tự động gửi lại</b>
              <p>
                Nếu timeout hoặc không trả HTTP 200, hệ thống sẽ thử gọi lại
                sau.
              </p>
            </span>
          </div>
          <div>
            <SafetyCertificateOutlined />
            <span>
              <b>Xác thực an toàn</b>
              <p>Luôn kiểm tra Header Signature trước khi xử lý cộng tiền.</p>
            </span>
          </div>
          <div>
            <ReloadOutlined />
            <span>
              <b>Tự động tắt</b>
              <p>
                Webhook thất bại liên tiếp có thể bị tắt để bảo vệ tài nguyên.
              </p>
            </span>
          </div>
        </Card>
      </Col>
    </Row>
  );
  return (
    <div className="webhooks-page">
      <div className="page-title">
        <h1>Danh sách Callback URL</h1>
        <p>
          Nhận thông báo giao dịch theo thời gian thực và tích hợp an toàn bằng
          Signature.
        </p>
      </div>
      <Tabs
        className="webhook-tabs"
        defaultActiveKey="management"
        items={[
          {
            key: 'management',
            label: (
              <span>
                <DeploymentUnitOutlined /> Quản lý Webhooks
              </span>
            ),
            children: management,
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> Lịch sử đẩy
              </span>
            ),
            children: history,
          },
          {
            key: 'telegram',
            label: (
              <span>
                <TeamOutlined /> Lịch sử Telegram
              </span>
            ),
            children: telegramHistory,
          },
          {
            key: 'integration',
            label: (
              <span>
                <CodeOutlined /> Hướng dẫn tích hợp
              </span>
            ),
            children: integration,
          },
        ]}
      />
      <Modal
        title="Thêm Webhook mới"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true }}
          onFinish={add}
        >
          <Form.Item
            name="bank_type"
            label="Chọn ngân hàng"
            rules={[{ required: true }]}
          >
            <Select
              size="large"
              options={banks}
              placeholder="Chọn ngân hàng hoặc ví"
            />
          </Form.Item>
          <Form.Item
            name="account_number"
            label="Số tài khoản"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="Nhập số tài khoản" />
          </Form.Item>
          <Form.Item
            name="webhook_url"
            label="URL nhận Webhook"
            rules={[
              { required: true },
              { type: 'url', message: 'Webhook URL không hợp lệ' },
            ]}
          >
            <Input size="large" placeholder="https://domain.com/callback.php" />
          </Form.Item>
          <Form.Item name="status" valuePropName="checked" label="Trạng thái">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          <Button
            block
            type="primary"
            size="large"
            htmlType="submit"
            loading={saving}
          >
            Lưu cấu hình
          </Button>
        </Form>
      </Modal>
      <Modal
        width={720}
        title={viewer?.title}
        open={!!viewer}
        onCancel={() => setViewer(undefined)}
        footer={<Button onClick={() => setViewer(undefined)}>Đóng</Button>}
      >
        <pre className="viewer-code">{viewer?.content}</pre>
      </Modal>
    </div>
  );
}
