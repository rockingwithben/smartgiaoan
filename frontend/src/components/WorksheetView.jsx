import React from 'react';
import { useI18n } from '../lib/i18n';

export function WorksheetView({ data, paperRef }) {
  const { t } = useI18n();
  if (!data) {
    return (
      <div className="bg-white border border-border shadow-sm h-[60vh] flex items-center justify-center" data-testid="worksheet-empty">
        <div className="text-center px-8">
          <p className="font-display text-3xl text-ink/70">Your worksheet will appear here.</p>
          <p className="text-sm text-muted-foreground mt-2">Fill the form and click <span className="font-medium text-ink">Generate</span>.</p>
        </div>
      </div>
    );
  }
  const c = data.content || {};
  return (
    <div
      ref={paperRef}
      className="worksheet-paper border border-border shadow-lg mx-auto w-full max-w-[820px] p-10 md:p-16"
      data-testid="worksheet-paper"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <div className="overline text-terracotta">SmartGiaoAn · Cambridge ESL</div>
          <h1 className="font-display text-4xl mt-2 leading-tight">{c.title || data.title}</h1>
          {c.subtitle && <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>}
        </div>
        <div className="text-right text-xs space-y-1">
          <div><span className="overline">Level</span> &nbsp; {data.level}</div>
          <div><span className="overline">CEFR</span> &nbsp; {data.cefr}</div>
          <div><span className="overline">Skill</span> &nbsp; {data.skill}</div>
        </div>
      </div>

      {/* Name / Date row */}
      <div className="flex items-center gap-6 my-6 text-sm">
        <div className="flex-1 flex items-baseline gap-2">
          <span className="overline">Name</span>
          <div className="flex-1 border-b border-dotted border-ink/60 h-5"></div>
        </div>
        <div className="w-40 flex items-baseline gap-2">
          <span className="overline">Date</span>
          <div className="flex-1 border-b border-dotted border-ink/60 h-5"></div>
        </div>
        <div className="w-32 flex items-baseline gap-2">
          <span className="overline">Score</span>
          <div className="flex-1 border-b border-dotted border-ink/60 h-5"></div>
        </div>
      </div>

      {c.instructions && (
        <div className="bg-sand border-l-4 border-terracotta px-4 py-3 mb-6">
          <p className="overline mb-1">{t('instructions')}</p>
          <p className="text-sm leading-relaxed">{c.instructions}</p>
        </div>
      )}

      {c.passage && (
        <div className="mb-8">
          <p className="overline mb-2">Reading Passage</p>
          <div className="text-base leading-7 whitespace-pre-line text-ink border border-ink/30 p-5 bg-white">
            {c.passage}
          </div>
        </div>
      )}

      {/* Sections */}
      {(c.sections || []).map((sec, i) => (
        <div key={i} className="mb-8">
          <h2 className="font-display text-2xl border-b border-ink/40 pb-1">{sec.section_title || `${t('section')} ${i + 1}`}</h2>
          {sec.instructions && <p className="text-sm italic mt-2 text-ink/80">{sec.instructions}</p>}
          <ol className="mt-4 space-y-4">
            {(sec.questions || []).map((q, j) => (
              <li key={j} className="text-base">
                <div className="flex gap-3">
                  <span className="font-bold min-w-[2rem]">{q.number ?? j + 1}.</span>
                  <div className="flex-1">
                    <p>{q.question}</p>
                    {q.type === 'multiple_choice' && q.options && (
                      <ul className="mt-2 ml-2 space-y-1">
                        {q.options.map((opt, k) => (
                          <li key={k} className="flex gap-3 items-baseline">
                            <span className="font-mono text-sm">{String.fromCharCode(65 + k)}.</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === 'true_false' && (
                      <div className="mt-2 ml-2 text-sm font-mono">T &nbsp; / &nbsp; F</div>
                    )}
                    {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                      <>
                        <div className="write-line"></div>
                        <div className="write-line"></div>
                      </>
                    )}
                    {q.type === 'matching' && q.options && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        {q.options.map((opt, k) => (
                          <div key={k} className="border-b border-dotted border-ink/40 py-1">{String.fromCharCode(65 + k)}. {opt}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {/* Answer key */}
      {c.answer_key && c.answer_key.length > 0 && (
        <div className="mt-10 border-t-2 border-ink pt-4">
          <h2 className="font-display text-2xl">{t('answer_key')}</h2>
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {c.answer_key.map((a, i) => (
              <li key={i}>
                <span className="font-bold">{a.number}.</span> {a.answer}
                {a.explanation && <span className="text-muted-foreground"> — {a.explanation}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {c.teacher_notes && (
        <div className="mt-6 text-sm bg-sand border border-border p-4">
          <p className="overline mb-1">{t('teacher_notes')}</p>
          <p className="leading-relaxed">{c.teacher_notes}</p>
        </div>
      )}

      <div className="mt-8 pt-3 border-t border-border text-[11px] text-muted-foreground flex justify-between">
        <span className="font-mono tracking-widest">SmartGiaoAn</span>
        <span>Page 1</span>
      </div>
    </div>
  );
}
