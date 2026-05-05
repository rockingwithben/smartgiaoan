import React from 'react';
import FeedbackLoop from './FeedbackLoop';

export function WorksheetView({ data, paperRef, onRegenerate }) {
  if (!data) return null;
  const content = data.content;
  const isKindergarten = data.level === 'Kindergarten';
  const isIELTS = data.level === 'IELTS' || data.level === 'Secondary';

  return (
    <div className="space-y-4">
      <div
        ref={paperRef}
        className={`bg-white shadow-lg border border-gray-200 mx-auto print:shadow-none print:border-none ${isKindergarten ? 'p-6 sm:p-10' : 'p-8 sm:p-12'}`}
      >
        <div className={`border-black pb-4 mb-6 ${isKindergarten ? 'border-b-4 text-center' : 'border-b-2 flex justify-between items-end'}`}>
          <div className={isKindergarten ? 'w-full' : 'w-2/3'}>
            <h1 className={`${isKindergarten ? 'text-4xl' : 'text-3xl'} font-serif font-bold text-black mb-1`}>
              {content?.title || data.title}
            </h1>
          </div>
          <div className="flex gap-4 text-xs font-bold text-black uppercase">
            <span>{data.level} ({data.cefr})</span>
            <span>|</span>
            <span>{data.skill}</span>
          </div>
        </div>

        <div className={`flex justify-between items-end mb-8 font-serif ${isKindergarten ? 'text-2xl' : 'text-lg'}`}>
          <div className="w-1/2 border-b-2 border-dashed border-gray-400 pb-1">Name:</div>
          <div className="w-1/4 border-b-2 border-dashed border-gray-400 pb-1">Date:</div>
          <div className="w-1/6 border-b-2 border-dashed border-gray-400 pb-1 text-right">Score: /100</div>
        </div>

        {content?.reading_passage && (
          <div className={`mb-10 ${isIELTS ? 'text-sm text-justify font-serif leading-relaxed' : 'p-6 bg-gray-50 rounded-xl border border-gray-300 text-lg leading-loose'}`}>
            {!isIELTS && <h3 className="font-bold text-xl mb-4 uppercase">Read the text carefully:</h3>}
            {content.reading_passage.title && <h4 className="font-bold text-lg mb-3">{content.reading_passage.title}</h4>}
            <p className="whitespace-pre-wrap">{content.reading_passage.text}</p>
          </div>
        )}

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
              <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
            ))}
          </div>
        )}

        {content?.comprehension && content.comprehension.exercises && (
          <div className="mb-10">
            <h3 className="font-bold text-xl mb-4 font-serif border-b border-gray-300 pb-2">Comprehension</h3>
            {content.comprehension.exercises.map((ex, i) => (
              <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} isIELTS={isIELTS} />
            ))}
          </div>
        )}

        {content?.grammar && (
          <div className="mb-10">
            <h3 className="font-bold text-xl mb-2 font-serif border-b border-gray-300 pb-2">Grammar: {content.grammar.focus}</h3>
            {content.grammar.explanation && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 text-sm">{content.grammar.explanation}</div>
            )}
            {content.grammar.exercises && content.grammar.exercises.map((ex, i) => (
              <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
            ))}
          </div>
        )}

        {content?.sections && content.sections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h3 className={`font-bold mb-2 font-serif ${isKindergarten ? 'text-2xl bg-red-50 p-3 rounded-lg border-2 border-dashed border-red-200' : 'text-xl bg-gray-100 p-2'}`}>
              {section.section_title}
            </h3>
            <p className={`italic text-gray-700 mb-6 ${isKindergarten ? 'text-lg font-medium' : 'text-md'}`}>{section.instructions}</p>
            <div className={`space-y-${isKindergarten ? '10' : '6'}`}>
              {section.questions && section.questions.map((q) => (
                <div key={q.number} className="pl-2">
                  <p className={`font-medium ${isKindergarten ? 'text-2xl mb-4' : 'text-lg mb-2'}`}>
                    <span className="font-bold mr-2">{q.number}.</span>{q.question}
                  </p>
                  {q.options && q.options.length > 0 ? (
                    <div className="pl-6 space-y-2 mt-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-start">
                          <div className="w-5 h-5 border border-black rounded-full mr-3 mt-1 flex-shrink-0"></div>
                          <span className="text-gray-800">{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 border-b border-gray-500 w-full h-6"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {content?.writing && (
          <div className="mb-10 mt-12">
            <h3 className="font-bold text-xl mb-4 font-serif border-b-2 border-black pb-2">Writing Task</h3>
            <p className="font-medium text-lg mb-2">{content.writing.task}</p>
            {content.writing.success_criteria && (
              <ul className="text-sm text-gray-600 mb-4 list-disc pl-5">
                {content.writing.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            )}
            <div className="space-y-8 mt-8">
              {[...Array(isKindergarten ? 5 : 12)].map((_, i) => (
                <div key={i} className={`border-b ${isKindergarten ? 'border-dashed border-gray-400 h-12' : 'border-gray-400 h-8'} w-full`}></div>
              ))}
            </div>
          </div>
        )}

        {content?.comprehension?.exercises && content.comprehension.exercises.some(ex => ex.answers && ex.answers.length > 0) && (
          <div className="mt-12 pt-8 border-t-2 border-gray-300 print:break-before-page">
            <h3 className="font-bold text-xl mb-4 font-serif">Answer Key</h3>
            {content.comprehension.exercises.map((ex, i) => (
              ex.answers && ex.answers.length > 0 && (
                <div key={i} className="mb-4">
                  <p className="font-bold text-sm mb-2">{ex.instructions}</p>
                  <div className="flex flex-wrap gap-3">
                    {ex.answers.map((ans, j) => (
                      <span key={j} className="text-sm bg-gray-100 px-2 py-1 rounded">{j + 1}. {String(ans)}</span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <FeedbackLoop
        worksheetId={data.worksheet_id}
        originalPrompt={`${data.level} ${data.cefr} ${data.skill} ${data.topic}`}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

function ExBlock({ exercise, isKindergarten, isIELTS }) {
  if (!exercise) return null;
  return (
    <div className="mb-8">
      <p className={`italic text-gray-700 mb-4 ${isKindergarten ? 'text-lg font-medium' : 'text-sm'}`}>{exercise.instructions}</p>
      <div className={`space-y-${isKindergarten ? '8' : '4'}`}>
        {exercise.items && exercise.items.map((item, i) => (
          <div key={i} className="pl-2">
            <p className={`font-medium ${isKindergarten ? 'text-2xl mb-3' : 'text-base mb-2'}`}>
              <span className="font-bold mr-2">{i + 1}.</span>
              {typeof item === 'string' ? item : item.question || item.sentence || JSON.stringify(item)}
            </p>
            {typeof item === 'object' && item.options ? (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
