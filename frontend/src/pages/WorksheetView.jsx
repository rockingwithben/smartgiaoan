import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function WorksheetView() {
  const { id } = useParams();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorksheet = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/worksheets/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
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
  const isKindergarten = worksheet.level === 'Kindergarten';
  const isIELTS = worksheet.level === 'IELTS' || worksheet.level === 'Secondary';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      
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
      <div className={`bg-white shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 mx-auto ${isKindergarten ? 'p-6 sm:p-10' : 'p-8 sm:p-12'}`}>
        
        {/* Header - Adapts to Level */}
        <div className={`border-black pb-4 mb-6 ${isKindergarten ? 'border-b-4 text-center' : 'border-b-2 flex justify-between items-end'}`}>
          <div className={isKindergarten ? 'w-full' : 'w-2/3'}>
            <h1 className={`${isKindergarten ? 'text-4xl' : 'text-3xl'} font-serif font-bold text-black mb-1`}>{content.title}</h1>
            <h2 className="text-md text-gray-600 italic">{content.vi_translation}</h2>
          </div>
          
          <div className={`${isKindergarten ? 'mt-4 justify-center' : 'text-right'} flex gap-4 text-xs font-bold text-black uppercase`}>
            <span>{worksheet.level} ({worksheet.cefr})</span>
            <span>|</span>
            <span>{worksheet.skill}</span>
          </div>
        </div>

        {/* Student Name Block */}
        <div className={`flex justify-between items-end mb-8 font-serif ${isKindergarten ? 'text-2xl' : 'text-lg'}`}>
          <div className="w-1/2 border-b-2 border-dashed border-gray-400 pb-1">Name:</div>
          <div className="w-1/4 border-b-2 border-dashed border-gray-400 pb-1">Date:</div>
          <div className="w-1/6 border-b-2 border-dashed border-gray-400 pb-1 text-right">Score: &nbsp;&nbsp;&nbsp;/100</div>
        </div>

        {/* Reading Passage - Formatting changes for IELTS vs Primary */}
        {content.passage && (
          <div className={`mb-10 ${isIELTS ? 'text-justify font-serif text-sm leading-relaxed columns-2 gap-8' : 'p-6 bg-gray-50 rounded-xl border border-gray-300 print:bg-white print:border-gray-400 text-lg leading-loose'}`}>
            {!isIELTS && <h3 className="font-bold text-xl mb-4 uppercase">Read the text carefully:</h3>}
            <p className="whitespace-pre-wrap">{content.passage}</p>
          </div>
        )}

        {/* Exercises / Sections */}
        {content.sections && content.sections.map((section, idx) => (
          <div key={idx} className="mb-12 page-break-inside-avoid">
            <h3 className={`font-bold mb-2 font-serif ${isKindergarten ? 'text-2xl bg-red-50 p-3 rounded-lg border-2 border-dashed border-red-200' : 'text-xl bg-gray-100 p-2 print:bg-transparent print:border-b print:border-black'}`}>
              {section.section_title}
            </h3>
            <p className={`italic text-gray-700 mb-6 ${isKindergarten ? 'text-lg font-medium' : 'text-md'}`}>{section.instructions}</p>
            
            <div className={`space-y-${isKindergarten ? '10' : '6'}`}>
              {section.questions.map((q) => (
                <div key={q.number} className="pl-2">
                  <p className={`font-medium ${isKindergarten ? 'text-2xl mb-4' : 'text-lg mb-2'}`}>
                    <span className="font-bold mr-2">{q.number}.</span> 
                    {q.question}
                  </p>
                  
                  {/* KINDERGARTEN TRACING UI */}
                  {isKindergarten && q.answer && !q.options && (
                    <div className="mt-4 relative pt-2 pb-2">
                      {/* Handwriting Guidelines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '3.5rem' }}>
                        <div className="border-t border-gray-400 w-full"></div>
                        <div className="border-t border-dashed border-gray-300 w-full"></div>
                        <div className="border-t border-gray-400 w-full"></div>
                      </div>
                      {/* Tracing Text */}
                      <div className="text-5xl font-mono text-gray-200 tracking-[0.5em] uppercase text-center relative z-10 select-none">
                        {q.answer}
                      </div>
                    </div>
                  )}

                  {/* IELTS TRUE / FALSE / NOT GIVEN UI */}
                  {isIELTS && q.type === 'true_false_not_given' && (
                    <div className="mt-3 flex gap-4 pl-6">
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                        <div key={opt} className="flex items-center text-sm font-bold border border-gray-300 px-3 py-1 rounded">
                          <div className="w-4 h-4 border border-black mr-2 bg-white"></div>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STANDARD MULTIPLE CHOICE */}
                  {!isKindergarten && q.options && q.options.length > 0 && (
                    <div className="pl-6 space-y-2 mt-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-start">
                          <div className="w-5 h-5 border border-black rounded-full mr-3 mt-1 flex-shrink-0 print:border-gray-500"></div>
                          <span className={`${isKindergarten ? 'text-xl' : 'text-md'} text-gray-800`}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STANDARD FILL IN BLANK */}
                  {!isKindergarten && (!q.options || q.options.length === 0) && q.type !== 'true_false_not_given' && (
                    <div className="mt-4 border-b border-gray-500 w-full h-6 print:border-gray-400"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Writing Task */}
        {content.writing_task && (
          <div className="mb-10 mt-12 page-break-before">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-black pb-2">Writing Task</h3>
            <p className="font-medium text-lg mb-2">{content.writing_task.prompt}</p>
            <p className="text-sm italic text-gray-600 mb-8">Minimum words: {content.writing_task.minimum_words}</p>
            
            <div className="space-y-8 mt-8">
              {[...Array(isKindergarten ? 5 : 12)].map((_, i) => (
                <div key={i} className={`border-b ${isKindergarten ? 'border-dashed border-gray-400 h-12' : 'border-gray-400 h-8'} w-full`}></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
