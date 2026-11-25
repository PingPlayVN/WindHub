export function unrollKeyBadges(text) {
  if (!text) return '';
  let s = text;

  s = s.replace(/\(([^)]+)\)\s*[×x]\s*(\d+)\s*lần/gi, (_, inner, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(inner.trim()).join(' ');
  });

  s = s.replace(/\(([^)]+)\)\s*[×x]\s*(\d+)/gi, (_, inner, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(inner.trim()).join(' ');
  });

  s = s.replace(/(\[[^\]]+\])\s*[×x]\s*(\d+)(\s*lần)?/gi, (_, key, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(key.trim()).join(' ');
  });

  s = s.replace(/\[(\d+)\s*số\s*bất\s*k[ìỳ]\]/gi, (match, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    if (n > 10) return match;
    if (n === 9) return '[1] [2] [3] [4] [5] [6] [7] [8] [9]';
    return Array(n).fill('[1]').join(' ');
  });

  s = s.replace(/\]\s*\[/g, '] [');
  s = s
    .replace(/\[<\]/g, '[←]')
    .replace(/\[>\]/g, '[→]')
    .replace(/\[[\^∧]\]/g, '[↑]')
    .replace(/\[[v∨]\]/g, '[↓]');

  return s;
}
