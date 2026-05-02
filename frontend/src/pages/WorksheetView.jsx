import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { http } from '../lib/api';

export default function WorksheetView() {
  const { id } = useParams();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorksheet = async () => {
      try {
        // Use the shared axios instance (sends httpOnly cookie automatically)
        // Do NOT use localStorage for auth - session is in a secure httpOnly cookie
        const r = await http.get(`/worksheets/${id}`);
        setWorksheet(r.data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setError('Worksheet not found. It may have been deleted or made private.');
        } else if (status === 403) {
          setError('This worksheet is private.');
        } else {
          setError('Network error loading worksheet. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWorksheet();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="font-bold text-gray-600">Loading worksheet...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-red-100 shadow-sm">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <Link to="/library" className="text-sm font-bold underline text-gray-600 hover:text-black">
          ← Back to Library
        </Link>
      </div>
    </div>
  );

  if (!worksheet) return null;

  const content = worksheet.content;
  const isKindergarten = worksheet.level === 'Kindergarten';
  const isIELTS = worksheet.level === 'IELTS' || worksheet.level === 'Secondary';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">

      {/* ACTION BAR - hidden when printing */}
      <div className="flex justify-between items-center mb-8 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Link to="/library" className="text-gray-600 font-bold hover:text-black">
          ← Back to Library
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-md flex items-center gap-2"
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* PRINTABLE DOCUMENT */}
      <div className={`bg-white shadow-lg border border-gray-200 print:shadow-none print:border-none mx-auto ${isKindergarten ? 'p-6 sm:p-10' : 'p-8 sm:p-12'}`}>

        {/* Header */}
        <div className={`border-black pb-4 mb-6 ${isKindergarten ? 'border-b-4 text-center' : 'border-b-2 flex justify-between items-end'}`}>
          <div className={isKindergarten ? 'w-full' : 'w-2/3'}>
            <h1 className={`${isKindergarten ? 'text-4xl' : 'text-3xl'} font-serif font-bold text-black mb-1`}>
              {content?.title || worksheet.title}
            </h1>
            {content?.vi_translation && (
              <h2 className="text-md text-gray-600 italic">{content.vi_translation}</h2>
            )}
          </div>
          <div className={`${isKindergarten ? 'mt-4 justify-center' : 'text-right'} flex gap-4 text-xs font-bold text-black uppercase`}>
            <span>{worksheet.level} ({worksheet.cefr})</span>
            <span>|</span>
            <span>{worksheet.skill}</span>
          </div>
        </div>

        {/* Student info block */}
        <div className={`flex justify-between items-end mb-8 font-serif ${isKindergarten ? 'text-2xl' : 'text-lg'}`}>
          <div className="w-1/2 border-b-2 border-dashed border-gray-400 pb-1">Name:</div>
          <div className="w-1/4 border-b-2 border-dashed border-gray-400 pb-1">Date:</div>
          <div className="w-1/6 border-b-2 border-dashed border-gray-400 pb-1 text-right">Score: /100</div>
        </div>

        {/* Reading passage - supports both content.passage and content.reading_passage */}
        {(content?.reading_passage || content?.passage) && (
          <div className={`mb-10 ${isIELTS ? 'text-justify font-serif text-sm leading-relaxed columns-2 gap-8' : 'p-6 bg-gray-50 rounded-xl border border-gray-300 print:bg-white print:border-gray-400 text-lg leading-loose'}`}>
            {!isIELTS && <h3 className="font-bold text-xl mb-4 uppercase">Read the text carefully:</h3>}
            {content?.reading_passage && (
              <>
                {content.reading_passage.title && (
                  <h4 className="font-bold text-lg mb-3">{content.reading_passage.title}</h4>
                )}
                <p className="whitespace-pre-wrap">{content.reading_passage.text}</p>
              </>
            )}
            {!content?.reading_passage && content?.passage && (
              <p className="whitespace-pre-wrap">{content.passage}</p>
            )}
          </div>
        )}

        {/* Vocabulary section */}
        {content?.vocabulary && (
          <div className="mb-10">
            {content.vocabulary.glossary && content.vocabulary.glossary.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xl mb-4 font-serif border-b border-gray-300 pb-2">Vocabulary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.vocabulary.glossary.map((item, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="font-bold text-red-700">{item.word}</span>
                      <span className="text-gray-600 text-sm ml-2">— {item.definition}</span>
                      {item.example && <p className="text-xs text-gray-500 italic mt-1">{item.example}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {content.vocabulary.exercises && content.vocabulary.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
            ))}
          </div>
        )}

        {/* Comprehension section */}
        {content?.comprehension && content.comprehension.exercises && (
          <div className="mb-10">
            <h3 className="font-bold text-xl mb-4 font-serif border-b border-gray-300 pb-2">Comprehension</h3>
            {content.comprehension.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} isIELTS={isIELTS} />
            ))}
          </div>
        )}

        {/* Grammar section */}
        {content?.grammar && (
          <div className="mb-10">
            <h3 className="font-bold text-xl mb-2 font-serif border-b border-gray-300 pb-2">
              Grammar: {content.grammar.focus}
            </h3>
            {content.grammar.explanation && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 text-sm">
                {content.grammar.explanation}
              </div>
            )}
            {content.grammar.exercises && content.grammar.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
            ))}
          </div>
        )}

        {/* Legacy sections[] format */}
        {content?.sections && content.sections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h3 className={`font-bold mb-2 font-serif ${isKindergarten ? 'text-2xl bg-red-50 p-3 rounded-lg border-2 border-dashed border-red-200' : 'text-xl bg-gray-100 p-2 print:bg-transparent print:border-b print:border-black'}`}>
              {section.section_title}
            </h3>
            <p className={`italic text-gray-700 mb-6 ${isKindergarten ? 'text-lg font-medium' : 'text-md'}`}>
              {section.instructions}
            </p>
            <div className={`space-y-${isKindergarten ? '10' : '6'}`}>
              {section.questions && section.questions.map((q) => (
                <div key={q.number} className="pl-2">
                  <p className={`font-medium ${isKindergarten ? 'text-2xl mb-4' : 'text-lg mb-2'}`}>
                    <span className="font-bold mr-2">{q.number}.</span>{q.question}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <div className="pl-6 space-y-2 mt-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-start">
                          <div className="w-5 h-5 border border-black rounded-full mr-3 mt-1 flex-shrink-0"></div>
                          <span className="text-gray-800">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!q.options || q.options.length === 0) && (
                    <div className="mt-4 border-b border-gray-500 w-full h-6"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Writing task */}
        {(content?.writing || content?.writing_task) && (
          <div className="mb-10 mt-12">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-black pb-2">Writing Task</h3>
            {content.writing && (
              <>
                <p className="font-medium text-lg mb-2">{content.writing.task}</p>
                {content.writing.success_criteria && (
                  <ul className="text-sm text-gray-600 mb-4 list-disc pl-5">
                    {content.writing.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
              </>
            )}
            {content.writing_task && (
              <>
                <p className="font-medium text-lg mb-2">{content.writing_task.prompt}</p>
                <p className="text-sm italic text-gray-600 mb-4">
                  Minimum words: {content.writing_task.minimum_words}
                </p>
              </>
            )}
            <div className="space-y-8 mt-8">
              {[...Array(isKindergarten ? 5 : 12)].map((_, i) => (
                <div key={i} className={`border-b ${isKindergarten ? 'border-dashed border-gray-400 h-12' : 'border-gray-400 h-8'} w-full`}></div>
              ))}
            </div>
          </div>
        )}

        {/* Answer key - print only */}
        {content?.comprehension?.exercises && (
          <div className="mt-12 pt-8 border-t-2 border-gray-300 print:break-before-page">
            <h3 className="font-bold text-xl mb-4 font-serif">Answer Key</h3>
            {content.comprehension.exercises.map((ex, i) => (
              ex.answers && ex.answers.length > 0 && (
                <div key={i} className="mb-4">
                  <p className="font-bold text-sm mb-2">{ex.instructions}</p>
                  <div className="flex flex-wrap gap-3">
                    {ex.answers.map((ans, j) => (
                      <span key={j} className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {j + 1}. {String(ans)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseBlock({ exercise, isKindergarten, isIELTS }) {
  if (!exercise) return null;
  return (
    <div className="mb-8">
      <p className={`italic text-gray-700 mb-4 ${isKindergarten ? 'text-lg font-medium' : 'text-sm'}`}>
        {exercise.instructions}
      </p>
      <div className={`space-y-${isKindergarten ? '8' : '4'}`}>
        {exercise.items && exercise.items.map((item, i) => (
          <div key={i} className="pl-2">
            <p className={`font-medium ${isKindergarten ? 'text-2xl mb-3' : 'text-base mb-2'}`}>
              <span className="font-bold mr-2">{i + 1}.</span>
              {typeof item === 'string' ? item : item.question || item.sentence || JSON.stringify(item)}
            </p>
            {isIELTS && exercise.type === 'true_false_not_given' && (
              <div className="flex gap-4 pl-6">
                {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                  <div key={opt} className="flex items-center text-sm font-bold border border-gray-300 px-3 py-1 rounded">
                    <div className="w-4 h-4 border border-black mr-2 bg-white"></div>{opt}
                  </div>
                ))}
              </div>
            )}
            {(!isIELTS || exercise.type !== 'true_false_not_given') && (
              typeof item === 'object' && item.options ? (
                <div className="pl-6 space-y-2 mt-2">
                  {item.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-start">
                      <div className="w-5 h-5 border border-black rounded-full mr-3 mt-0.5 flex-shrink-0"></div>
                      <span className="text-gray-800">{opt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 border-b border-gray-400 w-full h-7"></div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
