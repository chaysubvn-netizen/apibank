'use client';

import {
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  EyeOutlined,
  LoginOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '@/lib/api';

type AccountLimit = {
  limit: number;
  used: number;
  remaining: number;
  can_add: boolean;
};
type Account = {
  id: number;
  bank_code: string;
  display_name?: string;
  login_account?: string;
  account_number?: string;
  phone?: string;
  username?: string;
  name?: string;
  balance?: number | string;
  sodu?: number | string;
  time?: number | string;
  create_date?: string;
  created_at?: string;
  [key: string]: unknown;
};
type ReloginResponse = {
  status?: string | number;
  message?: string;
  msg?: string;
  require_otp?: boolean;
  otp_action?: string;
  action?: string;
};
export type Field = {
  name: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  required?: boolean;
  kind?: 'textarea';
};
export type Bank = { code: string; name: string; fields: Field[] };
const loginFields: Field[] = [
  {
    name: 'username',
    label: 'Tài khoản đăng nhập',
    placeholder: 'Nhập tài khoản',
    required: true,
  },
  {
    name: 'password',
    label: 'Mật khẩu',
    placeholder: 'Nhập mật khẩu',
    secret: true,
    required: true,
  },
  {
    name: 'account',
    label: 'Số tài khoản',
    placeholder: 'Nhập số tài khoản',
    required: true,
  },
];
export const banks: Bank[] = [
  { code: 'acb', name: 'ACB', fields: loginFields },
  {
    code: 'viettel',
    name: 'Viettel Money',
    fields: [
      {
        name: 'phone',
        label: 'Tài khoản Viettel Money',
        placeholder: 'Nhập số điện thoại',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu',
        placeholder: 'Nhập mật khẩu',
        secret: true,
        required: true,
      },
    ],
  },
  {
    code: 'viettin',
    name: 'VietinBank',
    fields: [
      {
        name: 'phone',
        label: 'Tài khoản đăng nhập',
        placeholder: 'Nhập tài khoản',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu',
        placeholder: 'Nhập mật khẩu',
        secret: true,
        required: true,
      },
      {
        name: 'accountNo',
        label: 'Số tài khoản',
        placeholder: 'Nhập số tài khoản',
        required: true,
      },
    ],
  },
  {
    code: 'mbbank',
    name: 'Mbbank',
    fields: [
      {
        name: 'phone',
        label: 'Tên đăng nhập ứng dụng MB',
        placeholder: 'Tên đăng nhập ứng dụng MB',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu ứng dụng MB',
        placeholder: 'Mật khẩu ứng dụng MB',
        secret: true,
        required: true,
      },
      {
        name: 'stk',
        label: 'Số tài khoản MBBank',
        placeholder: 'Nhập số tài khoản MBBank',
        required: true,
      },
    ],
  },
  {
    code: 'ocb',
    name: 'OCB',
    fields: [
      {
        name: 'token_auth',
        label: 'Tên đăng nhập OCB',
        placeholder: 'Vui lòng nhập tên đăng nhập OCB',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu OCB',
        placeholder: 'Vui lòng nhập mật khẩu OCB',
        secret: true,
        required: true,
      },
      {
        name: 'account',
        label: 'Số tài khoản OCB',
        placeholder: 'Vui lòng nhập số tài khoản OCB',
        required: true,
      },
    ],
  },
  { code: 'vpbank', name: 'VPBank', fields: loginFields },
  { code: 'vietcombank', name: 'Vietcombank', fields: loginFields },
  { code: 'bidv', name: 'BIDV', fields: loginFields },
  {
    code: 'thesieure',
    name: 'Thesieure',
    fields: [
      {
        name: 'usernametsr',
        label: 'Tài khoản Thesieure',
        placeholder: 'Vui lòng nhập chính xác tài khoản thesieure',
        required: true,
      },
      {
        name: 'cookie',
        label: 'Cookie đăng nhập',
        placeholder: 'Vui lòng nhập chính xác cookie',
        secret: true,
        kind: 'textarea',
        required: true,
      },
    ],
  },
  { code: 'techcombank', name: 'Techcombank', fields: loginFields },
  {
    code: 'seabank',
    name: 'Seabank',
    fields: [
      {
        name: 'phone',
        label: 'Tài khoản đăng nhập',
        placeholder: 'Nhập tài khoản',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu',
        placeholder: 'Nhập mật khẩu',
        secret: true,
        required: true,
      },
      {
        name: 'accountNumber',
        label: 'Số tài khoản',
        placeholder: 'Nhập số tài khoản',
        required: true,
      },
    ],
  },
  {
    code: 'tpbank',
    name: 'TPBank',
    fields: [
      {
        name: 'phone',
        label: 'Tài khoản đăng nhập',
        placeholder: 'Nhập tài khoản',
        required: true,
      },
      {
        name: 'password',
        label: 'Mật khẩu',
        placeholder: 'Nhập mật khẩu',
        secret: true,
        required: true,
      },
      {
        name: 'stk',
        label: 'Số tài khoản',
        placeholder: 'Nhập số tài khoản',
        required: true,
      },
    ],
  },
  {
    code: 'binance',
    name: 'Binance Pay',
    fields: [
      {
        name: 'name',
        label: 'Tên tài khoản',
        placeholder: 'Ví dụ: BINANCE_CHINH',
        required: true,
      },
      {
        name: 'username',
        label: 'Binance API Key',
        placeholder: 'Nhập Binance API Key',
        required: true,
      },
      {
        name: 'password',
        label: 'Binance API Secret',
        placeholder: 'Nhập Binance API Secret',
        secret: true,
        required: true,
      },
      {
        name: 'account',
        label: 'Email Binance',
        placeholder: 'Nhập email Binance',
      },
    ],
  },
  {
    code: 'trc20',
    name: 'TRC20 (USDT)',
    fields: [
      {
        name: 'name',
        label: 'Tên ví',
        placeholder: 'Ví dụ: Ví USDT cá nhân',
        required: true,
      },
      {
        name: 'account',
        label: 'Địa chỉ ví TRC20',
        placeholder: 'Ví dụ: TXXMADRkewAoxuwDijt9byS1cRzaFSZoAw',
        required: true,
      },
    ],
  },
  {
    code: 'bep20',
    name: 'BEP20 (USDT)',
    fields: [
      {
        name: 'name',
        label: 'Tên ví',
        placeholder: 'Ví dụ: Ví USDT cá nhân',
        required: true,
      },
      {
        name: 'account',
        label: 'Địa chỉ ví BEP20',
        placeholder: 'Ví dụ: 0x8894E0a0c962CB723c1976A4421c95949bE2D4E3',
        required: true,
      },
    ],
  },
  {
    code: 'paypal',
    name: 'PayPal',
    fields: [
      {
        name: 'account',
        label: 'Email PayPal',
        placeholder: 'Nhập Email Paypal',
        required: true,
      },
      {
        name: 'client_id',
        label: 'Client ID',
        placeholder: 'Nhập Client ID',
        required: true,
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        placeholder: 'Nhập Client Secret',
        secret: true,
        required: true,
      },
    ],
  },
  {
    code: 'zalopay',
    name: 'ZaloPay',
    fields: [
      {
        name: 'account',
        label: 'Tài khoản ZaloPay',
        placeholder: 'Nhập số điện thoại',
        required: true,
      },
      {
        name: 'cookie',
        label: 'Cookies ZaloPay',
        placeholder: 'Nhập chính xác Cookies đã lấy được theo hướng dẫn',
        secret: true,
        kind: 'textarea',
        required: true,
      },
    ],
  },
];
const balanceOf = (row: Account) => [row.balance, row.sodu, row.SoDu, row.availableBalance, row.balanceAval].find((value) => value !== null && value !== undefined && value !== "");
const money = (value: unknown) => value === null || value === undefined || value === "" ? "Chưa cập nhật" : formatMoney(Number(value) || 0);
const addedAt = (row: Account) => {
  const value = row.create_date || row.created_at || row.time;
  if (!value) return '—';
  const date =
    typeof value === 'number' || /^\d+$/.test(String(value))
      ? new Date(Number(value) * 1000)
      : new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('vi-VN');
};

type OtpConfig = {
  label: string;
  placeholder: string;
  pattern: RegExp;
  message: string;
  maxLength: number;
  inputMode: 'numeric' | 'text';
};
const numericOtp: OtpConfig = {
  label: 'Mã OTP',
  placeholder: 'Nhập mã OTP',
  pattern: /^\d{4,10}$/,
  message: 'Mã OTP gồm từ 4 đến 10 chữ số',
  maxLength: 10,
  inputMode: 'numeric',
};
const otpConfigs: Record<string, OtpConfig> = {
  vpbank: {
    label: 'Mã xác thực VPBank',
    placeholder: 'Ví dụ: HKV7JAFXB4',
    pattern: /^[A-Za-z0-9]{4,16}$/,
    message: 'Mã VPBank gồm từ 4 đến 16 ký tự chữ hoặc số',
    maxLength: 16,
    inputMode: 'text',
  },
  ocb: numericOtp,
  bidv: numericOtp,
  vietcombank: numericOtp,
  viettel: numericOtp,
  mbbank: numericOtp,
  techcombank: {
    label: 'Mã xác thực / mật khẩu',
    placeholder: 'Nhập thông tin Techcombank yêu cầu',
    pattern: /^.{4,64}$/,
    message: 'Thông tin xác thực gồm từ 4 đến 64 ký tự',
    maxLength: 64,
    inputMode: 'text',
  },
};
const otpConfigFor = (bankCode?: string): OtpConfig =>
  otpConfigs[bankCode || ''] || {
    label: 'Mã xác thực',
    placeholder: 'Nhập mã ngân hàng cung cấp',
    pattern: /^[A-Za-z0-9]{4,32}$/,
    message: 'Mã xác thực gồm từ 4 đến 32 ký tự chữ hoặc số',
    maxLength: 32,
    inputMode: 'text',
  };
export function BankGatewayContent({ bankCode }: { bankCode?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountLimit, setAccountLimit] = useState<AccountLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Account | null>(null);
  const [editingCookie, setEditingCookie] = useState<Account | null>(null);
  const [reloginAccount, setReloginAccount] = useState<Account | null>(null);
  const [otpAction, setOtpAction] = useState('');
  const [busyAccountId, setBusyAccountId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [cookieForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const selected = useMemo(
    () =>
      banks.find(
        (bank) => bank.code === (bankCode || params.get('bank') || 'acb')
      ) || banks[0],
    [bankCode, params]
  );
  const load = useCallback(
    async (show = true) => {
      if (show) setLoading(true);
      try {
        const result = await api<{
          data: Account[];
          account_limit: AccountLimit;
        }>(`/bank-accounts?bank=${encodeURIComponent(selected.code)}`);
        setAccounts(result.data);
        setAccountLimit(result.account_limit);
      } finally {
        if (show) setLoading(false);
      }
    },
    [selected.code]
  );
  useEffect(() => {
    let active = true;
    api<{ data: Account[]; account_limit: AccountLimit }>(
      `/bank-accounts?bank=${encodeURIComponent(selected.code)}`
    )
      .then((result) => {
        if (active) {
          setAccounts(result.data);
          setAccountLimit(result.account_limit);
        }
      })
      .catch((error) => {
        if (active)
          message.error(
            error instanceof Error
              ? error.message
              : 'Không tải được giới hạn gói API'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [message, selected.code]);
  const rows = useMemo(
    () => accounts.filter((row) => row.bank_code === selected.code),
    [accounts, selected.code]
  );
  const add = async (values: Record<string, string>) => {
    await api('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify({ bank_code: selected.code, ...values }),
    });
    message.success(`Đã thêm tài khoản ${selected.name}`);
    setAdding(false);
    form.resetFields();
    await load(false);
  };
  const remove = async (row: Account) => {
    await api(`/bank-accounts/${row.bank_code}/${row.id}`, {
      method: 'DELETE',
    });
    message.success('Đã xóa tài khoản');
    await load(false);
  };
  const confirmRemove = (row: Account) =>
    modal.confirm({
      centered: true,
      width: 480,
      className: 'bank-delete-confirm',
      title: 'Xóa tài khoản này?',
      content:
        'Tài khoản ngân hàng và dữ liệu liên kết sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.',
      okText: 'Xóa tài khoản',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, size: 'large' },
      cancelButtonProps: { size: 'large' },
      onOk: () => remove(row),
    });
  const refreshBalance = async (row: Account) => {
    if (busyAccountId !== null) {
      message.warning(
        'Một thao tác ngân hàng đang chạy. Vui lòng chờ hoàn tất.'
      );
      return;
    }
    setBusyAccountId(row.id);
    const hide = message.loading(`Đang cập nhật số dư ${selected.name}...`, 0);
    try {
      const result = await api<{ message: string; balance: number }>(
        `/bank-accounts/${row.bank_code}/${row.id}/balance`,
        { method: 'POST' }
      );
      message.success(result.message);
      await load(false);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không cập nhật được số dư'
      );
    } finally {
      hide();
      setBusyAccountId(null);
    }
  };
  const closeRelogin = () => {
    setReloginAccount(null);
    setOtpAction('');
    otpForm.resetFields();
  };
  const relogin = async (row: Account, body?: Record<string, string>) => {
    if (busyAccountId !== null) {
      message.warning(
        'Một thao tác ngân hàng đang chạy. Vui lòng chờ hoàn tất.'
      );
      return;
    }
    setBusyAccountId(row.id);
    const hide = message.loading(`Đang đăng nhập lại ${selected.name}...`, 0);
    try {
      let result = await api<ReloginResponse>(
        `/bank-accounts/${row.bank_code}/${row.id}/relogin`,
        { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) }
      );
      if (
        row.bank_code === 'ocb' &&
        String(result.status) === 'waiting' &&
        result.action
      ) {
        result = await api<ReloginResponse>(
          `/bank-accounts/${row.bank_code}/${row.id}/relogin`,
          {
            method: 'POST',
            body: JSON.stringify({
              action: 'POLL_OTP',
              otp_action: result.action,
            }),
          }
        );
      }
      const text = result.message || result.msg || 'Đã xử lý yêu cầu';
      if (
        result.require_otp ||
        String(result.status) === 'otp' ||
        String(result.status) === '3'
      ) {
        setReloginAccount(row);
        setOtpAction(result.otp_action || result.action || '');
        message.info(text);
        return;
      }
      if (String(result.status) === '1') throw new Error(text);
      message.success(text);
      setEditingCookie(null);
      cookieForm.resetFields();
      closeRelogin();
      await load(false);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không thể đăng nhập lại'
      );
    } finally {
      hide();
      setBusyAccountId(null);
    }
  };
  const otpConfig = otpConfigFor(reloginAccount?.bank_code);
  const verifyReloginOtp = ({ otp }: { otp: string }) => {
    if (!reloginAccount) return;
    const action = reloginAccount.bank_code === 'bidv' ? 'LOGIN' : 'SUBMIT_OTP';
    return relogin(reloginAccount, { action, otp, otp_action: otpAction });
  };
  const confirmRelogin = (row: Account) => {
    if (['thesieure', 'zalopay'].includes(row.bank_code)) {
      cookieForm.resetFields();
      setEditingCookie(row);
      return;
    }
    modal.confirm({
      centered: true,
      title: `Đăng nhập lại ${selected.name}?`,
      content:
        selected.code === 'techcombank'
          ? 'Mở ứng dụng Techcombank trên điện thoại ngay sau khi bấm Tiếp tục và duyệt yêu cầu đăng nhập trong vòng 40 giây.'
          : 'Hệ thống sẽ dùng thông tin đã lưu để tạo lại phiên đăng nhập. Nếu ngân hàng yêu cầu OTP, ô nhập mã sẽ tự động hiển thị.',
      okText: 'Tiếp tục',
      cancelText: 'Hủy',
      onOk: () =>
        relogin(row, {
          action: ['ocb', 'vpbank'].includes(row.bank_code)
            ? 'LOGIN'
            : 'GETOTP',
        }),
    });
  };
  const openHistory = (row: Account) =>
    router.push(`/dashboard/banks/${selected.code}/history/${row.id}`);
  const sync = async () => {
    await load(false);
    message.success(`Đã làm mới dữ liệu ${selected.name}`);
  };
  const genericColumns: ColumnsType<Account> = [
    {
      title: 'TÀI KHOẢN',
      dataIndex: 'login_account',
      render: (_, r) => (
        <b>{r.login_account || r.username || r.phone || '—'}</b>
      ),
    },
    {
      title: 'SỐ TÀI KHOẢN',
      render: (_, r) => <b>{r.account_number || '—'}</b>,
    },
    {
      title: 'CHỦ TÀI KHOẢN',
      render: (_, r) => <b>{r.name || r.display_name || '—'}</b>,
    },
    {
      title: 'SỐ DƯ',
      render: (_, r) => { const balance = balanceOf(r); return <Tag color={balance === undefined ? "default" : "success"}>{money(balance)}</Tag> },
    },
    { title: 'THỜI GIAN THÊM', render: (_, r) => <b>{addedAt(r)}</b> },
    {
      title: 'THAO TÁC',
      align: 'right',
      width: 250,
      render: (_, r) => {
        const supportsBankActions = !['trc20', 'bep20', 'binance'].includes(
          r.bank_code
        );
        const rowBusy = busyAccountId === r.id;
        return (
          <Space>
            {supportsBankActions && r.bank_code !== 'thesieure' && (
              <Tooltip title="Cập nhật số dư">
                <Button
                  aria-label="Cập nhật số dư"
                  disabled={busyAccountId !== null}
                  loading={rowBusy}
                  shape="circle"
                  className="balance-action"
                  icon={<DollarCircleOutlined />}
                  onClick={() => refreshBalance(r)}
                />
              </Tooltip>
            )}
            {supportsBankActions && (
              <Tooltip
                title={
                  ['thesieure', 'zalopay'].includes(r.bank_code)
                    ? 'Sửa cookie đăng nhập'
                    : 'Đăng nhập lại tài khoản'
                }
              >
                <Button
                  aria-label="Cập nhật phiên đăng nhập"
                  shape="circle"
                  className="relogin-action"
                  disabled={busyAccountId !== null}
                  icon={
                    ['thesieure', 'zalopay'].includes(r.bank_code) ? (
                      <EditOutlined />
                    ) : (
                      <LoginOutlined />
                    )
                  }
                  onClick={() => confirmRelogin(r)}
                />
              </Tooltip>
            )}
            <Tooltip title="Xem lịch sử giao dịch">
              <Button
                aria-label="Xem lịch sử giao dịch"
                shape="circle"
                className="history-action"
                disabled={busyAccountId !== null}
                icon={<ReloadOutlined />}
                onClick={() => openHistory(r)}
              />
            </Tooltip>
            <Tooltip title="Xem thông tin tài khoản">
              <Button
                aria-label="Xem thông tin tài khoản"
                shape="circle"
                className="view-action"
                disabled={busyAccountId !== null}
                icon={<EyeOutlined />}
                onClick={() =>
                  router.push(
                    `/dashboard/banks/${selected.code}/account/${r.id}`
                  )
                }
              />
            </Tooltip>
            <Tooltip title="Xóa tài khoản">
              <Button
                aria-label="Xóa tài khoản"
                shape="circle"
                danger
                type="primary"
                disabled={busyAccountId !== null}
                icon={<DeleteOutlined />}
                onClick={() => confirmRemove(r)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];
  const cryptoGateway = ['binance', 'trc20', 'bep20'].includes(selected.code);
  const columns: ColumnsType<Account> =
    selected.code === 'thesieure'
      ? [
          { ...genericColumns[0], title: 'TÊN ĐĂNG NHẬP' },
          { ...genericColumns[2], title: 'TÊN TÀI KHOẢN' },
          genericColumns[3],
          {
            title: 'TRẠNG THÁI COOKIE',
            render: (_, r) => (
              <Tag color={Number(r.status) === 1 ? 'success' : 'error'}>
                {Number(r.status) === 1 ? 'Hoạt động' : 'Hết hạn'}
              </Tag>
            ),
          },
          genericColumns[4],
          genericColumns[5],
        ]
      : cryptoGateway
        ? [
            {
              title: 'TÀI KHOẢN',
              render: (_, r) => (
                <b>
                  {String(
                    r.account_number || r.account || r.login_account || '—'
                  )}
                </b>
              ),
            },
            {
              title: 'TOKEN',
              render: (_, r) => (
                <b className="transaction-code">{String(r.api_token || '—')}</b>
              ),
            },
            { title: 'CẬP NHẬT PHIÊN', render: (_, r) => <b>{addedAt(r)}</b> },
            {
              title: 'TRẠNG THÁI',
              render: () => <Switch size="small" checked disabled />,
            },
            genericColumns[5],
          ]
        : genericColumns;
  return (
    <div className="bank-manager">
      <div className="bank-page-head">
        <div>
          <h1>Cổng Thanh Toán {selected.name}</h1>
          <p>Đăng Nhập Trên Web Thì Trên App Sẽ Bị Văng.</p>
        </div>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={sync}>
            Cập nhật tất cả
          </Button>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            loading={loading && !accountLimit}
            onClick={() => {
              if (!accountLimit) {
                message.info('Đang tải giới hạn gói API, vui lòng thử lại.');
                load();
                return;
              }
              accountLimit.can_add
                ? router.push(`/dashboard/banks/${selected.code}/add`)
                : message.warning(
                    `Gói hiện tại chỉ cho phép ${accountLimit.limit} tài khoản ngân hàng. Bạn đang sử dụng ${accountLimit.used}/${accountLimit.limit} tài khoản.`
                  );
            }}
          >
            Thêm tài khoản
          </Button>
        </Space>
      </div>
      {selected.code === 'techcombank' && (
        <div className="techcombank-session-notice">
          <Alert
            type="error"
            showIcon
            title="Techcombank yêu cầu đăng nhập lại sau mỗi 12 giờ."
          />
          <Alert
            type="error"
            showIcon
            title="Khi API báo “Token is not active” hoặc phiên đã hết hạn, hãy bấm nút Đăng nhập lại, mở ứng dụng Techcombank và duyệt yêu cầu trong vòng 40 giây. Sau khi duyệt thành công, hệ thống sẽ tự duy trì token."
          />
        </div>
      )}
      <Card
        className="bank-list-card"
        title={
          <Space>
            <UnorderedListOutlined />
            <b>Danh Sách Ngân Hàng Của Bạn</b>
          </Space>
        }
        variant="borderless"
      >
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: (
                <Empty description={`Chưa có tài khoản ${selected.name}`} />
              ),
            }}
          />
        </Spin>
      </Card>
      <Modal
        title={`Thêm tài khoản ${selected.name}`}
        open={adding}
        footer={null}
        onCancel={() => setAdding(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={add}>
          {selected.fields.map((field) => (
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
                <Input.TextArea rows={5} placeholder={field.placeholder} />
              ) : field.secret ? (
                <Input.Password placeholder={field.placeholder} />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}
          <Button block type="primary" htmlType="submit">
            Kết nối tài khoản
          </Button>
        </Form>
      </Modal>
      <Modal
        title={`Cập nhật cookie ${editingCookie?.bank_code === 'thesieure' ? 'THESIEURE' : 'ZaloPay'}`}
        open={!!editingCookie}
        footer={null}
        onCancel={() => {
          setEditingCookie(null);
          cookieForm.resetFields();
        }}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          title="Cookie mới sẽ được kiểm tra trực tiếp trước khi thay thế cookie cũ."
          style={{ marginBottom: 16 }}
        />
        <Form
          form={cookieForm}
          layout="vertical"
          onFinish={({ cookie }) =>
            editingCookie && relogin(editingCookie, { cookie })
          }
        >
          <Form.Item
            name="cookie"
            label="Cookie đăng nhập mới"
            rules={[{ required: true, message: 'Vui lòng nhập cookie mới' }]}
          >
            <Input.TextArea
              rows={7}
              placeholder="Dán toàn bộ chuỗi Cookie lấy từ trình duyệt"
            />
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            loading={editingCookie ? busyAccountId === editingCookie.id : false}
          >
            Kiểm tra và cập nhật cookie
          </Button>
        </Form>
      </Modal>{' '}
      <Modal
        title="Chi tiết tài khoản"
        open={!!viewing}
        footer={<Button onClick={() => setViewing(null)}>Đóng</Button>}
        onCancel={() => setViewing(null)}
      >
        {viewing && (
          <div className="account-detail">
            <Typography.Text type="secondary">Ngân hàng</Typography.Text>
            <b>{selected.name}</b>
            <Typography.Text type="secondary">Tài khoản</Typography.Text>
            <b>
              {viewing.login_account ||
                viewing.username ||
                viewing.phone ||
                '—'}
            </b>
            <Typography.Text type="secondary">Số tài khoản</Typography.Text>
            <b>{viewing.account_number || '—'}</b>
            <Typography.Text type="secondary">Chủ tài khoản</Typography.Text>
            <b>{viewing.name || viewing.display_name || '—'}</b>
          </div>
        )}
      </Modal>{' '}
      <Modal
        centered
        title={`Xác minh OTP ${selected.name}`}
        open={!!reloginAccount}
        footer={null}
        onCancel={closeRelogin}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          title={`Ngân hàng ${selected.name} yêu cầu xác thực OTP`}
          description="Nhập mã OTP vừa được gửi tới số điện thoại đăng ký. Không chia sẻ mã này cho người khác."
          style={{ marginBottom: 20 }}
        />
        <Form form={otpForm} layout="vertical" onFinish={verifyReloginOtp}>
          <Form.Item
            name="otp"
            label={otpConfig.label}
            rules={[
              {
                required: true,
                message: `Vui lòng nhập ${otpConfig.label.toLowerCase()}`,
              },
              { pattern: otpConfig.pattern, message: otpConfig.message },
            ]}
          >
            <Input
              autoFocus
              inputMode={otpConfig.inputMode}
              autoComplete="one-time-code"
              maxLength={otpConfig.maxLength}
              placeholder={otpConfig.placeholder}
            />
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            loading={
              reloginAccount ? busyAccountId === reloginAccount.id : false
            }
          >
            Xác nhận OTP
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
export default function BanksGatewayPage() {
  return (
    <Suspense fallback={<Spin fullscreen />}>
      <BankGatewayContent />
    </Suspense>
  );
}
