import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { http } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Shown after first Google login when teaching_level is not set
export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    teaching_level: user?.teaching_level || '',
    class_size: user?.class_size || '',
    focus_area: user?.focus_area || '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await http.put('/auth/profile', form);
      await refreshUser();
      toast.success('Profile saved!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => navigate('/dashboard', { replace: true });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-16 px-4">
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">
              Welcome, {user.name}
            </p>
            <h1 className="font-serif font-bold text-3xl text-gray-900">
              Tell us about your teaching
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              This helps us tailor suggestions. You can skip this and update it later in Account settings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                Teaching level
              </label>
              <select
                value={form.teaching_level}
                onChange={onChange('teaching_level')}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition bg-gray-50"
                required
              >
                <option value="">Select a level</option>
                <option value="Kindergarten">Kindergarten (3-6 years)</option>
                <option value="Primary">Primary (6-11 years)</option>
                <option value="Secondary">Secondary (11-18 years)</option>
                <option value="IELTS">IELTS / Cambridge Exam prep</option>
                <option value="Adult">Adult / Professional English</option>
                <option value="Mixed">Mixed levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                Typical class size
              </label>
              <select
                value={form.class_size}
                onChange={onChange('class_size')}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition bg-gray-50"
                required
              >
                <option value="">Select class size</option>
                <option value="1-5">1–5 (private / small group)</option>
                <option value="6-15">6–15 (small class)</option>
                <option value="16-30">16–30 (standard class)</option>
                <option value="30+">30+ (large class)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                Main focus area
              </label>
              <select
                value={form.focus_area}
                onChange={onChange('focus_area')}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition bg-gray-50"
                required
              >
                <option value="">Select focus area</option>
                <option value="Reading & Comprehension">Reading &amp; Comprehension</option>
                <option value="Writing Skills">Writing Skills</option>
                <option value="Grammar">Grammar</option>
                <option value="Vocabulary">Vocabulary</option>
                <option value="Exam Preparation">Exam Preparation</option>
                <option value="Conversation">Conversation &amp; Speaking</option>
                <option value="All Skills">All Skills (balanced)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save and continue'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-5 text-sm text-gray-500 hover:text-black font-bold underline transition"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
