export const normalizeAnswer = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const getAcceptedAnswers = (value) => String(value ?? '')
  .split(/[;,\n]/)
  .map(normalizeAnswer)
  .filter(Boolean);

export const isAnswerCorrect = (answer, acceptedAnswers) => {
  const normalized = normalizeAnswer(answer);
  return Boolean(normalized) && acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
};