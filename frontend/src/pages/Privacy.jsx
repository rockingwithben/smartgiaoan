import React from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function Privacy() {
  const { lang } = useI18n();
  const en = (
    <>
      <h2 className="font-display text-3xl mt-8">1. What we collect</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">When you sign in with Google we receive your email address, name and profile picture. When you generate a worksheet we store its content and metadata under your account. We log basic technical events (request time, error codes) to keep the service running.</p>
      <h2 className="font-display text-3xl mt-8">2. What we never collect</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">We do not collect passwords (Google handles that), payment card details (PayPal handles that), or your students\u2019 personal data. Do not put student names or identifiers into the topic field.</p>
      <h2 className="font-display text-3xl mt-8">3. How we use your data</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">To generate, store and let you re-download your worksheets; to enforce free-tier quotas; to email you essential service updates (no marketing). That\u2019s it.</p>
      <h2 className="font-display text-3xl mt-8">4. Third parties</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Google (auth), Google Gemini (worksheet generation — your topic text is sent to Gemini and is subject to Google\u2019s policies), PayPal (billing), Google AdSense (ads on the free tier). No other third parties receive your data.</p>
      <h2 className="font-display text-3xl mt-8">5. Cookies</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">We set one essential httpOnly cookie (`session_token`) for keeping you logged in. We do not use tracking cookies beyond what AdSense requires for non-personalised ads.</p>
      <h2 className="font-display text-3xl mt-8">6. Your rights</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Email hello@smartgiaoan.com to request export or full deletion of your data; we action it within 30 days.</p>
      <h2 className="font-display text-3xl mt-8">7. Contact</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Questions? hello@smartgiaoan.site.</p>
    </>
  );
  const vi = (
    <>
      <h2 className="font-display text-3xl mt-8">1. Chúng tôi thu thập gì</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Khi bạn đăng nhập Google, chúng tôi nhận email, tên và ảnh đại diện. Khi bạn tạo bài tập, chúng tôi lưu nội dung và metadata trong tài khoản. Chúng tôi log sự kiện kỹ thuật cơ bản (thời gian, lỗi) để duy trì dịch vụ.</p>
      <h2 className="font-display text-3xl mt-8">2. Những gì chúng tôi KHÔNG bao giờ thu thập</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Không thu mật khẩu (Google quản lý), không thu thẻ thanh toán (PayPal quản lý), không thu dữ liệu cá nhân của học sinh. Vui lòng không nhập tên học sinh vào ô chủ đề.</p>
      <h2 className="font-display text-3xl mt-8">3. Sử dụng dữ liệu</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Để tạo, lưu và cho bạn tải lại bài tập; để áp quota miễn phí; để gửi bạn email dịch vụ thiết yếu (không marketing).</p>
      <h2 className="font-display text-3xl mt-8">4. Bên thứ ba</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Google (đăng nhập), Google Gemini (tạo bài tập — nội dung chủ đề được gửi tới Gemini theo chính sách của Google), PayPal (thanh toán), Google AdSense (quảng cáo gói miễn phí).</p>
      <h2 className="font-display text-3xl mt-8">5. Cookie</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Chúng tôi đặt một cookie httpOnly thiết yếu (`session_token`) để giữ bạn đăng nhập.</p>
      <h2 className="font-display text-3xl mt-8">6. Quyền của bạn</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Email hello@smartgiaoan.com để yêu cầu xuất hoặc xoá toàn bộ dữ liệu trong vòng 30 ngày.</p>
      <h2 className="font-display text-3xl mt-8">7. Liên hệ</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">Mọi thắc mắc: hello@smartgiaoan.site.</p>
    </>
  );
  return (
    <PageShell
      eyebrow={lang === 'vi' ? 'Pháp lý' : 'Legal'}
      title={lang === 'vi' ? 'Chính sách bảo mật' : 'Privacy policy'}
      intro={lang === 'vi' ? 'Cập nhật lần cuối: tháng 2/2026.' : 'Last updated: February 2026.'}
    >
      <article className="prose-style max-w-3xl">
        {lang === 'vi' ? vi : en}
      </article>
    </PageShell>
  );
}
