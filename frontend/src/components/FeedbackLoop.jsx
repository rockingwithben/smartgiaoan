import { useState } from 'react';

export default function FeedbackLoop({ worksheetId, originalPrompt, onRegenerate }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleFixIt = async () => {
    setIsSubmitting(true);
    try {
      // Point this to your Render backend URL. 
      // Ensure credentials: 'include' is there so your session cookies are sent!
      const backendUrl = process.env.REACT_APP_API_URL || 'https://your-render-url.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/worksheets/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          worksheetId: worksheetId,
          originalPrompt: originalPrompt,
          feedback: feedback
        })
      });

      if (!response.ok) throw new Error('Failed to fix worksheet');

      const data = await response.json();
      
      // Pass the new AI content up to whatever component is rendering the PDF
      onRegenerate(data.content); 
      setStatus('fixed');
    } catch (error) {
      console.error("Failed to fix:", error);
      setStatus('error');
    }
    setIsSubmitting(false);
  };

  if (status === 'fixed') {
    return (
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
        <p className="text-green-700 font-bold text-center">✨ Worksheet successfully upgraded based on your feedback!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-1">Not quite right?</h3>
      <p className="text-sm text-gray-500 mb-4">Tell the AI exactly what to change, and it will rewrite the lesson in seconds.</p>
      
      <textarea 
        className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-red-500 outline-none transition"
        rows="3"
        placeholder="e.g., Make the vocabulary easier, it's too hard for kindergarten... or add more focus on the past simple."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      
      <div className="flex items-center justify-between">
        {status === 'error' ? (
          <span className="text-red-500 text-sm font-medium">Failed to update. Try again.</span>
        ) : (
          <span className="text-xs text-gray-400">Powered by SmartGiaoAn AI</span>
        )}
        
        <button 
          onClick={handleFixIt}
          disabled={isSubmitting || !feedback}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold disabled:bg-gray-300 transition-colors flex items-center"
        >
          {isSubmitting ? 'Rewriting with AI...' : 'Fix Worksheet'}
        </button>
      </div>
    </div>
  );
}
