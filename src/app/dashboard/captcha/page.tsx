'use client';
import {
  ApiOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '@/lib/api';
type Service = {
  id: number;
  type: string;
  name: string;
  price: number;
  status: number;
  image?: string;
};
type History = {
  id: number;
  type: string;
  price: number;
  response_text?: string;
  status: string;
  time: number;
};
type CaptchaData = {
  services: Service[];
  history: History[];
  total_solved: number;
  balance: number;
  api_token?: string;
  endpoint: string;
};
type SolveResult = {
  status: string;
  msg: string;
  data?: { captcha: string };
  balance?: number;
};
const logos: Record<string, string> = {
  vietcombank: 'https://cdn.vietqr.io/img/VCB.png',
  mbbank: 'https://cdn.vietqr.io/img/MB.png',
  bidv: 'https://cdn.vietqr.io/img/BIDV.png',
  msb: 'https://cdn.vietqr.io/img/MSB.png',
  eximbank: 'https://cdn.vietqr.io/img/EIB.png',
  vietinbank: 'https://cdn.vietqr.io/img/ICB.png',
};
const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Không thể đọc ảnh Captcha'));
    reader.readAsDataURL(file);
  });
export default function CaptchaPage() {
  const { message } = App.useApp(),
    [data, setData] = useState<CaptchaData | null>(null),
    [loading, setLoading] = useState(true),
    [solving, setSolving] = useState(false),
    [type, setType] = useState(''),
    [fileList, setFileList] = useState<UploadFile[]>([]),
    [result, setResult] = useState<SolveResult | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api<CaptchaData>('/captcha');
      setData(response);
      setType((current) => current || response.services[0]?.type || '');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể tải dịch vụ Captcha'
      );
    } finally {
      setLoading(false);
    }
  }, [message]);
  useEffect(() => {
    load();
  }, [load]);
  const solve = async () => {
    const origin = fileList[0]?.originFileObj;
    if (!type) {
      message.warning('Vui lòng chọn dịch vụ');
      return;
    }
    if (!origin) {
      message.warning('Vui lòng tải ảnh Captcha lên');
      return;
    }
    setSolving(true);
    setResult(null);
    try {
      const base64 = await fileToBase64(origin);
      const response = await api<SolveResult>('/captcha/solve', {
        method: 'POST',
        body: JSON.stringify({ type, base64 }),
      });
      setResult(response);
      message.success(response.msg);
      setFileList([]);
      await load();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Không thể giải Captcha';
      setResult({ status: 'error', msg });
      message.error(msg);
      await load();
    } finally {
      setSolving(false);
    }
  };
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    message.success(`Đã sao chép ${label}`);
  };
  const columns: ColumnsType<History> = [
    {
      title: 'THỜI GIAN',
      dataIndex: 'time',
      width: 180,
      render: (value) => (
        <span className="captcha-time">
          {dayjs.unix(Number(value)).format('HH:mm:ss DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'LOẠI DỊCH VỤ',
      dataIndex: 'type',
      width: 170,
      render: (value) => <Tag>{String(value).toUpperCase()}</Tag>,
    },
    {
      title: 'ĐƠN GIÁ',
      dataIndex: 'price',
      width: 150,
      render: (value) => (
        <b className="captcha-price-out">-{formatMoney(value)}</b>
      ),
    },
    {
      title: 'OUTPUT (KẾT QUẢ)',
      dataIndex: 'response_text',
      render: (value) => (
        <strong className="captcha-output">{value || '—'}</strong>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      width: 150,
      align: 'right',
      render: (value) =>
        value === 'success' ? (
          <span className="captcha-success">
            <CheckCircleFilled /> Thành công
          </span>
        ) : (
          <Tag color="error">Thất bại</Tag>
        ),
    },
  ];
  const serviceCards = useMemo(
    () =>
      (data?.services || []).map((service) => (
        <Card key={service.id} className="captcha-service" variant="borderless">
          <div className="captcha-service-head">
            <span>
              <img
                src={
                  service.image ||
                  logos[service.type.toLowerCase()] ||
                  logos.vietcombank
                }
                alt={service.name}
              />
            </span>
            <div>
              <small>GIẢI CAPTCHA</small>
              <h3>{service.name}</h3>
            </div>
          </div>
          <ul>
            <li>
              <CheckCircleFilled /> Xử lý tự động 100% qua API
            </li>
            <li>
              <ThunderboltOutlined /> Tốc độ siêu nhanh (0.1S - 1S)
            </li>
            <li>
              <RobotOutlined /> Độ chính xác khoảng 99.9%
            </li>
          </ul>
          <div className="captcha-service-foot">
            <div>
              <small>ĐƠN GIÁ</small>
              <strong>
                {formatMoney(service.price)} <em>/ lượt</em>
              </strong>
            </div>
            <Tag color="success">● Hoạt động</Tag>
          </div>
        </Card>
      )),
    [data?.services]
  );
  if (loading && !data)
    return (
      <div className="captcha-loading">
        <Spin size="large" />
      </div>
    );
  return (
    <div className="captcha-page">
      <div className="captcha-hero">
        <div>
          <span>DỊCH VỤ TỰ ĐỘNG</span>
          <h1>Dịch vụ Giải Captcha</h1>
          <p>Hệ thống giải Captcha ngân hàng tự động siêu tốc 100% qua API.</p>
        </div>
        <div className="captcha-balance">
          <RobotOutlined />
          <span>
            <small>SỐ DƯ KHẢ DỤNG</small>
            <strong>{formatMoney(data?.balance)}</strong>
          </span>
        </div>
      </div>
      <Tabs
        className="captcha-tabs"
        defaultActiveKey="services"
        items={[
          {
            key: 'services',
            label: (
              <span>
                <RobotOutlined /> Bảng giá dịch vụ
              </span>
            ),
            children: serviceCards.length ? (
              <div className="captcha-service-grid">{serviceCards}</div>
            ) : (
              <Card>
                <Empty description="Hệ thống đang cập nhật dịch vụ giải Captcha" />
              </Card>
            ),
          },
          {
            key: 'api',
            label: (
              <span>
                <ApiOutlined /> Tài liệu & Test API
              </span>
            ),
            children: (
              <div className="captcha-api-grid">
                <Card
                  className="captcha-api-doc"
                  title={
                    <Space>
                      <CodeOutlined />
                      TÍCH HỢP API
                    </Space>
                  }
                  variant="borderless"
                >
                  <div className="captcha-endpoint-title">
                    <div>
                      <b>API Endpoint</b>
                      <small>Endpoint chung cho tất cả dịch vụ</small>
                    </div>
                  </div>
                  <div className="captcha-copy-row endpoint">
                    <Tag color="blue">POST</Tag>
                    <code>{data?.endpoint}</code>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copy(data?.endpoint || '', 'endpoint')}
                    />
                  </div>
                  <h4>ACCESS TOKEN</h4>
                  <div className="captcha-copy-row">
                    <span>••••••••••••••••••••••••</span>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copy(data?.api_token || '', 'token')}
                    />
                  </div>
                  <h4>REQUEST BODY (JSON)</h4>
                  <Table
                    pagination={false}
                    size="small"
                    rowKey="name"
                    dataSource={[
                      {
                        name: 'access_token',
                        type: 'string',
                        description: 'Token API của tài khoản',
                      },
                      {
                        name: 'type',
                        type: 'string',
                        description: 'Mã loại ngân hàng/dịch vụ',
                      },
                      {
                        name: 'base64',
                        type: 'string',
                        description: 'Ảnh Captcha dạng Base64',
                      },
                    ]}
                    columns={[
                      { dataIndex: 'name', render: (value) => <b>{value}</b> },
                      {
                        dataIndex: 'type',
                        render: (value) => <Tag>{value}</Tag>,
                      },
                      { dataIndex: 'description' },
                    ]}
                    showHeader={false}
                  />
                  <h4>DANH SÁCH TYPE</h4>
                  <Table
                    pagination={false}
                    size="small"
                    rowKey="type"
                    dataSource={data?.services}
                    columns={[
                      {
                        dataIndex: 'type',
                        render: (value) => <code>{value}</code>,
                      },
                      { dataIndex: 'name' },
                    ]}
                    showHeader={false}
                  />
                </Card>
                <Card
                  className="captcha-test-card"
                  title={
                    <Space>
                      <SendOutlined />
                      TEST API TRỰC TIẾP
                    </Space>
                  }
                  variant="borderless"
                >
                  <label>1. Chọn dịch vụ (type)</label>
                  <Select
                    value={type || undefined}
                    onChange={setType}
                    placeholder="Chọn dịch vụ"
                    options={data?.services.map((service) => ({
                      value: service.type,
                      label: `${service.name} (${service.type})`,
                    }))}
                  />
                  <label>2. Tải ảnh Captcha lên</label>
                  <Upload.Dragger
                    accept="image/*"
                    maxCount={1}
                    fileList={fileList}
                    beforeUpload={() => false}
                    onChange={({ fileList: files }) =>
                      setFileList(files.slice(-1))
                    }
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p>Nhấn hoặc kéo ảnh vào đây</p>
                    <small>
                      PNG, JPG, JPEG; ảnh được chuyển Base64 khi gửi
                    </small>
                  </Upload.Dragger>
                  <Button
                    block
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    loading={solving}
                    onClick={solve}
                  >
                    Gửi yêu cầu giải Captcha
                  </Button>
                  <label>Kết quả trả về</label>
                  <pre className={result?.status === 'error' ? 'error' : ''}>
                    {result
                      ? JSON.stringify(result, null, 2)
                      : 'Đang chờ yêu cầu...'}
                  </pre>
                </Card>
              </div>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> Lịch sử giải
              </span>
            ),
            children: (
              <Card
                className="captcha-history-card"
                title={
                  <Space>
                    <HistoryOutlined />
                    LỊCH SỬ GIẢI eCAPTCHA
                  </Space>
                }
                extra={
                  <div className="captcha-total">
                    <ClockCircleOutlined />
                    <span>
                      <small>TỔNG LƯỢT GIẢI</small>
                      <b>{data?.total_solved || 0} lượt</b>
                    </span>
                  </div>
                }
                variant="borderless"
              >
                <Table
                  rowKey="id"
                  dataSource={data?.history || []}
                  columns={columns}
                  scroll={{ x: 900 }}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50],
                    placement: ['bottomStart'],
                  }}
                  locale={{
                    emptyText: (
                      <Empty description="Bạn chưa thực hiện yêu cầu giải Captcha nào" />
                    ),
                  }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
