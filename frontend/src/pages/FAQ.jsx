import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

const FAQS_EN = [
  { q: 'What is SmartGiaoAn?', a: 'A focused web app for Vietnamese ESL teachers that generates Cambridge / CEFR-aligned worksheets in seconds, with answer keys, teacher notes and a printable layout.' },
  { q: 'Which CEFR levels are supported?', a: 'A1 through C2. Pick a student level (Kindergarten / Primary / Secondary / IELTS) and a CEFR sub-level — the worksheet matches the official descriptors.' },
  { q: 'Is the content really aligned to Cambridge?', a: 'Yes. The AI is prompted as a senior Cambridge ESOL examiner, follows the descriptor for the chosen CEFR band, mixes question types Cambridge actually uses, and provides answer keys with explanations.' },
  { q: 'How is the content localised to Vietnam?', a: 'Every person, place, holiday and reference is Vietnamese — Minh, Lan, Hanoi, Saigon, Tet, banh mi, ao dai, motorbikes, lotus ponds. Your students see themselves on the page.' },
  { q: 'How does the free plan work?', a: 'You get 3 worksheets free in your browser. Sign in with Google to keep that quota across devices, then earn 1-3 more by watching a 15/30/45-second rewarded ad.' },
  { q: 'How does Premium work?', a: '£5/month via PayPal. Unlimited worksheets, zero ads, priority generation. Cancel anytime in PayPal.' },
  { q: 'Can I print or save as PDF?', a: 'Both. Click Print or Download PDF on any generated worksheet. PDFs are A4-ready.' },
  { q: 'Is my data safe?', a: 'We store only your Google profile (email, name, picture) and the worksheets you generate. We never sell data. See Privacy Policy.' },
  { q: 'Can I edit a generated worksheet?', a: 'Editing is on the roadmap. For now you can re-generate with a tweaked topic, or download the PDF and edit elsewhere.' },
  { q: 'Is there a Vietnamese interface?', a: 'Yes. Use the EN / VI toggle in the top-right. Student-facing worksheet content stays in English by design.' },
];
const FAQS_VI = [
  { q: 'SmartGiaoAn là gì?', a: 'Công cụ web dành riêng cho giáo viên ESL Việt Nam, tạo bài tập chuẩn Cambridge/CEFR trong vài giây, kèm đáp án, ghi chú giáo viên và bố cục in sẵn.' },
  { q: 'Hỗ trợ những trình độ CEFR nào?', a: 'A1 đến C2. Chọn cấp học (Mầm non / Tiểu học / THCS-THPT / IELTS) và CEFR — bài tập sẽ bám chuẩn.' },
  { q: 'Nội dung có thật sự chuẩn Cambridge không?', a: 'Có. AI được hướng dẫn như một giám khảo Cambridge ESOL kỳ cựu, theo descriptor của band CEFR, mix các dạng câu hỏi Cambridge thường dùng và có đáp án giải thích.' },
  { q: 'Bản địa hoá Việt Nam thế nào?', a: 'Tất cả tên người, địa danh, ngày lễ đều là của Việt Nam — Minh, Lan, Hà Nội, Sài Gòn, Tết, bánh mì, áo dài, xe máy, đầm sen. Học sinh thấy chính mình trong bài.' },
  { q: 'Gói miễn phí hoạt động ra sao?', a: 'Bạn có 3 bài miễn phí trong trình duyệt. Đăng nhập Google để giữ quota khi đổi thiết bị, rồi xem QC 15/30/45 giây để được thêm 1-3 bài.' },
  { q: 'Premium hoạt động thế nào?', a: '£5/tháng qua PayPal. Bài tập không giới hạn, không quảng cáo, ưu tiên tốc độ. Huỷ bất kỳ lúc nào trong PayPal.' },
  { q: 'Có thể in hoặc lưu PDF không?', a: 'Cả hai. Nhấn In hoặc Tải PDF trên bài tập đã tạo. PDF chuẩn A4.' },
  { q: 'Dữ liệu của tôi có an toàn không?', a: 'Chúng tôi chỉ lưu profile Google (email, tên, ảnh) và bài tập bạn đã tạo. Không bán dữ liệu. Xem Chính sách bảo mật.' },
  { q: 'Có chỉnh sửa được bài tập đã tạo không?', a: 'Tính năng chỉnh sửa đang trong roadmap. Hiện tại bạn có thể tạo lại với chủ đề tinh chỉnh, hoặc tải PDF và sửa ở nơi khác.' },
  { q: 'Có giao diện tiếng Việt không?', a: 'Có. Dùng nút EN / VI ở góc trên-phải. Nội dung bài tập cho học sinh giữ nguyên tiếng Anh theo thiết kế.' },
];

export default function FAQ() {
  const { lang } = useI18n();
  const items = lang === 'vi' ? FAQS_VI : FAQS_EN;
  const [open, setOpen] = useState(0);
  return (
    <PageShell
      eyebrow={lang === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked'}
      title={lang === 'vi' ? 'Mọi điều bạn muốn hỏi.' : 'Everything you wanted to ask.'}
      intro={lang === 'vi' ? 'Không tìm thấy câu trả lời? Liên hệ với chúng tôi qua trang Liên hệ.' : 'Can\u2019t find your answer? Reach us on the Contact page.'}
    >
      <div className="divide-y divide-border border-y border-border" data-testid="faq-list">
        {items.map((it, i) => (
          <div key={i} className="py-5">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-start justify-between gap-6 text-left"
              data-testid={`faq-toggle-${i}`}
            >
              <span className="font-display text-2xl leading-snug">{it.q}</span>
              <span className="font-mono text-xl text-terracotta select-none">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-3xl animate-fade-up">{it.a}</p>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
