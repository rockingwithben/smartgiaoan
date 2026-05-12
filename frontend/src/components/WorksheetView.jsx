import React, { useMemo, lazy, Suspense } from 'react';
import FeedbackLoop from './FeedbackLoop';

// Lazy load sub-components within WorksheetView
const LazyHeaderSection = lazy(() => import('./HeaderSection')); // Assuming HeaderSection is in its own file
const LazyStudentInfoSection = lazy(() => import('./StudentInfoSection')); // Assuming StudentInfoSection is in its own file
const LazyReadingPassage = lazy(() => import('./ReadingPassage')); // Assuming ReadingPassage is in its own file
const LazyExBlock = lazy(() => import('./ExBlock')); // Assuming ExBlock is in its own file
const LazyVocabularySection = lazy(() => import('./VocabularySection')); // Assuming VocabularySection is in its own file
const LazyAnswerKeySection = lazy(() => import('./AnswerKeySection')); // Assuming AnswerKeySection is in its own file

// Simple loading fallback component for lazy-loaded sections
const SectionLoading = () => (
  <div className="min-h-[200px] flex items-center justify-center text-lg font-medium text-gray-500">
    Loading section...
  </div>
);

// Memoized sub-components to prevent unnecessary re-renders
// Note: If these are now lazy-loaded, they might not need React.memo here anymore,
// but it's kept for now in case of direct usage or future refactors.
const HeaderSection = React.memo(({ data, isKindergarten }) => {
  const content = data.content || {};
  return (
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
  );
});

const StudentInfoSection = React.memo(({ isKindergarten }) => (
  <div className={`flex justify-between items-end mb-8 font-serif ${isKindergarten ? 'text-2xl' : 'text-lg'}`}>
    <div className="w-1/2 border-b-2 border-dashed border-gray-400 pb-1">Name:</div>
    <div className="w-1/4 border-b-2 border-dashed border-gray-400 pb-1">Date:</div>
    <div className="w-1/6 border-b-2 border-dashed border-gray-400 pb-1 text-right">Score: /100</div>
  </div>
));

const ReadingPassage = React.memo(({ content, isIELTS }) => {
  if (!content?.reading_passage) return null;

  const passage = content.reading_passage;
  return (
    <div className={`mb-10 ${isIELTS ? 'text-sm text-justify font-serif leading-relaxed' : 'p-6 bg-gray-50 rounded-xl border border-gray-300 text-lg leading-loose'}`}>
      {!isIELTS && <h3 className="font-bold text-xl mb-4 font-serif">Read the text carefully:</h3>}
      {passage.title && <h4 className="font-bold text-lg mb-3">{passage.title}</h4>}
      <p className="whitespace-pre-wrap">{passage.text}</p>
    </div>
  );
});

