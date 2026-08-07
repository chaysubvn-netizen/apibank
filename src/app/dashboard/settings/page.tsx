'use client';
import {
  AlertOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Skeleton,
  Switch,
} from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
type Settings = {
  telegram_status: boolean;
  telegram_token?: string;
  telegram_chat_id?: string;
  telegram_group_status: boolean;
  telegram_group_chat_id?: string;
};
export default function SettingsPage() {
  const { message } = App.useApp(),
    [data, setData] = useState<Settings>(),
    [saving, setSaving] = useState<string>(),
    [testing, setTesting] = useState<string>();
  const [individual] = Form.useForm(),
    [group] = Form.useForm();
  useEffect(() => {
    api<Settings>('/telegram/settings').then(setData);
  }, []);
  if (!data) return <Skeleton active paragraph={{ rows: 14 }} />;
  const save = async (
    type: 'individual' | 'group',
    values: Partial<Settings>
  ) => {
    setSaving(type);
    try {
      const r = await api<{ message: string }>('/telegram/settings', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      message.success(r.message);
      setData((d) => (d ? { ...d, ...values } : d));
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không thể lưu cấu hình Telegram.'
      );
    } finally {
      setSaving(undefined);
    }
  };
  const test = async (type: 'individual' | 'group') => {
    const values =
      type === 'individual'
        ? individual.getFieldsValue()
        : {
            ...individual.getFieldsValue(['telegram_token']),
            ...group.getFieldsValue(),
          };
    setTesting(type);
    try {
      const r = await api<{ message: string }>('/telegram/test', {
        method: 'POST',
        body: JSON.stringify({ ...values, type }),
      });
      message.success(r.message);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không thể gửi tin nhắn kiểm thử.'
      );
    } finally {
      setTesting(undefined);
    }
  };
  return (
    <div className="settings-page">
      <div className="page-title">
        <h1>Cấu hình Bot Telegram</h1>
        <p>
          Nhận cảnh báo hệ thống và biến động giao dịch theo thời gian thực.
        </p>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card
            className="telegram-setting-card personal"
            variant="borderless"
            title={
              <div className="telegram-card-title">
                <span>
                  <SendOutlined />
                </span>
                <div>
                  <b>Bot thông báo Cá nhân</b>
                  <small>Nhận thông báo hết hạn gói và sự cố hệ thống</small>
                </div>
              </div>
            }
          >
            <div className="telegram-guide">
              <h3>
                <InfoCircleOutlined /> Các bước thực hiện
              </h3>
              <ol>
                <li>
                  Tìm <b>@BotFather</b> trên Telegram và dùng lệnh{' '}
                  <code>/newbot</code> để tạo Bot.
                </li>
                <li>
                  Sau khi tạo thành công, sao chép <b>Token</b> Bot.
                </li>
                <li>
                  Tìm <b>@userinfobot</b> và nhấn Start để lấy Chat ID cá nhân.
                </li>
                <li>Nhấn Start vào Bot vừa tạo trước khi gửi kiểm thử.</li>
              </ol>
            </div>
            <Form
              form={individual}
              initialValues={data}
              layout="vertical"
              onFinish={(v) => save('individual', v)}
            >
              <div className="telegram-status-row">
                <div>
                  <b>Thông báo cá nhân</b>
                  <small>Bật để nhận cảnh báo từ hệ thống</small>
                </div>
                <Form.Item
                  name="telegram_status"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              <Form.Item
                name="telegram_token"
                label="Token Telegram Bot"
                rules={[{ required: true, message: 'Vui lòng nhập Token Bot' }]}
              >
                <Input.Password
                  size="large"
                  placeholder="7123456789:AAF-abcdef..."
                />
              </Form.Item>
              <Form.Item
                name="telegram_chat_id"
                label="Chat ID của bạn"
                rules={[{ required: true, message: 'Vui lòng nhập Chat ID' }]}
              >
                <Input size="large" placeholder="123456789" />
              </Form.Item>
              <div className="telegram-actions">
                <Button
                  size="large"
                  icon={<SendOutlined />}
                  loading={testing === 'individual'}
                  onClick={() => test('individual')}
                >
                  Kiểm thử
                </Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving === 'individual'}
                  htmlType="submit"
                >
                  Lưu cấu hình
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            className="telegram-setting-card group"
            variant="borderless"
            title={
              <div className="telegram-card-title">
                <span>
                  <TeamOutlined />
                </span>
                <div>
                  <b>Bot báo biến động Nhóm</b>
                  <small>
                    Tự động báo cáo thu chi của tất cả cổng thanh toán
                  </small>
                </div>
              </div>
            }
          >
            <div className="telegram-guide">
              <h3>
                <InfoCircleOutlined /> Các bước thực hiện
              </h3>
              <ol>
                <li>Thêm Bot đã tạo vào nhóm Telegram của bạn.</li>
                <li>Cấp quyền Administrator cho Bot trong nhóm.</li>
                <li>
                  Thêm <b>@apistcrobot_osh_bot</b> và gửi <code>/start</code> để
                  lấy ID.
                </li>
                <li>
                  Chat ID nhóm thường bắt đầu bằng dấu trừ, ví dụ{' '}
                  <b>-100123456789</b>.
                </li>
              </ol>
            </div>
            <Form
              form={group}
              initialValues={data}
              layout="vertical"
              onFinish={(v) => save('group', v)}
            >
              <div className="telegram-status-row">
                <div>
                  <b>Thông báo nhóm</b>
                  <small>Bật để nhận biến động thu chi trong nhóm</small>
                </div>
                <Form.Item
                  name="telegram_group_status"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              <Form.Item
                name="telegram_group_chat_id"
                label="Chat ID nhóm Telegram"
                rules={[
                  { required: true, message: 'Vui lòng nhập Chat ID nhóm' },
                ]}
              >
                <Input size="large" placeholder="-100123456789" />
              </Form.Item>
              <div className="group-reminder">
                <AlertOutlined /> Bạn phải thiết lập Bot cá nhân thành công
                trước khi sử dụng Bot nhóm.
              </div>
              <div className="telegram-actions group-actions">
                <Button
                  size="large"
                  icon={<SendOutlined />}
                  loading={testing === 'group'}
                  onClick={() => test('group')}
                >
                  Kiểm thử
                </Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving === 'group'}
                  htmlType="submit"
                >
                  Lưu cấu hình
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
      <div className="telegram-security-note">
        <CheckCircleOutlined />
        <div>
          <b>Kết nối an toàn</b>
          <p>
            Token Bot chỉ được dùng ở máy chủ Laravel để gửi thông báo và không
            xuất hiện trong payload giao dịch.
          </p>
        </div>
      </div>
    </div>
  );
}
