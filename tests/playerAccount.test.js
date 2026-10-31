// tests/playerAccount.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  PlayerAccountDO,
  DAILY_REWARD_AMOUNTS,
  getVietnamDateString,
  calculateDayDifference
} from '../cloudflare-worker/src/PlayerAccountDO.js';

// Tạo adapter giả lập Cloudflare Durable Object storage.sql từ node:sqlite DatabaseSync
function createMockDOContext(db = new DatabaseSync(':memory:')) {
  const sql = {
    exec(query, ...params) {
      const trimmed = query.trim().toUpperCase();
      if (params.length === 0 && (trimmed.startsWith('CREATE') || query.includes(';'))) {
        db.exec(query);
        return [];
      }
      const stmt = db.prepare(query);
      if (trimmed.startsWith('SELECT')) {
        return stmt.all(...params);
      } else {
        stmt.run(...params);
        return [];
      }
    }
  };

  const state = {
    storage: { sql }
  };

  return { state, db };
}

test('1. Tạo tài khoản Google mới và cập nhật profile khi đăng nhập lại', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});

  const loginRes = playerDO.loginOrRegister({
    googleSub: 'google_sub_123456789',
    email: 'player1@gmail.com',
    displayName: 'Nguyễn Văn A',
    avatarUrl: 'https://lh3.googleusercontent.com/a/avatar1',
    initialPoints: 0
  });

  assert.equal(loginRes.user.googleSub, 'google_sub_123456789');
  assert.equal(loginRes.user.email, 'player1@gmail.com');
  assert.equal(loginRes.user.displayName, 'Nguyễn Văn A');
  assert.equal(loginRes.balance, 0);
  assert.equal(loginRes.dailyReward.canClaimToday, true);

  // Đăng nhập lại với tên mới
  const reloginRes = playerDO.loginOrRegister({
    googleSub: 'google_sub_123456789',
    email: 'player1@gmail.com',
    displayName: 'Nguyễn Văn A (Cập nhật)',
    avatarUrl: 'https://lh3.googleusercontent.com/a/avatar2'
  });

  assert.equal(reloginRes.user.userId, loginRes.user.userId);
  assert.equal(reloginRes.user.displayName, 'Nguyễn Văn A (Cập nhật)');
});

test('2. Atomic credit và debit với kiểm tra số dư không âm', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_wallet_test',
    email: 'test@gmail.com',
    initialPoints: 0
  });

  // Số dư ban đầu = 0
  assert.equal(playerDO.getBalance(user.userId), 0);

  // Cố gắng trừ tiền khi số dư = 0 -> Thất bại
  const debitFail = playerDO.debit({
    userId: user.userId,
    amount: 1000,
    txId: 'tx_fail_01',
    description: 'Cược thất bại do thiếu tiền'
  });
  assert.equal(debitFail.success, false);
  assert.equal(debitFail.code, 'INSUFFICIENT_BALANCE');
  assert.equal(playerDO.getBalance(user.userId), 0);

  // Nạp 5,000 xu
  const creditRes = playerDO.credit({
    userId: user.userId,
    amount: 5000,
    txId: 'tx_credit_01',
    type: 'PAYOUT',
    description: 'Thắng cược'
  });
  assert.equal(creditRes.success, true);
  assert.equal(creditRes.balance, 5000);
  assert.equal(playerDO.getBalance(user.userId), 5000);

  // Trừ 2,000 xu
  const debitRes = playerDO.debit({
    userId: user.userId,
    amount: 2000,
    txId: 'tx_debit_01',
    description: 'Đặt cược Tài'
  });
  assert.equal(debitRes.success, true);
  assert.equal(debitRes.balance, 3000);
  assert.equal(playerDO.getBalance(user.userId), 3000);
});

