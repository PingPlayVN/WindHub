// cloudflare-worker/src/LotteryRoom.js
/**
 * LotteryRoom - Durable Object quản lý phòng "Tài Xỉu Dân Gian" (3 Xúc Xắc)
 * Sử dụng Cloudflare Durable Objects + SQLite (ctx.storage.sql)
 * Hỗ trợ 2 phòng: 30s (Xóm Đình Truyền Thống) và 15s (Chợ Phiên Siêu Tốc)
 * Tích hợp tính năng Nặn Bát / Mở Đĩa, WebSocket Hibernation API tối ưu chi phí.
 */

const DEFAULT_INITIAL_POINTS = 10000;

export class LotteryRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.roomId = 'tai-xiu-30s';

    // Cấu hình thời gian theo phòng
    this.waitingDuration = 50; // Xóm Đình 50s
    this.shakingDuration = 2;  // 2s lắc bát
    this.resultDuration = 15;  // 15s nặn bát & công bố kết quả
    this.alarmTimer = null;

    // Khởi tạo SQLite Storage
    this.sql = ctx.storage ? ctx.storage.sql : null;
    this.initDatabase();

    // Trạng thái trong bộ nhớ
    this.state = 'WAITING'; // 'WAITING' | 'PLAYING' | 'RESULT' | 'CLOSED'
    this.currentRoundId = null;
    this.roundEndTime = 0;
    this.dice = [1, 2, 3];
    this.total = 6;
    this.outcome = 'XIU'; // 'TAI' | 'XIU' | 'BAO'
    this.isTriple = false;
    this.participants = new Map(); // socketId -> { userId, userName }
    this.lastSeq = 0;
    this.isAdvancing = false;

    this.loadCurrentState();
  }

  // Khởi tạo schema SQLite
  initDatabase() {
    if (!this.sql) return;
    try {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS rounds (
          id TEXT PRIMARY KEY,
          dice1 INTEGER,
          dice2 INTEGER,
          dice3 INTEGER,
          total INTEGER,
          outcome TEXT,
          draw_time INTEGER,
          status TEXT,
          total_bets INTEGER DEFAULT 0,
          total_payout INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS bets (
          id TEXT PRIMARY KEY,
          round_id TEXT,
          user_id TEXT,
          user_name TEXT,
          bet_side TEXT,
          amount INTEGER,
          payout INTEGER DEFAULT 0,
          created_at INTEGER
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_round_user_side 
        ON bets(round_id, user_id, bet_side);

        CREATE TABLE IF NOT EXISTS player_points (
          user_id TEXT PRIMARY KEY,
          points INTEGER,
          updated_at INTEGER
        );
      `);
    } catch (err) {
      console.error('[LotteryRoom] initDatabase error:', err);
    }
  }

  // Xác định thời lượng theo roomId
  configureTiming(roomId) {
    this.roomId = roomId || this.roomId;
    if (this.roomId.includes('15') || this.roomId.includes('25') || this.roomId.includes('cho-phien')) {
      this.waitingDuration = 25; // Chợ Phiên: 25s đặt cược
      this.shakingDuration = 2;  // 2s lắc bát
      this.resultDuration = 15;  // 15s nặn đĩa & xem kết quả
    } else {
      this.waitingDuration = 50; // Xóm Đình: 50s đặt cược
      this.shakingDuration = 2;  // 2s lắc bát
      this.resultDuration = 15;  // 15s nặn đĩa & xem kết quả
    }
  }

  loadCurrentState() {
    if (!this.sql) {
      this.startNewRound();
      return;
    }

    try {
      const metaCursor = this.sql.exec("SELECT key, value FROM room_meta WHERE key IN ('currentRoundId', 'state', 'roundEndTime', 'dice', 'outcome', 'roomId')");
      const meta = {};
      for (const row of metaCursor) {
        meta[row.key] = row.value;
      }

      if (meta.roomId) {
        this.configureTiming(meta.roomId);
      }

      if (meta.currentRoundId) {
        this.currentRoundId = meta.currentRoundId;
        this.state = meta.state || 'WAITING';
        this.roundEndTime = parseInt(meta.roundEndTime, 10) || (Date.now() + this.waitingDuration * 1000);
        if (meta.dice) {
          try {
            this.dice = JSON.parse(meta.dice);
            this.total = this.dice.reduce((a, b) => a + b, 0);
            this.isTriple = (this.dice[0] === this.dice[1] && this.dice[1] === this.dice[2]);
          } catch {}
        }
        this.outcome = meta.outcome || 'XIU';

        // Lập tức kiểm tra thời gian và lên lịch chuyển trạng thái chính xác
        if (Date.now() >= this.roundEndTime) {
          this.scheduleNextAlarm(Date.now() + 50);
        } else {
          this.scheduleNextAlarm(this.roundEndTime);
        }
      } else {
        this.startNewRound();
      }
    } catch (err) {
      console.error('[LotteryRoom] loadCurrentState error:', err);
      this.startNewRound();
    }
  }

  saveMeta(key, value) {
    if (!this.sql) return;
    try {
      this.sql.exec(
        'INSERT INTO room_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        key,
        String(value),
        String(value)
      );
    } catch (err) {
      console.error(`[LotteryRoom] saveMeta ${key} error:`, err);
    }
  }

  generateRoundId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    return `TX-${dateStr}-${randomHex}`;
  }

  startNewRound() {
    this.currentRoundId = this.generateRoundId();
    this.state = 'WAITING';
    this.roundEndTime = Date.now() + this.waitingDuration * 1000;
    this.dice = [1, 2, 3];
    this.total = 6;
    this.outcome = 'XIU';
    this.isTriple = false;

    this.saveMeta('currentRoundId', this.currentRoundId);
    this.saveMeta('state', this.state);
    this.saveMeta('roundEndTime', this.roundEndTime);
    this.saveMeta('roomId', this.roomId);
    this.saveMeta('dice', JSON.stringify(this.dice));
    this.saveMeta('outcome', this.outcome);

    if (this.sql) {
      try {
        this.sql.exec(
          'INSERT OR IGNORE INTO rounds (id, dice1, dice2, dice3, total, outcome, draw_time, status, total_bets, total_payout) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, 0, 0)',
          this.currentRoundId,
          this.roundEndTime,
          'WAITING'
        );
      } catch (err) {
        console.error('[LotteryRoom] startNewRound DB error:', err);
      }
    }

    this.scheduleNextAlarm(this.roundEndTime);

    this.broadcast({
      type: 'ROUND_START',
      seq: ++this.lastSeq,
      roundId: this.currentRoundId,
      state: this.state,
      endsAt: this.roundEndTime,
      duration: this.waitingDuration,
      onlineCount: this.getOnlineCount()
    });
  }

  scheduleNextAlarm(targetTime) {
    if (this.alarmTimer) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
    }

    const now = Date.now();
    const delay = Math.max(0, targetTime - now);

    // Bật timer chính xác từng mili-giây trên bộ nhớ instance đang chạy
    this.alarmTimer = setTimeout(() => {
      this.alarmTimer = null;
      this.alarm();
    }, delay);
    if (this.alarmTimer && typeof this.alarmTimer.unref === 'function') {
      this.alarmTimer.unref();
    }

    // Cloudflare Storage Alarm dự phòng khi instance bị ngắt
    if (this.ctx && this.ctx.storage && typeof this.ctx.storage.setAlarm === 'function') {
      try {
        this.ctx.storage.setAlarm(targetTime);
      } catch (err) {
        console.error('[LotteryRoom] setAlarm error:', err);
      }
    }
  }

  checkTimeAndAdvance() {
    if (this.isAdvancing) return false;
    const now = Date.now();
    if (this.roundEndTime && now >= this.roundEndTime) {
      if (this.alarmTimer) {
        clearTimeout(this.alarmTimer);
        this.alarmTimer = null;
      }
      this.alarm();
      return true;
    }
    return false;
  }

  // Cloudflare Alarm xử lý chuyển đổi trạng thái (với re-entrancy lock)
  async alarm() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    try {
      const now = Date.now();

      if (this.state === 'WAITING') {
        // 1. Chuyển sang LẮC BÁT (PLAYING)
        this.state = 'PLAYING';
        this.roundEndTime = now + this.shakingDuration * 1000;
        this.saveMeta('state', this.state);
        this.saveMeta('roundEndTime', this.roundEndTime);

        if (this.sql) {
          try {
            this.sql.exec("UPDATE rounds SET status = 'PLAYING' WHERE id = ?", this.currentRoundId);
          } catch {}
        }

        this.scheduleNextAlarm(this.roundEndTime);

        this.broadcast({
          type: 'ROUND_SHAKE',
          seq: ++this.lastSeq,
          roundId: this.currentRoundId,
          state: this.state,
          endsAt: this.roundEndTime,
          duration: this.shakingDuration
        });

      } else if (this.state === 'PLAYING') {
        // 2. Chốt kết quả 3 xúc xắc trên máy chủ & bắt đầu thời gian NẶN BÁT
        await this.finalizeRound();

      } else if (this.state === 'RESULT') {
        // 3. Kết thúc thời gian xem kết quả, sang vòng mới
        this.startNewRound();
      }
    } finally {
      this.isAdvancing = false;
    }
  }

  // Chốt 3 xúc xắc ngẫu nhiên (CSPRNG), tính điểm, ghi SQLite, broadcast
  async finalizeRound() {
    const roundId = this.currentRoundId;
    if (this.state !== 'PLAYING') return;

    // Sinh 3 xúc xắc ngẫu nhiên bằng CSPRNG (mỗi con từ 1 đến 6)
    const randBuf = new Uint8Array(3);
    crypto.getRandomValues(randBuf);
    const d1 = (randBuf[0] % 6) + 1;
    const d2 = (randBuf[1] % 6) + 1;
    const d3 = (randBuf[2] % 6) + 1;

    this.dice = [d1, d2, d3];
    this.total = d1 + d2 + d3;
    this.isTriple = (d1 === d2 && d2 === d3);

    // Xác định kết quả:
    // Tam bảo (Bão): 3 con giống nhau (1-1-1, 2-2-2...) -> Cửa Bão thắng (1:30), Tài và Xỉu thua
    // Xỉu: Tổng từ 4 đến 10
    // Tài: Tổng từ 11 đến 17
    if (this.isTriple) {
      this.outcome = 'BAO';
    } else if (this.total >= 11) {
      this.outcome = 'TAI';
    } else {
      this.outcome = 'XIU';
    }

    let totalBets = 0;
    let totalPayout = 0;
    const winners = [];

    if (this.sql) {
      try {
        const betsCursor = this.sql.exec(
          'SELECT id, user_id, user_name, bet_side, amount FROM bets WHERE round_id = ?',
          roundId
        );
        const bets = [];
        for (const row of betsCursor) {
          bets.push(row);
        }
        totalBets = bets.length;

        for (const bet of bets) {
          let winMultiplier = 0;

          if (this.outcome === 'BAO') {
            if (bet.bet_side === 'BAO') {
              winMultiplier = 30; // Cược Bão ăn 30 lần
            }
          } else if (bet.bet_side === this.outcome) {
            winMultiplier = 2; // Cược Tài hoặc Xỉu ăn 1:1 (hoàn vốn + thưởng = 2x)
          }

          if (winMultiplier > 0) {
            const winPoints = bet.amount * winMultiplier;
            totalPayout += winPoints;
            winners.push({
              userId: bet.user_id,
              userName: bet.user_name,
              betSide: bet.bet_side,
              payout: winPoints
            });

            this.sql.exec('UPDATE bets SET payout = ? WHERE id = ?', winPoints, bet.id);
            this.sql.exec(
              'UPDATE player_points SET points = points + ?, updated_at = ? WHERE user_id = ?',
              winPoints,
              Date.now(),
              bet.user_id
            );
            this.syncSharedWalletDelta(bet.user_id, winPoints);
          }
        }

        this.sql.exec(
          "UPDATE rounds SET dice1 = ?, dice2 = ?, dice3 = ?, total = ?, outcome = ?, draw_time = ?, status = 'RESULT', total_bets = ?, total_payout = ? WHERE id = ?",
          d1,
          d2,
          d3,
          this.total,
          this.outcome,
          Date.now(),
          totalBets,
          totalPayout,
          roundId
        );

        this.state = 'RESULT';
        this.roundEndTime = Date.now() + this.resultDuration * 1000;
        this.saveMeta('state', this.state);
        this.saveMeta('dice', JSON.stringify(this.dice));
        this.saveMeta('outcome', this.outcome);
        this.saveMeta('roundEndTime', this.roundEndTime);

      } catch (dbErr) {
        console.error('[LotteryRoom] SQLite write error during finalize:', dbErr);
        this.broadcast({
          type: 'ERROR',
          seq: ++this.lastSeq,
          code: 'DB_FINALIZE_ERROR',
          message: 'Lỗi ghi kết quả vào cơ sở dữ liệu.'
        });
        return;
      }
    } else {
      this.state = 'RESULT';
      this.roundEndTime = Date.now() + this.resultDuration * 1000;
    }

    const historyItem = {
      roundId,
      dice: this.dice,
      total: this.total,
      outcome: this.outcome,
      isTriple: this.isTriple,
      drawTime: Date.now(),
      totalBets,
      totalPayout,
      winnersCount: winners.length
    };

    this.scheduleNextAlarm(this.roundEndTime);

    // Broadcast kết quả xúc xắc để client chuẩn bị NẶN ĐĨA
    this.broadcast({
      type: 'ROUND_RESULT',
      seq: ++this.lastSeq,
      roundId,
      dice: this.dice,
      total: this.total,
      outcome: this.outcome,
      isTriple: this.isTriple,
      winners,
      historyItem,
      endsAt: this.roundEndTime,
      state: this.state
    });

    this.syncAllPlayerBalances();
  }

  // Quản lý điểm giải trí mô phỏng & Liên kết ví giữa các bàn
  getWalletStub() {
    if (this.roomId === 'tai-xiu-shared-wallet') return null;
    if (this.env && this.env.LOTTERY_ROOM && typeof this.env.LOTTERY_ROOM.idFromName === 'function') {
      try {
        const id = this.env.LOTTERY_ROOM.idFromName('tai-xiu-shared-wallet');
        return this.env.LOTTERY_ROOM.get(id);
      } catch (err) {
        console.error('[LotteryRoom] getWalletStub error:', err);
      }
    }
    return null;
  }

  async fetchSharedWalletPoints(userId) {
    const stub = this.getWalletStub();
    if (!stub) return this.getPlayerPoints(userId);
    try {
      const res = await stub.fetch(`http://internal/api/wallet/get?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.points === 'number') {
          this.setLocalPlayerPoints(userId, data.points);
          return data.points;
        }
      }
    } catch (err) {
      console.error('[LotteryRoom] fetchSharedWalletPoints error:', err);
    }
    return this.getPlayerPoints(userId);
  }

  syncSharedWalletDelta(userId, delta) {
    const stub = this.getWalletStub();
    if (!stub) return;
    const task = async () => {
      try {
        await stub.fetch(`http://internal/api/wallet/delta?userId=${encodeURIComponent(userId)}&delta=${delta}`);
      } catch (err) {
        console.error('[LotteryRoom] syncSharedWalletDelta error:', err);
      }
    };
    if (this.ctx && typeof this.ctx.waitUntil === 'function') {
      this.ctx.waitUntil(task());
    } else {
      task();
    }
  }

  setLocalPlayerPoints(userId, points) {
    if (!this.sql) return;
    try {
      this.sql.exec(
        'INSERT INTO player_points (user_id, points, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET points = ?, updated_at = ?',
        userId,
        points,
        Date.now(),
        points,
        Date.now()
      );
    } catch {}
  }

  getPlayerPoints(userId) {
    if (!this.sql) return DEFAULT_INITIAL_POINTS;
    try {
      const cursor = this.sql.exec('SELECT points FROM player_points WHERE user_id = ?', userId);
      for (const row of cursor) {
        return row.points;
      }
      this.sql.exec(
        'INSERT INTO player_points (user_id, points, updated_at) VALUES (?, ?, ?)',
        userId,
        DEFAULT_INITIAL_POINTS,
        Date.now()
      );
      return DEFAULT_INITIAL_POINTS;
    } catch {
      return DEFAULT_INITIAL_POINTS;
    }
  }

  resetPlayerPoints(userId) {
    if (!this.sql) return DEFAULT_INITIAL_POINTS;
    try {
      this.sql.exec(
        'INSERT INTO player_points (user_id, points, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET points = ?, updated_at = ?',
        userId,
        DEFAULT_INITIAL_POINTS,
        Date.now(),
        DEFAULT_INITIAL_POINTS,
        Date.now()
      );
      return DEFAULT_INITIAL_POINTS;
    } catch {
      return DEFAULT_INITIAL_POINTS;
    }
  }

  // Lấy lịch sử 50 ván gần nhất để soi cầu chi tiết
  getHistory(limit = 50) {
    if (!this.sql) return [];
    try {
      const cursor = this.sql.exec(
        "SELECT id AS roundId, dice1, dice2, dice3, total, outcome, draw_time AS drawTime, total_bets AS totalBets, total_payout AS totalPayout FROM rounds WHERE status = 'RESULT' ORDER BY draw_time DESC LIMIT ?",
        limit
      );
      const history = [];
      for (const row of cursor) {
        history.push({
          ...row,
          dice: [row.dice1, row.dice2, row.dice3],
          isTriple: row.dice1 === row.dice2 && row.dice2 === row.dice3
        });
      }
      return history;
    } catch {
      return [];
    }
  }

  // Xử lý cược Tài / Xỉu / Bão
  handlePlaceBet(userId, userName, roundId, betSide, amount) {
    if (this.state !== 'WAITING') {
      return { success: false, code: 'NOT_ACCEPTING_BETS', message: 'Bát đã úp, đã khóa cược! Chờ ván sau nhé.' };
    }

    if (roundId !== this.currentRoundId) {
      return { success: false, code: 'INVALID_ROUND', message: 'Mã lượt chơi đã thay đổi.' };
    }

    const side = String(betSide || '').toUpperCase().trim();
    if (!['TAI', 'XIU', 'BAO'].includes(side)) {
      return { success: false, code: 'INVALID_SIDE', message: 'Cửa cược không hợp lệ (Chọn Tài, Xỉu hoặc Bão).' };
    }

    const betAmount = parseInt(amount, 10);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > 50000) {
      return { success: false, code: 'INVALID_AMOUNT', message: 'Số điểm cược không hợp lệ.' };
    }

    const currentPoints = this.getPlayerPoints(userId);
    if (currentPoints < betAmount) {
      return { success: false, code: 'INSUFFICIENT_POINTS', message: 'Bạn không đủ xu vui vẻ! Nhấn nút nhận thêm xu nhé.' };
    }

    const betId = `bet_${roundId}_${userId}_${side}`;
    if (this.sql) {
      try {
        const checkCursor = this.sql.exec('SELECT id FROM bets WHERE round_id = ? AND user_id = ? AND bet_side = ?', roundId, userId, side);
        for (const _ of checkCursor) {
          return { success: false, code: 'DUPLICATE_BET', message: `Bạn đã cược cửa ${side === 'TAI' ? 'Tài' : side === 'XIU' ? 'Xỉu' : 'Bão'} lượt này rồi!` };
        }

        this.sql.exec(
          'UPDATE player_points SET points = points - ?, updated_at = ? WHERE user_id = ? AND points >= ?',
          betAmount,
          Date.now(),
          userId,
          betAmount
        );
        this.syncSharedWalletDelta(userId, -betAmount);

        this.sql.exec(
          'INSERT INTO bets (id, round_id, user_id, user_name, bet_side, amount, payout, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
          betId,
          roundId,
          userId,
          userName || 'Người làng',
          side,
          betAmount,
          Date.now()
        );

        this.sql.exec('UPDATE rounds SET total_bets = total_bets + 1 WHERE id = ?', roundId);

      } catch (err) {
        console.error('[LotteryRoom] placeBet error:', err);
        return { success: false, code: 'DB_ERROR', message: 'Lỗi ghi nhận cược.' };
      }
    }

    const updatedPoints = this.getPlayerPoints(userId);

    return {
      success: true,
      bet: {
        id: betId,
        roundId,
        side,
        amount: betAmount,
        sideName: side === 'TAI' ? 'Tài' : side === 'XIU' ? 'Xỉu' : 'Bão'
      },
      newBalance: updatedPoints
    };
  }

  // Danh sách cược của user trong ván hiện tại
  getUserCurrentBets(userId) {
    if (!this.sql || !this.currentRoundId) return [];
    try {
      const cursor = this.sql.exec(
        'SELECT bet_side, amount FROM bets WHERE round_id = ? AND user_id = ?',
        this.currentRoundId,
        userId
      );
      const bets = [];
      for (const row of cursor) {
        bets.push({
          side: row.bet_side,
          amount: row.amount,
          sideName: row.bet_side === 'TAI' ? 'Tài' : row.bet_side === 'XIU' ? 'Xỉu' : 'Bão'
        });
      }
      return bets;
    } catch {
      return [];
    }
  }

  // Thống kê tổng cược 2 cửa Tài / Xỉu của phòng
  getRoomBetSummary() {
    if (!this.sql || !this.currentRoundId) return { taiTotal: 0, xiuTotal: 0, baoTotal: 0 };
    try {
      const cursor = this.sql.exec(
        'SELECT bet_side, SUM(amount) AS totalAmount FROM bets WHERE round_id = ? GROUP BY bet_side',
        this.currentRoundId
      );
      const summary = { taiTotal: 0, xiuTotal: 0, baoTotal: 0 };
      for (const row of cursor) {
        if (row.bet_side === 'TAI') summary.taiTotal = row.totalAmount || 0;
        if (row.bet_side === 'XIU') summary.xiuTotal = row.totalAmount || 0;
        if (row.bet_side === 'BAO') summary.baoTotal = row.totalAmount || 0;
      }
      return summary;
    } catch {
      return { taiTotal: 0, xiuTotal: 0, baoTotal: 0 };
    }
  }

  async syncAllPlayerBalances() {
    const sockets = this.getSockets();
    for (const ws of sockets) {
      try {
        const meta = ws.deserializeAttachment ? ws.deserializeAttachment() : null;
        if (meta && meta.userId) {
          const points = await this.fetchSharedWalletPoints(meta.userId);
          ws.send(JSON.stringify({
            type: 'POINTS_UPDATED',
            seq: ++this.lastSeq,
            points
          }));
        }
      } catch {}
    }
  }

  getSockets() {
    if (this.ctx && typeof this.ctx.getWebSockets === 'function') {
      return this.ctx.getWebSockets();
    }
    return [];
  }

  getOnlineCount() {
    return this.getSockets().length || (this.participants.size || 1);
  }

  broadcast(message) {
    const str = typeof message === 'string' ? message : JSON.stringify(message);
    const sockets = this.getSockets();
    for (const ws of sockets) {
      try {
        ws.send(str);
      } catch {}
    }
  }

  // Xử lý HTTP & WebSocket Upgrade
  async fetch(request) {
    const url = new URL(request.url);

    // 0. Xử lý API ví điểm dùng chung (Shared Wallet API)
    if (url.pathname.startsWith('/api/wallet/')) {
      const action = url.pathname.replace('/api/wallet/', '');
      const userId = url.searchParams.get('userId');
      if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

      if (action === 'get') {
        const points = this.getPlayerPoints(userId);
        return new Response(JSON.stringify({ points }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'delta') {
        const delta = parseInt(url.searchParams.get('delta') || '0', 10);
        this.getPlayerPoints(userId);
        if (this.sql) {
          this.sql.exec('UPDATE player_points SET points = points + ?, updated_at = ? WHERE user_id = ?', delta, Date.now(), userId);
        }
        const points = this.getPlayerPoints(userId);
        return new Response(JSON.stringify({ ok: true, points }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'claim') {
        const points = this.resetPlayerPoints(userId);
        return new Response(JSON.stringify({ ok: true, points }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Xác định thời gian phòng dựa theo URL
    const roomParam = url.searchParams.get('room') || this.roomId;
    this.configureTiming(roomParam);
    this.checkTimeAndAdvance();

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      const userId = url.searchParams.get('userId') || `guest_${Math.random().toString(36).substring(2, 8)}`;
      const userName = url.searchParams.get('userName') || 'Dân làng';
      const socketId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (this.ctx && typeof this.ctx.acceptWebSocket === 'function') {
        this.ctx.acceptWebSocket(server, [userId]);
      } else {
        server.accept();
      }

      const attachment = { socketId, userId, userName, joinedAt: Date.now() };
      if (typeof server.serializeAttachment === 'function') {
        server.serializeAttachment(attachment);
      }
      this.participants.set(socketId, attachment);

      if (!this.ctx || typeof this.ctx.acceptWebSocket !== 'function') {
        server.addEventListener('message', (event) => this.handleSocketMessage(server, event.data));
        server.addEventListener('close', () => this.handleSocketClose(server));
      }

      // Gửi snapshot tức thì
      const snapshot = await this.getSnapshot(userId);
      server.send(JSON.stringify({
        type: 'SNAPSHOT',
        seq: ++this.lastSeq,
        ...snapshot
      }));

      this.broadcast({
        type: 'PLAYER_JOIN',
        seq: ++this.lastSeq,
        userId,
        userName,
        onlineCount: this.getOnlineCount()
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith('/snapshot')) {
      const userId = url.searchParams.get('userId') || 'anon';
      return new Response(JSON.stringify(await this.getSnapshot(userId)), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.endsWith('/history')) {
      return new Response(JSON.stringify(this.getHistory(50)), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('TaiXiuRoom OK', { status: 200 });
  }

  async getSnapshot(userId) {
    const userPoints = await this.fetchSharedWalletPoints(userId);
    const history = this.getHistory(50);
    const myBets = this.getUserCurrentBets(userId);
    const betSummary = this.getRoomBetSummary();

    return {
      roomId: this.roomId,
      state: this.state,
      currentRoundId: this.currentRoundId,
      roundEndTime: this.roundEndTime,
      waitingDuration: this.waitingDuration,
      dice: this.dice,
      total: this.total,
      outcome: this.outcome,
      isTriple: this.isTriple,
      serverTime: Date.now(),
      onlineCount: this.getOnlineCount(),
      myPoints: userPoints,
      myCurrentBets: myBets,
      betSummary,
      history
    };
  }

  async webSocketMessage(ws, message) {
    this.handleSocketMessage(ws, message);
  }

  async webSocketClose(ws, _code, _reason, _wasClean) {
    this.handleSocketClose(ws);
  }

  async webSocketError(ws, error) {
    console.error('[LotteryRoom] webSocketError:', error);
  }

  handleSocketClose(ws) {
    try {
      const meta = ws.deserializeAttachment ? ws.deserializeAttachment() : null;
      if (meta) {
        this.participants.delete(meta.socketId);
        this.broadcast({
          type: 'PLAYER_LEAVE',
          seq: ++this.lastSeq,
          userId: meta.userId,
          userName: meta.userName,
          onlineCount: this.getOnlineCount()
        });
      }
    } catch {}
  }

  async handleSocketMessage(ws, data) {
    let payload;
    try {
      if (typeof data === 'string' && data.length > 2048) {
        ws.send(JSON.stringify({ type: 'ERROR', code: 'PAYLOAD_TOO_LARGE', message: 'Tin nhắn quá lớn.' }));
        return;
      }
      payload = JSON.parse(data);
    } catch {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'INVALID_JSON', message: 'Định dạng gói tin không hợp lệ.' }));
      return;
    }

    const meta = ws.deserializeAttachment ? ws.deserializeAttachment() : { userId: payload.userId, userName: payload.userName };
    const userId = meta?.userId || payload.userId || 'anon';
    const userName = meta?.userName || payload.userName || 'Dân làng';

    switch (payload.type) {
      case 'PING':
        this.checkTimeAndAdvance();
        ws.send(JSON.stringify({ type: 'PONG', serverTime: Date.now() }));
        break;

      case 'GET_SNAPSHOT': {
        const snap = await this.getSnapshot(userId);
        ws.send(JSON.stringify({ type: 'SNAPSHOT', seq: ++this.lastSeq, ...snap }));
        break;
      }

      case 'PREDICT': {
        const result = this.handlePlaceBet(
          userId,
          userName,
          payload.roundId,
          payload.side,
          payload.amount
        );

        if (!result.success) {
          ws.send(JSON.stringify({
            type: 'BET_ERROR',
            code: result.code,
            message: result.message
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'BET_ACCEPTED',
            seq: ++this.lastSeq,
            bet: result.bet,
            newBalance: result.newBalance
          }));

          // Phát tổng cược mới cho phòng
          this.broadcast({
            type: 'BET_SUMMARY_UPDATE',
            seq: ++this.lastSeq,
            betSummary: this.getRoomBetSummary()
          });
        }
        break;
      }

      case 'CLAIM_FREE_POINTS': {
        const cur = await this.fetchSharedWalletPoints(userId);
        if (cur <= 500) {
          const stub = this.getWalletStub();
          if (stub) {
            try {
              await stub.fetch(`http://internal/api/wallet/claim?userId=${encodeURIComponent(userId)}`);
            } catch (err) {
              console.error('[LotteryRoom] claim stub error:', err);
            }
          }
          const newPoints = this.resetPlayerPoints(userId);
          ws.send(JSON.stringify({
            type: 'POINTS_UPDATED',
            seq: ++this.lastSeq,
            points: newPoints,
            message: 'Đã nhận thêm 10,000 xu giải trí từ Trưởng thôn!'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'ERROR',
            code: 'CLAIM_NOT_ALLOWED',
            message: 'Chỉ được nhận thêm xu khi số dư dưới 500 xu!'
          }));
        }
        break;
      }

      default:
        break;
    }
  }
}
