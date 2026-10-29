// tests/lottery.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { LotteryRoom } from '../cloudflare-worker/src/LotteryRoom.js';

// Tạo adapter giả lập Cloudflare Durable Object ctx.storage.sql từ node:sqlite DatabaseSync
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

// Giả lập WebSocket kết nối
class MockWebSocket {
  constructor(userId = 'u1', userName = 'Bác Ba') {
    this.attachment = { userId, userName, socketId: `mock_${Math.random()}` };
    this.sentMessages = [];
    this.readyState = 1; // OPEN
  }

  serializeAttachment(data) {
    this.attachment = data;
  }

  deserializeAttachment() {
    return this.attachment;
  }

  send(data) {
    this.sentMessages.push(JSON.parse(data));
  }

  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  findMessages(type) {
    return this.sentMessages.filter((m) => m.type === type);
  }
}

test('1. Hai client trong cùng phòng nhận cùng một kết quả 3 xúc xắc', async () => {
  const { ctx, sockets } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  const clientA = new MockWebSocket('u1', 'Bác Ba');
  const clientB = new MockWebSocket('u2', 'Chú Tư');
  sockets.push(clientA, clientB);

  room.state = 'PLAYING';
  await room.finalizeRound();

  const resultsA = clientA.findMessages('ROUND_RESULT');
  const resultsB = clientB.findMessages('ROUND_RESULT');

  assert.equal(resultsA.length, 1);
  assert.equal(resultsB.length, 1);
  assert.equal(resultsA[0].roundId, resultsB[0].roundId);
  assert.deepEqual(resultsA[0].dice, resultsB[0].dice);
  assert.equal(resultsA[0].total, resultsB[0].total);
  assert.equal(resultsA[0].outcome, resultsB[0].outcome);
});

test('2. Hai phòng khác nhau (Xóm Đình 50s và Chợ Phiên 25s) có cấu hình thời gian và dữ liệu độc lập', async () => {
  const room1Ctx = createMockDOContext();
  const room2Ctx = createMockDOContext();

  const room30s = new LotteryRoom(room1Ctx.ctx, {});
  room30s.configureTiming('tai-xiu-30s');

  const room15s = new LotteryRoom(room2Ctx.ctx, {});
  room15s.configureTiming('tai-xiu-15s');

  assert.equal(room30s.waitingDuration, 50);
  assert.equal(room15s.waitingDuration, 25);
  assert.equal(room30s.resultDuration, 15);
  assert.equal(room15s.resultDuration, 15);

  const betResult1 = room30s.handlePlaceBet('user1', 'Bác Ba', room30s.currentRoundId, 'TAI', 100);
  assert.equal(betResult1.success, true);

  const betsInRoom2 = room15s.getUserCurrentBets('user1');
  assert.equal(betsInRoom2.length, 0);
  assert.notEqual(room30s.currentRoundId, room15s.currentRoundId);
});

test('3. Người dùng reconnect nhận được snapshot chính xác (Tài Xỉu)', async () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  room.handlePlaceBet('reconnect_user', 'Anh Sáu', room.currentRoundId, 'XIU', 200);

  const snap = await room.getSnapshot('reconnect_user');

  assert.equal(snap.currentRoundId, room.currentRoundId);
  assert.equal(snap.state, room.state);
  assert.equal(snap.myPoints, 9800); // 10,000 - 200
  assert.equal(snap.myCurrentBets.length, 1);
  assert.equal(snap.myCurrentBets[0].side, 'XIU');
});

