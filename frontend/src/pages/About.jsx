import React from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function About() {
  const { lang } = useI18n();
  const en = {
    eyebrow: 'About',
    title: 'Built for Vietnamese teachers, by people who\u2019ve sat in those classrooms.',
    intro: 'SmartGiaoAn (giáo án = lesson plan) exists to give Vietnamese ESL teachers back their evenings — without compromising on the rigour their students deserve.',
    sec1_h: 'The problem',
    sec1_b: 'Vietnamese ESL teachers spend 8-15 hours per week building worksheets — by hand, in Word, often after class. Imported materials don\u2019t mention Tet or Hanoi. Generic AI tools give bland, unaligned output. Cambridge-style rigour is hard to source for free.',
    sec2_h: 'Our answer',
    sec2_b: 'A focused tool that does exactly one thing brilliantly: generate Cambridge / CEFR-aligned worksheets that feel local, look professional and print clean. No fluff. No 14-tab dashboards.',
    sec3_h: 'Principles',
    p1: 'Localized first — every name, place and reference belongs to Vietnam.',
    p2: 'Cambridge-grade content — strict CEFR descriptors A1 → C2.',
    p3: 'Print is sacred — the PDF you download is what your students see.',
    p4: 'Honest pricing — three free worksheets to start, £5/month if you stay.',
  };
  const vi = {
    eyebrow: 'Giới thiệu',
    title: 'Được tạo cho giáo viên Việt Nam, bởi những người đã từng đứng lớp.',
    intro: 'SmartGiaoAn ra đời để trả lại cho giáo viên ESL Việt Nam những buổi tối — mà vẫn giữ được chuẩn mực mà học sinh xứng đáng nhận.',
    sec1_h: 'Vấn đề',
    sec1_b: 'Giáo viên ESL Việt Nam dành 8-15 giờ mỗi tuần soạn bài tập — thủ công, bằng Word, thường là sau giờ dạy. Tài liệu nhập khẩu thì không có Tết, không có Hà Nội. Công cụ AI chung chung thì cho ra nội dung nhạt, không khớp chuẩn. Bài chuẩn Cambridge miễn phí thì khó tìm.',
    sec2_h: 'Lời giải của chúng tôi',
    sec2_b: 'Một công cụ tập trung làm cực tốt một việc: tạo bài tập chuẩn Cambridge/CEFR mang đậm chất Việt Nam, trình bày chuyên nghiệp và in ra sạch đẹp. Không rườm rà. Không 14 tab dashboard.',
    sec3_h: 'Nguyên tắc',
    p1: 'Bản địa hoá trên hết — từng cái tên, địa danh đều thuộc về Việt Nam.',
    p2: 'Chất lượng chuẩn Cambridge — bám chuẩn CEFR A1 → C2.',
    p3: 'Bản in là thiêng liêng — file PDF bạn tải về chính là cái học sinh thấy.',
    p4: 'Giá thật thà — 3 bài miễn phí để thử, £5/tháng nếu bạn ở lại.',
  };
  const t = lang === 'vi' ? vi : en;
  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-7 space-y-10">
          <div>
            <h2 className="font-display text-3xl">{t.sec1_h}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{t.sec1_b}</p>
          </div>
          <div>
            <h2 className="font-display text-3xl">{t.sec2_h}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{t.sec2_b}</p>
          </div>
          <div>
            <h2 className="font-display text-3xl">{t.sec3_h}</h2>
            <ul className="mt-4 space-y-3">
              {[t.p1, t.p2, t.p3, t.p4].map((p, i) => (
                <li key={i} className="flex gap-4 border-l-2 border-terracotta pl-4">
                  <span className="font-mono text-xs text-muted-foreground pt-1.5">0{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <aside className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden border border-border bg-white">
            <img src="https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg" alt="" className="w-full h-full object-cover" />
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
