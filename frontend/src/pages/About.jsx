import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';

export default function About() {
  const { lang } = useI18n();
  const { user, startLogin } = useAuth();

  const en = {
    eyebrow: 'The SmartGiaoAn Manifesto',
    title: 'Built for the frontline.',
    intro: 'For local teachers, expats, parents, and driven learners. SmartGiaoAn (giáo án = lesson plan) exists to give you your evenings back — without compromising one ounce of the educational rigour your students deserve.',

    problem_h: 'The Problem',
    problem_b: 'The current landscape of ESL resources is broken. Giant corporate platforms charge hefty subscriptions for bloated dashboards and endless scrolling, only to give you materials that feel generic and disconnected from your actual classroom. On the flip side, basic AI tools spit out bland, unaligned fluff.',
    problem_c: 'Whether you’re a local teacher in Hanoi, a British expat teaching kindergarten in Saigon, or a parent trying to give your child an edge at home, sourcing true Cambridge-style rigour that actually references the world around you is nearly impossible.',

    answer_h: 'Our Answer',
    answer_b: 'We built the anti-bloat alternative. SmartGiaoAn is a laser-focused engine that does exactly one thing brilliantly: it generates CEFR-aligned, Cambridge-grade worksheets that feel authentic, look professional, and print perfectly. No fluff. No 14-tab menus. Just top-tier materials in seconds.',

    principles_h: 'Our Core Principles',
    p: [
      { n: '01', t: 'Context That Connects', b: 'Students learn best when they recognise their own world. We weave authentic, local context into our materials — from Tet holidays to motorbikes — so the English feels real, not imported.' },
      { n: '02', t: 'Cambridge-Grade Rigour', b: 'We don’t do “close enough.” Every worksheet is strictly aligned to CEFR descriptors from Pre-A1 (Starters) all the way up to C2. The grammar and vocabulary hit the exact standard required for international success.' },
      { n: '03', t: 'Print is Sacred', b: 'There is nothing worse than an unformatted mess. The PDF you generate is classroom-ready. It’s clean, perfectly structured, and exactly what your students will see on their desks.' },
      { n: '04', t: 'Honest, No-Nonsense Pricing', b: 'Big resource sites lock everything behind massive yearly paywalls. We keep it simple: generate your first three worksheets completely free. If you love the platform and want unlimited access, it’s just £5 a month. You cancel when you want.' },
    ],

    promise_h: 'A small promise',
    promise_b: 'You shouldn’t need to spend Sunday evening typing worksheets in Word when an exam-aligned alternative exists. We will keep this tool focused, fast, fair-priced and locally relevant — for as long as a single Vietnamese teacher finds it useful.',

    cta: 'Try the generator',
  };

  const vi = {
    eyebrow: 'Tuyên ngôn SmartGiaoAn',
    title: 'Được tạo cho tuyến đầu.',
    intro: 'Dành cho giáo viên Việt, expat, phụ huynh và người học chăm chỉ. SmartGiaoAn (giáo án = lesson plan) tồn tại để trả lại cho bạn những buổi tối — mà không hy sinh một chút chuẩn mực giáo dục nào học sinh xứng đáng.',

    problem_h: 'Vấn đề',
    problem_b: 'Thị trường tài liệu ESL đang bế tắc. Những nền tảng lớn thu phí thuê bao cao chỉ để cho bạn dashboard ngồn ngộn và lăn chuột mãi không hết, kết quả là tài liệu vẫn cứ nhạt và xa rời lớp học thật. Mặt khác, các công cụ AI cơ bản chỉ phun ra văn bản nhạt nhẽo, không khớp chuẩn.',
    problem_c: 'Dù bạn là giáo viên ở Hà Nội, expat người Anh dạy mầm non ở Sài Gòn, hay phụ huynh muốn con mình có lợi thế ở nhà — tìm chuẩn Cambridge thực sự mà còn phản ánh đúng cuộc sống xung quanh là điều gần như bất khả thi.',

    answer_h: 'Lời giải của chúng tôi',
    answer_b: 'Chúng tôi xây giải pháp “anti-bloat”. SmartGiaoAn là một engine tập trung làm xuất sắc một việc duy nhất: tạo bài tập chuẩn CEFR/Cambridge, mang chất bản địa, chuyên nghiệp và in ra hoàn hảo. Không rườm rà. Không 14 tab dashboard. Chỉ tài liệu hàng đầu trong vài giây.',

    principles_h: 'Nguyên tắc cốt lõi',
    p: [
      { n: '01', t: 'Bối cảnh kết nối', b: 'Học sinh học tốt nhất khi nhận ra thế giới của chính mình. Chúng tôi dệt bối cảnh Việt Nam thật vào tài liệu — từ Tết đến xe máy — để tiếng Anh không còn cảm giác “nhập khẩu”.' },
      { n: '02', t: 'Chuẩn Cambridge', b: 'Chúng tôi không làm “tạm được”. Mỗi bài tập bám sát descriptor CEFR từ Pre-A1 (Starters) lên tới C2. Ngữ pháp và từ vựng đúng chuẩn cần để thành công quốc tế.' },
      { n: '03', t: 'Bản in là thiêng liêng', b: 'Không gì tệ hơn một file định dạng lộn xộn. PDF bạn xuất ra đã sẵn sàng cho lớp học — sạch, có cấu trúc hoàn hảo, và đúng những gì học sinh sẽ thấy trên bàn.' },
      { n: '04', t: 'Giá thật thà', b: 'Các trang lớn khoá tất cả sau gói thuê bao năm khổng lồ. Chúng tôi giữ đơn giản: tạo 3 bài đầu tiên hoàn toàn miễn phí. Nếu yêu thích, gói không giới hạn chỉ £5/tháng. Huỷ bất kỳ lúc nào.' },
    ],

    promise_h: 'Một lời hứa nhỏ',
    promise_b: 'Bạn không nên phải dành tối Chủ nhật gõ bài tập trong Word khi đã có lựa chọn bám chuẩn thi cử. Chúng tôi sẽ giữ công cụ này tập trung, nhanh, giá hợp lý và đậm chất bản địa — chừng nào còn một giáo viên Việt thấy hữu ích.',

    cta: 'Thử generator',
  };

  const t = lang === 'vi' ? vi : en;

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      {/* Problem + Answer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-7 space-y-12">
          <div>
            <p className="overline text-terracotta">{t.problem_h}</p>
            <p className="mt-3 text-muted-foreground leading-relaxed text-lg">{t.problem_b}</p>
            <p className="mt-3 text-muted-foreground leading-relaxed text-lg">{t.problem_c}</p>
          </div>
          <div>
            <p className="overline text-terracotta">{t.answer_h}</p>
            <p className="mt-3 text-muted-foreground leading-relaxed text-lg">{t.answer_b}</p>
          </div>
        </div>
        <aside className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden border border-border bg-white">
            <img
              src="https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg"
              alt="Vietnamese ESL classroom"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 bg-sand border border-border p-4 text-xs text-muted-foreground italic leading-relaxed">
            {lang === 'vi'
              ? '“Bạn không nên phải dành tối Chủ nhật gõ bài tập trong Word khi đã có lựa chọn bám chuẩn thi cử.”'
              : '“You shouldn’t need to spend Sunday evening typing worksheets in Word when an exam-aligned alternative exists.”'}
          </div>
        </aside>
      </div>

      {/* Principles */}
      <section className="mt-20">
        <p className="overline text-terracotta">{t.principles_h}</p>
        <h2 className="font-display text-4xl mt-2 leading-tight">
          {lang === 'vi' ? 'Bốn điều chúng tôi sẽ không bao giờ thoả hiệp.' : 'Four things we will never compromise on.'}
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {t.p.map((pr) => (
            <div key={pr.n} className="border-l-2 border-terracotta pl-5" data-testid={`principle-${pr.n}`}>
              <div className="overline text-muted-foreground">{pr.n}</div>
              <h3 className="font-display text-2xl mt-1">{pr.t}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{pr.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Promise / pull quote */}
      <section className="mt-20 bg-ink text-white p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-8">
          <p className="overline text-terracotta">{t.promise_h}</p>
          <p className="mt-4 font-display text-3xl md:text-4xl leading-tight">{t.promise_b}</p>
        </div>
        <div className="md:col-span-4 md:text-right">
          {user ? (
            <Link to="/dashboard" className="inline-flex items-center justify-center bg-terracotta hover:bg-terracotta-hover text-white px-7 py-4 rounded-sm font-medium transition-all" data-testid="about-cta-dash">{t.cta} →</Link>
          ) : (
            <button onClick={startLogin} className="inline-flex items-center justify-center bg-terracotta hover:bg-terracotta-hover text-white px-7 py-4 rounded-sm font-medium transition-all" data-testid="about-cta-google">{t.cta} →</button>
          )}
        </div>
      </section>
    </PageShell>
  );
}
