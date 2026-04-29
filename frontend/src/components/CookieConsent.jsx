import React, { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';

const STORAGE_KEY = 'sga_cookie_consent_v1';

export function CookieConsent() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Slight delay so it doesn't slam in on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (choice) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  const en = {
    title: 'Cookies — the honest version',
    body: 'We use one essential cookie to keep you signed in. We also serve clean ads on the free plan. Choose what you\u2019re comfortable with.',
    accept_all: 'Accept all',
    essential: 'Essential only',
    learn: 'Privacy policy',
  };
  const vi = {
    title: 'Cookie — phiên bản thật thà',
    body: 'Chúng tôi dùng một cookie thiết yếu để giữ bạn đăng nhập. Trên gói miễn phí có quảng cáo sạch. Hãy chọn điều bạn thoải mái.',
    accept_all: 'Đồng ý tất cả',
    essential: 'Chỉ thiết yếu',
    learn: 'Chính sách bảo mật',
  };
  const t = lang === 'vi' ? vi : en;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-white border border-border shadow-xl p-5 animate-fade-up" data-testid="cookie-consent">
      <p className="overline text-terracotta">{t.title}</p>
      <p className="mt-2 text-sm leading-relaxed">{t.body}</p>
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => accept('all')} className="btn-primary !py-2 !px-4 text-sm" data-testid="cookie-accept-all">{t.accept_all}</button>
        <button onClick={() => accept('essential')} className="btn-secondary !py-2 !px-4 text-sm" data-testid="cookie-essential">{t.essential}</button>
        <a href="/privacy" className="text-xs underline text-muted-foreground ml-auto">{t.learn}</a>
      </div>
    </div>
  );
}
