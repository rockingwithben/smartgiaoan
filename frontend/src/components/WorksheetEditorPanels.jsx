import React, { useState } from 'react';
import { http } from '../lib/api';
import { Sparkles, UserCheck, PenTool, Lock, Loader } from 'lucide-react';

export default function WorksheetEditorPanels({ worksheet, tier, onUpdate }) {
  const [aiCommand, setAiCommand] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [humanNotes, setHumanNotes] = useState('');
  const [humanLoading, setHumanLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(JSON.stringify(worksheet.content, null, 2));

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
      alert(err?.response?.data?.detail || 'AI Edit failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleHumanEdit = async () => {
    setHumanLoading(true);
    try {
      const r = await http.post('/worksheets/human-edit-request', {
        worksheet_id: worksheet.worksheet_id,
        notes: humanNotes
      });
      alert(`Submitted! Review ID: ${r.data.review_id}`);
      setHumanNotes('');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to submit');
    } finally {
      setHumanLoading(false);
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

  const isPremium = tier?.tier === 'premium';
  const isBasic = tier?.tier === 'basic' || isPremium;
  const isFree = !isBasic && !isPremium;

  return (
    <div className="print:hidden space-y-6 mb-8">
      {/* TIER BADGE */}
      <div className="flex justify-end">
        <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${
          isPremium ? 'bg-purple-100 text-purple-700' :
          isBasic ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {tier?.tier || 'free'} Plan
        </span>
      </div>

      {/* WORD EDITOR — Basic+ */}
      {isBasic && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" />
              Word Editor
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
              Click "Edit Content" to manually modify this worksheet's JSON. Perfect for fixing typos or tweaking questions.
            </p>
          )}
        </div>
      )}

      {/* AI EDITOR — Premium only */}
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border ${isPremium ? 'border-purple-200' : 'border-gray-200 opacity-75'} rounded-2xl p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Editor
            {!isPremium && <Lock className="w-4 h-4 text-gray-400" />}
          </h3>
          {isPremium && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
        </div>
        {isPremium ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {["Make it harder", "Add 5 questions", "Translate to Vietnamese", "Simplify for weak students", "Convert to exam format"].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => { setAiCommand(cmd); }}
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
              disabled={aiLoading || !aiCommand}
              className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {aiLoading ? <Loader className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'Editing...' : 'Apply AI Edit'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-3">Upgrade to Premium to edit worksheets with AI.</p>
            <a href="/pricing" className="text-sm font-bold text-purple-700 underline">View Pricing →</a>
          </div>
        )}
      </div>

      {/* HUMAN EDITOR — Basic+ */}
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border ${isBasic ? 'border-amber-200' : 'border-gray-200 opacity-75'} rounded-2xl p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            Expert Human Review
            {!isBasic && <Lock className="w-4 h-4 text-gray-400" />}
          </h3>
          {isBasic && (
            <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
              {tier?.human_editor_credits || 0} left
            </span>
          )}
        </div>
        {isBasic ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              A Cambridge-certified examiner will review your worksheet and send feedback within 24 hours.
            </p>
            <textarea
              placeholder="Any specific requests? (e.g., 'Check CEFR alignment', 'More gap-fill questions')"
              value={humanNotes}
              onChange={(e) => setHumanNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleHumanEdit}
              disabled={humanLoading || (tier?.human_editor_credits || 0) < 1}
              className="w-full bg-amber-600 text-white font-bold py-2.5 rounded-xl hover:bg-amber-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {humanLoading ? <Loader className="animate-spin w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {humanLoading ? 'Submitting...' : 'Request Review'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-3">Upgrade to Basic for expert human reviews.</p>
            <a href="/pricing" className="text-sm font-bold text-amber-700 underline">View Pricing →</a>
          </div>
        )}
      </div>
    </div>
  );
}