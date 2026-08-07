'use client';
import {
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Checkbox, Form, Input } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ZaloPayQrConnect } from '@/components/zalopay-qr-connect';
import { banks } from '../../page';
type Values = Record<string, string | boolean>;
type CoreResponse = {
  status?: string | number;
  msg?: string;
  message?: string;
  otp_action?: string;
  action?: string;
  require_otp?: boolean;
};
type Guide = {
  title: string;
  intro: string;
  steps?: string[];
  links?: Array<{ label: string; url: string }>;
  images?: Array<{ src: string; alt: string }>;
  danger?: string;
};
const generic = (name: string): Guide => ({
  title: `Hướng dẫn thêm tài khoản ${name}`,
  intro:
    'Vui lòng nhập thông tin chính xác để hệ thống có thể kết nối tự động.',
  steps: [
    'Đăng nhập thành công trên ứng dụng điện thoại trước khi thêm vào hệ thống.',
    'Kiểm tra đúng tên đăng nhập, mật khẩu và số tài khoản nhận giao dịch.',
    'Không đóng trang trong khi hệ thống đang kiểm tra kết nối.',
  ],
});
const guides: Record<string, Guide> = {
  acb: generic('ACB'),
  bidv: generic('BIDV'),
  mbbank: generic('MBBank'),
  paypal: generic('PayPal'),
  seabank: generic('SeABank'),
  viettel: generic('Viettel Money'),
  viettin: generic('VietinBank'),
  vpbank: {
    title: 'Hướng dẫn thêm tài khoản VPBank',
    intro:
      'Đăng nhập VPBank NEO và xác thực thiết bị để hệ thống đồng bộ giao dịch.',
    steps: [
      'Nhập tên đăng nhập, mật khẩu và số tài khoản VPBank.',
      'Nếu VPBank gửi OTP, nhập mã trong vòng 10 phút.',
      'Không đăng nhập đồng thời trên trình duyệt khác khi đang kết nối.',
    ],
  },
  ocb: {
    title: 'Hướng dẫn thêm tài khoản OCB',
    intro:
      'Sau khi gửi thông tin, hệ thống sẽ tự động đăng nhập và đồng bộ lịch sử giao dịch.',
    steps: [
      'Thông tin đăng nhập chỉ được dùng để lấy lịch sử giao dịch và khởi tạo lại phiên OCB.',
      'Nếu OCB yêu cầu xác minh thiết bị, hãy nhập OTP được gửi về điện thoại.',
      'Không đăng nhập đồng thời trên thiết bị khác trong lúc kết nối.',
    ],
  },
  techcombank: {
    title: 'Hướng dẫn thêm tài khoản Techcombank',
    intro: 'Bạn chỉ có khoảng 10 giây để xác thực thiết bị.',
    steps: [
      'Mở sẵn ứng dụng Techcombank trên điện thoại.',
      'Nhấn kết nối rồi xác thực thiết bị ngay khi ứng dụng yêu cầu.',
      'Nếu hết thời gian, chờ một lúc rồi thực hiện lại.',
    ],
  },
  tpbank: {
    title: 'Hướng dẫn thêm tài khoản TPBank',
    intro: 'Hãy kiểm tra đăng nhập Internet Banking trước khi kết nối.',
    steps: [
      'Truy cập TPBank eBank và kiểm tra tài khoản đăng nhập được.',
      'Mở ứng dụng TPBank để sẵn sàng xác minh khuôn mặt.',
      'Bạn có tối đa khoảng 30 giây để hoàn tất xác thực.',
    ],
    links: [
      { label: 'Mở TPBank eBank', url: 'https://ebank.tpb.vn/retail/vX/' },
    ],
  },
  vietcombank: {
    title: 'Hướng dẫn thêm tài khoản Vietcombank',
    intro: 'Bạn phải mở quyền đăng nhập VCB Digibank trên web trước khi thêm.',
    steps: [
      'Mở ứng dụng VCB Digibank.',
      'Vào Tiện ích → Cài đặt → Cài đặt chung.',
      'Chọn Quản lý đăng nhập kênh → Cài đặt đăng nhập VCB Digibank trên web.',
    ],
    images: [
      {
        src: 'https://thueapibank.vn/assets/images/hdvcb1.jpg',
        alt: 'Hướng dẫn mở đăng nhập VCB Digibank trên web bước 1',
      },
      {
        src: 'https://thueapibank.vn/assets/images/hdvcb2.jpg',
        alt: 'Hướng dẫn mở đăng nhập VCB Digibank trên web bước 2',
      },
    ],
    danger:
      'Nếu chưa mở đăng nhập web, hệ thống sẽ không thể kết nối tài khoản.',
  },
  binance: {
    title: 'Hướng dẫn lấy API Binance Pay',
    intro:
      'Để hệ thống có thể đọc lịch sử giao dịch Binance Pay của bạn, vui lòng cấu hình API Key chính xác.',
    steps: [
      'Đăng nhập tài khoản Binance của bạn.',
      'Truy cập phần Quản Lý API (API Management) dưới trình đơn tài khoản.',
      'Tạo một API Key mới (Chọn API do hệ thống tạo).',
      'Trong cài đặt hạn chế quyền, bật quyền Đọc dữ liệu (Enable Reading) và kích hoạt phân hệ Binance Pay API (sapi).',
      'Lưu lại API Key & Secret Key và nhập vào biểu mẫu bên cạnh để kết nối.',
    ],
    danger: 'Không bật quyền rút tiền hoặc giao dịch cho API Key này.',
  },
  trc20: {
    title: 'Hướng dẫn thêm ví TRC20',
    intro: 'Nhập đúng địa chỉ ví USDT thuộc mạng TRON (TRC20).',
    steps: [
      'Mở ví Binance, Trust Wallet hoặc ví đang sử dụng.',
      'Chọn nhận USDT và chọn đúng mạng TRON (TRC20).',
      'Sao chép địa chỉ ví nhận tiền rồi dán vào biểu mẫu.',
    ],
    danger: 'Gửi sai mạng có thể làm mất tài sản và không thể khôi phục.',
  },
  bep20: {
    title: 'Hướng dẫn thêm ví BEP20',
    intro: 'Nhập đúng địa chỉ ví USDT thuộc mạng BNB Smart Chain (BEP20).',
    steps: [
      'Mở Binance, Trust Wallet hoặc MetaMask.',
      'Chọn nhận USDT (Tether US).',
      'Chọn chính xác mạng BNB Smart Chain (BEP20).',
      'Sao chép địa chỉ ví nhận tiền và dán vào biểu mẫu.',
    ],
    danger: 'Không sử dụng địa chỉ thuộc mạng TRC20 hoặc ERC20.',
  },
  zalopay: {
    title: 'Hướng dẫn lấy Cookies ZaloPay thủ công',
    intro: 'ZaloPay được kết nối bằng Cookies lấy từ phiên đăng nhập web.',
    steps: [
      'Đăng nhập tài khoản Zalo trên Zalo Web.',
      'Mở trang ZaloPay Personal.',
      'Mở endpoint tạo QR rồi nhấn F12 để sao chép Cookie từ request.',
    ],
    links: [
      { label: '1. Đăng nhập Zalo Web', url: 'https://chat.zalo.me' },
      {
        label: '2. Mở ZaloPay Personal',
        url: 'https://social.zalopay.vn/spa/v2/personal',
      },
      {
        label: '3. Mở endpoint lấy Cookie',
        url: 'https://sapi.zalopay.vn/v1/mt/flex-qrcode/generate',
      },
      {
        label: 'Xem video hướng dẫn',
        url: 'https://drive.google.com/file/d/1KbS9ndcC63hiAHbOqQhGUcnOvg3nn5a-/view?usp=sharing',
      },
    ],
    danger: 'Cookie là dữ liệu riêng tư. Không gửi Cookie cho người khác.',
  },
};
const otpActions: Record<string, { first: string; second: string }> = {
  viettel: { first: 'GETOTP', second: 'CHECKOTP' },
  vietcombank: { first: 'GETOTP', second: 'LOGIN' },
  bidv: { first: 'GETOTP', second: 'LOGIN' },
  ocb: { first: 'LOGIN', second: 'SUBMIT_OTP' },
  vpbank: { first: 'LOGIN', second: 'SUBMIT_OTP' },
};
export default function AddBankAccount() {
  const params = useParams<{ bank: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const bank = banks.find((item) => item.code === params.bank) || banks[0];
  const guide = guides[bank.code];
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [waitingOtp, setWaitingOtp] = useState(false);
  const [saved, setSaved] = useState<Values>({});
  const [otpAction, setOtpAction] = useState('');
  const [loading, setLoading] = useState(false);
  const requestConnect = (
    action: string,
    fields: Values,
    otp = '',
    actionToken = otpAction
  ) =>
    api<CoreResponse>(`/bank-accounts/${bank.code}/connect`, {
      method: 'POST',
      body: JSON.stringify({ action, fields, otp, otp_action: actionToken }),
    });
  const connect = async (action: string, fields: Values, otp = '') => {
    const result = await requestConnect(action, fields, otp);
    if (
      bank.code === 'ocb' &&
      String(result.status) === 'waiting' &&
      result.action
    ) {
      message.info(result.msg || 'Hãy xác nhận đăng nhập trên ứng dụng OCB.');
      return requestConnect('POLL_OTP', fields, '', result.action);
    }
    return result;
  };
  const submit = async (values: Values) => {
    setLoading(true);
    try {
      const flow = otpActions[bank.code];
      const result = await connect(flow?.first || 'LOGIN', values);
      const text = result.msg || result.message || 'Đã xử lý yêu cầu';
      if (
        flow &&
        ((bank.code === 'viettel' && flow.first === 'GETOTP') ||
          result.otp_action ||
          result.action ||
          result.require_otp ||
          String(result.status) === '3')
      ) {
        setSaved(values);
        setOtpAction(result.otp_action || result.action || '');
        setWaitingOtp(true);
        message.info(text);
        return;
      }
      if (
        String(result.status) === '2' ||
        String(result.status) === 'success'
      ) {
        message.success(text);
        router.push(`/dashboard/banks/${bank.code}`);
      } else message.error(text);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không kết nối được ngân hàng'
      );
    } finally {
      setLoading(false);
    }
  };
  const verify = async ({ otp }: { otp: string }) => {
    setLoading(true);
    try {
      const result = await connect(otpActions[bank.code].second, saved, otp);
      const text = result.msg || result.message || 'Đã xác minh';
      if (
        String(result.status) === '2' ||
        String(result.status) === 'success'
      ) {
        message.success(text);
        router.push(`/dashboard/banks/${bank.code}`);
      } else message.error(text);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Xác minh OTP thất bại'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bank-form-page">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => (waitingOtp ? setWaitingOtp(false) : router.back())}
      >
        Quay lại
      </Button>
      <div className="page-title">
        <h1>
          {waitingOtp ? 'Xác Minh OTP' : 'Thêm Tài Khoản'} {bank.name}
        </h1>
        <p>
          {waitingOtp
            ? 'Nhập mã OTP ngân hàng vừa gửi để hoàn tất kết nối.'
            : 'Thông tin sẽ được kiểm tra trực tiếp bằng core ngân hàng gốc.'}
        </p>
      </div>
      <div className="bank-add-layout">
        <Card className="bank-form-card">
          {waitingOtp ? (
            <>
              <Alert
                style={{ marginBottom: 20 }}
                type="info"
                showIcon
                icon={<SafetyCertificateOutlined />}
                title={`Đang chờ OTP ${bank.name}`}
                description="Không đóng trang hoặc đăng nhập ứng dụng ngân hàng trong lúc xác minh."
              />
              <Form form={otpForm} layout="vertical" onFinish={verify}>
                <Form.Item
                  name="otp"
                  label="Mã OTP"
                  rules={[{ required: true, message: 'Vui lòng nhập mã OTP' }]}
                >
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={10}
                    placeholder="Nhập mã OTP gửi về điện thoại"
                  />
                </Form.Item>
                <Button
                  block
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                >
                  Xác nhận OTP
                </Button>
              </Form>
            </>
          ) : (
            <>
              <Alert
                style={{ marginBottom: 20 }}
                type={otpActions[bank.code] ? 'info' : 'warning'}
                showIcon
                title={
                  otpActions[bank.code]
                    ? `${bank.name} có thể yêu cầu OTP khi đăng nhập thiết bị mới.`
                    : 'Đăng nhập trên web có thể làm phiên trên ứng dụng ngân hàng bị đăng xuất.'
                }
              />
              {bank.code === 'zalopay' ? (
                <ZaloPayQrConnect
                  onConnected={() =>
                    router.push(`/dashboard/banks/${bank.code}`)
                  }
                />
              ) : (
                <Form form={form} layout="vertical" onFinish={submit}>
                  {bank.fields.map((field) => (
                    <Form.Item
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      rules={
                        field.required
                          ? [
                              {
                                required: true,
                                message: `Vui lòng nhập ${field.label.toLowerCase()}`,
                              },
                            ]
                          : undefined
                      }
                    >
                      {field.kind === 'textarea' ? (
                        <Input.TextArea
                          rows={6}
                          placeholder={field.placeholder}
                        />
                      ) : field.secret ? (
                        <Input.Password placeholder={field.placeholder} />
                      ) : (
                        <Input placeholder={field.placeholder} />
                      )}
                    </Form.Item>
                  ))}
                  <Form.Item
                    name="agree"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error('Bạn phải đồng ý điều khoản sử dụng')
                              ),
                      },
                    ]}
                  >
                    <Checkbox>
                      Tôi đồng ý điều khoản sử dụng và chính sách bảo mật
                    </Checkbox>
                  </Form.Item>
                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                  >
                    {otpActions[bank.code]
                      ? 'Đăng nhập / Lấy OTP'
                      : 'Kiểm tra và thêm tài khoản'}
                  </Button>
                </Form>
              )}
            </>
          )}
        </Card>
        {guide && (
          <Card
            className="bank-guide-card"
            title={
              <>
                <SafetyCertificateOutlined /> {guide.title}
              </>
            }
          >
            <Alert
              type="warning"
              showIcon
              title="Quan trọng: đọc kỹ hướng dẫn trước khi kết nối."
            />
            <p>{guide.intro}</p>
            {guide.steps && (
              <ol>
                {guide.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
            {guide.images && (
              <div className="bank-guide-images">
                {guide.images.map((image) => (
                  <a
                    key={image.src}
                    href={image.src}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            {guide.links && (
              <div className="bank-guide-links">
                {guide.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            {guide.danger && (
              <Alert type="error" showIcon title={guide.danger} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
