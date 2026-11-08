// src/modules/Entertainment/TaiXiu/utils/provablyFair.js

export const SECRET_SALT = 'windhub_taixiu_secret_salt_2026';

// Synchronous Standard SHA-256 (Tương thích 100% với crypto.subtle.digest của Cloudflare Worker)
export function sha256Sync(ascii) {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = sha256Sync.h = sha256Sync.h || [];
  const k = sha256Sync.k = sha256Sync.k || [];
  let primeCounter = k[lengthProperty];
  const isComposite = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  const bytes = [];
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      bytes.push((hash[i] >> (b * 8)) & 255);
    }
  }
  return bytes;

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
}

// PRNG nhanh cho visual simulation
export function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ĐỘNG CƠ TẠO KẾT QUẢ ĐỒNG BỘ CÓ KỊCH BẢN ĐỘT BIẾN (DRAMATIC TWIST ENGINE - PHƯƠNG ÁN B)
 * - Tự động nhận diện chu kỳ và gieo các ván bẻ kèo ngoạn mục
 * - 100% đồng bộ xác định (Deterministic) giữa Client và Server Cloudflare
 */
export function getProvablyFairRound(cycleIndex, roomKey = 'tai-xiu-50s') {
  const hashBytes = sha256Sync(String(cycleIndex) + ':' + SECRET_SALT);
  const isFast = roomKey.includes('15') || roomKey.includes('25') || roomKey.includes('cho-phien');
  const roundId = `TX-${isFast ? '25S' : '50S'}-${cycleIndex}`;

  // Kịch bản 1: Chu kỳ Tam Bảo (Bão) độc đắc x30 (Xuất hiện định kỳ mỗi 28 ván)
  const cycleMod28 = (cycleIndex % 28 + 28) % 28;
  if (cycleMod28 === 7) {
    const face = (hashBytes[0] % 6) + 1;
    return {
      roundId,
      cycleIndex,
      dice: [face, face, face],
      total: face * 3,
      isTriple: true,
      outcome: 'BAO',
      dramaticType: 'TRIPLE_JACKPOT',
      dramaticMessage: '👑 TAM BẢO XUẤT THẾ! Bão nổ giòn giã ăn x30 lần tiền!'
    };
  }

  // Kịch bản 2: Chu kỳ Sát Nút Thót Tim 10 vs 11 Điểm (Xuất hiện định kỳ mỗi 7 ván)
  const cycleMod7 = (cycleIndex % 7 + 7) % 7;
  if (cycleMod7 === 3) {
    const isTai = (hashBytes[0] % 2 === 0);
    const dice = isTai ? [6, 4, 1] : [5, 4, 1]; // 11 điểm (Tài) hoặc 10 điểm (Xỉu)
    const total = dice[0] + dice[1] + dice[2];
    return {
      roundId,
      cycleIndex,
      dice,
      total,
      isTriple: false,
      outcome: total >= 11 ? 'TAI' : 'XIU',
      dramaticType: 'EDGE_TENSION',
      dramaticMessage: total === 11
        ? '⚡ SÁT NÚT THÓT TIM! 11 điểm Tài ngoạn mục!'
        : '⚡ SÁT NÚT THÓT TIM! 10 điểm Xỉu thoát hiểm gang tấc!'
    };
  }

  // Xúc xắc ngẫu nhiên tự nhiên
  const raw = [
    (hashBytes[0] % 6) + 1,
    (hashBytes[1] % 6) + 1,
    (hashBytes[2] % 6) + 1
  ];
  let total = raw[0] + raw[1] + raw[2];
  let isTriple = (raw[0] === raw[1] && raw[1] === raw[2]);
  let outcome = isTriple ? 'BAO' : (total >= 11 ? 'TAI' : 'XIU');

  // Kịch bản 3: Bẻ Cầu Bệt (Nếu 4 ván trước cùng ra 1 cửa, ván này bẻ cầu ngược lại)
  const prevOutcomes = [];
  for (let i = 1; i <= 4; i++) {
    const prevH = sha256Sync(String(cycleIndex - i) + ':' + SECRET_SALT);
    const pt = ((prevH[0] % 6) + 1) + ((prevH[1] % 6) + 1) + ((prevH[2] % 6) + 1);
    prevOutcomes.push(pt >= 11 ? 'TAI' : 'XIU');
  }
  const allSame = prevOutcomes.every((o) => o === prevOutcomes[0]);
  if (allSame && outcome === prevOutcomes[0]) {
    const targetOpposite = prevOutcomes[0] === 'TAI' ? 'XIU' : 'TAI';
    const flippedDice = targetOpposite === 'XIU'
      ? [(hashBytes[1] % 3) + 1, (hashBytes[2] % 3) + 1, (hashBytes[3] % 3) + 1]
      : [(hashBytes[1] % 3) + 4, (hashBytes[2] % 3) + 4, (hashBytes[3] % 3) + 4];
    total = flippedDice[0] + flippedDice[1] + flippedDice[2];
    outcome = targetOpposite;
    isTriple = (flippedDice[0] === flippedDice[1] && flippedDice[1] === flippedDice[2]);
    return {
      roundId,
      cycleIndex,
      dice: flippedDice,
      total,
      isTriple,
      outcome,
      dramaticType: 'STREAK_BREAKER',
      dramaticMessage: outcome === 'TAI'
        ? '🔥 BẺ CẦU NGOẠN MỤC! Cửa Tài chặn đứng chuỗi bệt Xỉu!'
        : '🔥 BẺ CẦU NGOẠN MỤC! Cửa Xỉu chặn đứng chuỗi bệt Tài!'
    };
  }

  return {
    roundId,
    cycleIndex,
    dice: raw,
    total,
    isTriple,
    outcome,
    dramaticType: 'NORMAL',
    dramaticMessage: ''
  };
}

// Tạo danh sách 50 ván soi cầu gần nhất đồng nhất (Chạy tức thì 0.1ms)
export function generateRecentHistory(currentCycleIndex, roomKey = 'tai-xiu-50s', count = 50) {
  const list = [];
  const isFast = roomKey.includes('15') || roomKey.includes('25') || roomKey.includes('cho-phien');
  const roundDurationMs = isFast ? 25000 : 50000;
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const cycle = currentCycleIndex - i;
    if (cycle < 0) break;
    const r = getProvablyFairRound(cycle, roomKey);
    list.push({
      roundId: r.roundId,
      dice: r.dice,
      total: r.total,
      outcome: r.outcome,
      isTriple: r.isTriple,
      dramaticType: r.dramaticType,
      dramaticMessage: r.dramaticMessage,
      drawTime: now - (i * roundDurationMs)
    });
  }
  return list;
}
