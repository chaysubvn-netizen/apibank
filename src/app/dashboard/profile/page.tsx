'use client';
import {
  ApiOutlined,
  CalendarOutlined,
  CopyOutlined,
  LockOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Statistic,
  Switch,
  Tabs,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
type User = {
  username: string;
  email?: string;
  money: number;
  telegram_chat_id?: string;
  telegram_status: boolean;
  time_momo?: number;
  create_date?: string;
  '2fa_status'?: number;
};
type Profile = {
  user: User;
  api_token?: string;
  ip?: string;
  bank_accounts: Record<string, number>;
};
const dateValue = (value?: number | string) => {
  if (!value) return 'Chưa cập nhật';
  const date =
    typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('vi-VN');
};
export default function ProfilePage() {
  const { message } = App.useApp();
  const [data, setData] = useState<Profile>();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    api<Profile>('/profile').then((result) => {
      if (active) {
        setData(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  if (!data) return <Skeleton active paragraph={{ rows: 14 }} />;
  const save = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const result = await api<Profile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      setData(result);
      message.success('Đã thay đổi thông tin thành công');
    } finally {
      setLoading(false);
    }
  };
  const changePassword = async (values: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    setLoading(true);
    try {
      const result = await api<{ message: string }>('/profile/password', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      message.success(result.message);
      passwordForm.resetFields();
    } finally {
      setLoading(false);
    }
  };
  const rotateToken = async () => {
    const result = await api<{ message: string; api_token: string }>(
      '/profile/token',
      { method: 'POST' }
    );
    setData({ ...data, api_token: result.api_token });
    message.success(result.message);
  };
  const copy = async () => {
    if (!data.api_token) return;
    await navigator.clipboard.writeText(data.api_token);
    message.success('Đã sao chép Token API');
  };
  const account = (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={7}>
        <Card className="profile-person" variant="borderless">
          <Tag color="blue">Thành viên</Tag>
          <Avatar
            size={78}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.username)}`}
          >
            {data.user.username.slice(0, 1).toUpperCase()}
          </Avatar>
          <h2>{data.user.username}</h2>
          <p>Khách hàng</p>
          <div className="profile-meta">
            <span>
              <MailOutlined />
              {data.user.email || 'Chưa cập nhật'}
            </span>
            <span>
              <SendOutlined />
              {data.user.telegram_chat_id || 'Chưa liên kết'}
            </span>
            <span>
              <ApiOutlined />
              {data.ip || '—'}
            </span>
            <span>
              <CalendarOutlined />
              {dateValue(data.user.create_date)}
            </span>
          </div>
        </Card>
        <Card
          title="Tài chính"
          className="profile-finance"
          variant="borderless"
        >
          <Statistic
            prefix={<WalletOutlined />}
            title="Số dư khả dụng"
            value={formatMoney(data.user.money)}
          />
          <Statistic
            title="Tài khoản ngân hàng"
            value={Object.values(data.bank_accounts).reduce(
              (sum, value) => sum + value,
              0
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={17}>
        <Card
          title="Liên kết Telegram"
          className="telegram-guide"
          variant="borderless"
        >
          <ol>
            <li>
              Truy cập Bot Telegram <b>@spay5sbot</b>.
            </li>
            <li>
              Gửi lệnh <b>/start</b> để lấy Chat ID.
            </li>
            <li>Điền Chat ID vào form và lưu.</li>
            <li>Hệ thống sẽ gửi thông báo hoạt động của bạn.</li>
          </ol>
        </Card>
        <Card
          title="Thông tin tài khoản"
          className="profile-info-card"
          variant="borderless"
        >
          <Form initialValues={data.user} layout="vertical" onFinish={save}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Tên đăng nhập">
                  <Input
                    prefix={<UserOutlined />}
                    value={data.user.username}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                >
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="telegram_chat_id" label="ID Telegram">
                  <Input prefix={<SendOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="telegram_status"
                  label="Nhận thông báo Telegram"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Hết hạn API">
                  <Input value={dateValue(data.user.time_momo)} disabled />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Token API">
                  <Space.Compact block>
                    <Input
                      value={data.api_token || 'N/A'}
                      readOnly
                      className="profile-token"
                    />
                    <Button icon={<CopyOutlined />} onClick={copy}>
                      Sao chép
                    </Button>
                    <Popconfirm
                      title="Đổi Token API?"
                      description="Mọi kết nối dùng token cũ sẽ ngừng hoạt động."
                      onConfirm={rotateToken}
                    >
                      <Button danger icon={<ReloadOutlined />}>
                        Đổi Token mới
                      </Button>
                    </Popconfirm>
                  </Space.Compact>
                  <small className="token-warning">
                    Cảnh báo: Nếu đổi Token, tất cả kết nối API cũ sẽ ngừng hoạt
                    động.
                  </small>
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật thông tin
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
  const security = (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <Card
          title="Đổi mật khẩu"
          className="security-card"
          variant="borderless"
        >
          <Form form={passwordForm} layout="vertical" onFinish={changePassword}>
            <Form.Item
              name="current_password"
              label="Mật khẩu hiện tại"
              rules={[{ required: true }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="password"
              label="Mật khẩu mới"
              rules={[{ required: true, min: 8, message: 'Tối thiểu 8 ký tự' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="password_confirmation"
              label="Nhập lại mật khẩu mới"
              dependencies={['password']}
              rules={[
                { required: true },
                {
                  validator: (_, value) =>
                    !value || passwordForm.getFieldValue('password') === value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error('Mật khẩu nhập lại không đúng')
                        ),
                },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Đổi mật khẩu
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title="Xác thực 2 yếu tố"
          className="security-card twofa-card"
          variant="borderless"
        >
          <SafetyCertificateOutlined />
          <h2>{data.user['2fa_status'] ? '2FA Đã bật' : '2FA Chưa bật'}</h2>
          <p>
            {data.user['2fa_status']
              ? 'Tài khoản đang được bảo vệ bởi xác thực hai lớp.'
              : 'Kích hoạt Google Authenticator để tăng cường bảo mật tài khoản.'}
          </p>
          <Tag color={data.user['2fa_status'] ? 'success' : 'warning'}>
            {data.user['2fa_status'] ? 'Đang bảo vệ' : 'Chưa kích hoạt'}
          </Tag>
        </Card>
      </Col>
    </Row>
  );
  return (
    <div className="profile-page">
      <Card className="profile-cover" variant="borderless">
        <div className="profile-cover-art" />
        <div className="profile-cover-user">
          <Avatar
            size={92}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.username)}`}
          >
            {data.user.username.slice(0, 1).toUpperCase()}
          </Avatar>
          <div>
            <h1>{data.user.username}</h1>
            <p>Khách hàng</p>
          </div>
          <Button
            type="primary"
            icon={<WalletOutlined />}
            href="/dashboard/invoices"
          >
            Nạp tiền
          </Button>
        </div>
      </Card>
      <Tabs
        className="profile-tabs"
        defaultActiveKey="account"
        items={[
          {
            key: 'account',
            label: (
              <span>
                <UserOutlined /> Tài khoản
              </span>
            ),
            children: account,
          },
          {
            key: 'security',
            label: (
              <span>
                <SafetyCertificateOutlined /> Bảo mật
              </span>
            ),
            children: security,
          },
        ]}
      />
    </div>
  );
}
