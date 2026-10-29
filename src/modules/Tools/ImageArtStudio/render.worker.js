import { renderArt } from './renderArt.js';

self.addEventListener('message', (event) => {
  const { pixels, pixelWidth, pixelHeight, settings, requestId } = event.data;
  try {
    const result = renderArt(new Uint8ClampedArray(pixels), pixelWidth, pixelHeight, settings);
    const colors = result.colors.buffer;
    delete result.colors;
    self.postMessage({ requestId, result, colors }, [colors]);
  } catch (error) {
    self.postMessage({ requestId, error: error.message || 'Không thể chuyển đổi ảnh.' });
  }
});
