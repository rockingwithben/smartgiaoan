import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../lib/api';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    teaching_level: '',
    class_size: '',
    focus_area: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await http.get('/auth/me');
        const user = response.data;
        setFormData({
          teaching_level: user.teaching_level || '',
          class_size: user.class_size || '',
          focus_area: user.focus_area || '',
        });
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        console.error('Failed to load profile', error);
        setMessage({ type: 'error', text: 'Could not load your profile settings.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await http.put('/auth/profile', formData);
      setMessage({ type: 'success', text: 'Classroom AI profile updated successfully! 🚀' });
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Classroom Profile</h1>
            <p className="mt-2 font-medium text-gray-500">
              Train the AI to adapt worksheets exactly to your students.
            </p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-gray-500 transition hover:text-black">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {message.text && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm font-bold ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Primary Teaching Level</label>
              <select
                name="teaching_level"
                value={formData.teaching_level}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="" disabled>Select the age group...</option>
                <option value="Kindergarten">Kindergarten (Aged 3-5)</option>
                <option value="Primary">Primary School (Aged 6-10)</option>
                <option value="Secondary">Secondary School (Aged 11-15)</option>
                <option value="IELTS">High School / IELTS (Aged 16+)</option>
                <option value="Adults">Adult Learners</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Average Class Size</label>
              <select
                name="class_size"
                value={formData.class_size}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="" disabled>Select class size...</option>
                <option value="1 to 1 (Tutoring)">1 to 1 (Tutoring)</option>
                <option value="Small Group (2-6)">Small Group (2-6 students)</option>
                <option value="Medium Class (7-15)">Medium Class (7-15 students)</option>
                <option value="Large Public Class (30+)">Large Public Class (30+ students)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Main Pedagogical Focus</label>
              <select
                name="focus_area"
                value={formData.focus_area}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="" disabled>What do your students struggle with most?</option>
                <option value="Phonics and Basic Tracing">Phonics & Tracing (Young Learners)</option>
                <option value="Speaking and Conversational Fluency">Speaking & Fluency</option>
                <option value="Grammar Accuracy">Grammar Accuracy</option>
                <option value="Test Preparation (Cambridge/IELTS)">Exam Formatting & Test Prep</option>
                <option value="Vocabulary Expansion">Vocabulary Expansion</option>
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-black p-4 font-extrabold text-white shadow-md transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isSaving ? 'Saving Profile...' : 'Save AI Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
