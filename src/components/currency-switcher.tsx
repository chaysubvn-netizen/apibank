'use client';

import {
  CheckOutlined,
  DollarOutlined,
  DownOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Input, Popover, Spin } from 'antd';
import { useMemo, useState } from 'react';
import { useCurrency } from '@/components/currency-provider';

type Currency = { code: string; name: string; symbol: string };
const currencies: Currency[] = [
  { code: 'VND', name: 'Việt Nam Đồng', symbol: '₫' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];
export default function CurrencySwitcher() {
  const [search, setSearch] = useState(''),
    [open, setOpen] = useState(false);
  const { currency: selected, rates, loading, setCurrency } = useCurrency();
  const available = currencies.filter(
    (item) => item.code === 'VND' || Boolean(rates[item.code])
  );
  const current =
    available.find((item) => item.code === selected) ?? available[0];
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? available.filter((item) =>
          `${item.name} ${item.code} ${item.symbol}`
            .toLocaleLowerCase()
            .includes(query)
        )
      : available;
  }, [search, available]);
  const choose = (item: Currency) => {
    setCurrency(item.code);
    setOpen(false);
    setSearch('');
  };
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setSearch('');
      }}
      classNames={{ root: 'currency-popover' }}
      content={
        <div className="currency-panel">
          <Input
            autoFocus
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm tiền tệ..."
            onChange={(event) => setSearch(event.target.value)}
          />
          <Spin spinning={loading}>
            <div className="currency-list">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.code}
                  className={`currency-option${item.code === selected ? ' is-selected' : ''}`}
                  onClick={() => choose(item)}
                >
                  <span className="currency-symbol">{item.symbol}</span>
                  <span className="currency-name">{item.name}</span>
                  <span className="currency-code">{item.code}</span>
                  {item.code === selected && (
                    <CheckOutlined className="currency-check" />
                  )}
                </button>
              ))}
              {!filtered.length && (
                <div className="currency-empty">Không tìm thấy tiền tệ</div>
              )}
            </div>
          </Spin>
        </div>
      }
    >
      <button
        type="button"
        className="currency-trigger"
        aria-label={`Tiền tệ: ${current.name}`}
      >
        <DollarOutlined className="currency-trigger-icon" />
        <span className="currency-trigger-code">{current.code}</span>
        <DownOutlined />
      </button>
    </Popover>
  );
}
