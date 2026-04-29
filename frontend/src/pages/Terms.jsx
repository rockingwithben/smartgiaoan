import React from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function Terms() {
  const { lang } = useI18n();

  const en = (
    <>
      <p className="text-lg text-muted-foreground leading-relaxed">
        Welcome to SmartGiaoAn. After a decade of writing materials and running ESL classrooms from the UK to Vietnam, I know firsthand that the burnout of Sunday-night lesson planning is completely real. I built this platform to give teachers their weekends back.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        By using SmartGiaoAn, you are agreeing to the rules below. If you don’t agree, no hard feelings — but please don’t use the site. Let’s keep it professional and build some great lessons.
      </p>

      <h2 className="font-display text-3xl mt-10">1. Keep It Educational (Acceptable Use)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">This tool is built to generate high-quality ESL worksheets.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">The Good:</strong>
          <span className="text-muted-foreground"> Use it to create amazing, engaging materials for your students.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">The Bad:</strong>
          <span className="text-muted-foreground"> Do not use the platform to generate hateful, violent, sexually explicit, illegal, or politically inflammatory garbage.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">The Tech Rule:</strong>
          <span className="text-muted-foreground"> Don’t try to reverse-engineer the system, scrape the site, or game the API. Play fair.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">2. Free Tiers, Ads, &amp; Going Premium</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">I want this tool to be accessible, which is why there are a few ways to use it:</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">The Free Tier:</strong>
          <span className="text-muted-foreground"> You get 3 free worksheets per browser. Need a couple more? You can earn extra credits by watching a quick rewarded ad to help cover the server costs.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">SmartGiaoAn Premium:</strong>
          <span className="text-muted-foreground"> For the heavy users, it’s £5/month via PayPal. That unlocks unlimited, ad-free generation. It’s less than the cost of a couple of coffees for a month of saved time.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Cancellations:</strong>
          <span className="text-muted-foreground"> You can cancel your Premium subscription anytime directly through your PayPal dashboard. Because you get instant access to unlimited digital generation, I don’t offer refunds for partial months.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">3. Who Owns What?</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        When you generate a worksheet, it’s yours. Print it, share it, and teach with it freely.
      </p>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        What you <strong className="text-ink">can’t</strong> do is mass-produce the raw AI output to sell as a commercial product, or white-label this service and pretend you built it.
      </p>

      <h2 className="font-display text-3xl mt-10">4. The AI Reality Check</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        SmartGiaoAn is powered by an emergent AI agent. That means it dynamically adapts to your prompts to create completely unique materials.
      </p>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        But let’s be real: AI is not a human teacher. While the engine is strictly tuned to Cambridge standards, it might occasionally hallucinate or make a weird grammar choice. <strong className="text-ink">You are the expert in the room.</strong> Always give the worksheet a quick read-through before handing it out to 30 students.
      </p>

      <h2 className="font-display text-3xl mt-10">5. “As-Is” Liability</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        I work hard to keep this site running fast and bug-free, but it is provided “as is.” Sometimes servers go down or the AI API takes a minute. I am not legally liable if a technical glitch delays your lesson plan. If something goes critically wrong, my total liability is capped at the subscription fees you’ve paid in the last 12 months.
      </p>

      <h2 className="font-display text-3xl mt-10">6. Saying Goodbye</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        You can stop using SmartGiaoAn whenever you want. On the flip side, I reserve the right to ban any account that abuses the system or breaks these rules.
      </p>

      <h2 className="font-display text-3xl mt-10">7. The Legal Stuff</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        From a legal standpoint, these terms are governed by the laws of England &amp; Wales.
      </p>

      <h2 className="font-display text-3xl mt-10">8. Get In Touch</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        If you hit a billing snag, find a bug, or just want to chat about ESL methodology, email me at <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>.
      </p>
    </>
  );

  const vi = (
    <>
      <p className="text-lg text-muted-foreground leading-relaxed">
        Chào mừng bạn đến với SmartGiaoAn. Sau một thập kỷ viết tài liệu và đứng lớp ESL từ Anh sang Việt Nam, tôi hiểu rất rõ cảm giác kiệt sức khi soạn giáo án vào tối Chủ nhật. Tôi xây dựng nền tảng này để trả lại cuối tuần cho giáo viên.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Khi sử dụng SmartGiaoAn, bạn đồng ý với các quy tắc bên dưới. Nếu không đồng ý — không sao cả, nhưng vui lòng đừng dùng trang. Cùng giữ chuyên nghiệp và xây những bài học tuyệt vời.
      </p>

      <h2 className="font-display text-3xl mt-10">1. Giữ tinh thần giáo dục (Sử dụng phù hợp)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Công cụ này được tạo để sinh ra bài tập ESL chất lượng cao.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Điều tốt:</strong>
          <span className="text-muted-foreground"> Dùng để tạo tài liệu hấp dẫn cho học sinh.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Điều xấu:</strong>
          <span className="text-muted-foreground"> Không dùng để tạo nội dung thù ghét, bạo lực, khiêu dâm, vi phạm pháp luật hay kích động chính trị.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Quy tắc kỹ thuật:</strong>
          <span className="text-muted-foreground"> Không reverse-engineer, scrape hay khai thác API. Chơi đẹp.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">2. Gói miễn phí, quảng cáo &amp; lên Premium</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Tôi muốn công cụ này dễ tiếp cận, nên có vài cách dùng:</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Gói miễn phí:</strong>
          <span className="text-muted-foreground"> 3 bài/trình duyệt. Cần thêm? Xem một quảng cáo ngắn để nhận credit, giúp gánh chi phí máy chủ.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">SmartGiaoAn Premium:</strong>
          <span className="text-muted-foreground"> Người dùng nhiều: £5/tháng qua PayPal. Mở khoá tạo bài không giới hạn, không quảng cáo. Bằng giá vài ly cà phê cho cả tháng tiết kiệm thời gian.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Huỷ:</strong>
          <span className="text-muted-foreground"> Bạn có thể huỷ Premium bất kỳ lúc nào trực tiếp trên dashboard PayPal. Vì truy cập số lượng bài không giới hạn là tức thời, tôi không hoàn tiền cho tháng dùng dở.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">3. Ai sở hữu gì?</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Bài tập bạn tạo là của bạn. In, chia sẻ, dạy thoải mái.
      </p>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Điều bạn <strong className="text-ink">không được</strong> làm: sản xuất hàng loạt output AI thô để bán thành sản phẩm thương mại, hoặc white-label dịch vụ và giả vờ là người tạo ra.
      </p>

      <h2 className="font-display text-3xl mt-10">4. Sự thật về AI</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        SmartGiaoAn được vận hành bởi một AI agent thông minh, thích ứng với prompt để tạo tài liệu hoàn toàn duy nhất.
      </p>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Nhưng nói thẳng: AI không phải là giáo viên. Dù được hiệu chỉnh sát chuẩn Cambridge, đôi khi nó vẫn có thể "ảo giác" hoặc chọn ngữ pháp lạ. <strong className="text-ink">Bạn mới là chuyên gia trong phòng học.</strong> Hãy đọc lại bài tập trước khi phát cho 30 học sinh.
      </p>

      <h2 className="font-display text-3xl mt-10">5. Trách nhiệm “nguyên trạng”</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Tôi nỗ lực giữ trang chạy nhanh và không lỗi, nhưng dịch vụ cung cấp “nguyên trạng”. Đôi khi máy chủ down hoặc API AI chậm. Tôi không chịu trách nhiệm pháp lý nếu sự cố kỹ thuật làm chậm giáo án của bạn. Nếu xảy ra sự cố nghiêm trọng, tổng trách nhiệm của tôi không vượt quá phí đăng ký bạn đã trả trong 12 tháng gần nhất.
      </p>

      <h2 className="font-display text-3xl mt-10">6. Tạm biệt</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Bạn có thể ngừng dùng SmartGiaoAn bất kỳ lúc nào. Ngược lại, tôi giữ quyền khoá tài khoản nào lạm dụng hệ thống hoặc vi phạm các quy tắc này.
      </p>

      <h2 className="font-display text-3xl mt-10">7. Pháp lý</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Về mặt pháp lý, các điều khoản này được điều chỉnh bởi luật pháp Anh &amp; Xứ Wales.
      </p>

      <h2 className="font-display text-3xl mt-10">8. Liên hệ</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Nếu bạn gặp trục trặc thanh toán, phát hiện bug, hay đơn giản muốn trao đổi về phương pháp ESL, email tôi tại <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>.
      </p>
    </>
  );

  return (
    <PageShell
      eyebrow={lang === 'vi' ? 'Pháp lý' : 'Legal'}
      title={lang === 'vi' ? 'Điều khoản & Sử dụng hợp lý' : 'Terms of Service & Fair Use'}
      intro={lang === 'vi' ? 'Cập nhật lần cuối: tháng 2/2026.' : 'Last updated: February 2026.'}
    >
      <article className="max-w-3xl">{lang === 'vi' ? vi : en}</article>
    </PageShell>
  );
}
