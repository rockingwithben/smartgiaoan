import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { generateWorksheet, listWorksheets } from '../lib/api';
import { toast } from 'sonner';
import { Loader2, Sparkles, FileText, Crown, Filter, ArrowUpDown } from 'lucide-react'; 
import { PaywallModal } from '../components/PaywallModal';
import RewardedAdModal from '../components/RewardedAdModal';

const LEVELS = ['Kindergarten', 'Primary 1-2', 'Primary 3-4', 'Primary 5-6', 'Secondary', 'IELTS'];
const CEFR = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILLS = ['Reading', 'Listening', 'Writing', 'Grammar', 'Vocabulary', 'Speaking'];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [worksheets, setWorksheets] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('Generate Worksheet');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adTier, setAdTier] = useState(15);
  
  // UX Optimization (Sorting & Filtering)
  const [filterLevel, setFilterLevel] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');

  const [form, setForm] = useState({
    level: 'Primary 3-4',
    cefr: 'A2',
    skill: 'Reading',
    topic: '',
    num_questions: 24,
    grammar_focus: '',
  });

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

  const remaining = user
    ? user.is_premium
      ? Infinity
      : Math.max(0, (3 + (user.bonus_credits || 0)) - (user.free_used || 0))
    : 0;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) {
      toast.error('Please enter a topic');
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

  const handleWatchAd = (tier) => {
    setAdTier({ short: 15, medium: 30, long: 45 }[tier] || tier);
    setShowPaywall(false);
    setShowAd(true);
  };

  const handleAdGranted = () => {
    window.location.reload();
  };

  // Process sorting and filtering
  const processedWorksheets = worksheets
    .filter(ws => filterLevel === 'All' || ws.level === filterLevel)
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
              {user?.is_premium ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <Crown size={14} /> Premium — Unlimited
                </span>
              ) : (
                <span>Free left: <span className={`font-bold ${remaining === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {remaining === Infinity ? 'Unlimited' : remaining}
                </span></span>
              )}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles size={18} /> Generate Worksheet
              </h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEFR</label>
                  <select value={form.cefr} onChange={e => setForm(f => ({ ...f, cefr: e.target.value }))} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm">
                    {CEFR.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                  <select value={form.skill} onChange={e => setForm(f => ({ ...f, skill: e.target.value }))} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm">
                    {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input type="text" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Ordering food at a restaurant" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
                  <input type="number" min={5} max={50} value={form.num_questions} onChange={e => setForm(f => ({ ...f, num_questions: parseInt(e.target.value) || 24 }))} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grammar Focus (optional)</label>
                  <input type="text" value={form.grammar_focus} onChange={e => setForm(f => ({ ...f, grammar_focus: e.target.value }))} placeholder="e.g. Present Perfect" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
                <button type="submit" disabled={generating} className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
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

              <div className="flex items-center gap-2">
                <div className="relative flex items-center border border-gray-200 rounded-lg bg-white px-2 py-1.5 shadow-sm">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Levels</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
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
                  <button key={ws.worksheet_id} onClick={() => navigate(`/worksheet/${ws.worksheet_id}`)} className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-500 hover:shadow-sm transition">
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

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} onWatchAd={handleWatchAd} />
      {showAd && <RewardedAdModal tier={adTier} onClose={() => setShowAd(false)} onGranted={handleAdGranted} />}
    </div>
  );
}