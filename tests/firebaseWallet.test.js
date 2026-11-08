// tests/firebaseWallet.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getVietnamDateString,
  getYesterdayVietnamDateString,
  formatDailyRewardState,
  DAILY_REWARD_AMOUNTS
} from '../src/services/firebaseWallet.js';

test('1. getVietnamDateString formats YYYY-MM-DD in Vietnam timezone', () => {
  const date = new Date('2026-11-07T18:00:00Z'); // 18:00 UTC = 01:00 AM Nov 8 in VN
  const str = getVietnamDateString(date);
  assert.equal(str, '2026-11-08');
});

test('2. getYesterdayVietnamDateString returns the day before today', () => {
  const today = getVietnamDateString();
  const yesterday = getYesterdayVietnamDateString();
  assert.notEqual(today, yesterday);
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(yesterday, /^\d{4}-\d{2}-\d{2}$/);
});

test('3. formatDailyRewardState for brand new player', () => {
  const state = formatDailyRewardState({
    currentStreak: 0,
    lastClaimedDate: ''
  });

  assert.equal(state.canClaimToday, true);
  assert.equal(state.claimedToday, false);
  assert.equal(state.nextStreakDay, 1);
  assert.equal(state.rewardAmount, 5000);
});

test('4. formatDailyRewardState when already claimed today', () => {
  const today = getVietnamDateString();
  const state = formatDailyRewardState({
    currentStreak: 3,
    lastClaimedDate: today
  });

  assert.equal(state.canClaimToday, false);
  assert.equal(state.claimedToday, true);
  assert.equal(state.currentStreak, 3);
  assert.equal(state.nextStreakDay, 4);
  assert.equal(state.rewardAmount, DAILY_REWARD_AMOUNTS[3]); // 25,000 xu
});

test('5. formatDailyRewardState when claimed yesterday continues streak', () => {
  const yesterday = getYesterdayVietnamDateString();
  const state = formatDailyRewardState({
    currentStreak: 4,
    lastClaimedDate: yesterday
  });

  assert.equal(state.canClaimToday, true);
  assert.equal(state.claimedToday, false);
  assert.equal(state.currentStreak, 4);
  assert.equal(state.nextStreakDay, 5);
  assert.equal(state.rewardAmount, DAILY_REWARD_AMOUNTS[4]); // 40,000 xu
});

test('6. formatDailyRewardState resets streak to day 1 when missing a day', () => {
  const state = formatDailyRewardState({
    currentStreak: 5,
    lastClaimedDate: '2026-01-01'
  });

  assert.equal(state.canClaimToday, true);
  assert.equal(state.claimedToday, false);
  assert.equal(state.currentStreak, 0); // reset
  assert.equal(state.nextStreakDay, 1);
  assert.equal(state.rewardAmount, 5000);
});

test('7. formatDailyRewardState wraps streak after day 7 to day 1', () => {
  const today = getVietnamDateString();
  const state = formatDailyRewardState({
    currentStreak: 7,
    lastClaimedDate: today
  });

  assert.equal(state.canClaimToday, false);
  assert.equal(state.claimedToday, true);
  assert.equal(state.nextStreakDay, 1);
  assert.equal(state.rewardAmount, 5000);
});

