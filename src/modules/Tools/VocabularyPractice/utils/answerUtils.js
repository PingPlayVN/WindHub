export const normalizeAnswer = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const getAcceptedAnswers = (value) => {
  const text = String(value ?? '');
  const answers = [];
  let start = 0;
  let parenthesisDepth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '(') parenthesisDepth += 1;
    else if (character === ')') parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    else if ((character === ';' || character === '\n' || character === ',' && parenthesisDepth === 0)) {
      answers.push(text.slice(start, index));
      start = index + 1;
    }
  }
  answers.push(text.slice(start));

  return answers.map(normalizeAnswer).filter(Boolean);
};

export const isAnswerCorrect = (answer, acceptedAnswers) => {
  const normalized = normalizeAnswer(answer);
  return Boolean(normalized) && acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
};