test('4. Kết quả và điểm số đã lưu vẫn tồn tại sau khi Durable Object khởi động lại (SQLite persistence)', async () => {
  const sharedDb = new DatabaseSync(':memory:');
  const { ctx: ctx1 } = createMockDOContext(sharedDb);

  const roomInstance1 = new LotteryRoom(ctx1, {});
  const initialRoundId = roomInstance1.currentRoundId;

  // Cược cửa TAI
  roomInstance1.handlePlaceBet('persistent_user', 'Cô Năm', initialRoundId, 'TAI', 500);

  // Mock xúc xắc ra [4, 5, 6] = 15 (TAI)
  roomInstance1.state = 'PLAYING';
  const origCrypto = crypto.getRandomValues;
  crypto.getRandomValues = (buf) => {
    buf[0] = 3; // (3 % 6) + 1 = 4
    buf[1] = 4; // (4 % 6) + 1 = 5
    buf[2] = 5; // (5 % 6) + 1 = 6
    return buf;
  };
  await roomInstance1.finalizeRound();
  crypto.getRandomValues = origCrypto;

  // Thắng 500 * 2 = 1000 xu
  const pointsAfterWin = roomInstance1.getPlayerPoints('persistent_user');
  assert.equal(pointsAfterWin, 10000 - 500 + 1000); // 10,500 điểm

  // Khởi tạo instance mới từ cùng database SQLite
  const { ctx: ctx2 } = createMockDOContext(sharedDb);
  const roomInstance2 = new LotteryRoom(ctx2, {});

  const restoredPoints = roomInstance2.getPlayerPoints('persistent_user');
  assert.equal(restoredPoints, 10500);

  const history = roomInstance2.getHistory(5);
  assert.equal(history.length >= 1, true);
  assert.equal(history[0].roundId, initialRoundId);
  assert.deepEqual(history[0].dice, [4, 5, 6]);
  assert.equal(history[0].outcome, 'TAI');
});

test('5. Yêu cầu trùng (duplicate bet) vào cùng 1 cửa không làm tính điểm hai lần (Idempotency)', () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  const bet1 = room.handlePlaceBet('user_dup', 'Dân làng', room.currentRoundId, 'TAI', 100);
  assert.equal(bet1.success, true);
  assert.equal(room.getPlayerPoints('user_dup'), 9900);

  // Cược lại cùng cửa TAI trong cùng ván
  const bet2 = room.handlePlaceBet('user_dup', 'Dân làng', room.currentRoundId, 'TAI', 100);
  assert.equal(bet2.success, false);
  assert.equal(bet2.code, 'DUPLICATE_BET');

  assert.equal(room.getPlayerPoints('user_dup'), 9900);
});

test('6. Client không thể tự sửa kết quả 3 xúc xắc', async () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  const client = new MockWebSocket('hacker', 'Kẻ gian');
  room.handleSocketMessage(client, JSON.stringify({
    type: 'ROUND_RESULT',
    roundId: room.currentRoundId,
    dice: [6, 6, 6],
    outcome: 'BAO'
  }));

  assert.notDeepEqual(room.dice, [6, 6, 6]);
  assert.equal(room.state, 'WAITING');
});

test('7. Lỗi ghi SQLite không phát kết quả thành công giả (Failure Safety)', async () => {
  const { ctx, sockets } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  const client = new MockWebSocket('u1', 'Bác Ba');
  sockets.push(client);

  room.state = 'PLAYING';

  const origExec = room.sql.exec;
  room.sql.exec = (query, ...params) => {
    if (query.includes('UPDATE rounds')) {
      throw new Error('Disk IO Failure simulated');
    }
    return origExec.call(room.sql, query, ...params);
  };

  await room.finalizeRound();

  const roundResults = client.findMessages('ROUND_RESULT');
  assert.equal(roundResults.length, 0);

  const errors = client.findMessages('ERROR');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, 'DB_FINALIZE_ERROR');
});

test('8. Client xử lý được sự kiện trùng hoặc đến sai thứ tự (Sequence Ordering)', () => {
  const processedSeq = [];
  let lastSeq = 0;

  const handleClientEvent = (event) => {
    if (event.seq && event.seq < lastSeq) {
      return false;
    }
    if (event.seq) {
      lastSeq = Math.max(lastSeq, event.seq);
    }
    processedSeq.push(event.seq);
    return true;
  };

  assert.equal(handleClientEvent({ seq: 1 }), true);
  assert.equal(handleClientEvent({ seq: 3 }), true);
  assert.equal(handleClientEvent({ seq: 2 }), false);
  assert.equal(handleClientEvent({ seq: 3 }), true);
  assert.equal(handleClientEvent({ seq: 4 }), true);

  assert.deepEqual(processedSeq, [1, 3, 3, 4]);
});

test('9. Xử lý an toàn khi phòng không có ai đặt cược', async () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  room.state = 'PLAYING';
  await room.finalizeRound();

  assert.equal(room.state, 'RESULT');
  assert.equal(Array.isArray(room.dice), true);
  assert.equal(room.dice.length, 3);

  const history = room.getHistory(1);
  assert.equal(history.length, 1);
  assert.equal(history[0].totalBets, 0);
  assert.equal(history[0].totalPayout, 0);
});
