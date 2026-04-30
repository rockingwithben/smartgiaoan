import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function WorksheetView() {
  const { id } = useParams(); // Grabs the ID from the URL
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorksheet = async () => {
      try {
        // Fetch the specific worksheet data
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/worksheets/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWorksheet(data);
        } else {
          setError('Worksheet not found. It may have been deleted or made private.');
        }
      } catch (err) {
        setError('Network error loading worksheet.');
      }
      setLoading(false);
    };

    fetchWorksheet();
  }, [id]);

  if (loading) return <div className="text-center py-20 font-bold text-xl">Loading Worksheet...</div>;
  if (error) return <div className="text-center py-20 text-red-600 font-bold">{error}</div>;
  if (!worksheet) return null;

  const content = worksheet.content;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-gray-50 min-h-screen">
      
      {/* ACTION BAR (Hidden when printing) */}
      <div className="flex justify-between items-center mb-8 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Link to="/library" className="text-gray-600 font-bold hover:text-black">
          ← Back to Library
        </Link>
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-md flex items-center"
        >
          <span className="mr-2">🖨️</span> Print / Save PDF
        </button>
      </div>

      {/* THE PRINTABLE A4 DOCUMENT */}
      <div className="bg-white p-8 sm:p-12 shadow-lg rounded-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-3xl font-serif font-bold text-black mb-2">{content.title}</h1>
          <h2 className="text-lg text-gray-600 mb-4">{content.vi_translation}</h2>
          
          <div className="flex justify-between text-sm font-bold text-black uppercase">
            <span>Level: {worksheet.level} ({worksheet.cefr})</span>
            <span>Skill: {worksheet.skill}</span>
            <span>Time: {content.estimated_time_minutes} mins</span>
          </div>
        </div>

        {/* Student Name Block */}
        <div className="flex justify-between items-end mb-8 text-lg font-serif">
          <div className="w-1/2 border-b border-black pb-1">Name:</div>
          <div className="w-1/4 border-b border-black pb-1">Date:</div>
          <div className="w-1/6 border-b border-black pb-1">Score: &nbsp;&nbsp;&nbsp;/100</div>
        </div>

        {/* Reading Passage (if exists) */}
        {content.passage && (
          <div className="mb-10 p-6 bg-gray-50 rounded-lg border border-gray-300 print:bg-white print:border-gray-400">
            <h3 className="font-bold text-lg mb-4 uppercase">Read the text carefully:</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-800 text-justify">
              {content.passage}
            </p>
          </div>
        )}

        {/* Exercises / Sections */}
        {content.sections && content.sections.map((section, idx) => (
          <div key={idx} className="mb-10">
            <h3 className="font-bold text-xl mb-2 font-serif bg-gray-100 p-2 print:bg-transparent print:border-b print:border-black">
              {section.section_title}
            </h3>
            <p className="italic text-gray-700 mb-4">{section.instructions}</p>
            
            <div className="space-y-6">
              {section.questions.map((q) => (
                <div key={q.number} className="pl-4">
                  <p className="font-medium text-lg mb-2">
                    <span className="font-bold mr-2">{q.number}.</span> 
                    {q.question}
                  </p>
                  
                  {/* Multiple Choice Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="pl-6 space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center">
                          <div className="w-5 h-5 border border-black rounded-full mr-3 print:border-gray-500"></div>
                          <span className="text-gray-800">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fill in the blank / Short Answer lines */}
                  {(!q.options || q.options.length === 0) && (
                    <div className="mt-4 border-b border-gray-400 w-full h-6 print:border-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Writing Task */}
        {content.writing_task && (
          <div className="mb-10 page-break-before">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-black pb-2">Writing Task</h3>
            <p className="font-medium text-lg mb-4">{content.writing_task.prompt}</p>
            <p className="text-sm italic text-gray-600 mb-8">Minimum words: {content.writing_task.minimum_words}</p>
            
            {/* Lined paper effect for writing */}
            <div className="space-y-8 mt-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="border-b border-gray-400 w-full h-8"></div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