const ExBlock = React.memo(({ exercise, isKindergarten, isIELTS }) => {
  if (!exercise) return null;

  const getText = (item) => {
    if (typeof item === 'string') return item;
    return item.question || item.sentence || JSON.stringify(item);
  };

  return (
    <div className="mb-8">
      <p className={`italic text-gray-700 mb-4 ${isKindergarten ? 'text-lg font-medium' : 'text-sm'}`}>
        {exercise.instructions}
      </p>
      <div className={`space-y-${isKindergarten ? '8' : '4'}`}>
        {exercise.items?.map((item, i) => (
          <div key={i} className="pl-2">
            <p className={`font-medium ${isKindergarten ? 'text-2xl mb-3' : 'text-base mb-2'}`}>
              <span className="font-bold mr-2">{i + 1}.</span>
              {getText(item)}
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
});

const VocabularySection = React.memo(({ content, isKindergarten }) => {
  if (!content?.vocabulary) return null;

  const vocab = content.vocabulary;

  return (
    <div className="mb-10">
      {vocab.glossary && vocab.glossary.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-4 font-serif border-b border-gray-300 pb-2">Vocabulary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vocab.glossary.map((item, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="font-bold text-red-700">{item.word}</span>
                <span className="text-gray-600 text-sm ml-2">— {item.definition}</span>
                {item.example && <p className="text-xs text-gray-500 italic mt-1">{item.example}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {vocab.exercises && vocab.exercises.map((ex, i) => (
        <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
      ))}
    </div>
  );
});

const AnswerKeySection = React.memo(({ content }) => {
  if (!content?.comprehension?.exercises?.some(ex => ex.answers?.length > 0)) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t-2 border-gray-300 print:break-before-page">
      <h3 className="font-bold text-xl mb-4 font-serif">Answer Key</h3>
      {content.comprehension.exercises.map((ex, i) => {
        if (!ex.answers?.length) return null;
        return (
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
        );
      })}
    </div>
  );
});

export function WorksheetView({ data, paperRef, onRegenerate }) {
  if (!data) return null;

  const content = data.content || {};
  const isKindergarten = data.level === 'Kindergarten';
  const isIELTS = data.level === 'IELTS' || data.level === 'Secondary';

  // Removed redundant useMemo hook. Props are passed directly.

  return (
    <div className="space-y-4">
      <div
        ref={paperRef}
        className={`bg-white shadow-lg border border-gray-200 mx-auto print:shadow-none print:border-none ${isKindergarten ? 'p-6 sm:p-10' : 'p-8 sm:p-12'}`}
      >
        <Suspense fallback={<SectionLoading />}>
          <HeaderSection data={data} isKindergarten={isKindergarten} />
        </Suspense>
        <Suspense fallback={<SectionLoading />}>
          <StudentInfoSection isKindergarten={isKindergarten} />
        </Suspense>

        <Suspense fallback={<SectionLoading />}>
          <ReadingPassage content={content} isIELTS={isIELTS} />
        </Suspense>

        <Suspense fallback={<SectionLoading />}>
          <VocabularySection content={content} isKindergarten={isKindergarten} />
        </Suspense>

        {content?.comprehension && content.comprehension.exercises && (
          <Suspense fallback={<SectionLoading />}>
            <div className="mb-10">
              <h3 className="font-bold text-xl mb-4 font-serif border-b border-gray-300 pb-2">Comprehension</h3>
              {content.comprehension.exercises.map((ex, i) => (
                <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} isIELTS={isIELTS} />
              ))}
            </div>
          </Suspense>
        )}

        {content?.grammar && (
          <Suspense fallback={<SectionLoading />}>
            <div className="mb-10">
              <h3 className="font-bold text-xl mb-2 font-serif border-b border-gray-300 pb-2">
                Grammar: {content.grammar.focus}
              </h3>
              {content.grammar.explanation && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 text-sm">
                  {content.grammar.explanation}
                </div>
              )}
              {content.grammar.exercises?.map((ex, i) => (
                <ExBlock key={i} exercise={ex} isKindergarten={isKindergarten} />
              ))}
            </div>
          </Suspense>
        )}

        {content?.sections?.map((section, idx) => (
          <Suspense fallback={<SectionLoading />}>
            <div key={idx} className="mb-12">
              <h3 className={`font-bold mb-2 font-serif ${isKindergarten ? 'text-2xl bg-red-50 p-3 rounded-lg border-2 border-dashed border-red-200' : 'text-xl bg-gray-100 p-2'}`}>
                {section.section_title}
              </h3>
              <p className={`italic text-gray-700 mb-6 ${isKindergarten ? 'text-lg font-medium' : 'text-md'}`}>
                {section.instructions}
              </p>
              <div className={`space-y-${isKindergarten ? '10' : '6'}`}>
                {section.questions?.map((q) => (
                  <div key={q.number} className="pl-2">
                    <p className={`font-medium ${isKindergarten ? 'text-2xl mb-4' : 'text-lg mb-2'}`}>
                      <span className="font-bold mr-2">{q.number}.</span>
                      {q.question}
                    </p>
                    {q.options?.length > 0 ? (
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
          </Suspense>
        ))}

        {content?.writing && (
          <Suspense fallback={<SectionLoading />}>
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
          </Suspense>
        )}

        <Suspense fallback={<SectionLoading />}>
          <AnswerKeySection content={content} />
        </Suspense>
      </div>

      <FeedbackLoop
        worksheetId={data.worksheet_id}
        originalPrompt={`${data.level} ${data.cefr} ${data.skill} ${data.topic}`}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

export default WorksheetView;