test('3. Idempotent processing: Trùng transaction ID không áp dụng biến động số dư lần 2', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_idempotent_test',
    email: 'idempotent@gmail.com',
    initialPoints: 0
  });

  playerDO.credit({
    userId: user.userId,
    amount: 10000,
    txId: 'tx_init_10k'
  });
  assert.equal(playerDO.getBalance(user.userId), 10000);

  // Gửi lệnh trừ 3,000 lần 1
  const debit1 = playerDO.debit({
    userId: user.userId,
    amount: 3000,
    txId: 'tx_unique_bet_001',
    description: 'Cược ván 101'
  });
  assert.equal(debit1.success, true);
  assert.equal(debit1.balance, 7000);

  // Gửi lại lệnh trừ 3,000 với CÙNG txId lần 2 (retry mạng)
  const debit2 = playerDO.debit({
    userId: user.userId,
    amount: 3000,
    txId: 'tx_unique_bet_001',
    description: 'Cược ván 101 retry'
  });
  assert.equal(debit2.success, true);
  assert.equal(debit2.idempotent, true);
  assert.equal(debit2.balance, 7000); // Số dư KHÔNG bị trừ thêm lần nữa!
  assert.equal(playerDO.getBalance(user.userId), 7000);

  // Tương tự với credit payout
  const credit1 = playerDO.credit({
    userId: user.userId,
    amount: 6000,
    txId: 'tx_payout_round_101',
    description: 'Thưởng ván 101'
  });
  assert.equal(credit1.success, true);
  assert.equal(credit1.balance, 13000);

  const credit2 = playerDO.credit({
    userId: user.userId,
    amount: 6000,
    txId: 'tx_payout_round_101',
    description: 'Thưởng ván 101 retry'
  });
  assert.equal(credit2.success, true);
  assert.equal(credit2.idempotent, true);
  assert.equal(credit2.balance, 13000); // Số dư giữ nguyên!
  assert.equal(playerDO.getBalance(user.userId), 13000);
});

test('4. Chu kỳ điểm danh 7 ngày chuẩn xác (Day 1: 5k đến Day 7: 100k xu)', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_streak_test',
    email: 'streak@gmail.com',
    initialPoints: 0
  });

  const dates = [
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05',
    '2026-10-06',
    '2026-10-07'
  ];

  let expectedBalance = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = dates[i];
    const expectedDay = i + 1;
    const expectedAmount = DAILY_REWARD_AMOUNTS[i];
    expectedBalance += expectedAmount;

    // Kiểm tra trạng thái trước khi claim
    const statusBefore = playerDO.getDailyRewardStatus(user.userId, dayDate);
    assert.equal(statusBefore.canClaimToday, true);
    assert.equal(statusBefore.nextStreakDay, expectedDay);
    assert.equal(statusBefore.nextRewardAmount, expectedAmount);

    // Thực hiện claim
    const claimRes = playerDO.claimDailyReward(user.userId, dayDate);
    assert.equal(claimRes.success, true);
    assert.equal(claimRes.streakDay, expectedDay);
    assert.equal(claimRes.amount, expectedAmount);
    assert.equal(claimRes.newBalance, expectedBalance);

    // Kiểm tra trạng thái sau khi claim
    const statusAfter = playerDO.getDailyRewardStatus(user.userId, dayDate);
    assert.equal(statusAfter.claimedToday, true);
    assert.equal(statusAfter.canClaimToday, false);
    assert.equal(statusAfter.currentStreak, expectedDay);
  }

  // Vào ngày thứ 8 (2026-10-08), streak xoay vòng về Ngày 1 (5,000 xu)
  const day8Date = '2026-10-08';
  const statusDay8 = playerDO.getDailyRewardStatus(user.userId, day8Date);
  assert.equal(statusDay8.canClaimToday, true);
  assert.equal(statusDay8.nextStreakDay, 1);
  assert.equal(statusDay8.nextRewardAmount, 5000);

  const claimDay8 = playerDO.claimDailyReward(user.userId, day8Date);
  assert.equal(claimDay8.success, true);
  assert.equal(claimDay8.streakDay, 1);
  assert.equal(claimDay8.amount, 5000);
  assert.equal(claimDay8.newBalance, expectedBalance + 5000);
});

test('5. Chặn điểm danh 2 lần trong cùng 1 ngày (Server-enforced Unique Constraint)', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_duplicate_claim',
    email: 'dup@gmail.com',
    initialPoints: 0
  });

  const claim1 = playerDO.claimDailyReward(user.userId, '2026-10-31');
  assert.equal(claim1.success, true);
  assert.equal(claim1.amount, 5000);

  // Lần claim thứ 2 trong cùng ngày phải bị từ chối
  const claim2 = playerDO.claimDailyReward(user.userId, '2026-10-31');
  assert.equal(claim2.success, false);
  assert.equal(claim2.code, 'ALREADY_CLAIMED');
  assert.equal(playerDO.getBalance(user.userId), 5000); // Balance không tăng thêm
});

