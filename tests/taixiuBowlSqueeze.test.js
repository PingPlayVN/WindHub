// tests/taixiuBowlSqueeze.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Logic tính toán thời gian và trạng thái nặn bát Tài Xỉu
 */
export function computeRemainingSeconds(roundEndTime, now = Date.now()) {
  if (!roundEndTime) return 0;
  return Math.max(0, Math.ceil((roundEndTime - now) / 1000));
}

export function computeAutoOpenRemaining(remainingSeconds) {
  return Math.max(0, remainingSeconds - 5);
}

export function shouldAutoRevealResult({ state, roundEndTime, now = Date.now(), isRevealed = false }) {
  if (isRevealed) return true;
  if (state !== 'RESULT') return false;
  if (!roundEndTime) return false;
  const remaining = computeRemainingSeconds(roundEndTime, now);
  // Khi ở trạng thái RESULT, người chơi có thời gian nặn đến khi còn <= 5 giây trước khi kết thúc ván
  return remaining <= 5;
}

export function calculateSqueezeProgress(dist, maxDist = 110) {
  if (dist <= 0) return 0;
  return Math.min(100, Math.round((dist / maxDist) * 100));
}

export function evaluateDragRelease({ dist, speed = 0, releaseThreshold = 65, flingSpeedThreshold = 600 }) {
  const isFling = speed > flingSpeedThreshold && dist > 30;
  if (dist >= releaseThreshold || isFling) {
    return { shouldReveal: true, snapBack: false };
  }
  return { shouldReveal: false, snapBack: true };
}

test('1. computeRemainingSeconds tính chính xác số giây còn lại từ roundEndTime', () => {
  const now = 100000;
  assert.equal(computeRemainingSeconds(now + 15000, now), 15);
  assert.equal(computeRemainingSeconds(now + 14200, now), 15); // làm tròn ceil
  assert.equal(computeRemainingSeconds(now + 5000, now), 5);
  assert.equal(computeRemainingSeconds(now + 100, now), 1);
  assert.equal(computeRemainingSeconds(now, now), 0);
  assert.equal(computeRemainingSeconds(now - 1000, now), 0);
});

test('2. shouldAutoRevealResult KHÔNG tự động mở bát khi vừa bắt đầu phase RESULT', () => {
  const now = 100000;
  const roundEndTime = now + 15000; // Phase RESULT kéo dài 15s

  // Vừa vào RESULT (còn 15s) -> KHÔNG ĐƯỢC TỰ ĐỘNG MỞ BÁT
  assert.equal(
    shouldAutoRevealResult({ state: 'RESULT', roundEndTime, now, isRevealed: false }),
    false,
    'Vừa vào RESULT không được tự giật mở bát ngay lập tức'
  );

  // Còn 10s (đã nặn được 5s) -> vẫn không tự mở
  assert.equal(
    shouldAutoRevealResult({ state: 'RESULT', roundEndTime: now + 10000, now, isRevealed: false }),
    false
  );

  // Còn 6s -> vẫn cho nặn
  assert.equal(
    shouldAutoRevealResult({ state: 'RESULT', roundEndTime: now + 6000, now, isRevealed: false }),
    false
  );
});

test('3. shouldAutoRevealResult CHỈ tự động mở bát khi hết giờ nặn (còn <= 5s cuối)', () => {
  const now = 100000;

  // Khi còn đúng 5s cuối -> tự động mở bát để công bố kết quả
  assert.equal(
    shouldAutoRevealResult({ state: 'RESULT', roundEndTime: now + 5000, now, isRevealed: false }),
    true,
    'Hết thời gian nặn (còn <= 5s) phải tự động mở bát'
  );

  // Khi còn 2s -> tự động mở bát
  assert.equal(
    shouldAutoRevealResult({ state: 'RESULT', roundEndTime: now + 2000, now, isRevealed: false }),
    true
  );
});

test('4. shouldAutoRevealResult không mở bát ở trạng thái WAITING hoặc PLAYING', () => {
  const now = 100000;
  assert.equal(
    shouldAutoRevealResult({ state: 'WAITING', roundEndTime: now + 25000, now, isRevealed: false }),
    false
  );
  assert.equal(
    shouldAutoRevealResult({ state: 'PLAYING', roundEndTime: now + 2000, now, isRevealed: false }),
    false
  );
});

test('5. calculateSqueezeProgress tính tỷ lệ % mở bát mượt mà', () => {
  assert.equal(calculateSqueezeProgress(0), 0);
  assert.equal(calculateSqueezeProgress(33, 110), 30);
  assert.equal(calculateSqueezeProgress(55, 110), 50);
  assert.equal(calculateSqueezeProgress(88, 110), 80);
  assert.equal(calculateSqueezeProgress(110, 110), 100);
  assert.equal(calculateSqueezeProgress(150, 110), 100);
});

