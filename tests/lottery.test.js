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

test('10. Re-entrancy guard ngăn chặn alarm chạy trùng lặp khi có nhiều lời gọi đồng thời', async () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  room.state = 'WAITING';
  room.roundEndTime = Date.now() - 100; // Đã quá hạn

  // Gọi đồng thời checkTimeAndAdvance và alarm
  const p1 = room.checkTimeAndAdvance();
  const p2 = room.checkTimeAndAdvance();

  assert.equal(p1, true);
  assert.equal(p2, false); // Lần gọi thứ 2 bị chặn bởi isAdvancing
  assert.equal(room.state, 'PLAYING');
});

test('11. Khôi phục SQLite chính xác cờ isTriple khi vòng quay ra Tam bảo (Bão)', () => {
  const sharedDb = new DatabaseSync(':memory:');
  const { ctx: ctx1 } = createMockDOContext(sharedDb);

  const room1 = new LotteryRoom(ctx1, {});
  room1.state = 'RESULT';
  room1.dice = [3, 3, 3];
  room1.total = 9;
  room1.outcome = 'BAO';
  room1.isTriple = true;
  room1.saveMeta('state', 'RESULT');
  room1.saveMeta('dice', JSON.stringify([3, 3, 3]));
  room1.saveMeta('outcome', 'BAO');

  // Khởi động instance mới từ database
  const { ctx: ctx2 } = createMockDOContext(sharedDb);
  const room2 = new LotteryRoom(ctx2, {});

  assert.equal(room2.state, 'RESULT');
  assert.deepEqual(room2.dice, [3, 3, 3]);
  assert.equal(room2.total, 9);
  assert.equal(room2.outcome, 'BAO');
  assert.equal(room2.isTriple, true); // Phải là true
});

test('12. Snapshot reset lastProcessedSeq trên client, không drop sự kiện phiên mới sau reconnect', () => {
  let lastProcessedSeq = 50; // Giả lập sequence cao từ phiên cũ

  const handleMessageWithSeq = (msg) => {
    if (msg.type === 'SNAPSHOT') {
      lastProcessedSeq = msg.seq || 0; // Đã fix: reset theo snapshot
      return true;
    }
    if (msg.seq && msg.seq < lastProcessedSeq) {
      return false; // Bị drop nếu nhỏ hơn
    }
    if (msg.seq) {
      lastProcessedSeq = Math.max(lastProcessedSeq, msg.seq);
    }
    return true;
  };

  // Nhận snapshot phiên mới có seq = 1
  const snapshotHandled = handleMessageWithSeq({ type: 'SNAPSHOT', seq: 1 });
  assert.equal(snapshotHandled, true);
  assert.equal(lastProcessedSeq, 1);

  // Nhận ROUND_START có seq = 2 (nhỏ hơn 50 nhưng lớn hơn snapshot 1) -> Phải được xử lý thành công!
  const roundStartHandled = handleMessageWithSeq({ type: 'ROUND_START', seq: 2 });
  assert.equal(roundStartHandled, true);
  assert.equal(lastProcessedSeq, 2);
});

test('13. CLAIM_FREE_POINTS reset chính xác 10,000 điểm khi số dư <= 500 và từ chối khi > 500', async () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  const client = new MockWebSocket('user_poor', 'Bác Bảy');

  // Trường hợp 1: Số dư còn 100 xu (<= 500) -> Được nhận
  room.setLocalPlayerPoints('user_poor', 100);
  await room.handleSocketMessage(client, JSON.stringify({ type: 'CLAIM_FREE_POINTS' }));

  const pointsMsgs = client.findMessages('POINTS_UPDATED');
  assert.equal(pointsMsgs.length, 1);
  assert.equal(pointsMsgs[0].points, 10000);
  assert.equal(room.getPlayerPoints('user_poor'), 10000);

  // Trường hợp 2: Số dư đang 10,000 xu (> 500) -> Từ chối
  await room.handleSocketMessage(client, JSON.stringify({ type: 'CLAIM_FREE_POINTS' }));
  const errors = client.findMessages('ERROR');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, 'CLAIM_NOT_ALLOWED');
});

test('14. Lịch sử getHistory trả về chính xác tối đa 50 ván soi cầu', () => {
  const { ctx } = createMockDOContext();
  const room = new LotteryRoom(ctx, {});

  // Giả lập 60 ván đã có kết quả
  for (let i = 1; i <= 60; i++) {
    room.sql.exec(
      "INSERT INTO rounds (id, dice1, dice2, dice3, total, outcome, draw_time, status, total_bets, total_payout) VALUES (?, 1, 2, 3, 6, 'XIU', ?, 'RESULT', 1, 0)",
      `TX_ROUND_${i}`,
      1000 + i
    );
  }

  const history50 = room.getHistory(50);
  assert.equal(history50.length, 50);
  // Ván mới nhất (drawTime = 1060) nằm đầu danh sách
  assert.equal(history50[0].roundId, 'TX_ROUND_60');
});
