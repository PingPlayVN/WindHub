import test from 'node:test';
import assert from 'node:assert/strict';

import { renderArt } from '../src/modules/Tools/ImageArtStudio/renderArt.js';

function settings(overrides = {}) {
  return {
    mode: 'classic',
    columns: 1,
    rows: 1,
    characters: '@ ',
    blockStyle: 'shade',
    gamma: 1,
    saturation: 100,
    brightness: 0,
    contrast: 0,
    exposure: 0,
    ...overrides,
  };
}

function rgba(pixels) {
  return new Uint8ClampedArray(pixels.flatMap(([red, green, blue, alpha = 255]) => [red, green, blue, alpha]));
}

test('classic renderer maps dark and light pixels to opposite ends of the ramp', () => {
  const result = renderArt(rgba([[0, 0, 0], [255, 255, 255]]), 2, 1, settings({ columns: 2 }));
  assert.equal(result.text, '@ ');
  assert.equal(result.columns, 2);
  assert.equal(result.rows, 1);
});

test('braille renderer maps a dark top-left sample to the first braille dot', () => {
  const pixels = rgba([[0, 0, 0], ...Array.from({ length: 7 }, () => [255, 255, 255])]);
  const result = renderArt(pixels, 2, 4, settings({ mode: 'braille' }));
  assert.equal(result.text, '⠁');
});

test('half-block renderer distinguishes top-only and bottom-only samples', () => {
  const topOnly = renderArt(
    rgba([[0, 0, 0], [255, 255, 255]]),
    1,
    2,
    settings({ mode: 'block', blockStyle: 'half' }),
  );
  const bottomOnly = renderArt(
    rgba([[255, 255, 255], [0, 0, 0]]),
    1,
    2,
    settings({ mode: 'block', blockStyle: 'half' }),
  );
  assert.equal(topOnly.text, '▀');
  assert.equal(bottomOnly.text, '▄');
});

test('edge and dither modes return bounded output with the requested dimensions', () => {
  const pixels = rgba([
    [255, 255, 255], [255, 255, 255], [255, 255, 255],
    [255, 255, 255], [0, 0, 0], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [255, 255, 255],
  ]);
  const edge = renderArt(pixels, 3, 3, settings({ mode: 'edge', columns: 3, rows: 3, characters: '# ' }));
  const dither = renderArt(pixels, 3, 3, settings({ mode: 'dither', columns: 3, rows: 3, characters: '# ' }));
  assert.equal(edge.text.split('\n').length, 3);
  assert.equal(dither.text.split('\n').length, 3);
  assert.equal(edge.text.length, 11);
  assert.equal(dither.text.length, 11);
});

test('custom Unicode glyphs and source colors are retained', () => {
  const result = renderArt(
    rgba([[20, 90, 180]]),
    1,
    1,
    settings({ mode: 'custom', characters: '♥★●', saturation: 100 }),
  );
  assert.equal(result.text, '★');
  assert.deepEqual(Array.from(result.colors), [20, 90, 180]);
});

test('dense, Unicode and shaded block modes use mode-specific ramps', () => {
  const blackPixel = rgba([[0, 0, 0]]);
  assert.equal(renderArt(blackPixel, 1, 1, settings({ mode: 'dense', characters: undefined })).text, '$');
  assert.equal(renderArt(blackPixel, 1, 1, settings({ mode: 'unicode', characters: undefined })).text, '█');
  assert.equal(renderArt(blackPixel, 1, 1, settings({ mode: 'block', characters: undefined })).text, '█');
});

test('invalid sample dimensions are rejected', () => {
  assert.throws(
    () => renderArt(rgba([[0, 0, 0]]), 1, 1, settings({ mode: 'braille' })),
    /dimensions do not match/,
  );
});
