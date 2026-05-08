import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { generateWorksheet, listWorksheets, http } from '../lib/api';
import { toast } from 'sonner';
import { Loader2, Sparkles, FileText, Crown, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { PaywallModal } from '../components/PaywallModal';
import RewardedAdModal from '../components/RewardedAdModal';
import AdModal from '../components/AdModal';

const LEVELS = ['Kindergarten', 'Primary 1-2', 'Primary 3-4', 'Primary 5-6', 'Secondary', 'IELTS'];
const CEFR = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILLS = ['Reading', 'Listening', 'Writing', 'Grammar', 'Vocabulary', 'Speaking'];

// Mobile step wizard configuration
const FORM_STEPS = [
  { key: 'level-cefr', title: 'Level & CEFR', fields: ['level', 'cefr'] },
  { key: 'skill-topic', title: 'Skill & Topic', fields: ['skill', 'topic'] },
  { key: 'options', title: 'Options', fields: ['num_questions', 'grammar_focus'] },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [worksheets, setWorksheets] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('Generate Worksheet');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adDuration, setAdDuration] = useState(0);
  const [adTier, setAdTier] = useState(15);
  const [tierInfo, setTierInfo] = useState(null);
  
  // UX Optimization (Sorting & Filtering)
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Mobile step wizard
  const [mobileStep, setMobileStep] = useState(0);

  const [form, setForm] = useState({
    level: 'Primary 3-4',
    cefr: 'A2',
    skill: 'Reading',
    topic: '',
    num_questions: 24,
    grammar_focus: '',
  });

  // Load tier info for accurate credit display
  useEffect(() => {
    if (user) {
      http.get('/billing/tier').then(r => setTierInfo(r.data)).catch(() => {});
    }
  }, [user]);

  const loadWorksheets = useCallback(async () => {
    if (!user) return;
    try {
      const docs = await listWorksheets();
      setWorksheets(docs);
    } catch (e) {
      console.error('Failed to load worksheets', e);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
      return;
    }
    if (user) {
      loadWorksheets();
    }
  }, [user, authLoading, navigate, loadWorksheets]);

  // Calculate remaining based on tier info from server
  const getRemainingDisplay = () => {
    if (!tierInfo) return '...';
    if (tierInfo.tier === 'premium') return 'Unlimited';
    if (tierInfo.tier === 'basic') {
      const remaining = Math.max(0, tierInfo.monthly_quota - tierInfo.used_this_month);
      return `${remaining} / ${tierInfo.monthly_quota}`;
    }
    // Free tier: unlimited but with ads
    return 'Unlimited (ads)';
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) {
      toast.error('Please enter a topic');
      // On mobile, jump to step 2 where topic field is
      setMobileStep(1);
      return;
    }
    
    setGenerating(true);
    
    // Psychological Wait-Time Reduction
    const loadingPhrases = [
      "Analyzing CEFR Level...",
      "Structuring Grammar Exercises...",
      "Writing Vietnamese Contexts...",
      "Formatting Answer Key...",
      "Finalizing PDF Layout..."
    ];
    
    let phraseIndex = 0;
    setLoadingText(loadingPhrases[0]);
    
    const interval = setInterval(() => {
      phraseIndex++;
      if (phraseIndex < loadingPhrases.length) {
        setLoadingText(loadingPhrases[phraseIndex]);
      }
    }, 2500);

    try {
      const ws = await generateWorksheet(form);
      clearInterval(interval);
      
      // Check if server wants us to show an ad (free tier random injection)
      if (ws.show_ad) {
        setAdDuration(ws.ad_duration);
        setShowAd(true);
        setGenerating(false);
        setLoadingText('Generate Worksheet');
        return; // Don't navigate yet — AdModal will call onComplete
      }
      
      toast.success('Worksheet generated successfully!');
      navigate(`/worksheet/${ws.worksheet_id}`);
    } catch (err) {
      clearInterval(interval);
      if (err.response?.status === 402) {
        setShowPaywall(true);
      } else {
        toast.error(err.response?.data?.detail || 'Generation failed');
      }
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setLoadingText('Generate Worksheet');
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    loadWorksheets(); // Refresh to show new worksheet
    toast.success('Ad complete! +1 worksheet credit.');
  };

  const handleWatchAd = (tier) => {
    setAdTier({ short: 15, medium: 30, long: 45 }[tier] || tier);
    setShowPaywall(false);
    setShowAd(true);
  };

  const handleAdGranted = () => {
    window.location.reload();
  };

  // Process sorting and filtering
  const dateRangeDays = {
    All: null,
    'Last 7 days': 7,
    'Last 30 days': 30,
    'Last 90 days': 90,
  };

  const processedWorksheets = worksheets
    .filter(ws => filterLevel === 'All' || ws.level === filterLevel)
    .filter(ws => filterSkill === 'All' || ws.skill === filterSkill)
    .filter(ws => {
      const days = dateRangeDays[filterDateRange];
      if (!days) return true;
      const created = new Date(ws.created_at).getTime();
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return created >= cutoff;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
            <p className="text-gray-500 text-sm mt-1">
              {tierInfo?.tier === 'premium' ? (
                <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                  <Crown size={14} /> Premium — Unlimited • {tierInfo?.ai_edit_credits || 0} AI edits left
                </span>
              ) : tierInfo?.tier === 'basic' ? (
                <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                  <Sparkles size={14} /> Basic — {getRemainingDisplay()} this month
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                  <Sparkles size={14} /> Free — Unlimited (random ads) • {tierInfo?.remaining_this_month || '∞'} left
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {/* Desktop: sticky form, Mobile: non-sticky with step wizard */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:sticky lg:top-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles size={18} /> Generate Worksheet
              </h2>
              
              {/* Mobile step indicator */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <div className="flex gap-1.5">
                  {FORM_STEPS.map((step, idx) => (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setMobileStep(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === mobileStep 
                          ? 'w-6 bg-black' 
                          : idx < mobileStep 
                            ? 'w-2 bg-green-500' 
                            : 'w-2 bg-gray-200'
                      }`}
                      aria-label={`Go to step ${idx + 1}: ${step.title}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {FORM_STEPS[mobileStep].title}
                </span>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Step 1: Level & CEFR - always visible on desktop, conditional on mobile */}
                <div className={`space-y-4 ${mobileStep === 0 ? 'block' : 'hidden lg:block'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                    <select 
                      value={form.level} 
                      onChange={e => setForm(f => ({ ...f, level: e.target.value }))} 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation"
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CEFR</label>
                    <select 
                      value={form.cefr} 
                      onChange={e => setForm(f => ({ ...f, cefr: e.target.value }))} 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation"
                    >
                      {CEFR.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Step 2: Skill & Topic */}
                <div className={`space-y-4 ${mobileStep === 1 ? 'block' : 'hidden lg:block'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill</label>
                    <select 
                      value={form.skill} 
                      onChange={e => setForm(f => ({ ...f, skill: e.target.value }))} 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation"
                    >
                      {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
                    <input 
                      type="text" 
                      value={form.topic} 
                      onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} 
                      placeholder="e.g. Ordering food at a restaurant" 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation" 
                    />
                  </div>
                </div>

                {/* Step 3: Options */}
                <div className={`space-y-4 ${mobileStep === 2 ? 'block' : 'hidden lg:block'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Questions</label>
                    <input 
                      type="number" 
                      min={5} 
                      max={50} 
                      value={form.num_questions} 
                      onChange={e => setForm(f => ({ ...f, num_questions: parseInt(e.target.value) || 24 }))} 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grammar Focus (optional)</label>
                    <input 
                      type="text" 
                      value={form.grammar_focus} 
                      onChange={e => setForm(f => ({ ...f, grammar_focus: e.target.value }))} 
                      placeholder="e.g. Present Perfect" 
                      className="w-full border border-gray-200 rounded-lg p-3.5 text-base min-h-[48px] touch-manipulation" 
                    />
                  </div>
                </div>

                {/* Mobile navigation buttons */}
                <div className="flex gap-2 lg:hidden">
                  {mobileStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setMobileStep(s => s - 1)}
                      className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition min-h-[48px]"
                    >
                      <ChevronLeft size={18} /> Back
                    </button>
                  )}
                  {mobileStep < FORM_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setMobileStep(s => s + 1)}
                      className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition min-h-[48px]"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={generating} 
                      className="flex-1 bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      {generating && <Loader2 size={18} className="animate-spin" />}
                      {generating ? loadingText : 'Generate'}
                    </button>
                  )}
                </div>

                {/* Desktop submit button */}
                <button 
                  type="submit" 
                  disabled={generating} 
                  className="hidden lg:flex w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 items-center justify-center gap-2 min-h-[48px]"
                >
                  {generating && <Loader2 size={18} className="animate-spin" />}
                  {generating ? loadingText : 'Generate Worksheet'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} /> My Worksheets ({processedWorksheets.length})
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2.5 shadow-sm min-h-[44px]">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-transparent text-base text-gray-700 outline-none cursor-pointer touch-manipulation"
                  >
                    <option value="All">All Levels</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="relative flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2.5 shadow-sm min-h-[44px]">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                    className="bg-transparent text-base text-gray-700 outline-none cursor-pointer touch-manipulation"
                  >
                    <option value="All">All Skills</option>
                    {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="relative flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2.5 shadow-sm min-h-[44px]">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="bg-transparent text-base text-gray-700 outline-none cursor-pointer touch-manipulation"
                  >
                    <option value="All">All Dates</option>
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 90 days">Last 90 days</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-3 py-2.5 text-base text-gray-700 hover:bg-gray-50 transition shadow-sm min-h-[44px] touch-manipulation"
                  title="Sort by Date"
                >
                  <ArrowUpDown size={14} className="text-gray-400" />
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>

            {processedWorksheets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">No worksheets found for these filters. Generate your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processedWorksheets.map(ws => (
                  <button 
                    key={ws.worksheet_id} 
                    onClick={() => navigate(`/worksheet/${ws.worksheet_id}`)} 
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-500 hover:shadow-sm transition min-h-[72px] touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ws.title}</h3>
                        <p className="text-sm text-gray-500">{ws.level} · {ws.cefr} · {ws.skill}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(ws.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Random Ad Modal (from server) */}
      <AdModal 
        isOpen={showAd} 
        duration={adDuration} 
        onComplete={handleAdComplete}
        onClose={() => {
          setShowAd(false);
          setGenerating(false);
        }}
      />

      {/* Legacy Paywall for out-of-credit scenarios */}
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} onWatchAd={handleWatchAd} />
      
      {/* Legacy Rewarded Ad Modal */}
      {showAd && adDuration === 0 && <RewardedAdModal tier={adTier} onClose={() => setShowAd(false)} onGranted={handleAdGranted} />}
    </div>
  );
}
