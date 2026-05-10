import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Filter, Copy, Eye, BookOpen, User, Sparkles } from 'lucide-react';
import { SEO } from '../meta';

const LEVEL_FILTERS = ['All', 'Kindergarten', 'Primary', 'Secondary', 'IELTS'];
const SKILL_FILTERS = ['All', 'Grammar', 'Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking'];

export default function PublicLibrary() {
  const navigate = useNavigate();
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLevel, setActiveLevel] = useState('All');
  const [activeSkill, setActiveSkill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloningId, setCloningId] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLibrary();
  }, [activeLevel, activeSkill]);

  // Debounce search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLibrary();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeLevel !== 'All') params.level = activeLevel;
      if (activeSkill !== 'All') params.skill = activeSkill;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      const r = await http.get('/library/feed', { params });
      setWorksheets(r.data);
    } catch (err) {
      setError('Failed to load the library. Please try again.');
      console.error('Library fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (worksheetId) => {
    setCloningId(worksheetId);
    try {
      const r = await http.post(`/library/${worksheetId}/clone`);
      // Redirect to the cloned worksheet
      navigate(`/worksheet/${r.data.worksheet_id}`);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to clone worksheet.');
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEO
        title="Community Library | SmartGiaoAn - Free ESL Worksheets"
        description="Browse, preview, and remix free ESL worksheets from teachers across Vietnam. Filter by level, skill, and topic."
        keywords="ESL worksheet library, free English worksheets, Cambridge, CEFR, IELTS, Vietnam teachers, public worksheets"
        ogUrl="https://www.smartgiaoan.site/library"
        ogImage="https://www.smartgiaoan.site/og-image.svg"
      />
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans w-full">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            The <span className="text-red-600">Community</span> Library
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Browse, preview, and remix free ESL worksheets from teachers across Vietnam.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by topic or title (e.g., 'past tense', 'food', 'Mid-Autumn')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-12">
          {/* Level filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-gray-500 mr-2">
              <Filter className="w-4 h-4" /> Level:
            </span>
            {LEVEL_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveLevel(filter)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                  activeLevel === filter
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-black hover:text-black'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Skill filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-gray-500 mr-2">
              <BookOpen className="w-4 h-4" /> Skill:
            </span>
            {SKILL_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSkill(filter)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all ${
                  activeSkill === filter
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-red-400 hover:text-red-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 font-bold bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto p-8">
            {error}
          </div>
        ) : worksheets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-2xl mx-auto p-8 shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No worksheets found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.` 
                : activeLevel !== 'All' || activeSkill !== 'All'
                  ? `No ${activeLevel !== 'All' ? activeLevel : ''} ${activeSkill !== 'All' ? activeSkill : ''} worksheets yet.`
                  : "The library is empty. Be the first to share a worksheet!"}
            </p>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate a Worksheet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {worksheets.map((ws) => (
              <div
                key={ws.worksheet_id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden group"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-red-50 text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                      {ws.level}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {ws.cefr}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {ws.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-3 mb-4">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">
                      {ws.skill}
                    </span>
                    {ws.topic && (
                      <span className="bg-gray-50 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 truncate max-w-[140px]">
                        {ws.topic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                    <User className="w-3 h-3" />
                    <span className="font-medium">{ws.author_name || 'Anonymous Teacher'}</span>
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                  <Link
                    to={`/worksheet/${ws.worksheet_id}`}
                    className="w-full flex justify-center items-center gap-2 bg-white border-2 border-black text-black font-bold py-2.5 rounded-xl hover:bg-black hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview & Print
                  </Link>
                  <button
                    onClick={() => handleClone(ws.worksheet_id)}
                    disabled={cloningId === ws.worksheet_id}
                    className="w-full flex justify-center items-center gap-2 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cloningId === ws.worksheet_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {cloningId === ws.worksheet_id ? 'Cloning...' : 'Use This Template'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}