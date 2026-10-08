const RAMPS = {
  classic: '@%#*+=-:. ',
  dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,^`.',
  unicode: '█▓▒░●· ',
  edge: '@#*+=-:. ',
  block: '█▓▒░ ',
};

const BRAILLE_BITS = [
  [1, 2, 4, 64],
  [8, 16, 32, 128],
];

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getCharacterSet(settings) {
  if (settings.mode === 'block') return Array.from(settings.blockCharacters || RAMPS.block);
  if (settings.mode === 'dense') return Array.from(settings.characters || RAMPS.dense);
  if (settings.mode === 'unicode') return Array.from(settings.characters || RAMPS.unicode);
  if (settings.mode === 'custom') return Array.from(settings.characters || 'WIND');
  if (settings.mode === 'edge') return Array.from(settings.characters || RAMPS.edge);
  return Array.from(settings.characters || RAMPS.classic);
}

function luminance(red, green, blue) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function processPixel(red, green, blue, settings) {
  const originalLuminance = luminance(red, green, blue);
  const saturation = clamp(Number(settings.saturation ?? 100), 0, 200) / 100;
  red = originalLuminance + (red - originalLuminance) * saturation;
  green = originalLuminance + (green - originalLuminance) * saturation;
  blue = originalLuminance + (blue - originalLuminance) * saturation;

  const brightness = clamp(Number(settings.brightness || 0), -100, 100) * 2.55;
  const exposure = 2 ** clamp(Number(settings.exposure || 0), -4, 4);
  const contrastValue = clamp(Number(settings.contrast || 0), -100, 100);
  const contrast = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const gamma = clamp(Number(settings.gamma || 1), 0.1, 4);
  const adjust = (channel) => (clamp(
    contrast * (channel * exposure + brightness - 128) + 128,
    0,
    255,
  ) / 255) ** (1 / gamma) * 255;

  let nextRed = adjust(red);
  let nextGreen = adjust(green);
  let nextBlue = adjust(blue);
  if (settings.invert) {
    nextRed = 255 - nextRed;
    nextGreen = 255 - nextGreen;
    nextBlue = 255 - nextBlue;
  }
  return [nextRed, nextGreen, nextBlue, luminance(nextRed, nextGreen, nextBlue)];
}

function applyThreshold(value, settings) {
  if (!settings.thresholdEnabled) return value;
  const threshold = clamp(Number(settings.threshold ?? 128), 0, 255);
  return value >= threshold ? 255 : 0;
}

function applySoftFocus(values, width, height, settings) {
  const blur = clamp(Number(settings.blur || 0), 0, 100) / 100;
  const sharpness = clamp(Number(settings.sharpness || 0), 0, 100) / 100;
  if (!blur && !sharpness) return values;

  const filtered = new Float32Array(values.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0;
      let samples = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const sampleX = clamp(x + offsetX, 0, width - 1);
          const sampleY = clamp(y + offsetY, 0, height - 1);
          total += values[sampleY * width + sampleX];
          samples += 1;
        }
      }
      const index = y * width + x;
      const average = total / samples;
      filtered[index] = clamp(values[index] + (average - values[index]) * blur + (values[index] - average) * sharpness, 0, 255);
    }
  }
  return filtered;
}

function applyDither(values, width, height, settings, levels) {
  const algorithm = settings.ditherAlgorithm || 'floyd-steinberg';
  const strength = clamp(Number(settings.ditherStrength ?? 75), 0, 100) / 100;
  const output = values.slice();
  const maxLevel = Math.max(1, levels - 1);
  const quantize = (value) => Math.round(clamp(value, 0, 255) / 255 * maxLevel) / maxLevel * 255;

  if (algorithm === 'ordered') {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const adjusted = output[index] + ((BAYER_4[y % 4][x % 4] / 16) - 0.5) * 255 * strength;
        output[index] = quantize(adjusted);
      }
    }
    return output;
  }

  const atkinson = algorithm === 'atkinson';
  const spread = atkinson ? 8 : 16;
  const neighbors = atkinson
    ? [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]]
    : [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = output[index];
      const newValue = quantize(oldValue);
      const error = (oldValue - newValue) * strength / spread;
      output[index] = newValue;
      for (const [offsetX, offsetY, weight] of neighbors) {
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
          const nextIndex = nextY * width + nextX;
          output[nextIndex] += error * weight;
        }
      }
    }
  }
  return output;
}

function applyEdgeDetection(values, width, height, settings) {
  const result = new Float32Array(values.length);
  const threshold = clamp(Number(settings.edgeThreshold ?? 24), 0, 255);
  const strength = clamp(Number(settings.edgeStrength ?? 1.5), 0, 5);
  const at = (x, y) => values[clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1)];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const horizontal = -at(x - 1, y - 1) + at(x + 1, y - 1)
        - 2 * at(x - 1, y) + 2 * at(x + 1, y)
        - at(x - 1, y + 1) + at(x + 1, y + 1);
      const vertical = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)
        + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      const magnitude = Math.hypot(horizontal, vertical) * strength;
      result[y * width + x] = magnitude < threshold ? 255 : 0;
    }
  }
  return result;
}

function characterAt(value, characters) {
  const index = Math.round(clamp(value, 0, 255) / 255 * (characters.length - 1));
  return characters[index] ?? ' ';
}

export function renderArt(pixelData, pixelWidth, pixelHeight, settings) {
  const columns = clamp(Math.floor(Number(settings.columns) || 80), 1, 240);
  const rows = clamp(Math.floor(Number(settings.rows) || 40), 1, 240);
  const mode = settings.mode || 'classic';
  const isBraille = mode === 'braille';
  const isHalfBlock = mode === 'block' && settings.blockStyle === 'half';
  const scaleX = isBraille ? 2 : 1;
  const scaleY = isBraille || isHalfBlock ? (isBraille ? 4 : 2) : 1;
  if (pixelWidth !== columns * scaleX || pixelHeight !== rows * scaleY) {
    throw new Error('Image sample dimensions do not match the render settings.');
  }
  if (pixelData.length !== pixelWidth * pixelHeight * 4) {
    throw new Error('Image pixel data is incomplete.');
  }

  const filteredPixels = new Float32Array(pixelWidth * pixelHeight * 4);
  const pixelLuminance = new Float32Array(pixelWidth * pixelHeight);
  for (let index = 0, pixelIndex = 0; index < pixelData.length; index += 4, pixelIndex += 1) {
    const [red, green, blue, gray] = processPixel(pixelData[index], pixelData[index + 1], pixelData[index + 2], settings);
    filteredPixels[index] = red;
    filteredPixels[index + 1] = green;
    filteredPixels[index + 2] = blue;
    filteredPixels[index + 3] = pixelData[index + 3];
    pixelLuminance[pixelIndex] = gray;
  }
  const processedLuminance = applySoftFocus(pixelLuminance, pixelWidth, pixelHeight, settings);

  const values = new Float32Array(columns * rows);
  const colorTotals = new Float32Array(columns * rows * 3);
  const subPixels = Array.from({ length: columns * rows }, () => []);
  for (let y = 0; y < pixelHeight; y += 1) {
    for (let x = 0; x < pixelWidth; x += 1) {
      const pixelIndex = y * pixelWidth + x;
      const cellX = Math.floor(x / scaleX);
      const cellY = Math.floor(y / scaleY);
      const cellIndex = cellY * columns + cellX;
      const pixelOffset = pixelIndex * 4;
      const gray = applyThreshold(processedLuminance[pixelIndex], settings);
      subPixels[cellIndex].push(gray);
      values[cellIndex] += gray;
      colorTotals[cellIndex * 3] += filteredPixels[pixelOffset];
      colorTotals[cellIndex * 3 + 1] += filteredPixels[pixelOffset + 1];
      colorTotals[cellIndex * 3 + 2] += filteredPixels[pixelOffset + 2];
    }
  }

  const samplesPerCell = scaleX * scaleY;
  for (let index = 0; index < values.length; index += 1) {
    values[index] /= samplesPerCell;
  }
  const colors = new Uint8ClampedArray(colorTotals.length);
  for (let index = 0; index < colorTotals.length; index += 1) {
    colors[index] = colorTotals[index] / samplesPerCell;
  }

  if (mode === 'edge') {
    values.set(applyEdgeDetection(values, columns, rows, settings));
  } else if (mode === 'dither') {
    const levels = Math.max(2, getCharacterSet(settings).length);
    values.set(applyDither(values, columns, rows, settings, levels));
  }

  const characters = getCharacterSet(settings);
  const textLines = [];
  for (let y = 0; y < rows; y += 1) {
    let line = '';
    for (let x = 0; x < columns; x += 1) {
      const index = y * columns + x;
      let character;
      if (isBraille) {
        let mask = 0;
        const threshold = clamp(Number(settings.brailleThreshold ?? 128), 0, 255);
        for (let subX = 0; subX < 2; subX += 1) {
          for (let subY = 0; subY < 4; subY += 1) {
            const dotIndex = subY * 2 + subX;
            const value = subPixels[index][dotIndex];
            const isFilled = value < threshold;
            if (isFilled) mask |= BRAILLE_BITS[subX][subY];
          }
        }
        character = String.fromCodePoint(0x2800 + mask);
      } else if (isHalfBlock) {
        const threshold = clamp(Number(settings.blockThreshold ?? 128), 0, 255);
        const dots = subPixels[index];
        const topFilled = dots[0] < threshold;
        const bottomFilled = dots[1] < threshold;
        character = topFilled ? (bottomFilled ? '█' : '▀') : (bottomFilled ? '▄' : ' ');
      } else {
        character = characterAt(values[index], characters);
      }
      line += character;
    }
    textLines.push(line);
  }

  return {
    text: textLines.join('\n'),
    columns,
    rows,
    colors,
  };
}

export { RAMPS };
