// tests/taixiuIntegration.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { LotteryRoom } from '../cloudflare-worker/src/LotteryRoom.js';
import { PlayerAccountDO } from '../cloudflare-worker/src/PlayerAccountDO.js';

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

  const alarms = [];
  const sockets = [];

  const ctx = {
    storage: {
      sql,
      setAlarm(time) {
        alarms.push(time);
      }
    },
    acceptWebSocket(ws, _tags) {
      sockets.push(ws);
    },
    getWebSockets() {
      return sockets;
    }
  };

  return { ctx, db, alarms, sockets };
}

// Mock PlayerAccountDO Durable Object Namespace
function createMockPlayerAccountEnv() {
  const playerDODatabases = new Map();

  const PLAYER_ACCOUNT = {
    idFromName(googleSub) {
      return { googleSub, toString: () => googleSub };
    },
    get(id) {
      const sub = typeof id === 'object' ? id.googleSub : id;
      if (!playerDODatabases.has(sub)) {
        const { ctx } = createMockDOContext();
        const instance = new PlayerAccountDO(ctx, {});
        playerDODatabases.set(sub, instance);
      }
      const playerDO = playerDODatabases.get(sub);

      return {
        async fetch(url, options = {}) {
          const req = new Request(url, options);
          return playerDO.fetch(req);
        }
      };
    }
  };

  return { PLAYER_ACCOUNT, playerDODatabases };
}

test('1. LotteryRoom tích hợp PlayerAccountDO: Đặt cược trừ ví authoritative', async () => {
  const { PLAYER_ACCOUNT, playerDODatabases } = createMockPlayerAccountEnv();
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, { PLAYER_ACCOUNT });

  const googleSub = 'sub_integration_player_1';
  // Đăng ký tài khoản và nạp 10,000 BET
  const playerStub = PLAYER_ACCOUNT.get(PLAYER_ACCOUNT.idFromName(googleSub));
  await playerStub.fetch('http://internal/login', {
    method: 'POST',
    body: JSON.stringify({
      googleSub,
      email: 'p1@windhub.vn',
      displayName: 'Nguyễn Văn Cược',
      initialPoints: 0
    })
  });
  const playerDO = playerDODatabases.get(googleSub);
  const userAcc = playerDO.getAccountByGoogleSub(googleSub);

  // Cộng 10,000 xu vào ví
  playerDO.credit({
    userId: userAcc.user_id,
    amount: 10000,
    txId: 'tx_init_points_10k'
  });
  assert.equal(playerDO.getBalance(userAcc.user_id), 10000);

  // Đặt cược 3,000 xu cửa TAI
  const betRes = await room.handlePlaceBet(
    userAcc.user_id,
    'Nguyễn Văn Cược',
    room.currentRoundId,
    'TAI',
    3000,
    googleSub
  );

  assert.equal(betRes.success, true);
  assert.equal(betRes.bet.amount, 3000);
  assert.equal(betRes.newBalance, 7000);
  assert.equal(playerDO.getBalance(userAcc.user_id), 7000);

  // Đặt cược quá số dư (8,000 > 7,000) -> Thất bại
  const betFail = await room.handlePlaceBet(
    userAcc.user_id,
    'Nguyễn Văn Cược',
    room.currentRoundId,
    'TAI',
    8000,
    googleSub
  );

  assert.equal(betFail.success, false);
  assert.equal(betFail.code, 'INSUFFICIENT_BALANCE');
  assert.equal(playerDO.getBalance(userAcc.user_id), 7000); // Số dư không đổi
});

test('2. LotteryRoom trả thưởng ván chơi vào PlayerAccountDO (Idempotent Payout)', async () => {
  const { PLAYER_ACCOUNT, playerDODatabases } = createMockPlayerAccountEnv();
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, { PLAYER_ACCOUNT });

  const googleSub = 'sub_winner_player';
  const playerStub = PLAYER_ACCOUNT.get(PLAYER_ACCOUNT.idFromName(googleSub));
  await playerStub.fetch('http://internal/login', {
    method: 'POST',
    body: JSON.stringify({
      googleSub,
      email: 'winner@windhub.vn',
      displayName: 'Người Thắng Cuộc',
      initialPoints: 0
    })
  });
  const playerDO = playerDODatabases.get(googleSub);
  const userAcc = playerDO.getAccountByGoogleSub(googleSub);

  playerDO.credit({
    userId: userAcc.user_id,
    amount: 5000,
    txId: 'tx_init_5k'
  });

  // Cược 2,000 cửa TAI (số dư còn 3,000)
  await room.handlePlaceBet(
    userAcc.user_id,
    'Người Thắng Cuộc',
    room.currentRoundId,
    'TAI',
    2000,
    googleSub
  );
  assert.equal(playerDO.getBalance(userAcc.user_id), 3000);

  // Mock xúc xắc ra [4, 5, 6] = 15 (TAI)
  room.state = 'PLAYING';
  const origCrypto = crypto.getRandomValues;
  crypto.getRandomValues = (buf) => {
    buf[0] = 3; // 4
    buf[1] = 4; // 5
    buf[2] = 5; // 6
    return buf;
  };

  await room.finalizeRound();
  crypto.getRandomValues = origCrypto;

  // Thắng 2,000 * 2 = 4,000 xu -> Số dư mới = 3,000 + 4,000 = 7,000
  assert.equal(playerDO.getBalance(userAcc.user_id), 7000);

  const txs = playerDO.getTransactions(userAcc.user_id);
  const payoutTx = txs.find((t) => t.type === 'PAYOUT');
  assert.ok(payoutTx);
  assert.equal(payoutTx.amount, 4000);
});
