// cloudflare-worker/src/PlayerAccountDO.js

export const DAILY_REWARD_AMOUNTS = [500, 700, 800, 1000, 1200, 1500, 2500];

export function getVietnamDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

export function calculateDayDifference(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = Date.parse(`${dateStr1}T00:00:00Z`);
  const d2 = Date.parse(`${dateStr2}T00:00:00Z`);
  if (isNaN(d1) || isNaN(d2)) return null;
  return Math.round((d2 - d1) / (24 * 3600 * 1000));
}

export class PlayerAccountDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ctx = state;
    this.sql = state.storage?.sql || null;
    this.initialized = false;
    this.initSchema();
  }

  initSchema() {
    if (!this.sql || this.initialized) return;
    try {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS account (
          user_id TEXT PRIMARY KEY,
          google_sub TEXT UNIQUE NOT NULL,
          email TEXT,
          display_name TEXT,
          avatar_url TEXT,
          created_at INTEGER NOT NULL,
          last_login_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS wallet (
          user_id TEXT PRIMARY KEY,
          balance INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          reference_id TEXT,
          description TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_rewards (
          user_id TEXT NOT NULL,
          reward_date TEXT NOT NULL,
          streak_day INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          claimed_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, reward_date)
        );

        CREATE TABLE IF NOT EXISTS reward_streak (
          user_id TEXT PRIMARY KEY,
          current_streak INTEGER NOT NULL DEFAULT 0,
          last_claimed_date TEXT,
          updated_at INTEGER NOT NULL
        );
      `);
      this.initialized = true;
    } catch (err) {
      console.error('[PlayerAccountDO] initSchema error:', err);
    }
  }

  getAccountByGoogleSub(googleSub) {
    if (!this.sql) return null;
    const cursor = this.sql.exec('SELECT * FROM account WHERE google_sub = ?', googleSub);
    for (const row of cursor) {
      return row;
    }
    return null;
  }

  getAccountByUserId(userId) {
    if (!this.sql) return null;
    const cursor = this.sql.exec('SELECT * FROM account WHERE user_id = ?', userId);
    for (const row of cursor) {
      return row;
    }
    return null;
  }

  loginOrRegister({ googleSub, email, displayName, avatarUrl, initialPoints = 0 }) {
    this.initSchema();
    if (!googleSub) throw new Error('Missing googleSub');

    let acc = this.getAccountByGoogleSub(googleSub);
    const now = Date.now();

    if (acc) {
      // Update profile info & last login
      this.sql.exec(
        'UPDATE account SET email = ?, display_name = ?, avatar_url = ?, last_login_at = ? WHERE google_sub = ?',
        email || acc.email,
        displayName || acc.display_name,
        avatarUrl || acc.avatar_url,
        now,
        googleSub
      );
      acc = this.getAccountByGoogleSub(googleSub);
    } else {
      // Create new account
      const userId = `usr_${googleSub.slice(-10)}_${Math.random().toString(36).substring(2, 6)}`;
      this.sql.exec(
        'INSERT INTO account (user_id, google_sub, email, display_name, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        userId,
        googleSub,
        email || '',
        displayName || 'Người Chơi',
        avatarUrl || '',
        now,
        now
      );

      const grant = Math.max(0, parseInt(initialPoints, 10) || 0);
      this.sql.exec(
        'INSERT INTO wallet (user_id, balance, updated_at) VALUES (?, ?, ?)',
        userId,
        grant,
        now
      );

      if (grant > 0) {
        this.sql.exec(
          'INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          `tx_init_${userId}_${now}`,
          userId,
          'MIGRATION',
          grant,
          grant,
          'initial_grant',
          'Khởi tạo số dư ban đầu',
          now
        );
      }

      this.sql.exec(
        'INSERT INTO reward_streak (user_id, current_streak, last_claimed_date, updated_at) VALUES (?, ?, ?, ?)',
        userId,
        0,
        null,
        now
      );

      acc = this.getAccountByGoogleSub(googleSub);
    }

    const balance = this.getBalance(acc.user_id);
    const rewardStatus = this.getDailyRewardStatus(acc.user_id);

    return {
      user: {
        userId: acc.user_id,
        googleSub: acc.google_sub,
        email: acc.email,
        displayName: acc.display_name,
        avatarUrl: acc.avatar_url,
        createdAt: acc.created_at,
        lastLoginAt: acc.last_login_at
      },
      balance,
      dailyReward: rewardStatus
    };
  }

  getBalance(userId) {
    if (!this.sql) return 0;
    try {
      const cursor = this.sql.exec('SELECT balance FROM wallet WHERE user_id = ?', userId);
      for (const row of cursor) {
        return Number(row.balance) || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  debit({ userId, amount, txId, referenceId = '', description = '' }) {
    this.initSchema();
    const debitAmount = parseInt(amount, 10);
    if (isNaN(debitAmount) || debitAmount <= 0) {
      return { success: false, code: 'INVALID_AMOUNT', message: 'Số điểm trừ không hợp lệ' };
    }
    if (!txId) {
      return { success: false, code: 'MISSING_TX_ID', message: 'Thiếu transaction ID' };
    }

    // Idempotency check: if transaction already executed, return current balance
    const existingTx = this.getTransactionById(txId);
    if (existingTx) {
      const curBalance = this.getBalance(userId);
      return {
        success: true,
        idempotent: true,
        balance: curBalance,
        txId,
        message: 'Giao dịch đã được xử lý trước đó.'
      };
    }

    const currentBalance = this.getBalance(userId);
    if (currentBalance < debitAmount) {
      return {
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        balance: currentBalance,
        message: 'Số dư xu không đủ'
      };
    }

    const newBalance = currentBalance - debitAmount;
    const now = Date.now();

    try {
      this.sql.exec(
        'UPDATE wallet SET balance = balance - ?, updated_at = ? WHERE user_id = ? AND balance >= ?',
        debitAmount,
        now,
        userId,
        debitAmount
      );

      this.sql.exec(
        'INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        txId,
        userId,
        'BET',
        -debitAmount,
        newBalance,
        referenceId,
        description || 'Đặt cược',
        now
      );

      return {
        success: true,
        balance: newBalance,
        txId
      };
    } catch (err) {
      console.error('[PlayerAccountDO] debit error:', err);
      return { success: false, code: 'DB_ERROR', message: 'Lỗi ghi nhận giao dịch ví' };
    }
  }

  credit({ userId, amount, txId, referenceId = '', description = '', type = 'PAYOUT' }) {
    this.initSchema();
    const creditAmount = parseInt(amount, 10);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return { success: false, code: 'INVALID_AMOUNT', message: 'Số điểm cộng không hợp lệ' };
    }
    if (!txId) {
      return { success: false, code: 'MISSING_TX_ID', message: 'Thiếu transaction ID' };
    }

    // Idempotency check
    const existingTx = this.getTransactionById(txId);
    if (existingTx) {
      const curBalance = this.getBalance(userId);
      return {
        success: true,
        idempotent: true,
        balance: curBalance,
        txId,
        message: 'Giao dịch đã được xử lý trước đó.'
      };
    }

    const currentBalance = this.getBalance(userId);
    const newBalance = currentBalance + creditAmount;
    const now = Date.now();

    try {
      this.sql.exec(
        'UPDATE wallet SET balance = balance + ?, updated_at = ? WHERE user_id = ?',
        creditAmount,
        now,
        userId
      );

      this.sql.exec(
        'INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        txId,
        userId,
        type,
        creditAmount,
        newBalance,
        referenceId,
        description || 'Thưởng',
        now
      );

      return {
        success: true,
        balance: newBalance,
        txId
      };
    } catch (err) {
      console.error('[PlayerAccountDO] credit error:', err);
      return { success: false, code: 'DB_ERROR', message: 'Lỗi ghi nhận giao dịch ví' };
    }
  }

  getTransactionById(txId) {
    if (!this.sql) return null;
    const cursor = this.sql.exec('SELECT * FROM transactions WHERE id = ?', txId);
    for (const row of cursor) {
      return row;
    }
    return null;
  }

  getDailyRewardStatus(userId, todayDateStr) {
    this.initSchema();
    const today = todayDateStr || getVietnamDateString();

    let streakRecord = null;
    const cursor = this.sql.exec('SELECT * FROM reward_streak WHERE user_id = ?', userId);
    for (const row of cursor) {
      streakRecord = row;
      break;
    }

    const currentStreak = streakRecord?.current_streak || 0;
    const lastClaimedDate = streakRecord?.last_claimed_date || null;

    const diff = lastClaimedDate ? calculateDayDifference(lastClaimedDate, today) : null;
    const claimedToday = diff === 0;

    let nextStreakDay = 1;
    if (claimedToday) {
      nextStreakDay = currentStreak;
    } else if (diff === 1) {
      nextStreakDay = (currentStreak % 7) + 1;
    } else {
      nextStreakDay = 1; // Missed a day or first time
    }

    return {
      currentStreak,
      lastClaimedDate,
      claimedToday,
      canClaimToday: !claimedToday,
      nextStreakDay,
      nextRewardAmount: DAILY_REWARD_AMOUNTS[nextStreakDay - 1],
      rewardAmounts: DAILY_REWARD_AMOUNTS,
      todayDate: today
    };
  }

  claimDailyReward(userId, todayDateStr) {
    this.initSchema();
    const today = todayDateStr || getVietnamDateString();

    // Check unique constraint check in daily_rewards table
    const checkCursor = this.sql.exec('SELECT streak_day, amount FROM daily_rewards WHERE user_id = ? AND reward_date = ?', userId, today);
    for (const _row of checkCursor) {
      return {
        success: false,
        code: 'ALREADY_CLAIMED',
        message: 'Hôm nay bạn đã điểm danh nhận thưởng rồi. Hãy quay lại vào ngày mai nhé!'
      };
    }

    const status = this.getDailyRewardStatus(userId, today);
    const streakDay = status.nextStreakDay;
    const amount = DAILY_REWARD_AMOUNTS[streakDay - 1];
    const now = Date.now();
    const txId = `tx_daily_${userId}_${today}`;

    try {
      // 1. Ghi nhận claim vào daily_rewards (chặn trùng lặp với UNIQUE/PRIMARY KEY constraint)
      this.sql.exec(
        'INSERT INTO daily_rewards (user_id, reward_date, streak_day, amount, claimed_at) VALUES (?, ?, ?, ?, ?)',
        userId,
        today,
        streakDay,
        amount,
        now
      );

      // 2. Cập nhật streak
      this.sql.exec(
        'INSERT INTO reward_streak (user_id, current_streak, last_claimed_date, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET current_streak = ?, last_claimed_date = ?, updated_at = ?',
        userId,
        streakDay,
        today,
        now,
        streakDay,
        today,
        now
      );

      // 3. Cộng tiền vào ví và ghi nhận ledger
      const curBalance = this.getBalance(userId);
      const newBalance = curBalance + amount;

      this.sql.exec('UPDATE wallet SET balance = balance + ?, updated_at = ? WHERE user_id = ?', amount, now, userId);

      this.sql.exec(
        'INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        txId,
        userId,
        'DAILY_REWARD',
        amount,
        newBalance,
        today,
        `Điểm danh ngày ${streakDay}`,
        now
      );

      return {
        success: true,
        streakDay,
        amount,
        newBalance,
        rewardDate: today,
        dailyReward: this.getDailyRewardStatus(userId, today)
      };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE')) {
        return {
          success: false,
          code: 'ALREADY_CLAIMED',
          message: 'Hôm nay bạn đã điểm danh nhận thưởng rồi.'
        };
      }
      console.error('[PlayerAccountDO] claimDailyReward error:', err);
      return { success: false, code: 'DB_ERROR', message: 'Lỗi ghi nhận điểm danh' };
    }
  }

  getTransactions(userId, limit = 50) {
    if (!this.sql) return [];
    try {
      const cursor = this.sql.exec(
        'SELECT id, type, amount, balance_after AS balanceAfter, reference_id AS referenceId, description, created_at AS createdAt FROM transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
        userId,
        Math.min(100, Math.max(1, limit))
      );
      const list = [];
      for (const row of cursor) {
        list.push(row);
      }
      return list;
    } catch {
      return [];
    }
  }

  getPlayerStats(userId) {
    if (!this.sql) {
      return { totalBets: 0, totalWon: 0, winCount: 0, totalBetAmount: 0 };
    }
    try {
      const cursor = this.sql.exec(
        `SELECT 
          COUNT(CASE WHEN type = 'BET' THEN 1 END) AS totalBets,
          COUNT(CASE WHEN type = 'PAYOUT' THEN 1 END) AS winCount,
          COALESCE(SUM(CASE WHEN type = 'BET' THEN -amount ELSE 0 END), 0) AS totalBetAmount,
          COALESCE(SUM(CASE WHEN type = 'PAYOUT' THEN amount ELSE 0 END), 0) AS totalWon
        FROM transactions WHERE user_id = ?`,
        userId
      );
      for (const row of cursor) {
        return {
          totalBets: Number(row.totalBets) || 0,
          winCount: Number(row.winCount) || 0,
          totalBetAmount: Number(row.totalBetAmount) || 0,
          totalWon: Number(row.totalWon) || 0
        };
      }
      return { totalBets: 0, totalWon: 0, winCount: 0, totalBetAmount: 0 };
    } catch {
      return { totalBets: 0, totalWon: 0, winCount: 0, totalBetAmount: 0 };
    }
  }

  getProfile(userId) {
    const acc = this.getAccountByUserId(userId);
    if (!acc) return null;
    const balance = this.getBalance(userId);
    const dailyReward = this.getDailyRewardStatus(userId);
    const stats = this.getPlayerStats(userId);

    return {
      user: {
        userId: acc.user_id,
        googleSub: acc.google_sub,
        email: acc.email,
        displayName: acc.display_name,
        avatarUrl: acc.avatar_url,
        createdAt: acc.created_at,
        lastLoginAt: acc.last_login_at
      },
      balance,
      dailyReward,
      stats
    };
  }

  // Durable Object HTTP Fetch Handler
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/login' && request.method === 'POST') {
        const body = await request.json();
        const result = this.loginOrRegister(body);
        return Response.json(result);
      }

      const userId = url.searchParams.get('userId');
      if (!userId && !path.startsWith('/by-google/')) {
        return Response.json({ error: 'Missing userId parameter' }, { status: 400 });
      }

      if (path === '/profile' && request.method === 'GET') {
        const profile = this.getProfile(userId);
        if (!profile) return Response.json({ error: 'Player not found' }, { status: 404 });
        return Response.json({ ok: true, profile });
      }

      if (path === '/balance' && request.method === 'GET') {
        const balance = this.getBalance(userId);
        return Response.json({ ok: true, balance });
      }

      if (path === '/debit' && request.method === 'POST') {
        const body = await request.json();
        const result = this.debit({ userId, ...body });
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (path === '/credit' && request.method === 'POST') {
        const body = await request.json();
        const result = this.credit({ userId, ...body });
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (path === '/reward/status' && request.method === 'GET') {
        const date = url.searchParams.get('date');
        const status = this.getDailyRewardStatus(userId, date);
        return Response.json({ ok: true, dailyReward: status });
      }

      if (path === '/reward/claim' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) || {};
        const result = this.claimDailyReward(userId, body.date);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (path === '/transactions' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const transactions = this.getTransactions(userId, limit);
        return Response.json({ ok: true, transactions });
      }

      if (path === '/stats' && request.method === 'GET') {
        const stats = this.getPlayerStats(userId);
        return Response.json({ ok: true, stats });
      }

      return Response.json({ error: 'Not Found' }, { status: 404 });
    } catch (err) {
      console.error('[PlayerAccountDO] fetch handler error:', err);
      return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
  }
}
