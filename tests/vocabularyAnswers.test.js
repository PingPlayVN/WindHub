import test from 'node:test';
import assert from 'node:assert/strict';

import { getAcceptedAnswers, isAnswerCorrect } from '../src/modules/Tools/VocabularyPractice/utils/answerUtils.js';
import { parseVocabularyText } from '../src/modules/Tools/VocabularyPractice/utils/importUtils.js';

test('keeps comma-separated grammatical labels together as one accepted answer', () => {
  const acceptedAnswers = getAcceptedAnswers('rule (n, v)');

  assert.deepEqual(acceptedAnswers, ['rule (n, v)']);
  assert.equal(isAnswerCorrect('rule (n, v)', acceptedAnswers), true);
});

test('accepts the imported rule (n, v) vocabulary entry exactly as entered', () => {
  const { entries } = parseVocabularyText('rule (n, v) : sự trị vì, trị vì');
  const acceptedAnswers = getAcceptedAnswers(entries[0].english);

  assert.deepEqual(entries, [{ english: 'rule (n, v)', vietnamese: 'sự trị vì, trị vì' }]);
  assert.equal(isAnswerCorrect('rule (n, v)', acceptedAnswers), true);
});

test('splits comma-separated synonyms outside parentheses into accepted answers', () => {
  const acceptedAnswers = getAcceptedAnswers('sự trị vì, trị vì');

  assert.deepEqual(acceptedAnswers, ['sự trị vì', 'trị vì']);
  assert.equal(isAnswerCorrect('trị vì', acceptedAnswers), true);
});

test('still accepts semicolon and newline-separated alternatives', () => {
  assert.deepEqual(
    getAcceptedAnswers('rule (n, v); reign\nsovereignty'),
    ['rule (n, v)', 'reign', 'sovereignty'],
  );
});
