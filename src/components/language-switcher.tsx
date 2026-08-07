'use client';

import {
  CheckOutlined,
  DollarCircleOutlined,
  DownOutlined,
  SearchOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Input, Popover, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/components/currency-provider';

type Language = { key: string; name: string; code: string; flag: string };
type Currency = { code: string; name: string; symbol: string; flag: string };
type TranslateWindow = Window & {
  googleTranslateElementInit?: () => void;
  google?: {
    translate?: {
      TranslateElement?: new (
        options: Record<string, unknown>,
        elementId: string
      ) => unknown;
    };
  };
};
let translateScriptPromise: Promise<void> | null = null;
function loadGoogleTranslate() {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as TranslateWindow;
  if (w.google?.translate?.TranslateElement) return Promise.resolve();
  if (translateScriptPromise) return translateScriptPromise;
  translateScriptPromise = new Promise<void>((resolve, reject) => {
    w.googleTranslateElementInit = resolve;
    const existing = document.getElementById(
      'google-translate-script'
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Không tải được Google Translate')),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      translateScriptPromise = null;
      reject(new Error('Không tải được Google Translate'));
    };
    document.head.appendChild(script);
  });
  return translateScriptPromise;
}
const languageStorageKey = 'apibank_language';
const languages: Language[] = [
  { key: 'vi', name: 'Tiếng Việt', code: 'VI', flag: 'vn' },
  { key: 'en', name: 'English', code: 'EN', flag: 'gb' },
  { key: 'zh-CN', name: '中文', code: 'ZH', flag: 'cn' },
  { key: 'ja', name: '日本語', code: 'JA', flag: 'jp' },
  { key: 'ko', name: '한국어', code: 'KO', flag: 'kr' },
  { key: 'th', name: 'ไทย', code: 'TH', flag: 'th' },
  { key: 'fr', name: 'Français', code: 'FR', flag: 'fr' },
  { key: 'de', name: 'Deutsch', code: 'DE', flag: 'de' },
  { key: 'es', name: 'Español', code: 'ES', flag: 'es' },
];
const currencies: Currency[] = [
  { code: 'VND', name: 'Vietnam Dong', symbol: '₫', flag: 'vn' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'gb' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: 'fr' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: 'jp' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', flag: 'kr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: 'cn' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: 'th' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: 'gb' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: 'cn' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: 'gb' },
];
function setTranslateCookie(language: string) {
  const value = language === 'vi' ? '' : `/vi/${language}`,
    expires =
      language === 'vi'
        ? 'Thu, 01 Jan 1970 00:00:00 GMT'
        : 'Fri, 31 Dec 9999 23:59:59 GMT';
  document.cookie = `googtrans=${value};path=/;expires=${expires};SameSite=Lax`;
  if (location.hostname !== 'localhost')
    document.cookie = `googtrans=${value};path=/;domain=.${location.hostname};expires=${expires};SameSite=Lax`;
}
export default function LanguageSwitcher() {
  const [search, setSearch] = useState(''),
    [open, setOpen] = useState(false),
    [tab, setTab] = useState<'language' | 'currency'>('language'),
    [selectedLanguage, setSelectedLanguage] = useState('vi');
  const {
    currency: selectedCurrency,
    rates,
    loading,
    setCurrency,
  } = useCurrency();
  const currentLanguage =
    languages.find((item) => item.key === selectedLanguage) ?? languages[0];
  const availableCurrencies = useMemo(
    () =>
      currencies.filter(
        (item) => item.code === 'VND' || Boolean(rates[item.code])
      ),
    [rates]
  );
  const filteredLanguages = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? languages.filter((item) =>
          `${item.name} ${item.code}`.toLocaleLowerCase().includes(query)
        )
      : languages;
  }, [search]);
  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? availableCurrencies.filter((item) =>
          `${item.name} ${item.code} ${item.symbol}`
            .toLocaleLowerCase()
            .includes(query)
        )
      : availableCurrencies;
  }, [search, availableCurrencies]);
  const initialize = () => {
    const w = window as TranslateWindow;
    if (!w.google?.translate?.TranslateElement) return;
    const host = document.getElementById('google_translate_element');
    if (!host || host.childNodes.length) return;
    new w.google.translate.TranslateElement(
      {
        pageLanguage: 'vi',
        includedLanguages: languages
          .map((item) => item.key)
          .filter((key) => key !== 'vi')
          .join(','),
        autoDisplay: false,
      },
      'google_translate_element'
    );
  };
  useEffect(() => {
    const saved = localStorage.getItem(languageStorageKey);
    if (!saved || !languages.some((item) => item.key === saved)) return;
    queueMicrotask(() => setSelectedLanguage(saved));
    if (saved !== 'vi')
      void loadGoogleTranslate()
        .then(initialize)
        .catch(() => {});
  }, []);
  const chooseLanguage = (language: Language) => {
    setOpen(false);
    setSelectedLanguage(language.key);
    localStorage.setItem(languageStorageKey, language.key);
    setTranslateCookie(language.key);
    if (language.key === 'vi') {
      location.reload();
      return;
    }
    void loadGoogleTranslate()
      .then(() => {
        initialize();
        window.setTimeout(() => {
          const combo =
            document.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (!combo) {
            location.reload();
            return;
          }
          combo.value = language.key;
          combo.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
      })
      .catch(() => location.reload());
  };
  const chooseCurrency = (currency: Currency) => {
    setCurrency(currency.code);
    setOpen(false);
    setSearch('');
  };
  const changeTab = (next: 'language' | 'currency') => {
    setTab(next);
    setSearch('');
  };
  const content = (
    <div className="locale-panel">
      <div className="locale-tabs">
        <button
          type="button"
          className={tab === 'language' ? 'active' : ''}
          onClick={() => changeTab('language')}
        >
          <TranslationOutlined /> Ngôn ngữ
        </button>
        <button
          type="button"
          className={tab === 'currency' ? 'active' : ''}
          onClick={() => changeTab('currency')}
        >
          <DollarCircleOutlined /> Tiền tệ · {selectedCurrency}
        </button>
      </div>
      <div className="locale-body">
        <Input
          autoFocus
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder={
            tab === 'language' ? 'Tìm kiếm ngôn ngữ...' : 'Tìm kiếm tiền tệ...'
          }
          onChange={(event) => setSearch(event.target.value)}
        />
        {tab === 'language' ? (
          <div className="locale-list">
            {filteredLanguages.map((language) => (
              <button
                type="button"
                key={language.key}
                className={`locale-option${language.key === selectedLanguage ? ' is-selected' : ''}`}
                onClick={() => chooseLanguage(language)}
              >
                <img
                  src={`/flags/${language.flag}.svg`}
                  alt=""
                  width={34}
                  height={34}
                />
                <span>{language.name}</span>
                <small>{language.code}</small>
                {language.key === selectedLanguage && <CheckOutlined />}
              </button>
            ))}
            {!filteredLanguages.length && (
              <div className="locale-empty">Không tìm thấy ngôn ngữ</div>
            )}
          </div>
        ) : (
          <Spin spinning={loading}>
            <div className="locale-list">
              {filteredCurrencies.map((currency) => (
                <button
                  type="button"
                  key={currency.code}
                  className={`locale-option${currency.code === selectedCurrency ? ' is-selected' : ''}`}
                  onClick={() => chooseCurrency(currency)}
                >
                  <span className="locale-currency-mark">
                    <img
                      src={`/flags/${currency.flag}.svg`}
                      alt=""
                      width={34}
                      height={34}
                    />
                    <i>{currency.symbol}</i>
                  </span>
                  <span>{currency.name}</span>
                  <small>{currency.code}</small>
                  {currency.code === selectedCurrency && <CheckOutlined />}
                </button>
              ))}
              {!filteredCurrencies.length && (
                <div className="locale-empty">Không tìm thấy tiền tệ</div>
              )}
            </div>
          </Spin>
        )}
      </div>
    </div>
  );
  return (
    <>
      <div id="google_translate_element" aria-hidden="true" />
      <Popover
        trigger="click"
        placement="bottomRight"
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setSearch('');
        }}
        classNames={{ root: 'locale-popover' }}
        content={content}
      >
        <button
          type="button"
          className="locale-trigger"
          aria-label={`Ngôn ngữ ${currentLanguage.name}, tiền tệ ${selectedCurrency}`}
        >
          <img
            src={`/flags/${currentLanguage.flag}.svg`}
            alt=""
            width={24}
            height={24}
          />
          <span>
            {currentLanguage.code} · {selectedCurrency}
          </span>
          <DownOutlined />
        </button>
      </Popover>
    </>
  );
}
