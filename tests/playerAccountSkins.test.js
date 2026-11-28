import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { PlayerAccountDO } from '../cloudflare-worker/src/PlayerAccountDO.js';

function createMockPlayerDO(db = new DatabaseSync(':memory:')) {
  const sql = {
    exec(query, ...params) {
      const trimmed = query.trim().toUpperCase();
      if (params.length === 0 && (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER'))) {
        db.exec(query);
        return [];
      }
      const stmt = db.prepare(query);
      if (trimmed.startsWith('SELECT')) {
        return stmt.all(...params);
      }
      stmt.run(...params);
      return [];
    }
  };

  const state = {
    storage: { sql }
  };

  return new PlayerAccountDO(state, {});
}

test('PlayerAccountDO Google Skin Sync: purchases, debits Xu ledger, and restores ownedSkins across logins', async () => {
  const playerDO = createMockPlayerDO();

  // 1. First Google login on Device A (`initialPoints: 120000`)
  const login1 = playerDO.loginOrRegister({
    googleSub: 'google_sub_998877',
    email: 'tankcommander@gmail.com',
    displayName: 'Tank Commander',
    avatarUrl: '',
    initialPoints: 120000
  });

  assert.equal(login1.balance, 120000);
  assert.deepEqual(login1.ownedSkins, ['classic']);
  const userId = login1.user.userId;

  // 2. Purchase `viper_scout` (25,000 Xu) and `titan_heavy` (55,000 Xu)
  const buy1 = playerDO.purchaseSkin({
    userId,
    skinId: 'viper_scout',
    skinName: 'Bọ Cạp Trinh Sát',
    costXu: 25000
  });
  assert.equal(buy1.success, true);
  assert.equal(buy1.newBalance, 95000);
  assert.deepEqual(buy1.ownedSkins, ['classic', 'viper_scout']);

  const buy2 = playerDO.purchaseSkin({
    userId,
    skinId: 'titan_heavy',
    skinName: 'Pháo Đài Titan',
    costXu: 55000
  });
  assert.equal(buy2.success, true);
  assert.equal(buy2.newBalance, 40000);
  assert.deepEqual(buy2.ownedSkins, ['classic', 'viper_scout', 'titan_heavy']);

  // 3. Re-buying already owned skin is idempotent and charges 0 Xu
  const buyDup = playerDO.purchaseSkin({
    userId,
    skinId: 'viper_scout',
    skinName: 'Bọ Cạp Trinh Sát',
    costXu: 25000
  });
  assert.equal(buyDup.success, true);
  assert.equal(buyDup.alreadyOwned, true);
  assert.equal(buyDup.newBalance, 40000);

  // 4. Buying expensive `cyber_omega` (500,000 Xu) with 40,000 Xu fails cleanly
  const buyInsufficient = playerDO.purchaseSkin({
    userId,
    skinId: 'cyber_omega',
    skinName: 'Chiến Thần Quang Tử',
    costXu: 500000
  });
  assert.equal(buyInsufficient.success, false);
  assert.equal(buyInsufficient.code, 'INSUFFICIENT_FUNDS');
  assert.equal(buyInsufficient.newBalance, 40000);

  // 5. Sync legacy local skin (`hover_specter`) up to Google Account DO via HTTP `/skins/sync`
  const syncRes = await playerDO.fetch(
    new Request(`http://internal/skins/sync?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownedSkins: ['classic', 'hover_specter', 'invalid_hack_skin'] })
    })
  );
  const syncJson = await syncRes.json();
  assert.equal(syncJson.ok, true);
  assert.deepEqual(syncJson.ownedSkins, ['classic', 'viper_scout', 'titan_heavy', 'hover_specter']);

  // 6. Login with the SAME Google Account on Device B -> all owned skins & balance restored immediately!
  const loginDeviceB = playerDO.loginOrRegister({
    googleSub: 'google_sub_998877',
    email: 'tankcommander@gmail.com',
    displayName: 'Tank Commander (Mobile)',
    avatarUrl: ''
  });
  assert.equal(loginDeviceB.balance, 40000);
  assert.deepEqual(loginDeviceB.ownedSkins, ['classic', 'viper_scout', 'titan_heavy', 'hover_specter']);

  const profile = playerDO.getProfile(userId);
  assert.deepEqual(profile.ownedSkins, ['classic', 'viper_scout', 'titan_heavy', 'hover_specter']);
});
