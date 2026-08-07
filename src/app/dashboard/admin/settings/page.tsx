'use client';
import {
  ApiOutlined,
  BankOutlined,
  CrownOutlined,
  DeleteOutlined,
  GlobalOutlined,
  SaveOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Tabs,
  Upload,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
type Kind = 'text' | 'password' | 'number' | 'textarea' | 'status';
type Field = {
  name: string;
  label: string;
  kind?: Kind;
  help?: React.ReactNode;
  placeholder?: string;
  span?: number;
};
const common: Field[] = [
  { name: 'logo', label: 'Logo', placeholder: 'URL logo website' },
  {
    name: 'site_url',
    label: 'Domain website',
    placeholder: 'https://domain.com',
  },
  { name: 'title', label: 'Title', placeholder: 'Tên hệ thống' },
  { name: 'description', label: 'Description', placeholder: 'Mô tả website' },
  { name: 'keywords', label: 'Keywords', placeholder: 'Từ khóa SEO' },
  { name: 'author', label: 'Author', placeholder: 'Tên tác giả' },
  {
    name: 'noidungnap',
    label: 'Nội dung nạp (Tiền tố)',
    placeholder: 'Ví dụ: NAP',
    help: (
      <i>
        Hệ thống cộng tiền theo cú pháp: <b>Nội dung nạp + ID khách hàng</b> (Ví
        dụ: NAP1)
      </i>
    ),
  },
  { name: 'hotline', label: 'Hotline', placeholder: 'Số điện thoại liên hệ' },
  { name: 'email', label: 'Email', placeholder: 'Email liên hệ' },
  {
    name: 'email_smtp',
    label: 'Email SMTP',
    placeholder: 'Email dùng gửi thư',
    help: <i>Email SMTP dùng gửi mã và thông báo hệ thống.</i>,
  },
  {
    name: 'pass_email_smtp',
    label: 'Password Email SMTP',
    kind: 'password',
    placeholder: 'Mật khẩu ứng dụng SMTP',
  },
  {
    name: 'session_login',
    label: 'Thời gian lưu phiên đăng nhập',
    kind: 'number',
    help: <i>Tính bằng giây (2592000 = 4 tuần)</i>,
  },
  { name: 'link_facebook', label: 'Link Facebook' },
  { name: 'link_zalo', label: 'Link Zalo' },
  { name: 'link_telegram', label: 'Link Telegram' },
  {
    name: 'time_test_api',
    label: 'Thời gian cho thành viên test API',
    kind: 'number',
    help: <i>Tính bằng giây (86400 = 1 ngày)</i>,
  },
  {
    name: 'status_noti',
    label: 'Status thông báo',
    kind: 'status',
    help: <i>Chọn tắt để tạm dừng thông báo toàn hệ thống.</i>,
  },
  {
    name: 'key_captcha',
    label: 'API KEY CAPTCHA',
    kind: 'password',
    help: <i>ecaptcha.sieuthicode.net</i>,
  },
  {
    name: 'key_captcha_dvd',
    label: 'API KEY CAPTCHA DVD',
    kind: 'password',
    help: <i>dvd.vn</i>,
  },
  {
    name: 'token_coderent',
    label: 'CODERENT API TOKEN',
    kind: 'password',
    help: <i>Dùng cho chức năng giải eCaptcha (coderent.vn)</i>,
  },
  {
    name: 'username_cap',
    label: 'Username Key',
    help: <i>Tài khoản dịch vụ Captcha dvd.vn</i>,
  },
  {
    name: 'notification',
    label: 'Nội dung thông báo chung',
    kind: 'textarea',
    span: 24,
  },
];
const bankAuto: Field[] = [
  {
    name: 'token_bank',
    label: 'Token Bank Auto',
    kind: 'password',
    placeholder: 'Nhập token ngân hàng',
    help: <i>Token dùng cho tác vụ tự động kiểm tra giao dịch ngân hàng.</i>,
    span: 12,
  },
  {
    name: 'loai',
    label: 'Link cron / loại xử lý',
    placeholder: 'cron/acb.php',
    help: <i>Chỉ nhập đường dẫn cron/..., không nhập https://</i>,
    span: 12,
  },
  {
    name: 'token_viettel',
    label: 'Token Viettel Money',
    kind: 'password',
    placeholder: 'Nhập token Viettel',
    help: <i>Link cron: cron/viettel.php</i>,
    span: 12,
  },
  {
    name: 'telegram_bot_token',
    label: 'Telegram Bot Token',
    kind: 'password',
    span: 12,
  },
  { name: 'telegram_chat_id', label: 'Telegram Chat ID', span: 12 },
];
const bankNames: Record<string, string> = {
  acb: 'ACB',
  thesieure: 'TheSieuRe',
  viettin: 'VietinBank',
  viettel: 'Viettel Money',
  vcb: 'Vietcombank',
  bidv: 'BIDV',
  mbbank: 'MBBank',
  ocb: 'OCB',
  vpbank: 'VPBank',
  techcombank: 'Techcombank',
  seabank: 'SeaBank',
  tpbank: 'TPBank',
  binance: 'Binance',
  paypal: 'PayPal',
  trc20: 'TRC20 (USDT)',
  bep20: 'BEP20 (USDT)',
  zalopay: 'ZaloPay',
};
const apiFields: Field[] = [
  ...Object.entries(bankNames).map(([key, label]) => ({
    name: `status_${key}`,
    label: `Trạng thái API ${label}`,
    kind: 'status' as const,
    span: 8,
  })),
  {
    name: 'bscscan_apikey',
    label: 'API Key Moralis / BSCScan',
    kind: 'password',
    help: <i>Dùng kiểm tra lịch sử mạng BEP20 qua Moralis.</i>,
    span: 24,
  },
];
const vipFields: Field[] = [1, 2, 3].flatMap((level) => [
  {
    name: `vip${level}_deposit`,
    label: `VIP ${level} - Mốc tổng nạp`,
    kind: 'number' as const,
    placeholder: 'Số tiền tối thiểu',
    span: 12,
  },
  {
    name: `vip${level}_discount`,
    label: `VIP ${level} - Giảm giá (%)`,
    kind: 'number' as const,
    placeholder: 'Phần trăm giảm',
    span: 12,
  },
]);
function Control({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === 'password')
    return (
      <Input.Password
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  if (field.kind === 'number')
    return (
      <InputNumber
        value={
          value === undefined || value === null || value === ''
            ? null
            : Number(value)
        }
        onChange={onChange}
        style={{ width: '100%' }}
        placeholder={field.placeholder}
        min={0}
      />
    );
  if (field.kind === 'textarea')
    return (
      <Input.TextArea
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder={field.placeholder}
      />
    );
  if (field.kind === 'status')
    return (
      <Select
        value={
          value === undefined || value === null || value === ''
            ? undefined
            : String(value)
        }
        onChange={onChange}
        options={[
          { label: 'Bật / Hoạt động', value: '1' },
          { label: 'Tắt / Bảo trì', value: '0' },
        ]}
      />
    );
  return (
    <Input
      value={String(value ?? '')}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
    />
  );
}
function MediaSetting({
  name,
  label,
  hint,
  value,
  onChange,
}: {
  name: 'favicon' | 'og_image';
  label: string;
  hint: string;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}) {
  const { message } = App.useApp(),
    [uploading, setUploading] = useState(false);
  const url = String(value ?? '');
  return (
    <Form.Item label={label} extra={hint} className="admin-media-setting">
      <div className="admin-media-control">
        {url ? (
          <div className={`admin-media-preview ${name}`}>
            <Image src={url} alt={label} preview={false} />
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => onChange(name, '')}
            >
              Xóa
            </Button>
          </div>
        ) : (
          <div className={`admin-media-empty ${name}`}>Chưa có ảnh</div>
        )}
        <Upload
          accept={
            name === 'favicon'
              ? '.ico,.png,.jpg,.jpeg,.webp'
              : '.png,.jpg,.jpeg,.webp'
          }
          maxCount={1}
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            const body = new FormData();
            body.append('type', name);
            body.append('file', file as File);
            setUploading(true);
            try {
              const result = await api<{ url: string }>(
                '/admin/settings/media',
                { method: 'POST', body }
              );
              onChange(name, result.url);
              onSuccess?.(result);
              message.success('Đã tải ảnh lên. Nhấn Lưu cấu hình để áp dụng.');
            } catch (error) {
              onError?.(error as Error);
              message.error(
                error instanceof Error ? error.message : 'Không thể tải ảnh'
              );
            } finally {
              setUploading(false);
            }
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {url ? 'Đổi ảnh' : 'Chọn ảnh'}
          </Button>
        </Upload>
      </div>
    </Form.Item>
  );
}
function Fields({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}) {
  return (
    <Row gutter={[16, 2]}>
      {fields.map((field) => (
        <Col
          xs={24}
          md={field.span === 24 ? 24 : 12}
          xl={field.span || 8}
          key={field.name}
        >
          <Form.Item label={field.label} extra={field.help}>
            <Control
              field={field}
              value={values[field.name]}
              onChange={(value) => onChange(field.name, value)}
            />
          </Form.Item>
        </Col>
      ))}
    </Row>
  );
}
export default function AdminSettings() {
  const { message } = App.useApp(),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [values, setValues] = useState<Record<string, unknown>>({});
  const touched = useRef(new Set<string>());
  useEffect(() => {
    api<{ settings: Record<string, string> }>('/admin/settings')
      .then((response) => setValues(response.settings))
      .catch((error) => message.error(error.message))
      .finally(() => setLoading(false));
  }, [message]);
  const change = (name: string, value: unknown) => {
    touched.current.add(name);
    setValues((current) => ({ ...current, [name]: value }));
  };
  const save = async () => {
    const settings = Object.fromEntries(
      [...touched.current].map((name) => [name, values[name]])
    );
    if (Object.keys(settings).length === 0) {
      message.warning('Bạn chưa nhập hoặc thay đổi cấu hình nào.');
      return;
    }
    setSaving(true);
    try {
      const result = await api<{
        message: string;
        saved_count: number;
        settings: Record<string, string>;
      }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });
      if (!result.saved_count)
        throw new Error('Máy chủ không ghi được cấu hình.');
      setValues(result.settings);
      touched.current.clear();
      message.success(`${result.message} (${result.saved_count} mục)`);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể lưu cấu hình'
      );
    } finally {
      setSaving(false);
    }
  };
  const tabs = [
    {
      key: 'common',
      label: (
        <span>
          <GlobalOutlined /> THÔNG TIN CHUNG
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 2]}>
            <Col xs={24} lg={8}>
              <MediaSetting
                name="favicon"
                label="Favicon"
                hint="ICO, PNG, JPG hoặc WEBP · nên dùng ảnh vuông"
                value={values.favicon}
                onChange={change}
              />
            </Col>
            <Col xs={24} lg={16}>
              <MediaSetting
                name="og_image"
                label="Ảnh chia sẻ (OG Image)"
                hint="PNG, JPG hoặc WEBP · khuyến nghị 1200×630px"
                value={values.og_image}
                onChange={change}
              />
            </Col>
          </Row>
          <Fields fields={common} values={values} onChange={change} />
        </>
      ),
    },
    {
      key: 'bank',
      label: (
        <span>
          <BankOutlined /> BANK AUTO
        </span>
      ),
      children: <Fields fields={bankAuto} values={values} onChange={change} />,
    },
    {
      key: 'api',
      label: (
        <span>
          <ApiOutlined /> CẤU HÌNH API
        </span>
      ),
      children: <Fields fields={apiFields} values={values} onChange={change} />,
    },
    {
      key: 'vip',
      label: (
        <span>
          <CrownOutlined /> CẤU HÌNH VIP
        </span>
      ),
      children: <Fields fields={vipFields} values={values} onChange={change} />,
    },
  ];
  return (
    <div className="admin-page admin-php-settings">
      <div className="admin-simple-title">
        <div>
          <h1>Cài đặt hệ thống</h1>
          <span>Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;Cài đặt hệ thống</span>
        </div>
      </div>
      <Spin spinning={loading} description="Đang tải cấu hình...">
        <Card
          className="admin-settings-card"
          title={
            <span>
              <SettingOutlined /> CẤU HÌNH HỆ THỐNG
            </span>
          }
          variant="borderless"
        >
          <Tabs destroyOnHidden={false} items={tabs} />
          <div className="admin-settings-footer">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading}
              onClick={save}
            >
              Lưu cấu hình
            </Button>
          </div>
        </Card>
      </Spin>
    </div>
  );
}
