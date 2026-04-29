import React, { createContext, useContext, useState, useCallback } from 'react';

const STRINGS = {
  en: {
    brand: 'SmartGiaoAn',
    tagline: 'Cambridge-aligned ESL worksheets, in seconds.',
    landing_eyebrow: 'For teachers, expats & parents in Vietnam',
    hero_title: 'Plan less. Teach more.',
    hero_sub: 'Cambridge & CEFR-aligned ESL worksheets — local context, classroom-ready PDFs, generated in ten seconds. Built for the frontline: local teachers, expats, and parents who want their evenings back.',
    cta_get_started: 'Get started — Sign in with Google',
    cta_learn_more: 'How it works',
    feat1_title: 'Cambridge-grade content',
    feat1_body: 'Every worksheet follows CEFR descriptors A1 → C2, with answer keys and teacher notes.',
    feat2_title: 'Localized to Vietnam',
    feat2_body: 'Vietnamese names, cities and cultural touchpoints — your students see themselves on the page.',
    feat3_title: 'Print-ready, PDF-ready',
    feat3_body: 'Direct print and PDF export. Save it. Send it. Hand it out tomorrow morning.',
    pricing_title: 'Simple pricing',
    free_title: 'Free',
    free_price: '£0',
    free_desc: '3 worksheets to start. Earn more by watching short ads.',
    free_cta: 'Start free',
    pro_title: 'Premium',
    pro_price: '£5',
    pro_per: '/ month',
    pro_desc: 'Unlimited worksheets. No ads. Priority generation.',
    pro_cta: 'Upgrade with PayPal',
    sign_in: 'Sign in',
    sign_out: 'Sign out',
    dashboard: 'Dashboard',
    worksheet_history: 'History',
    new_worksheet: 'New worksheet',
    form_level: 'Student level',
    form_cefr: 'CEFR level',
    form_skill: 'Skill focus',
    form_topic: 'Topic',
    form_questions: 'Number of questions',
    form_topic_placeholder: 'e.g. Tet holiday traditions, daily routines, food in Hanoi…',
    generate: 'Generate worksheet',
    generating: 'Generating…',
    print: 'Print',
    download_pdf: 'Download PDF',
    answer_key: 'Answer Key',
    teacher_notes: 'Teacher Notes',
    free_left: 'Free worksheets remaining',
    paywall_title: 'You\u2019ve used your free worksheets',
    paywall_sub: 'Watch a short ad for one more, or upgrade to Premium for unlimited.',
    paywall_watch: 'Watch ad (15s)',
    paywall_watch30: 'Watch ad (30s)',
    paywall_watch45: 'Watch ad (45s)',
    paywall_upgrade: 'Upgrade to Premium',
    rewarded_title: 'Watching ad…',
    rewarded_sub: 'Thanks for supporting free access. Please wait.',
    rewarded_skip_in: 'Reward unlocked in',
    rewarded_claim: 'Claim 1 worksheet',
    levels: { Kindergarten: 'Kindergarten', Primary: 'Primary', Secondary: 'Secondary', IELTS: 'IELTS' },
    skills: { reading: 'Reading', writing: 'Writing', grammar: 'Grammar', vocabulary: 'Vocabulary', listening: 'Listening' },
    section: 'Section',
    instructions: 'Instructions',
    no_history: 'No worksheets yet.',
    upgrade_modal_title: 'Upgrade to Premium',
    upgrade_modal_sub: '£5 / month — unlimited worksheets, zero ads.',
    after_paypal_note: 'After payment completes in PayPal, click the button below to activate Premium.',
    activate_premium: 'I\u2019ve paid — activate Premium',
    free_signed_out: 'You have {n} free worksheets left in this browser.',
  },
  vi: {
    brand: 'SmartGiaoAn',
    tagline: 'Giáo án ESL chuẩn Cambridge, chỉ trong vài giây.',
    landing_eyebrow: 'Dành cho giáo viên, expat & phụ huynh ở Việt Nam',
    hero_title: 'Soạn ít. Dạy nhiều.',
    hero_sub: 'Bài tập ESL chuẩn Cambridge & CEFR — bối cảnh Việt Nam, PDF sẵn sàng cho lớp, tạo trong 10 giây. Dành cho tuyến đầu: giáo viên Việt, expat và phụ huynh muốn lấy lại buổi tối.',
    cta_get_started: 'Bắt đầu — Đăng nhập Google',
    cta_learn_more: 'Cách hoạt động',
    feat1_title: 'Chất lượng Cambridge',
    feat1_body: 'Mỗi bài tập theo chuẩn CEFR A1 → C2, kèm đáp án và ghi chú giáo viên.',
    feat2_title: 'Bản địa hoá Việt Nam',
    feat2_body: 'Tên, thành phố và nét văn hoá Việt — học sinh thấy chính mình trong bài tập.',
    feat3_title: 'Sẵn sàng in & PDF',
    feat3_body: 'In trực tiếp hoặc xuất PDF. Lưu lại. Gửi đi. Mai dạy luôn.',
    pricing_title: 'Giá đơn giản',
    free_title: 'Miễn phí',
    free_price: '£0',
    free_desc: '3 bài tập khởi đầu. Xem quảng cáo ngắn để kiếm thêm.',
    free_cta: 'Dùng thử',
    pro_title: 'Premium',
    pro_price: '£5',
    pro_per: '/ tháng',
    pro_desc: 'Bài tập không giới hạn. Không quảng cáo. Ưu tiên tốc độ.',
    pro_cta: 'Nâng cấp với PayPal',
    sign_in: 'Đăng nhập',
    sign_out: 'Đăng xuất',
    dashboard: 'Bảng điều khiển',
    worksheet_history: 'Lịch sử',
    new_worksheet: 'Tạo bài tập mới',
    form_level: 'Cấp học',
    form_cefr: 'Trình độ CEFR',
    form_skill: 'Kỹ năng',
    form_topic: 'Chủ đề',
    form_questions: 'Số câu hỏi',
    form_topic_placeholder: 'VD: Tết, sinh hoạt hàng ngày, ẩm thực Hà Nội…',
    generate: 'Tạo bài tập',
    generating: 'Đang tạo…',
    print: 'In',
    download_pdf: 'Tải PDF',
    answer_key: 'Đáp án',
    teacher_notes: 'Ghi chú giáo viên',
    free_left: 'Bài tập miễn phí còn lại',
    paywall_title: 'Bạn đã dùng hết lượt miễn phí',
    paywall_sub: 'Xem quảng cáo ngắn để có thêm 1 bài, hoặc nâng cấp Premium để không giới hạn.',
    paywall_watch: 'Xem QC (15 giây)',
    paywall_watch30: 'Xem QC (30 giây)',
    paywall_watch45: 'Xem QC (45 giây)',
    paywall_upgrade: 'Nâng cấp Premium',
    rewarded_title: 'Đang xem quảng cáo…',
    rewarded_sub: 'Cảm ơn bạn đã ủng hộ bản miễn phí. Vui lòng chờ.',
    rewarded_skip_in: 'Mở khoá sau',
    rewarded_claim: 'Nhận 1 bài tập',
    levels: { Kindergarten: 'Mầm non', Primary: 'Tiểu học', Secondary: 'THCS/THPT', IELTS: 'IELTS' },
    skills: { reading: 'Đọc', writing: 'Viết', grammar: 'Ngữ pháp', vocabulary: 'Từ vựng', listening: 'Nghe' },
    section: 'Phần',
    instructions: 'Hướng dẫn',
    no_history: 'Chưa có bài tập nào.',
    upgrade_modal_title: 'Nâng cấp Premium',
    upgrade_modal_sub: '£5/tháng — không giới hạn, không quảng cáo.',
    after_paypal_note: 'Sau khi thanh toán xong trên PayPal, nhấn nút bên dưới để kích hoạt Premium.',
    activate_premium: 'Đã thanh toán — kích hoạt Premium',
    free_signed_out: 'Bạn còn {n} bài tập miễn phí trên trình duyệt này.',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sga_lang') || 'en');
  const t = useCallback((key, vars) => {
    const parts = key.split('.');
    let val = STRINGS[lang];
    for (const p of parts) val = val?.[p];
    if (val == null) val = key;
    if (vars && typeof val === 'string') {
      Object.entries(vars).forEach(([k, v]) => { val = val.replace(`{${k}}`, v); });
    }
    return val;
  }, [lang]);
  const change = useCallback((next) => {
    setLang(next);
    localStorage.setItem('sga_lang', next);
  }, []);
  return (
    <I18nContext.Provider value={{ lang, t, setLang: change }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside provider');
  return ctx;
}
