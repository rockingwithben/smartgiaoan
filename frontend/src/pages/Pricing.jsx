import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';

export default function Pricing() {
  const { lang, t } = useI18n();
  const { user, startLogin } = useAuth();
  const en = { eyebrow: 'Pricing', title: 'Honest, simple pricing.', intro: 'Three worksheets to fall in love. Five pounds a month if you stay.', features_free: ['3 worksheets to start', 'All CEFR levels A1 → C2', 'Cambridge-style format', 'PDF download + Print', 'Worksheet history', 'Earn more via 15/30/45s rewarded ads'], features_pro: ['Unlimited worksheets', 'Zero ads — anywhere', 'Priority generation queue', 'Future: branded PDFs with your school logo', 'Future: bulk export packs', 'Priority email support'], pack_h: 'Print Pack — one-time', pack_b: 'Need 5 worksheets for tomorrow without a subscription? Buy a one-time Print Pack: 5 worksheets, branded PDF, no ads, £1.50.', pack_cta: 'Coming soon' };
  const vi = { eyebrow: 'Bảng giá', title: 'Giá thật thà, đơn giản.', intro: '3 bài miễn phí để bạn yêu thích. £5/tháng nếu bạn ở lại.', features_free: ['3 bài tập để bắt đầu', 'Đầy đủ CEFR A1 → C2', 'Định dạng chuẩn Cambridge', 'Tải PDF + In', 'Lịch sử bài tập', 'Xem QC 15/30/45 giây để có thêm bài'], features_pro: ['Bài tập không giới hạn', 'Không quảng cáo — bất kỳ đâu', 'Ưu tiên tốc độ tạo', 'Sắp tới: PDF có logo trường', 'Sắp tới: xuất hàng loạt', 'Hỗ trợ email ưu tiên'], pack_h: 'Print Pack — mua một lần', pack_b: 'Cần 5 bài cho ngày mai mà không muốn subscribe? Mua Print Pack một lần: 5 bài, PDF có thương hiệu, không QC, £1.50.', pack_cta: 'Sắp ra mắt' };
  const tt = lang === 'vi' ? vi : en;
  return (
    <PageShell eyebrow={tt.eyebrow} title={tt.title} intro={tt.intro}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-border p-8" data-testid="pricing-free">
          <div className="overline text-muted-foreground">{t('free_title')}</div>
          <div className="mt-3 flex items-baseline gap-1"><span className="font-display text-6xl">£0</span></div>
          <p className="mt-3 text-sm text-muted-foreground">{t('free_desc')}</p>
          <ul className="mt-7 space-y-2 text-sm">
            {tt.features_free.map((f, i) => <li key={i} className="flex gap-3"><span className="text-terracotta">•</span>{f}</li>)}
          </ul>
          {user ? (
            <Link to="/dashboard" className="mt-8 btn-secondary w-full" data-testid="pricing-free-cta">{t('dashboard')} →</Link>
          ) : (
            <button onClick={startLogin} className="mt-8 btn-secondary w-full" data-testid="pricing-free-cta">{t('cta_get_started')}</button>
          )}
        </div>
        <div className="bg-ink text-white border border-ink p-8 relative" data-testid="pricing-pro">
          <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold bg-terracotta px-2 py-1">Best</span>
          <div className="overline text-white/70">{t('pro_title')}</div>
          <div className="mt-3 flex items-baseline gap-1"><span className="font-display text-6xl">£5</span><span className="text-white/70">{t('pro_per')}</span></div>
          <p className="mt-3 text-sm text-white/80">{t('pro_desc')}</p>
          <ul className="mt-7 space-y-2 text-sm text-white/90">
            {tt.features_pro.map((f, i) => <li key={i} className="flex gap-3"><span className="text-terracotta">•</span>{f}</li>)}
          </ul>
          <Link to="/dashboard#upgrade" className="mt-8 inline-flex items-center justify-center w-full bg-terracotta hover:bg-terracotta-hover text-white px-6 py-3 rounded-sm font-medium transition-all hover:-translate-y-[1px]" data-testid="pricing-pro-cta">{t('pro_cta')}</Link>
        </div>
      </div>
      <div className="mt-10 bg-sand border border-border p-8 grid grid-cols-1 md:grid-cols-12 items-center gap-6">
        <div className="md:col-span-8">
          <div className="overline text-terracotta">One-time</div>
          <h3 className="font-display text-3xl mt-2">{tt.pack_h}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{tt.pack_b}</p>
        </div>
        <div className="md:col-span-4 text-right">
          <div className="font-display text-5xl">£1.50</div>
          <span className="overline text-muted-foreground">{tt.pack_cta}</span>
        </div>
      </div>
    </PageShell>
  );
}
