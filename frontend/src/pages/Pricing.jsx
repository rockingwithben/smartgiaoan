import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import { http } from '../lib/api';
import { Check, Zap, Crown, Sparkles, Loader, Lock } from 'lucide-react';

export default function Pricing() {
  const { lang, t } = useI18n();
  const { user, startLogin } = useAuth();
  const [loading, setLoading] = useState(null);

  const activateTest = async (tier) => {
    if (!user) {
      startLogin();
      return;
    }
    setLoading(tier);
    try {
      const endpoint = tier === 'basic' ? '/billing/mark-basic' : '/billing/mark-premium';
      await http.post(endpoint);
      window.location.href = '/dashboard';
    } catch (e) {
      alert(e?.response?.data?.detail || 'Failed to activate. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const en = {
    eyebrow: 'Honest, no-nonsense pricing',
    title: 'Three plans. One that fits your classroom.',
    intro: 'Start free with unlimited worksheets — just watch an ad now and then. Upgrade when you want zero interruptions.',
    free_h: 'Free',
    free_sub: 'Unlimited worksheets, occasional ads.',
    free_price: '£0',
    free_period: 'forever',
    basic_h: 'Basic',
    basic_sub: 'No ads. 50 worksheets/month.',
    basic_price: '£5.67',
    basic_period: '/ month',
    premium_h: 'Premium',
    premium_sub: 'Best AI. AI Editor. Unlimited.',
    premium_price: '£9.99',
    premium_period: '/ month',
    most_popular: 'Most Popular',
    cta_free: 'Get Started',
    cta_basic: 'Upgrade to Basic',
    cta_premium: 'Go Premium',
    activating: 'Activating...',
    word_editor: 'Word Editor — edit any worksheet',
    ai_editor: 'AI Editor — 50 smart edits/month',
    ai_editor_extra: 'Buy more edits or earn via ads',
    unlimited: 'Unlimited',
    worksheets: 'worksheets/month',
    model_flash: 'AI: Gemini Flash',
    model_pro: 'AI: Gemini Pro',
    no_ads: 'Zero ads',
    ads: 'Random ads (15s–60s)',
    public_library: 'Public Library',
    print_pdf: 'Print & PDF export',
    fair_h: 'A note on fairness',
    fair_b: 'We don\'t do auto-renewing yearly contracts. We don\'t hide a "cancel" button three menus deep. You pay when SmartGiaoAn helps you. You stop when it doesn\'t.',
    login_to_upgrade: 'Log in to upgrade',
    ai_edit_pack: 'AI Edit Pack',
    ai_edit_pack_desc: '10 extra AI edits — £5 one-time',
  };

  const vi = {
    eyebrow: 'Giá thật thà, không loanh quanh',
    title: 'Ba gói. Một gói phù hợp lớp học của bạn.',
    intro: 'Bắt đầu miễn phí với bài tập không giới hạn — chỉ xem quảng cáo thỉnh thoảng. Nâng cấp khi muốn không bị gián đoạn.',
    free_h: 'Miễn phí',
    free_sub: 'Bài tập không giới hạn, QC thỉnh thoảng.',
    free_price: '£0',
    free_period: 'vĩnh viễn',
    basic_h: 'Cơ bản',
    basic_sub: 'Không QC. 50 bài/tháng.',
    basic_price: '£5.67',
    basic_period: '/ tháng',
    premium_h: 'Cao cấp',
    premium_sub: 'AI tốt nhất. AI Editor. Không giới hạn.',
    premium_price: '£9.99',
    premium_period: '/ tháng',
    most_popular: 'Phổ biến nhất',
    cta_free: 'Bắt đầu',
    cta_basic: 'Nâng cấp Cơ bản',
    cta_premium: 'Nâng cấp Cao cấp',
    activating: 'Đang kích hoạt...',
    word_editor: 'Word Editor — sửa bất kỳ bài tập',
    ai_editor: 'AI Editor — 50 chỉnh sửa thông minh/tháng',
    ai_editor_extra: 'Mua thêm hoặc kiếm qua QC',
    unlimited: 'Không giới hạn',
    worksheets: 'bài tập/tháng',
    model_flash: 'AI: Gemini Flash',
    model_pro: 'AI: Gemini Pro',
    no_ads: 'Không quảng cáo',
    ads: 'QC ngẫu nhiên (15s–60s)',
    public_library: 'Thư viện cộng đồng',
    print_pdf: 'In & tải PDF',
    fair_h: 'Một lời về sự công bằng',
    fair_b: 'Chúng tôi không có hợp đồng năm tự gia hạn. Không giấu nút "huỷ" sau ba menu. Bạn trả khi SmartGiaoAn giúp bạn. Bạn ngừng trả khi không.',
    login_to_upgrade: 'Đăng nhập để nâng cấp',
    ai_edit_pack: 'Gói AI Edit',
    ai_edit_pack_desc: '10 chỉnh sửa AI thêm — £5 một lần',
  };

  const tt = lang === 'vi' ? vi : en;

  const tiers = [
    {
      key: 'free',
      name: tt.free_h,
      sub: tt.free_sub,
      price: tt.free_price,
      period: tt.free_period,
      icon: <Sparkles className="w-5 h-5" />,
      features: [
        tt.unlimited + ' ' + tt.worksheets,
        tt.model_flash,
        tt.ads,
        tt.word_editor,
        tt.public_library,
        tt.print_pdf,
      ],
      cta: tt.cta_free,
      ctaAction: () => user ? window.location.href = '/dashboard' : startLogin(),
      highlight: false,
      locked: false,
    },
    {
      key: 'basic',
      name: tt.basic_h,
      sub: tt.basic_sub,
      price: tt.basic_price,
      period: tt.basic_period,
      icon: <Zap className="w-5 h-5" />,
      features: [
        '50 ' + tt.worksheets,
        tt.model_flash,
        tt.no_ads,
        tt.word_editor,
        tt.public_library,
        tt.print_pdf,
      ],
      cta: tt.cta_basic,
      ctaAction: () => activateTest('basic'),
      highlight: true,
      locked: !user,
    },
    {
      key: 'premium',
      name: tt.premium_h,
      sub: tt.premium_sub,
      price: tt.premium_price,
      period: tt.premium_period,
      icon: <Crown className="w-5 h-5" />,
      features: [
        tt.unlimited + ' ' + tt.worksheets,
        tt.model_pro,
        tt.no_ads,
        tt.word_editor,
        tt.ai_editor,
        tt.ai_editor_extra,
        tt.public_library,
        tt.print_pdf,
      ],
      cta: tt.cta_premium,
      ctaAction: () => activateTest('premium'),
      highlight: false,
      locked: !user,
    },
  ];

  return (
    <PageShell eyebrow={tt.eyebrow} title={tt.title} intro={tt.intro}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`relative p-8 flex flex-col border ${
              tier.highlight
                ? 'bg-ink text-white border-ink shadow-xl scale-[1.03] md:-mt-4 md:mb-4'
                : 'bg-white text-gray-900 border-border'
            }`}
            data-testid={`pricing-${tier.key}`}
          >
            {tier.highlight && (
              <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold bg-terracotta px-2 py-1">
                {tt.most_popular}
              </span>
            )}

            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${tier.highlight ? 'bg-white/10' : 'bg-gray-100'}`}>
                {tier.icon}
              </div>
              <div>
                <div className={`overline ${tier.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {tier.name}
                </div>
                <p className={`text-xs italic ${tier.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {tier.sub}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl">{tier.price}</span>
              <span className={tier.highlight ? 'text-white/70' : 'text-muted-foreground'}>
                {tier.period}
              </span>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {tier.features.map((f, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-terracotta' : 'text-green-600'}`} />
                  <span className={tier.highlight ? 'text-white/90' : ''}>{f}</span>
                </li>
              ))}
            </ul>

            {tier.locked ? (
              <button
                onClick={startLogin}
                className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-sm font-medium transition-all"
              >
                <Lock className="w-4 h-4" />
                {tt.login_to_upgrade}
              </button>
            ) : (
              <button
                onClick={tier.ctaAction}
                disabled={loading === tier.key}
                className={`mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-medium transition-all hover:-translate-y-[1px] disabled:opacity-50 ${
                  tier.highlight
                    ? 'bg-terracotta hover:bg-terracotta-hover text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {loading === tier.key && <Loader className="w-4 h-4 animate-spin" />}
                {loading === tier.key ? tt.activating : tier.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* AI Edit Pack — one-time purchase */}
      <div className="mt-10 bg-sand border border-border p-8 grid grid-cols-1 md:grid-cols-12 items-center gap-6 max-w-3xl mx-auto">
        <div className="md:col-span-8">
          <div className="overline text-terracotta">{tt.ai_edit_pack}</div>
          <h3 className="font-display text-2xl mt-2">{tt.ai_edit_pack_desc}</h3>
        </div>
        <div className="md:col-span-4 text-right">
          <div className="font-display text-4xl">£5</div>
          <span className="overline text-muted-foreground">one-time</span>
        </div>
      </div>

      {/* Fairness manifesto */}
      <div className="mt-16 border-l-4 border-terracotta pl-6 py-3 max-w-3xl mx-auto">
        <p className="overline text-terracotta">{tt.fair_h}</p>
        <p className="mt-3 font-display text-2xl leading-snug">{tt.fair_b}</p>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-12">
        {lang === 'vi' 
          ? 'Nút PayPal thật sẽ sớm có. Dùng nút thử nghiệm ở trên để demo.' 
          : 'Real PayPal buttons coming soon. Use test toggles above for demo.'}
      </p>
    </PageShell>
  );
}