test('6. Bỏ lỡ một ngày sẽ reset chu kỳ điểm danh về Ngày 1 (5,000 xu)', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_reset_streak',
    email: 'reset@gmail.com',
    initialPoints: 0
  });

  // Điểm danh ngày 1: 2026-10-01 (5,000 xu)
  playerDO.claimDailyReward(user.userId, '2026-10-01');
  // Điểm danh ngày 2: 2026-10-02 (10,000 xu)
  playerDO.claimDailyReward(user.userId, '2026-10-02');
  // Điểm danh ngày 3: 2026-10-03 (15,000 xu)
  const day3 = playerDO.claimDailyReward(user.userId, '2026-10-03');
  assert.equal(day3.streakDay, 3);
  assert.equal(day3.amount, 15000);

  // BỎ LỠ ngày 2026-10-04! Quay lại vào ngày 2026-10-05
  const statusMissed = playerDO.getDailyRewardStatus(user.userId, '2026-10-05');
  assert.equal(statusMissed.canClaimToday, true);
  assert.equal(statusMissed.nextStreakDay, 1); // Đã reset về ngày 1!
  assert.equal(statusMissed.nextRewardAmount, 5000);

  const claimAfterMissed = playerDO.claimDailyReward(user.userId, '2026-10-05');
  assert.equal(claimAfterMissed.success, true);
  assert.equal(claimAfterMissed.streakDay, 1);
  assert.equal(claimAfterMissed.amount, 5000);
});

test('7. Tính toán ngày múi giờ Asia/Ho_Chi_Minh chuẩn xác', () => {
  // Test ngày với thời gian cố định
  const sampleUtcDate = new Date('2026-10-30T18:30:00Z'); // 18:30 UTC = 01:30 sáng 31/10 tại VN (UTC+7)
  const vnDateStr = getVietnamDateString(sampleUtcDate);
  assert.equal(vnDateStr, '2026-10-31');

  // Test khoảng cách ngày
  assert.equal(calculateDayDifference('2026-10-30', '2026-10-31'), 1);
  assert.equal(calculateDayDifference('2026-10-31', '2026-10-31'), 0);
  assert.equal(calculateDayDifference('2026-10-25', '2026-10-31'), 6);
});

test('8. Ghi nhận sổ cái giao dịch (Transactions Ledger) và Thống kê người chơi', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_ledger_test',
    email: 'ledger@gmail.com',
    initialPoints: 0
  });

  // Điểm danh
  playerDO.claimDailyReward(user.userId, '2026-10-30'); // +5,000
  // Cược 2,000
  playerDO.debit({
    userId: user.userId,
    amount: 2000,
    txId: 'tx_bet_01',
    referenceId: 'round_01',
    description: 'Cược Tài ván 1'
  });
  // Thắng 4,000
  playerDO.credit({
    userId: user.userId,
    amount: 4000,
    txId: 'tx_payout_01',
    referenceId: 'round_01',
    description: 'Thưởng Tài ván 1'
  });

  const txs = playerDO.getTransactions(user.userId);
  assert.equal(txs.length, 3);
  assert.equal(txs[0].id, 'tx_payout_01');
  assert.equal(txs[0].amount, 4000);
  assert.equal(txs[1].id, 'tx_bet_01');
  assert.equal(txs[1].amount, -2000);
  assert.equal(txs[2].type, 'DAILY_REWARD');

  const stats = playerDO.getPlayerStats(user.userId);
  assert.equal(stats.totalBets, 1);
  assert.equal(stats.winCount, 1);
  assert.equal(stats.totalBetAmount, 2000);
  assert.equal(stats.totalWon, 4000);

  const profile = playerDO.getProfile(user.userId);
  assert.equal(profile.balance, 7000); // 5000 - 2000 + 4000 = 7000
  assert.equal(profile.user.email, 'ledger@gmail.com');
});

test('9. Ghi nhận đăng xuất recordLogout cập nhật last_logout_at phục vụ Session Revocation', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user } = playerDO.loginOrRegister({
    googleSub: 'sub_logout_test',
    email: 'logout@gmail.com'
  });

  const beforeLogout = playerDO.getProfile(user.userId);
  assert.equal(beforeLogout.user.lastLogoutAt, 0);

  const logoutRes = playerDO.recordLogout(user.userId);
  assert.equal(logoutRes.ok, true);
  assert.ok(logoutRes.logoutAt > 0);

  const afterLogout = playerDO.getProfile(user.userId);
  assert.equal(afterLogout.user.lastLogoutAt, logoutRes.logoutAt);
});

test('10. Tặng ngay 10,000 xu tân thủ khởi nghiệp khi tạo tài khoản mới', () => {
  const { state } = createMockDOContext();
  const playerDO = new PlayerAccountDO(state, {});
  const { user, balance } = playerDO.loginOrRegister({
    googleSub: 'sub_newbie_bonus',
    email: 'newbie@gmail.com'
  });

  assert.equal(balance, 10000);
  assert.equal(playerDO.getBalance(user.userId), 10000);

  const txs = playerDO.getTransactions(user.userId);
  assert.equal(txs.length, 1);
  assert.equal(txs[0].type, 'MIGRATION');
  assert.equal(txs[0].amount, 10000);
  assert.equal(txs[0].description, 'Tặng vốn khởi nghiệp tân thủ');
});
