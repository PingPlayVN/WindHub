import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVocabularyText } from '../src/modules/Tools/VocabularyPractice/utils/importUtils.js';

test('parses pasted word lists with common separators and ignores table headers', () => {
  const result = parseVocabularyText([
    '| English | Vietnamese |',
    '1. apple - quả táo',
    'book\tquyển sách',
    'thoughtful: chu đáo, ân cần',
    'apple, quả táo',
  ].join('\n'));

  assert.deepEqual(result.entries, [
    { english: 'apple', vietnamese: 'quả táo' },
    { english: 'book', vietnamese: 'quyển sách' },
    { english: 'thoughtful', vietnamese: 'chu đáo, ân cần' },
  ]);
  assert.deepEqual(result.invalidLines, []);
});

test('supports Vietnamese-first input and reports lines without a pair', () => {
  const result = parseVocabularyText('xin chào → hello\njust a word', 'vietnamese-first');

  assert.deepEqual(result.entries, [{ english: 'hello', vietnamese: 'xin chào' }]);
  assert.deepEqual(result.invalidLines, [{ line: 2, text: 'just a word' }]);
});