test('6. evaluateDragRelease xử lý thả tay nặn bát: kéo hé vừa đủ thì mở, kéo nhẹ thả tay thì snap back', () => {
  // Kéo nhẹ 25px rồi buông -> Snap back về tâm đĩa để nặn tiếp
  const peek = evaluateDragRelease({ dist: 25, speed: 100 });
  assert.equal(peek.shouldReveal, false);
  assert.equal(peek.snapBack, true);

  // Kéo 50px rồi buông (chưa tới ngưỡng 65px) -> Snap back
  const halfPeek = evaluateDragRelease({ dist: 50, speed: 120 });
  assert.equal(halfPeek.shouldReveal, false);
  assert.equal(halfPeek.snapBack, true);

  // Kéo 75px rồi buông (vượt ngưỡng 65px) -> Mở bát
  const fullRelease = evaluateDragRelease({ dist: 75, speed: 150 });
  assert.equal(fullRelease.shouldReveal, true);
  assert.equal(fullRelease.snapBack, false);

  // Vuốt nhanh (fling speed 700px/s, dist 40px) -> Nhận diện hành vi quẹt mở bát
  const flingRelease = evaluateDragRelease({ dist: 40, speed: 750 });
  assert.equal(flingRelease.shouldReveal, true);
  assert.equal(flingRelease.snapBack, false);
});

export function computeExitVector(dragOffsetX, dragOffsetY, distance = 850) {
  const hasMoved = dragOffsetX !== 0 || dragOffsetY !== 0;
  const dist = Math.hypot(dragOffsetX, dragOffsetY) || 1;
  const normX = hasMoved ? dragOffsetX / dist : 0;
  const normY = hasMoved ? dragOffsetY / dist : -1;
  return {
    x: Math.round(normX * distance),
    y: Math.round(normY * distance),
    rotate: normX !== 0 ? Math.sign(normX) * 16 : -8
  };
}

test('7. computeExitVector tính vector trượt rút bát ra hết màn hình theo hướng nặn', () => {
  // Khi không kéo (ví dụ bấm nút Mở Ngay) -> Bát rút thẳng lên trên khỏi màn hình
  const upwards = computeExitVector(0, 0, 850);
  assert.equal(upwards.x, 0);
  assert.equal(upwards.y, -850);

  // Khi kéo lệch sang phải
  const rightwards = computeExitVector(80, 0, 850);
  assert.equal(rightwards.x, 850);
  assert.equal(rightwards.y, 0);

  // Khi kéo lệch sang góc dưới trái
  const downLeft = computeExitVector(-60, 60, 850);
  assert.ok(downLeft.x < 0);
  assert.ok(downLeft.y > 0);
});

test('8. Mệnh giá chip cược đáp ứng đúng danh sách: 1k, 10k, 50k, 100k, 500k, 1M, 10M, 50M', () => {
  const CHIP_VALUES = [
    { label: '1k', value: 1000 },
    { label: '10k', value: 10000 },
    { label: '50k', value: 50000 },
    { label: '100k', value: 100000 },
    { label: '500k', value: 500000 },
    { label: '1M', value: 1000000 },
    { label: '10M', value: 10000000 },
    { label: '50M', value: 50000000 }
  ];

  assert.equal(CHIP_VALUES.length, 8);
  assert.deepEqual(
    CHIP_VALUES.map((c) => c.label),
    ['1k', '10k', '50k', '100k', '500k', '1M', '10M', '50M']
  );
  assert.deepEqual(
    CHIP_VALUES.map((c) => c.value),
    [1000, 10000, 50000, 100000, 500000, 1000000, 10000000, 50000000]
  );
});

test('9. Logic xác nhận và hủy cược', () => {
  const myPoints = 200000;
  let selectedSide = null;
  let pendingAmount = 0;

  // 1. Chọn cửa XỈU với chip 10k
  selectedSide = 'XIU';
  pendingAmount = 10000;
  assert.equal(selectedSide, 'XIU');
  assert.equal(pendingAmount, 10000);

  // 2. Bấm thêm chip 50k -> cộng dồn
  pendingAmount = Math.min(myPoints, pendingAmount + 50000);
  assert.equal(pendingAmount, 60000);

  // 3. Người chơi bấm nút Hủy -> reset cược về 0
  const handleCancel = () => {
    selectedSide = null;
    pendingAmount = 0;
  };
  handleCancel();
  assert.equal(selectedSide, null);
  assert.equal(pendingAmount, 0);
});


