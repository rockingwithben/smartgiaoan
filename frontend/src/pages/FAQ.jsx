import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

const FAQS_EN = [
  { q: 'What is SmartGiaoAn?', a: 'A focused web app for Vietnamese ESL teachers, expats and parents that generates Cambridge / CEFR-aligned worksheets in seconds, with answer keys, teacher notes and a printable layout.' },
  { q: 'Who is it for?', a: 'Local Vietnamese teachers, British / American expat teachers in Vietnam, parents homeschooling or supplementing at home, and self-driven learners preparing for Cambridge or IELTS exams.' },
  { q: 'Which CEFR levels are supported?', a: 'Pre-A1 (Starters) through C2 (Mastery). Pick a student level (Kindergarten / Primary / Secondary / IELTS) and a CEFR sub-level — the worksheet matches the official descriptors precisely.' },
  { q: 'Is the content really aligned to Cambridge?', a: 'Yes. The AI is prompted as a senior Cambridge ESOL examiner with explicit CEFR descriptors, follows the descriptor for the chosen band, mixes the question types Cambridge actually uses, and provides answer keys with rule-based explanations.' },
  { q: 'How is the content localised to Vietnam?', a: 'Every person, place, holiday and reference is Vietnamese — Minh, Lan, Hanoi, Saigon, Tet, banh mi, ao dai, motorbikes, lotus ponds, modern cafe culture. Authentic, not stereotypical.' },
  { q: 'How is this different from Twinkl or other big resource sites?', a: 'They give you 14 tabs, endless filters, and templates that feel imported. We give you one input field and three printable pages — locally relevant. Different philosophy. Different price.' },
  { q: 'How does the free plan work?', a: 'You get 3 worksheets free in your browser. Sign in with Google to keep that quota across devices, then earn extra credits by watching a 15 / 30 / 45-second rewarded ad (1 / 2 / 3 credits respectively).' },
  { q: 'How does Premium work?', a: '£5/month via PayPal. Unlimited worksheets, zero ads, priority generation. Cancel anytime in PayPal — no contract, no hassle.' },
  { q: 'Can I cancel Premium any time?', a: 'Yes. Open your PayPal dashboard → Recurring Payments → cancel SmartGiaoAn. Your account drops to the free tier at the end of the current billing month.' },
  { q: 'Can I print or save as PDF?', a: 'Both. Click Print or Download PDF on any generated worksheet. PDFs are A4-ready and student-handout-ready.' },
  { q: 'Is the worksheet quality really classroom-ready?', a: 'Yes — but you are the expert. Always read through before handing out. AI occasionally hallucinates a phrase or picks a slightly odd grammar choice; a 30-second review catches it.' },
  { q: 'Do you store my students\u2019 data?', a: 'No. SmartGiaoAn is a tool for teachers — you should never input real student names. We store only your Google profile and the worksheets you generate. See the Privacy & Trust Policy.' },
  { q: 'Is my data safe?', a: 'We store only your Google profile (email, name, picture) and your worksheet library. We never sell data, never spam you with marketing. You own your data — export or delete it any time from the Account page.' },
  { q: 'Can I edit a generated worksheet?', a: 'Direct in-app editing is on the roadmap. For now you can re-generate with a tweaked topic or grammar focus, or download the PDF and edit elsewhere.' },
  { q: 'Is there a Vietnamese interface?', a: 'Yes. Use the EN / VI toggle in the top-right. Student-facing worksheet content stays in English by design — that\u2019s the point of an ESL worksheet.' },
  { q: 'Does it work offline?', a: 'Generation needs internet (it calls Gemini). But once a worksheet is generated, you can save the PDF to your device and use it offline forever.' },
  { q: 'Do you support speaking practice?', a: 'Yes — every worksheet includes a creative production task with a vivid scene description, perfect for speaking pairs or class discussion.' },
  { q: 'I\u2019m a parent — is this useful for me?', a: 'Absolutely. Pick the level matching your child\u2019s grade, type a topic they care about (their pet, last weekend, a video game) and you have a focused 20-minute practice sheet. Bonus: vocabulary glossary has Vietnamese translations.' },
];

