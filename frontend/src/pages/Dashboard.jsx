import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdSlot } from '../components/AdSlot';
import { WorksheetView } from '../components/WorksheetView';
import { PaywallModal, UpgradeModal } from '../components/PaywallModal';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { generateWorksheet, listWorksheets } from '../lib/api';

const ANON_QUOTA = 3;

function getAnonUsed() {
  return parseInt(localStorage.getItem('sga_anon_used') || '0', 10);
}
function setAnonUsed(n) {
  localStorage.setItem('sga_anon_used', String(n));
}

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user, startLogin, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const paperRef = useRef(null);

  const [form, setForm] = useState({
    level: 'Primary',
    cefr: 'A2',
    skill: 'reading',
    topic: '',
    num_questions: 24,
    grammar_focus: '',
  });
  const [generating, setGenerating] = useState(false);
  const [worksheet, setWorksheet] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const [paywall, setPaywall] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [rewarded, setRewarded] = useState({ open: false, tier: 'medium' });

  // Open upgrade modal when hash is #upgrade
  useEffect(() => {
    if (location.hash === '#upgrade') setUpgrade(true);
  }, [location.hash]);

  // Load history when user logs in
  useEffect(() => {
    if (user) {
      listWorksheets().then(setHistory).catch(() => {});
    }
  }, [user]);

  const remaining = (() => {
    if (!user) return Math.max(0, ANON_QUOTA - getAnonUsed());
    if (user.is_premium) return Infinity;
    return Math.max(0, 3 + (user.bonus_credits || 0) - (user.free_used || 0));
  })();

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.topic.trim()) return;

    // Check quota
    if (!user) {
      if (getAnonUsed() >= ANON_QUOTA) {
        // Anonymous user must sign in to keep going
        if (!window.confirm(lang === 'vi'
          ? 'Bạn đã dùng hết lượt miễn phí trên trình duyệt này. Đăng nhập Google để tiếp tục?'
          : 'You\'ve used your free worksheets on this browser. Sign in with Google to continue?')) return;
        startLogin();
        return;
      }
    } else {
      const left = 3 + (user.bonus_credits || 0) - (user.free_used || 0);
      if (!user.is_premium && left <= 0) {
        setPaywall(true);
        return;
      }
    }

    try {
      setGenerating(true);
      const data = await generateWorksheet(form);
      setWorksheet(data);
      if (data.user) await refresh();
      if (!user) setAnonUsed(getAnonUsed() + 1);
      // refresh history
      if (user) listWorksheets().then(setHistory).catch(() => {});
      toast.success(lang === 'vi' ? 'Bài tập đã sẵn sàng' : 'Worksheet ready', { description: data.title });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 402) {
        setPaywall(true);
      } else {
        const msg = err?.response?.data?.detail || err.message || 'Failed to generate';
        setError(msg);
        toast.error(lang === 'vi' ? 'Không thể tạo bài tập' : 'Couldn\u2019t generate', { description: msg });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = async () => {
    if (!paperRef.current) return;
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      let imgW = pageW - 40;
      let imgH = imgW * ratio;
      if (imgH > pageH - 40) {
        imgH = pageH - 40;
        imgW = imgH / ratio;
      }
      pdf.addImage(img, 'PNG', (pageW - imgW) / 2, 20, imgW, imgH);
      const safeTitle = (worksheet?.title || 'worksheet').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      pdf.save(`smartgiaoan_${safeTitle}.pdf`);
      toast.success(lang === 'vi' ? 'PDF đã tải xuống' : 'PDF downloaded');
    } catch {
      toast.error(lang === 'vi' ? 'Không thể tạo PDF' : 'Could not create PDF');
    }
  };

  const onWatchAd = (tier) => {
    setPaywall(false);
    if (!user) {
      // Guests must sign in to track bonus credits server-side
      startLogin();
      return;
    }
    setRewarded({ open: true, tier });
  };

  const onRewardClaimed = async () => {
    await refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Status bar */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="overline text-muted-foreground">{t('free_left')}</span>
            <span className="font-mono font-bold text-base flex items-center gap-2" data-testid="free-counter">
              {remaining === Infinity ? '∞' : remaining}
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block"></span>
            </span>
            {user?.is_premium && (
              <span className="text-[10px] uppercase tracking-widest font-bold text-terracotta border border-terracotta px-1.5 py-0.5">Premium</span>
            )}
          </div>
          {!user?.is_premium && (
            <button onClick={() => setUpgrade(true)} className="text-sm text-terracotta hover:underline font-medium" data-testid="open-upgrade-btn">
              {t('paywall_upgrade')} →
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white border border-border p-6">
            <p className="overline text-terracotta">{t('new_worksheet')}</p>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <Field label={t('form_level')}>
                <select className="form-input" value={form.level} onChange={onChange('level')} data-testid="form-level">
                  {['Kindergarten', 'Primary', 'Secondary', 'IELTS'].map((l) => (
                    <option key={l} value={l}>{t(`levels.${l}`)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('form_cefr')}>
                <select className="form-input" value={form.cefr} onChange={onChange('cefr')} data-testid="form-cefr">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('form_skill')}>
                <select className="form-input" value={form.skill} onChange={onChange('skill')} data-testid="form-skill">
                  {['reading', 'writing', 'grammar', 'vocabulary', 'listening'].map((s) => (
                    <option key={s} value={s}>{t(`skills.${s}`)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('form_topic')}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('form_topic_placeholder')}
                  value={form.topic}
                  onChange={onChange('topic')}
                  data-testid="form-topic"
                  required
                />
              </Field>
              <Field label={lang === 'vi' ? 'Trọng tâm ngữ pháp (tuỳ chọn)' : 'Grammar focus (optional)'}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'vi' ? 'VD: thì quá khứ đơn, câu điều kiện loại 2' : 'e.g. past simple, second conditional'}
                  value={form.grammar_focus}
                  onChange={onChange('grammar_focus')}
                  data-testid="form-grammar"
                />
              </Field>
              <Field label={t('form_questions')}>
                <input
                  type="number"
                  min={16}
                  max={40}
                  className="form-input"
                  value={form.num_questions}
                  onChange={(e) => setForm((f) => ({ ...f, num_questions: Math.max(16, Math.min(40, +e.target.value || 24)) }))}
                  data-testid="form-questions"
                />
                <p className="text-[11px] text-muted-foreground mt-1">3+ page worksheet · 16 minimum, 40 max</p>
              </Field>
              {error && <div className="text-xs text-destructive border border-destructive/40 px-3 py-2 bg-destructive/10" data-testid="form-error">{error}</div>}
              <button type="submit" disabled={generating} className="btn-primary w-full" data-testid="generate-btn">
                {generating ? t('generating') : t('generate')}
              </button>
            </form>
          </div>

          {!user?.is_premium && <AdSlot size="sidebar" testId="sidebar-ad" />}

          {user && (
            <div className="bg-white border border-border p-6">
              <p className="overline text-muted-foreground">{t('worksheet_history')}</p>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-3">{t('no_history')}</p>
              ) : (
                <ul className="mt-3 space-y-2 max-h-[260px] overflow-auto" data-testid="history-list">
                  {history.map((w) => (
                    <li key={w.worksheet_id}>
                      <button
                        onClick={() => setWorksheet(w)}
                        className="text-left w-full text-sm hover:bg-secondary px-2 py-1.5 -mx-2 transition-colors"
                        data-testid={`history-item-${w.worksheet_id}`}
                      >
                        <div className="font-medium truncate">{w.title}</div>
                        <div className="text-xs text-muted-foreground">{w.level} · {w.cefr} · {w.skill}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* Main panel */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl">{worksheet?.title || (lang === 'vi' ? 'Bài tập của bạn' : 'Your worksheet')}</h1>
            {worksheet && (
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn-secondary !py-2 !px-4 text-sm" data-testid="print-btn">{t('print')}</button>
                <button onClick={handlePdf} className="btn-primary !py-2 !px-4 text-sm" data-testid="pdf-btn">{t('download_pdf')}</button>
              </div>
            )}
          </div>
          
          {/* UPDATED: We pass onRegenerate down so the FeedbackLoop can instantly update the screen! */}
          <WorksheetView 
            data={worksheet} 
            paperRef={paperRef} 
            onRegenerate={(newContent) => setWorksheet({ ...worksheet, content: newContent })}
          />

          {!user?.is_premium && <AdSlot size="leaderboard" testId="bottom-ad" />}
        </main>
      </div>

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} onWatchAd={onWatchAd} />
      <UpgradeModal open={upgrade} onClose={() => { setUpgrade(false); navigate('/dashboard', { replace: true }); }} />
      <RewardedAdModal open={rewarded.open} tier={rewarded.tier} onClose={() => setRewarded({ ...rewarded, open: false })} onClaimed={onRewardClaimed} />
      <Footer />
    </div>
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
