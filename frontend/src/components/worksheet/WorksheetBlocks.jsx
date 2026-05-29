import React, { memo } from 'react';

export const ExerciseBlock = memo(function ExerciseBlock({ exercise, isKindergarten, isIELTS, index }) {
  if (!exercise) return null;

  const items = exercise.items || exercise.questions || [];
  const instructions = exercise.instructions || exercise.prompt || exercise.title || `Exercise ${index + 1}`;
  const exType = exercise.type || exercise.exercise_type || '';

  return (
    <div className="mb-8 print:break-inside-avoid exercise-block">
      <h4 className={`font-bold mb-4 ${isKindergarten ? 'text-xl bg-yellow-50 p-3 rounded-lg border border-yellow-200' : 'text-lg text-gray-800'}`}>
        {instructions}
      </h4>
      <div className={isKindergarten ? 'space-y-8' : 'space-y-5'}>
        {items.map((item, i) => (
          <QuestionItem
            key={item?.number ?? item?.id ?? `ex-${index}-q-${i}`}
            question={item}
            number={i + 1}
            isKindergarten={isKindergarten}
            isIELTS={isIELTS}
            exerciseType={exType}
          />
        ))}
      </div>
    </div>
  );
});

export const QuestionItem = memo(function QuestionItem({ question, number, isKindergarten, isIELTS, exerciseType }) {
  if (!question) return null;

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

      {isTrueFalse && (
        <div className="flex gap-4 pl-6 mt-3" role="group" aria-label="True, False, or Not Given">
          {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
            <div key={opt} className="flex items-center text-sm font-bold border-2 border-gray-800 px-4 py-2 rounded bg-white">
              <div className="w-4 h-4 border-2 border-black mr-2 bg-white" aria-hidden="true" />
              {opt}
            </div>
          ))}
        </div>
      )}

      {!isTrueFalse && isMultipleChoice && (
        <ul className="pl-6 space-y-2 mt-3 list-none" role="list">
          {options.map((opt, oIdx) => {
            const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
            const optLabel = typeof opt === 'object' && opt.label ? opt.label : String.fromCharCode(65 + oIdx);
            return (
              <li key={oIdx} className="flex items-start group">
                <div className="w-5 h-5 border-2 border-gray-400 rounded-full mr-3 mt-1 flex-shrink-0 group-hover:border-black transition print:border-black" aria-hidden="true" />
                <span className="text-gray-800">
                  <span className="font-bold mr-1">{optLabel}.</span>
                  {optText}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!isTrueFalse && !isMultipleChoice && (
        <div className="mt-4 border-b-2 border-gray-300 w-full h-8 print:border-black" aria-hidden="true" />
      )}
    </div>
  );
});