const FAQS_VI = [
  { q: 'SmartGiaoAn là gì?', a: 'Công cụ web dành cho giáo viên ESL Việt Nam, expat và phụ huynh — tạo bài tập chuẩn Cambridge/CEFR trong vài giây, kèm đáp án, ghi chú giáo viên và bố cục in sẵn.' },
  { q: 'Dành cho ai?', a: 'Giáo viên Việt, giáo viên expat ở Việt Nam, phụ huynh dạy thêm tại nhà, và người tự học chuẩn bị thi Cambridge hoặc IELTS.' },
  { q: 'Hỗ trợ những trình độ CEFR nào?', a: 'Pre-A1 (Starters) đến C2 (Mastery). Chọn cấp học (Mầm non / Tiểu học / THCS-THPT / IELTS) và CEFR — bài tập sẽ bám chuẩn descriptor.' },
  { q: 'Nội dung có thật sự chuẩn Cambridge không?', a: 'Có. AI được hướng dẫn như giám khảo Cambridge ESOL kỳ cựu, theo đúng descriptor CEFR, mix các dạng câu hỏi Cambridge thường dùng, có đáp án giải thích.' },
  { q: 'Bản địa hoá Việt Nam ra sao?', a: 'Tất cả tên người, địa danh, ngày lễ đều là của Việt Nam — Minh, Lan, Hà Nội, Sài Gòn, Tết, bánh mì, áo dài, văn hoá cà phê hiện đại. Authentic, không sáo rỗng.' },
  { q: 'Khác Twinkl và các trang lớn ở điểm nào?', a: 'Họ cho bạn 14 tab, vô số filter, template như “nhập khẩu”. Chúng tôi cho bạn một ô nhập và ba trang in — đúng bản địa. Triết lý khác, giá khác.' },
  { q: 'Gói miễn phí hoạt động ra sao?', a: '3 bài miễn phí trong trình duyệt. Đăng nhập Google để giữ quota khi đổi thiết bị, rồi xem QC 15/30/45 giây để được thêm 1/2/3 credit.' },
  { q: 'Premium hoạt động thế nào?', a: '£5/tháng qua PayPal. Bài tập không giới hạn, không quảng cáo, ưu tiên tốc độ. Huỷ bất kỳ lúc nào trong PayPal — không hợp đồng, không phiền toái.' },
  { q: 'Có thể huỷ Premium lúc nào?', a: 'Có. Vào PayPal → Recurring Payments → huỷ SmartGiaoAn. Tài khoản trở lại gói miễn phí khi kết thúc kỳ thanh toán hiện tại.' },
  { q: 'Có thể in hoặc lưu PDF không?', a: 'Cả hai. Nhấn In hoặc Tải PDF trên bài tập đã tạo. PDF chuẩn A4, sẵn sàng phát cho học sinh.' },
  { q: 'Chất lượng bài tập có thật sự sẵn sàng cho lớp?', a: 'Có — nhưng bạn là chuyên gia. Hãy đọc lại trước khi phát. AI đôi khi “ảo giác” một cụm từ hoặc chọn ngữ pháp lạ; 30 giây kiểm tra là đủ.' },
  { q: 'Có lưu dữ liệu học sinh không?', a: 'Không. SmartGiaoAn là công cụ cho giáo viên — bạn không nên nhập tên thật học sinh. Chúng tôi chỉ lưu profile Google và bài tập của bạn. Xem Chính sách Bảo mật & Lòng tin.' },
  { q: 'Dữ liệu của tôi có an toàn không?', a: 'Chúng tôi chỉ lưu profile Google (email, tên, ảnh) và thư viện bài tập. Không bán dữ liệu, không spam. Bạn sở hữu dữ liệu — xuất hoặc xoá bất kỳ lúc nào ở trang Account.' },
  { q: 'Có chỉnh sửa bài tập đã tạo không?', a: 'Tính năng chỉnh sửa trực tiếp đang trong roadmap. Hiện tại bạn có thể tạo lại với chủ đề hoặc ngữ pháp tinh chỉnh, hoặc tải PDF và sửa nơi khác.' },
  { q: 'Có giao diện tiếng Việt không?', a: 'Có. Dùng nút EN / VI ở góc trên-phải. Nội dung bài tập cho học sinh giữ tiếng Anh theo thiết kế — đó là điểm của bài ESL.' },
  { q: 'Có dùng được offline không?', a: 'Việc tạo bài cần internet (gọi Gemini). Nhưng khi đã tạo xong, bạn có thể lưu PDF và dùng offline mãi.' },
  { q: 'Có hỗ trợ luyện nói không?', a: 'Có — mỗi bài đều có “Creative Task” với scene description sống động, phù hợp luyện nói cặp hoặc thảo luận lớp.' },
  { q: 'Tôi là phụ huynh — có hữu ích cho tôi không?', a: 'Tuyệt đối. Chọn cấp đúng khối lớp con, nhập chủ đề con quan tâm (thú cưng, cuối tuần, trò chơi điện tử) — bạn có ngay 20 phút luyện tập tập trung. Bonus: bảng từ vựng có dịch tiếng Việt.' },
];

export default function FAQ() {
  const { lang } = useI18n();
  const items = lang === 'vi' ? FAQS_VI : FAQS_EN;
  const [open, setOpen] = useState(0);
  return (
    <PageShell
      eyebrow={lang === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked'}
      title={lang === 'vi' ? 'Mọi điều bạn muốn hỏi.' : 'Everything you wanted to ask.'}
      intro={lang === 'vi' ? 'Không tìm thấy câu trả lời? Liên hệ với chúng tôi qua trang Liên hệ — email được trả lời trong 24 giờ làm việc.' : 'Can\u2019t find your answer? Reach us on the Contact page — emails answered within 24 working hours.'}
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
