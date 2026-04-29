import React from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function Privacy() {
  const { lang } = useI18n();

  const en = (
    <>
      <p className="text-lg text-muted-foreground leading-relaxed">
        At SmartGiaoAn, we build premium tools for teachers, not data-mining operations. We believe in total transparency about what we collect, why we need it, and how fiercely we protect it. Here is exactly how we handle your information.
      </p>

      <h2 className="font-display text-3xl mt-10">1. What We Actually Collect</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">To make the platform work seamlessly, we only collect the bare minimum:</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Your Basic Profile:</strong>
          <span className="text-muted-foreground"> When you use Google Sign-In, we securely receive your name, email address, and profile picture to create your account.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Your Worksheet Library:</strong>
          <span className="text-muted-foreground"> We securely store the prompts, topics, and final worksheets you generate so you can access and reprint them anytime from your cloud library.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">System Logs:</strong>
          <span className="text-muted-foreground"> We log basic, anonymous technical events (like request times and error codes) so our engineers can keep the servers running fast and bug-free.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">2. The “Do Not Touch” List (What We NEVER Collect)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Your security and your students’ privacy are non-negotiable.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Zero Passwords:</strong>
          <span className="text-muted-foreground"> We never see or store your passwords. Google’s enterprise-grade security handles your authentication.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Zero Financial Data:</strong>
          <span className="text-muted-foreground"> We do not touch your credit card numbers. All billing is processed in an encrypted vault by PayPal.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Zero Student Data:</strong>
          <span className="text-muted-foreground"> SmartGiaoAn is a tool for teachers. Please keep your classroom private — do not input real student names or personal identifiers into the topic generator.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">3. How We Use Your Data (And How We Don’t)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        We use your data for three simple reasons: to generate your materials, to enforce our free-tier and premium quotas, and to email you about vital account updates. That is it. We do not sell your email address. We do not spam you with third-party marketing. <strong className="text-ink">You are our customer, not our product.</strong>
      </p>

      <h2 className="font-display text-3xl mt-10">4. Our Trusted Tech Partners</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">We only partner with industry leaders to power SmartGiaoAn. No obscure third parties get access to your data.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google Cloud &amp; Firebase:</strong>
          <span className="text-muted-foreground"> Powers our secure login and database.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google Gemini API:</strong>
          <span className="text-muted-foreground"> The “Brain” of our system. The topics you input are securely sent to Gemini to architect your worksheets, subject to Google’s strict enterprise AI privacy terms.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">PayPal:</strong>
          <span className="text-muted-foreground"> Handles all subscription billing and payment processing securely.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google AdSense:</strong>
          <span className="text-muted-foreground"> Serves non-intrusive ads to keep the free tier alive for teachers who need it.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">5. Cookies &amp; Tracking (No Creepy Stuff)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        We use one essential, secure cookie (<code className="font-mono text-sm bg-secondary px-1.5 py-0.5">session_token</code>) simply to keep you logged in so you don’t have to authenticate every time you generate a worksheet. We do not use cross-site tracking cookies, beyond the standard requirements of Google AdSense to serve non-personalised ads on our free tier.
      </p>

      <h2 className="font-display text-3xl mt-10">6. Your Data, Your Rules</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        You own your data. If you want to export your worksheet history or permanently delete your SmartGiaoAn account and wipe your data from our servers, just say the word. Email us at <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>, and we will execute a full deletion within 30 days, no questions asked.
      </p>

      <h2 className="font-display text-3xl mt-10">7. Talk to Us</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        We are built for teachers, by people who respect teachers. If you have any questions about how your data is handled, reach out directly at <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>.
      </p>
    </>
  );

  const vi = (
    <>
      <p className="text-lg text-muted-foreground leading-relaxed">
        Tại SmartGiaoAn, chúng tôi xây dựng công cụ cao cấp cho giáo viên — không phải bộ máy khai thác dữ liệu. Chúng tôi tin vào sự minh bạch tuyệt đối: thu thập gì, vì sao cần và bảo vệ ra sao. Đây là cách chúng tôi xử lý thông tin của bạn.
      </p>

      <h2 className="font-display text-3xl mt-10">1. Chúng tôi thực sự thu thập gì</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Để nền tảng vận hành mượt mà, chúng tôi chỉ thu thập tối thiểu:</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Hồ sơ cơ bản:</strong>
          <span className="text-muted-foreground"> Khi bạn đăng nhập Google, chúng tôi nhận tên, email và ảnh đại diện để tạo tài khoản.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Thư viện bài tập:</strong>
          <span className="text-muted-foreground"> Chúng tôi lưu prompt, chủ đề và bài tập bạn đã tạo để bạn có thể truy cập và in lại bất kỳ lúc nào từ thư viện đám mây.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Nhật ký hệ thống:</strong>
          <span className="text-muted-foreground"> Chúng tôi log sự kiện kỹ thuật ẩn danh (thời gian request, mã lỗi) để máy chủ chạy nhanh và không bug.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">2. Danh sách “Không bao giờ chạm đến”</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Bảo mật của bạn và quyền riêng tư của học sinh là điều không thoả hiệp.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Không mật khẩu:</strong>
          <span className="text-muted-foreground"> Chúng tôi không bao giờ thấy hay lưu mật khẩu của bạn. Google quản lý phần xác thực với chuẩn bảo mật doanh nghiệp.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Không dữ liệu tài chính:</strong>
          <span className="text-muted-foreground"> Chúng tôi không chạm vào số thẻ tín dụng. Mọi giao dịch được PayPal xử lý trong két mã hoá.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Không dữ liệu học sinh:</strong>
          <span className="text-muted-foreground"> SmartGiaoAn là công cụ cho giáo viên. Hãy giữ riêng tư cho lớp học — không nhập tên thật hoặc thông tin định danh của học sinh vào ô chủ đề.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">3. Cách chúng tôi sử dụng dữ liệu (và không sử dụng)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Chúng tôi dùng dữ liệu cho đúng ba việc: tạo tài liệu cho bạn, áp quota miễn phí/Premium, và gửi email cập nhật tài khoản thiết yếu. Hết. Chúng tôi không bán email. Chúng tôi không spam marketing bên thứ ba. <strong className="text-ink">Bạn là khách hàng — không phải sản phẩm.</strong>
      </p>

      <h2 className="font-display text-3xl mt-10">4. Đối tác công nghệ</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Chúng tôi chỉ hợp tác với các đơn vị hàng đầu. Không bên thứ ba mờ ám nào tiếp cận dữ liệu của bạn.</p>
      <ul className="mt-4 space-y-3">
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google Cloud &amp; Firebase:</strong>
          <span className="text-muted-foreground"> Hạ tầng đăng nhập và cơ sở dữ liệu an toàn.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google Gemini API:</strong>
          <span className="text-muted-foreground"> “Bộ não” của hệ thống. Chủ đề bạn nhập được gửi an toàn đến Gemini để tạo bài tập, theo điều khoản AI doanh nghiệp nghiêm ngặt của Google.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">PayPal:</strong>
          <span className="text-muted-foreground"> Xử lý đăng ký và thanh toán an toàn.</span>
        </li>
        <li className="border-l-2 border-terracotta pl-4">
          <strong className="text-ink">Google AdSense:</strong>
          <span className="text-muted-foreground"> Phục vụ quảng cáo không xâm lấn để duy trì gói miễn phí cho các giáo viên cần.</span>
        </li>
      </ul>

      <h2 className="font-display text-3xl mt-10">5. Cookie &amp; theo dõi (không có gì khuất tất)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Chúng tôi dùng một cookie thiết yếu, an toàn (<code className="font-mono text-sm bg-secondary px-1.5 py-0.5">session_token</code>) để giữ bạn đăng nhập, không cần xác thực lại mỗi lần tạo bài. Chúng tôi không dùng cookie theo dõi xuyên trang, ngoài yêu cầu chuẩn của Google AdSense để phục vụ quảng cáo không cá nhân hoá ở gói miễn phí.
      </p>

      <h2 className="font-display text-3xl mt-10">6. Dữ liệu của bạn — luật chơi của bạn</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Bạn sở hữu dữ liệu. Muốn xuất lịch sử bài tập hoặc xoá vĩnh viễn tài khoản và toàn bộ dữ liệu khỏi máy chủ — chỉ cần nói. Email <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>, chúng tôi xoá hoàn toàn trong 30 ngày, không hỏi lại.
      </p>

      <h2 className="font-display text-3xl mt-10">7. Liên hệ</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Chúng tôi xây sản phẩm cho giáo viên, bởi những người tôn trọng giáo viên. Mọi câu hỏi về dữ liệu, gửi trực tiếp tới <a className="text-terracotta hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>.
      </p>
    </>
  );

  return (
    <PageShell
      eyebrow={lang === 'vi' ? 'Pháp lý' : 'Legal'}
      title={lang === 'vi' ? 'Chính sách Bảo mật & Lòng tin' : 'Privacy & Trust Policy'}
      intro={lang === 'vi' ? 'Cập nhật lần cuối: tháng 2/2026.' : 'Last updated: February 2026.'}
    >
      <article className="max-w-3xl">{lang === 'vi' ? vi : en}</article>
    </PageShell>
  );
}
