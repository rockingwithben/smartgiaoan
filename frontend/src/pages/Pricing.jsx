import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';

export default function Pricing() {
  const { lang, t } = useI18n();
  const { user, startLogin } = useAuth();

  const en = {
    eyebrow: 'Honest, no-nonsense pricing',
    title: 'Three free. Five quid a month after that.',
    intro: 'Big resource sites lock everything behind massive yearly paywalls. We don\u2019t. Three worksheets to fall in love. Cancel any time in PayPal — no contract, no haggling.',
    free_h: 'Free',
    free_sub: 'Get a feel for it.',
    free_features: ['3 worksheets included', 'Earn more via 15/30/45s rewarded ads', 'All CEFR levels A1 → C2', 'Cambridge-style format', 'PDF download + Print', 'Worksheet history (when signed in)', 'Vietnamese-translated vocabulary'],
    pro_h: 'Premium',
    pro_sub: 'For teachers and parents who use it weekly.',
    pro_features: ['Unlimited worksheets', 'Zero ads — anywhere', 'Priority generation queue', 'Cancel any time in PayPal', 'Future: branded PDFs with your school logo', 'Future: bulk export packs', 'Priority email support'],
    pack_h: 'Print Pack — one-time',
    pack_b: 'Need 5 worksheets for tomorrow without committing? Buy a one-time Print Pack: 5 worksheets, branded PDF, no ads, £1.50.',
    pack_cta: 'Coming soon',
    fair_h: 'A note on fairness',
    fair_b: 'We don\u2019t do auto-renewing yearly contracts. We don\u2019t hide a “cancel” button three menus deep. We don\u2019t bombard you with “your subscription is ending!” emails. You pay £5 when SmartGiaoAn helps you. You stop paying when it doesn\u2019t. That\u2019s the whole pitch.',
  };
  const vi = {
    eyebrow: 'Giá thật thà, không loanh quanh',
    title: 'Ba bài miễn phí. £5/tháng sau đó.',
    intro: 'Các trang lớn khoá tất cả sau gói thuê bao năm khổng lồ. Chúng tôi không. Ba bài đầu để bạn yêu thích. Huỷ bất kỳ lúc nào trong PayPal — không hợp đồng.',
    free_h: 'Miễn phí',
    free_sub: 'Cảm nhận trước.',
    free_features: ['3 bài tập để bắt đầu', 'Xem QC 15/30/45 giây để có thêm bài', 'Đầy đủ CEFR A1 → C2', 'Định dạng chuẩn Cambridge', 'Tải PDF + In', 'Lịch sử bài tập (khi đăng nhập)', 'Từ vựng có dịch tiếng Việt'],
    pro_h: 'Premium',
    pro_sub: 'Cho giáo viên và phụ huynh dùng hàng tuần.',
    pro_features: ['Bài tập không giới hạn', 'Không quảng cáo — bất kỳ đâu', 'Ưu tiên tốc độ tạo', 'Huỷ bất kỳ lúc nào trong PayPal', 'Sắp tới: PDF có logo trường', 'Sắp tới: xuất hàng loạt', 'Hỗ trợ email ưu tiên'],
    pack_h: 'Print Pack — mua một lần',
    pack_b: 'Cần 5 bài cho ngày mai mà không muốn subscribe? Mua Print Pack một lần: 5 bài, PDF có thương hiệu, không QC, £1.50.',
    pack_cta: 'Sắp ra mắt',
    fair_h: 'Một lời về sự công bằng',
    fair_b: 'Chúng tôi không có hợp đồng năm tự gia hạn. Không giấu nút “huỷ” sau ba menu. Không bắn email “thuê bao của bạn sắp hết hạn!”. Bạn trả £5 khi SmartGiaoAn giúp bạn. Bạn ngừng trả khi không. Đó là toàn bộ.',
  };
  const tt = lang === 'vi' ? vi : en;

  return (
    <PageShell eyebrow={tt.eyebrow} title={tt.title} intro={tt.intro}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-border p-8" data-testid="pricing-free">
          <div className="overline text-muted-foreground">{tt.free_h}</div>
          <p className="mt-1 text-xs italic text-muted-foreground">{tt.free_sub}</p>
          <div className="mt-3 flex items-baseline gap-1"><span className="font-display text-6xl">£0</span></div>
          <ul className="mt-7 space-y-2 text-sm">
            {tt.free_features.map((f, i) => <li key={i} className="flex gap-3"><span className="text-terracotta">●</span>{f}</li>)}
          </ul>
          {user ? (
            <Link to="/dashboard" className="mt-8 btn-secondary w-full" data-testid="pricing-free-cta">{t('dashboard')} →</Link>
          ) : (
            <button onClick={startLogin} className="mt-8 btn-secondary w-full" data-testid="pricing-free-cta">{t('cta_get_started')}</button>
          )}
        </div>
        <div className="bg-ink text-white border border-ink p-8 relative" data-testid="pricing-pro">
          <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold bg-terracotta px-2 py-1">Best value</span>
          <div className="overline text-white/70">{tt.pro_h}</div>
          <p className="mt-1 text-xs italic text-white/60">{tt.pro_sub}</p>
          <div className="mt-3 flex items-baseline gap-1"><span className="font-display text-6xl">£5</span><span className="text-white/70">{t('pro_per')}</span></div>
          <ul className="mt-7 space-y-2 text-sm text-white/90">
            {tt.pro_features.map((f, i) => <li key={i} className="flex gap-3"><span className="text-terracotta">●</span>{f}</li>)}
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

      {/* Fair-pricing manifesto strip */}
      <div className="mt-12 border-l-4 border-terracotta pl-6 py-3">
        <p className="overline text-terracotta">{tt.fair_h}</p>
        <p className="mt-2 font-display text-2xl leading-snug max-w-3xl">{tt.fair_b}</p>
      </div>
    </PageShell>
  );
}
