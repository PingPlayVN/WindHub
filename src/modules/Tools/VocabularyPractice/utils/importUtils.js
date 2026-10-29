const delimiters = [
  /\s*(?:->|→)\s*/,
  /\t+/,
  /\s*\|\s*/,
  /\s+[–—-]\s+/,
  /\s*[:=]\s*/,
  /\s*;\s*/,
  /[ \t]{2,}/,
  /\s*,\s*/,
];

const headerWords = new Set([
  'english', 'vietnamese', 'word', 'meaning', 'translation',
  'tieng anh', 'tieng viet', 'tu tieng anh', 'tu tieng viet', 'tu vung', 'nghia',
]);

const normalizeHeader = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const isHeaderRow = (english, vietnamese) => (
  (headerWords.has(normalizeHeader(english)) && headerWords.has(normalizeHeader(vietnamese)))
  || (headerWords.has(normalizeHeader(vietnamese)) && headerWords.has(normalizeHeader(english)))
);

function splitPair(line) {
  for (const delimiter of delimiters) {
    const match = delimiter.exec(line);
    if (match) {
      return [line.slice(0, match.index), line.slice(match.index + match[0].length)]
        .map((value) => value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/""/g, '"'));
    }
  }
  return null;
}

export function parseVocabularyText(text, order = 'english-first') {
  const entries = [];
  const invalidLines = [];
  const knownPairs = new Set();

  String(text ?? '').split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine
      .replace(/^\s*(?:\d+[.)、]|[-*•])\s*/, '')
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .trim();
    if (!line) return;

    const pair = splitPair(line);
    if (!pair || !pair[0] || !pair[1]) {
      invalidLines.push({ line: index + 1, text: rawLine.trim() });
      return;
    }

    const [first, second] = pair;
    if (isHeaderRow(first, second)) return;

    const [english, vietnamese] = order === 'vietnamese-first' ? [second, first] : [first, second];
    const key = `${english.toLocaleLowerCase()}\u0000${vietnamese.toLocaleLowerCase()}`;
    if (knownPairs.has(key)) return;
    knownPairs.add(key);
    entries.push({ english, vietnamese });
  });

  return { entries, invalidLines };
}