import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';

export default function Contact() {
  const { lang } = useI18n();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (e) => {
    e.preventDefault();
    // Open email client as a graceful fallback (no backend mail integration)
    const subject = encodeURIComponent('SmartGiaoAn — message from ' + form.name);
    const body = encodeURIComponent(`From: ${form.name} <${form.email}>\n\n${form.message}`);
    window.location.href = `mailto:hello@smartgiaoan.site?subject=${subject}&body=${body}`;
    setSent(true);
  };
  const en = { eyebrow: 'Contact', title: 'Tell us what your students need.', intro: 'Bug reports, level requests, partnership ideas — every email is read.', name: 'Your name', email: 'Email', msg: 'Message', send: 'Send message', sent: 'Thanks — your email client should be opening now.' };
  const vi = { eyebrow: 'Liên hệ', title: 'Cho chúng tôi biết học sinh bạn cần gì.', intro: 'Báo lỗi, yêu cầu cấp độ mới, đề xuất hợp tác — mỗi email đều được đọc.', name: 'Tên của bạn', email: 'Email', msg: 'Nội dung', send: 'Gửi tin nhắn', sent: 'Cảm ơn — ứng dụng email của bạn sẽ mở ra ngay.' };
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
            <p className="overline text-terracotta">{lang === 'vi' ? 'Phản hồi mong đợi' : 'Response time'}</p>
            <p className="mt-2 text-sm">{lang === 'vi' ? '< 24 giờ ngày làm việc' : 'Within 24 working hours'}</p>
          </div>
          <div className="bg-white border border-border p-6">
            <p className="overline text-terracotta">{lang === 'vi' ? 'Trụ sở' : 'Based in'}</p>
            <p className="mt-2 font-display text-xl">Hanoi · Saigon</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
function Field({ label, children }) {
  return <label className="block"><span className="overline text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>;
}
