import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function Contact() {
  const { lang } = useI18n();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', message: '' });
  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[SmartGiaoAn · ${form.topic}] message from ${form.name}`);
    const body = encodeURIComponent(`From: ${form.name} <${form.email}>\nTopic: ${form.topic}\n\n${form.message}`);
    window.location.href = `mailto:hello@smartgiaoan.site?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const en = {
    eyebrow: 'Talk to us',
    title: 'Tell us what your students need.',
    intro: 'Bug reports, level requests, partnership ideas, billing snags, lesson methodology chats — every email is read by a real person, usually within 24 hours.',
    name: 'Your name',
    email: 'Email',
    topic: 'Topic',
    msg: 'Message',
    send: 'Send message',
    sent: 'Thanks — your email client should be opening now. If it doesn\u2019t, just email hello@smartgiaoan.site directly.',
    response: 'Response time',
    response_v: 'Within 24 working hours',
    based: 'Based in',
    based_v: 'Hanoi · Saigon',
    topics: { general: 'General question', bug: 'Bug or technical issue', billing: 'Billing / subscription', feature: 'Feature request', partnership: 'Partnership / school plan', other: 'Other' },
  };
  const vi = {
    eyebrow: 'Liên hệ',
    title: 'Cho chúng tôi biết học sinh bạn cần gì.',
    intro: 'Báo lỗi, yêu cầu cấp độ mới, đề xuất hợp tác, vấn đề thanh toán, trao đổi phương pháp — mỗi email đều được người thật đọc, thường trong 24 giờ.',
    name: 'Tên của bạn',
    email: 'Email',
    topic: 'Chủ đề',
    msg: 'Nội dung',
    send: 'Gửi tin nhắn',
    sent: 'Cảm ơn — ứng dụng email của bạn sẽ mở ra. Nếu không, hãy gửi trực tiếp tới hello@smartgiaoan.site.',
    response: 'Thời gian phản hồi',
    response_v: 'Trong 24 giờ làm việc',
    based: 'Trụ sở',
    based_v: 'Hà Nội · Sài Gòn',
    topics: { general: 'Câu hỏi chung', bug: 'Lỗi / vấn đề kỹ thuật', billing: 'Thanh toán / thuê bao', feature: 'Yêu cầu tính năng', partnership: 'Hợp tác / gói trường học', other: 'Khác' },
  };
  const t = lang === 'vi' ? vi : en;

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-7">
          <form onSubmit={submit} className="space-y-5" data-testid="contact-form">
            <Field label={t.name}>
              <input required className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
            </Field>
            <Field label={t.email}>
              <input required type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" />
            </Field>
            <Field label={t.topic}>
              <select className="form-input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} data-testid="contact-topic">
                {Object.entries(t.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label={t.msg}>
              <textarea required rows={6} className="form-input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
            </Field>
            <button type="submit" className="btn-primary" data-testid="contact-submit">{t.send}</button>
            {sent && <p className="text-sm text-muted-foreground" data-testid="contact-sent">{t.sent}</p>}
          </form>
        </div>
        <aside className="md:col-span-5 space-y-6">
          <div className="bg-white border border-border p-6">
            <p className="overline text-terracotta">Email</p>
            <a className="block mt-2 font-display text-2xl hover:underline" href="mailto:hello@smartgiaoan.site">hello@smartgiaoan.site</a>
          </div>
          <div className="bg-white border border-border p-6">
            <p className="overline text-terracotta">{t.response}</p>
            <p className="mt-2 text-sm">{t.response_v}</p>
          </div>
          <div className="bg-white border border-border p-6">
            <p className="overline text-terracotta">{t.based}</p>
            <p className="mt-2 font-display text-xl">{t.based_v}</p>
          </div>
          <div className="bg-ink text-white p-6">
            <p className="overline text-terracotta">{lang === 'vi' ? 'Đề xuất tính năng?' : 'Got a feature idea?'}</p>
            <p className="mt-2 text-sm leading-relaxed">{lang === 'vi' ? 'Roadmap của chúng tôi nghe theo người dùng. Email với chủ đề "Feature request" — chúng tôi đọc, ưu tiên và phản hồi.' : 'Our roadmap is shaped by users. Email with topic "Feature request" — we read, prioritise and reply.'}</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
function Field({ label, children }) {
  return <label className="block"><span className="overline text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>;
}
