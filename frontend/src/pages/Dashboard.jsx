import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

// === COMPONENTS ===
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdSlot } from '../components/AdSlot';
import { WorksheetView } from '../components/WorksheetView';
import { PaywallModal, UpgradeModal } from '../components/PaywallModal';
import { RewardedAdModal } from '../components/RewardedAdModal';

// === LIB / API ===
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

  // === STATE ===
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

  // Monetization Modals
  const [paywall, setPaywall] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [rewarded, setRewarded] = useState({ open: false, tier: 'medium' });

  // === EFFECTS ===
  // Open upgrade modal if URL hash is #upgrade
  useEffect(() => {
    if (location.hash === '#upgrade') setUpgrade(true);
  }, [location.hash]);

  // Load worksheet history when user logs in
  useEffect(() => {
    if (user) {
      listWorksheets()
        .then(setHistory)
        .catch(err => console.error("Failed to load history:", err));
    }
  }, [user]);

  // === CALCULATE CREDITS ===
  const remaining = (() => {
    if (!user) return Math.max(0, ANON_QUOTA - getAnonUsed());
    if (user.is_premium) return Infinity;
    return Math.max(0, 3 + (user.bonus_credits || 0) - (user.free_used || 0));
  })();

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // === GENERATION LOGIC ===
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.topic.trim()) return;

    // 1. Quota Check for Anonymous Users
    if (!user) {
      if (getAnonUsed() >= ANON_QUOTA) {
        if (!window.confirm(lang === 'vi'
          ? 'Bạn đã dùng hết lượt miễn phí trên trình duyệt này. Đăng nhập Google để tiếp tục?'
          : 'You\'ve used your free worksheets on this browser. Sign in to continue?')) return;
        startLogin();
        return;
      }
    } else {
      // 2. Quota Check for Registered Users
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
      
      // Update quotas and history silently
      if (data.user) await refresh();
      if (!user) setAnonUsed(getAnonUsed() + 1);
      if (user) listWorksheets().then(setHistory).catch(() => {});
      
      toast.success(lang === 'vi' ? 'Bài tập đã sẵn sàng!' : 'Worksheet ready!', { description: data.title });
      
    } catch (err) {
      const status = err?.response?.status;
      if (status === 402) {
        setPaywall(true); // Server triggered paywall
      } else {
        const msg = err?.response?.data?.detail || err.message || 'Failed to generate content.';
        setError(msg);
        toast.error(lang === 'vi' ? 'Không thể tạo bài tập' : 'Generation Failed', { description: msg });
      }
    } finally {
      setGenerating(false);
    }
  };

  // === EXPORT LOGIC ===
  const handlePrint = () => {
    window.print();
  };

  const handlePdf = async () => {
    if (!paperRef.current) return;
    try {
      toast.info(lang === 'vi' ? 'Đang tạo PDF...' : 'Generating PDF...', { duration: 2000 });
      
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Scale image to fit A4 width perfectly with margins
      const margin = 20;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multi-page PDFs cleanly
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const safeTitle = (worksheet?.title || 'worksheet').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      pdf.save(`smartgiaoan_${safeTitle}.pdf`);
      toast.success(lang === 'vi' ? 'Đã tải xuống PDF' : 'PDF Downloaded');
      
    } catch (err) {
      console.error(err);
      toast.error(lang === 'vi' ? 'Lỗi tạo PDF' : 'Could not create PDF');
    }
  };

  // === MONETIZATION HANDLERS ===
  const onWatchAd = (tier) => {
    setPaywall(false);
    if (!user) {
      startLogin();
      return;
    }
    setRewarded({ open: true, tier });
  };

  const onRewardClaimed = async () => {
    await refresh(); // Silently pull new credit balance from server
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      {/* QUOTA STATUS BAR */}
      <div className="border-b border-border bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="uppercase tracking-wider text-xs font-bold text-gray-500">{t('free_left')}</span>
            <span className="font-mono font-black text-lg flex items-center gap-2" data-testid="free-counter">
              {remaining === Infinity ? '∞' : remaining}
              <span className={`w-2 h-2 rounded-full inline-block ${remaining === Infinity ? 'bg-green-500' : remaining > 0 ? 'bg-black' : 'bg-red-500'}`}></span>
            </span>
            {user?.is_premium && (
              <span className="text-[10px] uppercase tracking-widest font-black text-red-600 border border-red-600 px-2 py-0.5 rounded bg-red-50">Premium</span>
            )}
          </div>
          {!user?.is_premium && (
            <button onClick={() => setUpgrade(true)} className="text-sm text-red-600 hover:text-red-800 hover:underline font-bold transition-colors" data-testid="open-upgrade-btn">
              {t('paywall_upgrade')} →
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* === SIDEBAR (CONTROLS & HISTORY) === */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          {/* AI Generator Form */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
            <p className="uppercase tracking-widest text-xs font-bold text-red-600 mb-4">{t('new_worksheet')}</p>
            <form onSubmit={submit} className="space-y-4">
              
              <Field label={t('form_level')}>
                <select className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={form.level} onChange={onChange('level')}>
                  {['Kindergarten', 'Primary', 'Secondary', 'IELTS'].map((l) => (
                    <option key={l} value={l}>{t(`levels.${l}`)}</option>
                  ))}
                </select>
              </Field>
              
              <Field label={t('form_cefr')}>
                <select className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={form.cefr} onChange={onChange('cefr')}>
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
              
              <Field label={t('form_skill')}>
                <select className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={form.skill} onChange={onChange('skill')}>
                  {['reading', 'writing', 'grammar', 'vocabulary', 'listening'].map((s) => (
                    <option key={s} value={s}>{t(`skills.${s}`)}</option>
                  ))}
                </select>
              </Field>
              
              <Field label={t('form_topic')}>
                <input
                  type="text"
                  className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  placeholder={t('form_topic_placeholder')}
                  value={form.topic}
                  onChange={onChange('topic')}
                  required
                />
              </Field>
              
              <Field label={lang === 'vi' ? 'Trọng tâm ngữ pháp (Tùy chọn)' : 'Grammar focus (Optional)'}>
                <input
                  type="text"
                  className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  placeholder={lang === 'vi' ? 'VD: quá khứ đơn...' : 'e.g. past simple...'}
                  value={form.grammar_focus}
                  onChange={onChange('grammar_focus')}
                />
              </Field>
              
              <Field label={t('form_questions')}>
                <input
                  type="number"
                  min={16}
                  max={40}
                  className="form-input w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={form.num_questions}
                  onChange={(e) => setForm((f) => ({ ...f, num_questions: Math.max(16, Math.min(40, +e.target.value || 24)) }))}
                />
                <p className="text-[11px] text-gray-400 mt-1 font-medium">16 minimum, 40 maximum</p>
              </Field>

              {error && (
                <div className="text-xs font-bold text-red-600 border border-red-200 px-3 py-2 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={generating} 
                className={`w-full font-bold p-4 rounded-xl transition-all shadow-md mt-2 flex justify-center items-center ${
                  generating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {generating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('generating')}
                  </span>
                ) : (
                  <>✨ {t('generate')}</>
                )}
              </button>
            </form>
          </div>

          {!user?.is_premium && <AdSlot size="sidebar" testId="sidebar-ad" />}

          {/* Worksheet History Library */}
          {user && (
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
              <p className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4">{t('worksheet_history')}</p>
              
              {history.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm font-medium text-gray-500">{t('no_history')}</p>
                </div>
              ) : (
                <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((w) => (
                    <li key={w.worksheet_id}>
                      <button
                        onClick={() => setWorksheet(w)}
                        className="text-left w-full hover:bg-gray-50 px-3 py-3 rounded-xl transition-colors border border-transparent hover:border-gray-200 group"
                      >
                        <div className="font-bold text-gray-900 text-sm truncate group-hover:text-red-600 transition-colors">{w.title}</div>
                        <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                          {w.level} · {w.cefr} · {w.skill}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* === MAIN PANEL (DOCUMENT PREVIEW) === */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm gap-4">
            <h1 className="font-serif font-bold text-2xl text-gray-900 truncate">
              {worksheet?.title || (lang === 'vi' ? 'Khu Vực Làm Việc' : 'Workspace')}
            </h1>
            
            {worksheet && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handlePrint} className="bg-gray-100 hover:bg-gray-200 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm border border-gray-300">
                  🖨️ {t('print')}
                </button>
                <button onClick={handlePdf} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
                  ⬇️ {t('download_pdf')}
                </button>
              </div>
            )}
          </div>
          
          {worksheet ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <WorksheetView 
                data={worksheet} 
                paperRef={paperRef} 
                onRegenerate={(newContent) => setWorksheet({ ...worksheet, content: newContent })}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-2xl border border-gray-200 border-dashed">
              <div className="text-6xl mb-4 opacity-50">📝</div>
              <h3 className="text-xl font-bold text-gray-700">Ready to create?</h3>
              <p className="text-gray-500 font-medium mt-2 max-w-sm text-center">Fill out the settings on the left and click generate to build your first intelligent worksheet.</p>
            </div>
          )}

          {!user?.is_premium && worksheet && <AdSlot size="leaderboard" testId="bottom-ad" />}
        </main>
      </div>

      {/* === MODALS === */}
      <PaywallModal open={paywall} onClose={() => setPaywall(false)} onWatchAd={onWatchAd} />
      <UpgradeModal open={upgrade} onClose={() => { setUpgrade(false); navigate('/dashboard', { replace: true }); }} />
      <RewardedAdModal open={rewarded.open} tier={rewarded.tier} onClose={() => setRewarded({ ...rewarded, open: false })} onClaimed={onRewardClaimed} />
      
      <Footer />
    </div>
  );
}

// Reusable Label Component
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="uppercase tracking-widest text-[10px] font-bold text-gray-500 mb-1.5 block">{label}</span>
      <div>{children}</div>
    </label>
  );
}
