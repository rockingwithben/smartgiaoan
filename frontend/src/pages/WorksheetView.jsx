import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { http } from '../lib/api';
import { Printer, Share2, Copy, Check, AlertTriangle, BookOpen, GraduationCap, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorksheetView() {
  const { id } = useParams();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  useEffect(() => {
    const fetchWorksheet = async () => {
      try {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

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
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <Link to="/dashboard" className="text-sm font-bold underline text-gray-600 hover:text-black">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );

  if (!worksheet) return null;

  const content = worksheet.content || {};
  const isKindergarten = worksheet.level?.toLowerCase().includes('kindergarten');
  const isIELTS = worksheet.level === 'IELTS' || worksheet.level === 'Secondary';

  // ── Schema Detection ──
  const hasSections = Array.isArray(content.sections) && content.sections.length > 0;
  const hasExercises = Array.isArray(content.exercises) && content.exercises.length > 0;
  const hasVocabulary = content.vocabulary && (content.vocabulary.glossary?.length > 0 || content.vocabulary.exercises?.length > 0);
  const hasComprehension = content.comprehension && content.comprehension.exercises?.length > 0;
  const hasGrammar = content.grammar && (content.grammar.exercises?.length > 0 || content.grammar.explanation);
  const hasWriting = content.writing || content.writing_task;
  const hasPassage = content.reading_passage || content.passage;

  // Collect all answers for the answer key
  const allAnswers = [];
  if (content.answer_key) {
    allAnswers.push({ title: 'Answer Key', answers: content.answer_key });
  }
  if (hasSections) {
    content.sections.forEach((sec, idx) => {
      if (sec.answer_key || sec.answers) {
        allAnswers.push({
          title: sec.section_title || `Section ${idx + 1}`,
          answers: sec.answer_key || sec.answers
        });
      }
    });
  }
  if (hasVocabulary && content.vocabulary.exercises) {
    content.vocabulary.exercises.forEach((ex, idx) => {
      if (ex.answers) {
        allAnswers.push({ title: ex.instructions || `Vocabulary ${idx + 1}`, answers: ex.answers });
      }
    });
  }
  if (hasComprehension) {
    content.comprehension.exercises.forEach((ex, idx) => {
      if (ex.answers) {
        allAnswers.push({ title: ex.instructions || `Comprehension ${idx + 1}`, answers: ex.answers });
      }
    });
  }
  if (hasGrammar && content.grammar.exercises) {
    content.grammar.exercises.forEach((ex, idx) => {
      if (ex.answers) {
        allAnswers.push({ title: ex.instructions || `Grammar ${idx + 1}`, answers: ex.answers });
      }
    });
  }
  if (hasExercises) {
    content.exercises.forEach((ex, idx) => {
      if (ex.answers) {
        allAnswers.push({ title: ex.instructions || `Exercise ${idx + 1}`, answers: ex.answers });
      }
    });
  }

  const hasAnyAnswers = allAnswers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans print:bg-white">
      
      {/* ── ACTION BAR (hidden when printing) ── */}
      <div className="print:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 font-bold hover:text-black transition">
            <ChevronDown className="w-5 h-5 rotate-90" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-gray-300 hover:bg-gray-50 transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:bg-gray-800 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT ── */}
      <div className={`max-w-5xl mx-auto bg-white shadow-lg border-x border-gray-200 print:shadow-none print:border-none print:max-w-none ${isKindergarten ? 'p-6 sm:p-10' : 'p-8 sm:p-12'}`}>

        {/* Header */}
        <header className={`border-black pb-6 mb-8 ${isKindergarten ? 'border-b-4 text-center' : 'border-b-2'}`}>
          <div className={`${isKindergarten ? '' : 'flex justify-between items-start'}`}>
            <div className={isKindergarten ? 'w-full' : 'w-2/3'}>
              <h1 className={`${isKindergarten ? 'text-4xl' : 'text-3xl'} font-serif font-bold text-black mb-2 leading-tight`}>
                {content?.title || worksheet.title || 'Untitled Worksheet'}
              </h1>
              {content?.subtitle && (
                <p className="text-lg text-gray-600 font-medium">{content.subtitle}</p>
              )}
              {content?.vi_translation && (
                <h2 className="text-md text-gray-500 italic mt-1">{content.vi_translation}</h2>
              )}
            </div>
            <div className={`${isKindergarten ? 'mt-4 justify-center' : ''} flex flex-wrap gap-3 text-xs font-bold text-black uppercase tracking-wide`}>
              <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                <GraduationCap className="w-3 h-3" />
                {worksheet.level} ({worksheet.cefr})
              </span>
              <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                <BookOpen className="w-3 h-3" />
                {worksheet.skill}
              </span>
              {worksheet.topic && (
                <span className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full">
                  {worksheet.topic}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Student Info Block */}
        <div className={`flex justify-between items-end mb-10 font-serif gap-4 ${isKindergarten ? 'text-2xl' : 'text-lg'}`}>
          <div className="flex-1 border-b-2 border-dashed border-gray-400 pb-1">Name: ____________________</div>
          <div className="w-40 border-b-2 border-dashed border-gray-400 pb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Date: __________
          </div>
          <div className="w-32 border-b-2 border-dashed border-gray-400 pb-1 text-right">Score: _____/100</div>
        </div>

        {/* Reading Passage */}
        {hasPassage && (
          <section className={`mb-10 print:break-inside-avoid ${isIELTS ? 'text-justify font-serif text-sm leading-relaxed columns-2 gap-8' : 'p-6 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border-gray-400 text-lg leading-loose'}`}>
            {!isIELTS && <h3 className="font-bold text-xl mb-4 uppercase tracking-wide text-gray-800">Read the text carefully:</h3>}
            {content?.reading_passage && (
              <>
                {content.reading_passage.title && (
                  <h4 className="font-bold text-lg mb-3 font-serif">{content.reading_passage.title}</h4>
                )}
                <p className="whitespace-pre-wrap">{content.reading_passage.text}</p>
              </>
            )}
            {content?.passage && !content?.reading_passage && (
              <p className="whitespace-pre-wrap">{content.passage}</p>
            )}
          </section>
        )}

        {/* Vocabulary */}
        {hasVocabulary && (
          <section className="mb-10 print:break-inside-avoid">
            {content.vocabulary.glossary && content.vocabulary.glossary.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-gray-200 pb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Vocabulary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.vocabulary.glossary.map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:bg-white print:border-gray-300">
                      <span className="font-bold text-red-700 text-lg">{item.word}</span>
                      <span className="text-gray-600 text-sm ml-2">— {item.definition}</span>
                      {item.example && <p className="text-xs text-gray-500 italic mt-1 border-l-2 border-gray-300 pl-2">{item.example}</p>}
                      {item.vi_translation && <p className="text-xs text-blue-600 mt-1">{item.vi_translation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {content.vocabulary.exercises && content.vocabulary.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} index={i} />
            ))}
          </section>
        )}

        {/* Comprehension */}
        {hasComprehension && (
          <section className="mb-10 print:break-inside-avoid">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-gray-200 pb-2">Comprehension</h3>
            {content.comprehension.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} isIELTS={isIELTS} index={i} />
            ))}
          </section>
        )}

        {/* Grammar */}
        {hasGrammar && (
          <section className="mb-10 print:break-inside-avoid">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-gray-200 pb-2">
              Grammar{content.grammar.focus ? `: ${content.grammar.focus}` : ''}
            </h3>
            {content.grammar.explanation && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6 text-sm leading-relaxed print:bg-white print:border-gray-400">
                <span className="font-bold text-blue-800 block mb-1">Grammar Note:</span>
                {content.grammar.explanation}
              </div>
            )}
            {content.grammar.exercises && content.grammar.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} index={i} />
            ))}
          </section>
        )}

        {/* Flat exercises[] format (most common Gemini output) */}
        {hasExercises && (
          <section className="mb-10 print:break-inside-avoid">
            {content.exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} isKindergarten={isKindergarten} isIELTS={isIELTS} index={i} />
            ))}
          </section>
        )}

        {/* Legacy sections[] format */}
        {hasSections && content.sections.map((section, idx) => (
          <section key={idx} className="mb-12 print:break-inside-avoid">
            <h3 className={`font-bold mb-4 font-serif ${isKindergarten ? 'text-2xl bg-red-50 p-4 rounded-lg border-2 border-dashed border-red-200' : 'text-xl bg-gray-100 p-3 rounded-lg print:bg-transparent print:border-b-2 print:border-black print:rounded-none'}`}>
              {section.section_title || `Section ${idx + 1}`}
            </h3>
            {section.instructions && (
              <p className={`italic text-gray-700 mb-6 ${isKindergarten ? 'text-lg font-medium' : 'text-md'}`}>
                {section.instructions}
              </p>
            )}
            <div className={isKindergarten ? 'space-y-10' : 'space-y-6'}>
              {section.questions && section.questions.map((q) => (
                <QuestionItem key={q.number || Math.random()} question={q} isKindergarten={isKindergarten} />
              ))}
            </div>
          </section>
        ))}

        {/* Writing Task */}
        {hasWriting && (
          <section className="mb-10 mt-12 print:break-before-page">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-black pb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Writing Task
            </h3>
            {content.writing && (
              <>
                <p className="font-medium text-lg mb-3 leading-relaxed">{content.writing.task}</p>
                {content.writing.success_criteria && (
                  <ul className="text-sm text-gray-600 mb-6 list-disc pl-6 space-y-1">
                    {content.writing.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
              </>
            )}
            {content.writing_task && (
              <>
                <p className="font-medium text-lg mb-2">{content.writing_task.prompt}</p>
                <p className="text-sm italic text-gray-600 mb-4">
                  Minimum words: {content.writing_task.minimum_words || 'N/A'}
                </p>
              </>
            )}
            <div className="space-y-6 mt-8">
              {Array.from({ length: isKindergarten ? 5 : isIELTS ? 20 : 12 }).map((_, i) => (
                <div key={`line-${i}`} className={`border-b ${isKindergarten ? 'border-dashed border-gray-400 h-12' : 'border-gray-400 h-8'} w-full`}></div>
              ))}
            </div>
          </section>
        )}

        {/* ── ANSWER KEY ── */}
        {hasAnyAnswers && (
          <section className="mt-16 pt-8 border-t-4 border-gray-800 print:break-before-page">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="print:hidden flex items-center gap-2 w-full text-left font-bold text-xl font-serif mb-6 hover:text-red-700 transition"
            >
              {showAnswerKey ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              Answer Key {showAnswerKey ? '(Hide)' : '(Show)'}
            </button>
            <h3 className="hidden print:block font-bold text-xl mb-6 font-serif border-b border-gray-400 pb-2">Answer Key</h3>
            
            <div className={`space-y-8 ${showAnswerKey ? '' : 'hidden'} print:block`}>
              {allAnswers.map((section, idx) => (
                <div key={idx} className="print:break-inside-avoid">
                  <h4 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3 border-b border-gray-200 pb-1">
                    {section.title}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(section.answers) ? section.answers.map((ans, j) => (
                      <span key={j} className="text-sm bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-md font-mono">
                        <span className="font-bold text-gray-500 mr-1">{j + 1}.</span>
                        {String(ans)}
                      </span>
                    )) : (
                      <div className="text-sm bg-gray-100 border border-gray-300 p-3 rounded-md whitespace-pre-wrap font-mono">
                        {typeof section.answers === 'object' ? JSON.stringify(section.answers, null, 2) : String(section.answers)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FALLBACK: No recognized content structure ── */}
        {!hasSections && !hasExercises && !hasVocabulary && !hasComprehension && !hasGrammar && !hasWriting && !hasPassage && (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 font-bold mb-2">This worksheet has an unrecognized format.</p>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-sm text-blue-600 font-bold underline hover:text-blue-800"
            >
              {showRaw ? 'Hide' : 'View'} Raw JSON
            </button>
            {showRaw && (
              <pre className="mt-4 text-left bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 print:block">
          <p>Generated by SmartGiaoAn • smartgiaoan.site</p>
          <p className="mt-1">© {new Date().getFullYear()} SmartGiaoAn. For educational use only.</p>
        </footer>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ExerciseBlock({ exercise, isKindergarten, isIELTS, index }) {
  if (!exercise) return null;
  
  const items = exercise.items || exercise.questions || [];
  const instructions = exercise.instructions || exercise.prompt || exercise.title || `Exercise ${index + 1}`;
  const exType = exercise.type || exercise.exercise_type || '';
  
  return (
    <div className="mb-8 print:break-inside-avoid">
      <h4 className={`font-bold mb-4 ${isKindergarten ? 'text-xl bg-yellow-50 p-3 rounded-lg border border-yellow-200' : 'text-lg text-gray-800'}`}>
        {instructions}
      </h4>
      <div className={isKindergarten ? 'space-y-8' : 'space-y-5'}>
        {items.map((item, i) => (
          <QuestionItem key={i} question={item} number={i + 1} isKindergarten={isKindergarten} isIELTS={isIELTS} exerciseType={exType} />
        ))}
      </div>
    </div>
  );
}

function QuestionItem({ question, number, isKindergarten, isIELTS, exerciseType }) {
  if (!question) return null;
  
  // Handle both object and string formats
  const qText = typeof question === 'string' 
    ? question 
    : (question.question || question.sentence || question.prompt || question.text || JSON.stringify(question));
  
  const options = question.options || question.choices || [];
  const isTrueFalse = isIELTS && (exerciseType === 'true_false_not_given' || exerciseType === 'true_false');
  const isMultipleChoice = Array.isArray(options) && options.length > 0;
  
  return (
    <div className="pl-2">
      <p className={`font-medium leading-relaxed ${isKindergarten ? 'text-2xl mb-4' : 'text-lg mb-3'}`}>
        <span className="font-bold mr-2 text-gray-500">{number}.</span>
        {qText}
      </p>
      
      {/* True/False/Not Given (IELTS style) */}
      {isTrueFalse && (
        <div className="flex gap-4 pl-6 mt-3">
          {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
            <div key={opt} className="flex items-center text-sm font-bold border-2 border-gray-800 px-4 py-2 rounded bg-white">
              <div className="w-4 h-4 border-2 border-black mr-2 bg-white"></div>
              {opt}
            </div>
          ))}
        </div>
      )}
      
      {/* Multiple Choice */}
      {!isTrueFalse && isMultipleChoice && (
        <div className="pl-6 space-y-2 mt-3">
          {options.map((opt, oIdx) => {
            const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
            const optLabel = typeof opt === 'object' && opt.label ? opt.label : String.fromCharCode(65 + oIdx);
            return (
              <div key={oIdx} className="flex items-start group">
                <div className="w-5 h-5 border-2 border-gray-400 rounded-full mr-3 mt-1 flex-shrink-0 group-hover:border-black transition"></div>
                <span className="text-gray-800">
                  <span className="font-bold mr-1">{optLabel}.</span>
                  {optText}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Open response (fill in blank / short answer) */}
      {!isTrueFalse && !isMultipleChoice && (
        <div className="mt-4 border-b-2 border-gray-300 w-full h-8"></div>
      )}
    </div>
  );
}