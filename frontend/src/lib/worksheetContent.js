/** Collect answer-key sections from any worksheet content schema. */
export function collectWorksheetAnswers(content) {
  if (!content || typeof content !== 'object') return [];

  const allAnswers = [];
  const hasSections = Array.isArray(content.sections) && content.sections.length > 0;
  const hasExercises = Array.isArray(content.exercises) && content.exercises.length > 0;
  const hasVocabulary = content.vocabulary && (content.vocabulary.glossary?.length > 0 || content.vocabulary.exercises?.length > 0);
  const hasComprehension = content.comprehension && content.comprehension.exercises?.length > 0;
  const hasGrammar = content.grammar && (content.grammar.exercises?.length > 0 || content.grammar.explanation);

  if (content.answer_key) {
    allAnswers.push({ title: 'Answer Key', answers: content.answer_key });
  }
  if (hasSections) {
    content.sections.forEach((sec, idx) => {
      if (sec.answer_key || sec.answers) {
        allAnswers.push({
          title: sec.section_title || `Section ${idx + 1}`,
          answers: sec.answer_key || sec.answers,
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
  return allAnswers;
}

export function getContentFlags(content) {
  if (!content) {
    return {
      hasSections: false,
      hasExercises: false,
      hasVocabulary: false,
      hasComprehension: false,
      hasGrammar: false,
      hasWriting: false,
      hasPassage: false,
      hasListeningScript: false,
    };
  }
  return {
    hasSections: Array.isArray(content.sections) && content.sections.length > 0,
    hasExercises: Array.isArray(content.exercises) && content.exercises.length > 0,
    hasVocabulary: Boolean(content.vocabulary && (content.vocabulary.glossary?.length > 0 || content.vocabulary.exercises?.length > 0)),
    hasComprehension: Boolean(content.comprehension && content.comprehension.exercises?.length > 0),
    hasGrammar: Boolean(content.grammar && (content.grammar.exercises?.length > 0 || content.grammar.explanation)),
    hasWriting: Boolean(content.writing || content.writing_task),
    hasPassage: Boolean(content.reading_passage || content.passage),
    hasListeningScript: Boolean(content.listening_script),
  };
}
