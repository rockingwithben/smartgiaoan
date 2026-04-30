import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProfileSettings() {
  const [formData, setFormData] = useState({
    teaching_level: '',
    class_size: '',
    focus_area: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('session_token');
        if (!token) {
          // If they aren't logged in, send them to the front door
          window.location.href = '/login';
          return;
        }
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const user = await response.json();
          setFormData({
            teaching_level: user.teaching_level || '',
            class_size: user.class_size || '',
            focus_area: user.focus_area || ''
          });
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Classroom AI profile updated successfully! 🚀' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please check your connection.' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Classroom Profile</h1>
            <p className="text-gray-500 mt-2 font-medium">Train the AI to adapt worksheets exactly to your students.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-gray-500 hover:text-black transition">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl font-bold text-sm border ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Teaching Level */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Primary Teaching Level</label>
              <select 
                name="teaching_level" 
                value={formData.teaching_level} 
                onChange={handleChange}
                required
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium text-gray-700"
              >
                <option value="" disabled>Select the age group...</option>
                <option value="Kindergarten">Kindergarten (Aged 3-5)</option>
                <option value="Primary">Primary School (Aged 6-10)</option>
                <option value="Secondary">Secondary School (Aged 11-15)</option>
                <option value="IELTS">High School / IELTS (Aged 16+)</option>
                <option value="Adults">Adult Learners</option>
              </select>
            </div>

            {/* Class Size */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Average Class Size</label>
              <select 
                name="class_size" 
                value={formData.class_size} 
                onChange={handleChange}
                required
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium text-gray-700"
              >
                <option value="" disabled>Select class size...</option>
                <option value="1 to 1 (Tutoring)">1 to 1 (Tutoring)</option>
                <option value="Small Group (2-6)">Small Group (2-6 students)</option>
                <option value="Medium Class (7-15)">Medium Class (7-15 students)</option>
                <option value="Large Public Class (30+)">Large Public Class (30+ students)</option>
              </select>
            </div>

            {/* Focus Area */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Main Pedagogical Focus</label>
              <select 
                name="focus_area" 
                value={formData.focus_area} 
                onChange={handleChange}
                required
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium text-gray-700"
              >
                <option value="" disabled>What do your students struggle with most?</option>
                <option value="Phonics and Basic Tracing">Phonics & Tracing (Young Learners)</option>
                <option value="Speaking and Conversational Fluency">Speaking & Fluency</option>
                <option value="Grammar Accuracy">Grammar Accuracy</option>
                <option value="Test Preparation (Cambridge/IELTS)">Exam Formatting & Test Prep</option>
                <option value="Vocabulary Expansion">Vocabulary Expansion</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-black text-white font-extrabold p-4 rounded-xl hover:bg-gray-800 transition shadow-md disabled:bg-gray-400"
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
