import React, { useState } from 'react';
import { http } from '../lib/api';
import { toast } from 'sonner';

export default function FeedbackLoop({ worksheetId, originalPrompt, onRegenerate }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!worksheetId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      const r = await http.post('/worksheets/fix', { worksheetId, originalPrompt, feedback });
      if (r.data && r.data.content) {
        onRegenerate && onRegenerate(r.data.content);
        toast.success('Worksheet updated!');
        setFeedback('');
        setOpen(false);
      }
    } catch (err) {
      toast.error('Could not apply fix. Try regenerating instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-lg">✏️</span>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Request a quick fix</p>
            <p className="text-xs text-gray-500">Ask the AI to tweak this worksheet</p>
          </div>
        </div>
        <span className="text-gray-400 font-bold text-lg">{open ? '-' : '+'}</span>
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-gray-100 pt-4">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">What needs fixing?</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Make the reading passage simpler, add more vocabulary exercises..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition resize-none"
            rows={3} required />
          <button type="submit" disabled={loading || !feedback.trim()}
            className="mt-3 bg-black text-white font-bold px-6 py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-40 text-sm">
            {loading ? 'Applying fix...' : 'Apply fix'}
          </button>
        </form>
      )}
    </div>
  );
}
