import React, { useState } from 'react';
import { http } from '../lib/api';
import { Sparkles, PenTool, Lock, Loader, PlayCircle, ShoppingCart } from 'lucide-react';

export default function WorksheetEditorPanels({ worksheet, tier, onUpdate }) {
  const [aiCommand, setAiCommand] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(JSON.stringify(worksheet.content, null, 2));
  const [buyLoading, setBuyLoading] = useState(false);

  const handleAIEdit = async () => {
    if (!aiCommand.trim()) return;
    setAiLoading(true);
    try {
      const r = await http.post('/worksheets/ai-edit', {
        worksheet_id: worksheet.worksheet_id,
        command: aiCommand
      });
      window.location.href = `/worksheet/${r.data.worksheet_id}`;
    } catch (err) {
      const detail = err?.response?.data?.detail || 'AI Edit failed';
      if (detail.includes('No AI edit credits')) {
        alert('Out of AI edit credits! Buy more or watch an ad to earn some.');
      } else {
        alert(detail);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const parsed = JSON.parse(editContent);
      await http.patch(`/worksheets/${worksheet.worksheet_id}`, { content: parsed });
      alert('Saved!');
      setEditMode(false);
      onUpdate?.();
    } catch (e) {
      alert('Invalid JSON. Please fix before saving.');
    }
  };

  const handleBuyEdits = async () => {
    setBuyLoading(true);
    // This will open PayPal — implement when ready
    alert('PayPal integration coming soon! For now, watch an ad to earn AI edit credits.');
    setBuyLoading(false);
  };

  const handleWatchAdForEdit = async () => {
    // Simulate watching an ad for +1 AI edit credit
    try {
      await http.post('/usage/grant-rewarded', { tier: 30, reward_type: 'ai_edit' });
      alert('+1 AI edit credit earned! Refresh the page to see it.');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to grant credit');
    }
  };

  const canUseAiEditor = Boolean(tier?.has_ai_editor) || tier?.tier === 'premium' || tier?.tier === 'pro';
  const aiCredits = tier?.ai_edit_credits || 0;

  return (
    <div className="print:hidden space-y-6 mb-8">
      {/* TIER BADGE */}
      <div className="flex justify-end">
        <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${
          canUseAiEditor ? 'bg-purple-100 text-purple-700' :
          tier?.tier === 'basic' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {tier?.tier || 'free'} Plan
          {canUseAiEditor && <span className="ml-1">• {aiCredits} AI edits left</span>}
        </span>
      </div>

      {/* WORD EDITOR — FREE FOR EVERYONE */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" />
            Word Editor
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">FREE</span>
          </h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            {editMode ? 'Cancel' : 'Edit Content'}
          </button>
        </div>
        {editMode ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-64 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveEdit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Click "Edit Content" to manually modify this worksheet. Fix typos, tweak questions, or restructure the JSON. Free for everyone.
          </p>
        )}
      </div>

      {/* AI EDITOR — PREMIUM ONLY */}
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border ${canUseAiEditor ? 'border-purple-200' : 'border-gray-200 opacity-60'} rounded-2xl p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Editor
            {!canUseAiEditor && <Lock className="w-4 h-4 text-gray-400" />}
            {canUseAiEditor && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">{aiCredits} left</span>}
          </h3>
        </div>

        {canUseAiEditor ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {["Make it harder", "Add 5 questions", "Translate to Vietnamese", "Simplify for weak students", "Convert to exam format"].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => setAiCommand(cmd)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    aiCommand === cmd
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type your own command..."
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAIEdit}
              disabled={aiLoading || !aiCommand || aiCredits < 1}
              className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {aiLoading ? <Loader className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'Editing...' : aiCredits < 1 ? 'No credits left' : 'Apply AI Edit'}
            </button>

            {/* Out of credits? Buy or earn */}
            {aiCredits < 1 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-bold text-amber-800 mb-3">Out of AI edit credits!</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleBuyEdits}
                    disabled={buyLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white font-bold py-2 rounded-lg hover:bg-amber-700"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy 10 for £5
                  </button>
                  <button
                    onClick={handleWatchAdForEdit}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-amber-600 text-amber-700 font-bold py-2 rounded-lg hover:bg-amber-50"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Ad (+1)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-3">
              Upgrade to <strong>Premium</strong> to edit worksheets with AI.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              50 AI edits included monthly. Buy more or earn via ads.
            </p>
            <a href="/pricing" className="inline-block text-sm font-bold text-purple-700 underline hover:text-purple-900">
              View Pricing →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
