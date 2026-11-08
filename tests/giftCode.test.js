// tests/giftCode.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGiftCode,
  validateGiftCodeEligibility
} from '../src/services/firebaseWallet.js';

test('1. normalizeGiftCode trims whitespace and converts to uppercase', () => {
  assert.equal(normalizeGiftCode('  tanthu2026  '), 'TANTHU2026');
  assert.equal(normalizeGiftCode('lixi_50k'), 'LIXI_50K');
  assert.equal(normalizeGiftCode(''), '');
  assert.equal(normalizeGiftCode(null), '');
  assert.equal(normalizeGiftCode(undefined), '');
});

test('2. validateGiftCodeEligibility: rejects non-existent code', () => {
  const res = validateGiftCodeEligibility(null, 'user_123', 'TANTHU');
  assert.equal(res.valid, false);
  assert.equal(res.code, 'NOT_FOUND');
  assert.match(res.message, /không tồn tại/);
});

test('3. validateGiftCodeEligibility: rejects inactive code', () => {
  const giftData = {
    reward: 50000,
    isActive: false,
    usedBy: []
  };
  const res = validateGiftCodeEligibility(giftData, 'user_123', 'TANTHU');
  assert.equal(res.valid, false);
  assert.equal(res.code, 'INACTIVE');
});

test('4. validateGiftCodeEligibility: rejects expired code', () => {
  const giftData = {
    reward: 50000,
    expiresAt: Date.now() - 10000, // expired 10s ago
    usedBy: []
  };
  const res = validateGiftCodeEligibility(giftData, 'user_123', 'TANTHU');
  assert.equal(res.valid, false);
  assert.equal(res.code, 'EXPIRED');
});

test('5. validateGiftCodeEligibility: allows valid code with future expiration', () => {
  const giftData = {
    reward: 50000,
    expiresAt: Date.now() + 1000000,
    usedBy: []
  };
  const res = validateGiftCodeEligibility(giftData, 'user_123', 'TANTHU');
  assert.equal(res.valid, true);
  assert.equal(res.rewardAmount, 50000);
});

test('6. validateGiftCodeEligibility: enforces mỗi user chỉ được nhập duy nhất 1 lần (usedBy array in giftcode)', () => {
  const giftData = {
    reward: 50000,
    usedBy: ['user_abc', 'user_123']
  };

  // user_123 already used this code -> REJECTED
  const res1 = validateGiftCodeEligibility(giftData, 'user_123', 'TANTHU');
  assert.equal(res1.valid, false);
  assert.equal(res1.code, 'ALREADY_REDEEMED');
  assert.match(res1.message, /Mỗi tài khoản chỉ được nhập 1 lần/);

  // user_999 has NOT used this code -> ACCEPTED
  const res2 = validateGiftCodeEligibility(giftData, 'user_999', 'TANTHU');
  assert.equal(res2.valid, true);
  assert.equal(res2.rewardAmount, 50000);
});

test('7. validateGiftCodeEligibility: enforces mỗi user chỉ được nhập duy nhất 1 lần (player redeemedGiftcodes array)', () => {
  const giftData = {
    reward: 20000,
    usedBy: [] // Not yet recorded here
  };
  const playerRedeemed = ['TANTHU', 'LIXI2026'];

  // Player already redeemed 'TANTHU'
  const res = validateGiftCodeEligibility(giftData, 'user_new', 'TANTHU', playerRedeemed);
  assert.equal(res.valid, false);
  assert.equal(res.code, 'ALREADY_REDEEMED');

  // Player has not redeemed 'NEWCODE'
  const res2 = validateGiftCodeEligibility(giftData, 'user_new', 'NEWCODE', playerRedeemed);
  assert.equal(res2.valid, true);
  assert.equal(res2.rewardAmount, 20000);
});

test('8. validateGiftCodeEligibility: rejects when maxUses limit is reached', () => {
  const giftData = {
    reward: 100000,
    maxUses: 2,
    usedBy: ['u1', 'u2']
  };
  const res = validateGiftCodeEligibility(giftData, 'u3', 'LIMITED_CODE');
  assert.equal(res.valid, false);
  assert.equal(res.code, 'MAX_USES_REACHED');
});

test('9. validateGiftCodeEligibility: parses reward from various field names and string values', () => {
  // admin entered 'amount'
  assert.equal(validateGiftCodeEligibility({ amount: 30000 }, 'u1', 'C1').rewardAmount, 30000);
  // admin entered 'points'
  assert.equal(validateGiftCodeEligibility({ points: 25000 }, 'u1', 'C2').rewardAmount, 25000);
  // admin entered 'coins'
  assert.equal(validateGiftCodeEligibility({ coins: 40000 }, 'u1', 'C3').rewardAmount, 40000);
  // admin entered string '50000'
  assert.equal(validateGiftCodeEligibility({ reward: '50000' }, 'u1', 'C4').rewardAmount, 50000);
});

test('10. validateGiftCodeEligibility: rejects code with missing or 0 reward', () => {
  const res = validateGiftCodeEligibility({ reward: 0 }, 'u1', 'ZERO_REWARD');
  assert.equal(res.valid, false);
  assert.equal(res.code, 'INVALID_REWARD');
});
