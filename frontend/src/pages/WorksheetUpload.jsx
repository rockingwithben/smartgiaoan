import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../lib/i18n';
import { uploadLibraryWorksheet } from '../lib/api';
import { LEVELS } from '../lib/catalog';
import SkillToggle from '../components/SkillToggle';
import { PageShell } from '../components/PageShell';

export default function WorksheetUpload() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState(['reading']);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'Primary',
    topic: '',
    is_public: true,
  });

  const copy = lang === 'vi'
    ? {
        eyebrow: 'Chia sẻ cộng đồng',
        title: 'Đăng bài tập lên Thư viện',
        intro: 'Gửi bài tập bạn đã soạn để giáo viên khác xem, sao chép và chỉnh sửa. Bài sẽ được duyệt trước khi hiển thị công khai.',
        titleLabel: 'Tiêu đề',
        titlePlaceholder: 'VD: Tet Market Mystery — Primary A2',
        descriptionLabel: 'Mô tả ngắn',
        descriptionPlaceholder: 'Bài đọc hiểu về chợ Tết, 24 câu, có đáp án…',
        levelLabel: 'Cấp học',
        topicLabel: 'Chủ đề (tuỳ chọn)',
        topicPlaceholder: 'VD: Tết, ẩm thực Hà Nội, đại học…',
        publicLabel: 'Hiển thị công khai sau khi duyệt',
        submit: 'Gửi bài tập',
        submitting: 'Đang gửi…',
        success: 'Đã gửi! Bài tập đang chờ duyệt.',
        signIn: 'Đăng nhập để chia sẻ bài tập với cộng đồng.',
        libraryLink: 'Xem Thư viện cộng đồng →',
      }
    : {
        eyebrow: 'Community share',
        title: 'Share a worksheet',
        intro: 'Submit a worksheet you created so other teachers can preview, clone, and adapt it. Public listings are reviewed before they go live.',
        titleLabel: 'Title',
        titlePlaceholder: 'e.g. Tet Market Mystery — Primary A2',
        descriptionLabel: 'Short description',
        descriptionPlaceholder: 'Reading comprehension on Tet market visit, 24 questions, answer key included…',
        levelLabel: 'Level',
        topicLabel: 'Topic (optional)',
        topicPlaceholder: 'e.g. Tet, street food in Hanoi, university choice…',
        publicLabel: 'List publicly after review',
        submit: 'Submit worksheet',
        submitting: 'Submitting…',
        success: 'Submitted! Your worksheet is pending review.',
        signIn: 'Sign in to share worksheets with the community.',
        libraryLink: 'Browse the community library →',
      };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(lang === 'vi' ? 'Vui lòng nhập tiêu đề và mô tả.' : 'Please enter a title and description.');
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error(lang === 'vi' ? 'Chọn ít nhất một kỹ năng.' : 'Select at least one skill.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        skills: selectedSkills,
        topic: form.topic.trim(),
        is_public: form.is_public,
      };
      const ws = await uploadLibraryWorksheet(payload);
      toast.success(copy.success);
      navigate(`/worksheet/${ws.worksheet_id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || (lang === 'vi' ? 'Gửi thất bại.' : 'Upload failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const seo = {
    title: lang === 'vi' ? 'Chia sẻ bài tập | SmartGiaoAn' : 'Share a Worksheet | SmartGiaoAn',
    description: copy.intro,
    keywords: 'ESL worksheet share, community library Vietnam, Cambridge CEFR',
    ogUrl: 'https://www.smartgiaoan.site/upload',
    ogImage: 'https://www.smartgiaoan.site/og-image.svg',
  };

  return (
    <PageShell eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} seo={seo}>
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8" data-testid="upload-form">
          <Field label={copy.titleLabel}>
            <input
              required
              className="form-input w-full"
              placeholder={copy.titlePlaceholder}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="upload-title"
            />
          </Field>

          <Field label={copy.descriptionLabel}>
            <textarea
              required
              rows={4}
              className="form-input w-full"
              placeholder={copy.descriptionPlaceholder}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              data-testid="upload-description"
            />
          </Field>

          <Field label={copy.levelLabel}>
            <select
              className="form-input w-full"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              data-testid="upload-level"
            >
              {LEVELS.map((level) => (
                <option key={level.key} value={level.key}>
                  {level.label} — {level.age}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <SkillToggle selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills} />
          </div>

          <Field label={copy.topicLabel}>
            <input
              className="form-input w-full"
              placeholder={copy.topicPlaceholder}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              data-testid="upload-topic"
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="w-4 h-4 rounded border-border text-terracotta focus:ring-terracotta"
            />
            <span className="text-sm text-muted-foreground">{copy.publicLabel}</span>
          </label>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
              data-testid="upload-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {copy.submitting}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {copy.submit}
                </>
              )}
            </button>
            <Link to="/library" className="text-sm font-bold text-terracotta hover:underline">
              {copy.libraryLink}
            </Link>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="overline text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
