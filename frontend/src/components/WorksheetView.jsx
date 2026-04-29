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
      {/* PAGE 1 — Header + Pre-reading + Passage */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <div className="overline text-terracotta">SmartGiaoAn · Cambridge ESL</div>
          <h1 className="font-display text-4xl mt-2 leading-tight">{c.title || data.title}</h1>
          {c.vi_translation && <p className="text-sm italic text-muted-foreground mt-1">{c.vi_translation}</p>}
          {c.subtitle && <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>}
        </div>
        <div className="text-right text-xs space-y-1">
          <div><span className="overline">Level</span> &nbsp; {data.level}</div>
          <div><span className="overline">CEFR</span> &nbsp; {data.cefr}</div>
          <div><span className="overline">Skill</span> &nbsp; {data.skill}</div>
          {c.estimated_time_minutes && <div><span className="overline">Time</span> &nbsp; {c.estimated_time_minutes} min</div>}
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

      {c.learning_objectives && c.learning_objectives.length > 0 && (
        <div className="bg-sand border-l-4 border-terracotta px-4 py-3 mb-6">
          <p className="overline mb-2">Learning Objectives</p>
          <ul className="text-sm leading-relaxed list-disc ml-5 space-y-1">
            {c.learning_objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {c.instructions && (
        <div className="bg-sand border-l-4 border-ink px-4 py-3 mb-6">
          <p className="overline mb-1">{t('instructions')}</p>
          <p className="text-sm leading-relaxed">{c.instructions}</p>
        </div>
      )}

      {c.vocabulary_glossary && c.vocabulary_glossary.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl border-b border-ink/40 pb-1">Key Vocabulary</h2>
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="text-left border-b border-ink/30">
                <th className="py-1.5 pr-3 overline">Word</th>
                <th className="py-1.5 pr-3 overline">PoS</th>
                <th className="py-1.5 pr-3 overline">Tiếng Việt</th>
                <th className="py-1.5 pr-3 overline">Definition</th>
                <th className="py-1.5 overline">Example</th>
              </tr>
            </thead>
            <tbody>
              {c.vocabulary_glossary.map((v, i) => (
                <tr key={i} className="border-b border-ink/10 align-top">
                  <td className="py-1.5 pr-3 font-medium">{v.word}</td>
                  <td className="py-1.5 pr-3 italic text-muted-foreground">{v.part_of_speech}</td>
                  <td className="py-1.5 pr-3 font-medium text-terracotta">{v.meaning_vi || ''}</td>
                  <td className="py-1.5 pr-3">{v.definition_en || v.definition || ''}</td>
                  <td className="py-1.5 text-muted-foreground italic">{v.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {c.passage && (
        <div className="mb-8">
          <p className="overline mb-2">{data.skill === 'listening' ? 'Listening Transcript (read aloud twice at natural pace)' : 'Reading Passage'}</p>
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
                    {q.type === 'true_false_not_given' && (
                      <div className="mt-2 ml-2 text-sm font-mono">TRUE &nbsp; / &nbsp; FALSE &nbsp; / &nbsp; NOT GIVEN</div>
                    )}
                    {(q.type === 'fill_blank' || q.type === 'short_answer' || q.type === 'sentence_transformation' || q.type === 'error_correction' || q.type === 'open_ended') && (
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

      {/* Creative Task */}
      {c.creative_task && (
        <div className="mb-8 mt-10 border-l-4 border-terracotta bg-sand p-5">
          <p className="overline text-terracotta">{c.creative_task.title || 'Creative Task'}</p>
          {c.creative_task.scene_description && (
            <p className="mt-2 italic text-ink/85 leading-relaxed">{c.creative_task.scene_description}</p>
          )}
          {c.creative_task.instructions && (
            <p className="mt-3 text-base">{c.creative_task.instructions}</p>
          )}
          <div className="mt-4 space-y-2">
            {[...Array(6).keys()].map((_, i) => <div key={i} className="write-line"></div>)}
          </div>
        </div>
      )}

      {/* Writing Task */}
      {c.writing_task && (
        <div className="mb-8 mt-10">
          <h2 className="font-display text-2xl border-b border-ink/40 pb-1">Writing Task</h2>
          <p className="mt-3 text-base">{c.writing_task.prompt}</p>
          {c.writing_task.minimum_words && (
            <p className="text-sm italic text-muted-foreground mt-1">Minimum: {c.writing_task.minimum_words} words.</p>
          )}
          {c.writing_task.success_criteria && (
            <div className="mt-3 bg-sand border border-border p-3">
              <p className="overline mb-1">You will be assessed on</p>
              <ul className="text-sm list-disc ml-5 space-y-0.5">
                {c.writing_task.success_criteria.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {[...Array(10).keys()].map((_, i) => <div key={i} className="write-line"></div>)}
          </div>
        </div>
      )}

      {/* Answer key */}
      {c.answer_key && c.answer_key.length > 0 && (
        <div className="mt-10 border-t-2 border-ink pt-4 break-before-page">
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

      {c.extension_activity && (
        <div className="mt-4 text-sm border border-dashed border-terracotta p-4">
          <p className="overline text-terracotta mb-1">Extension Activity (5 min)</p>
          <p className="leading-relaxed">{c.extension_activity}</p>
        </div>
      )}

      <div className="mt-8 pt-3 border-t border-border text-[11px] text-muted-foreground flex justify-between">
        <span className="font-mono tracking-widest">SmartGiaoAn · {data.level} · {data.cefr}</span>
        <span>smartgiaoan.com</span>
      </div>
    </div>
  );
}
