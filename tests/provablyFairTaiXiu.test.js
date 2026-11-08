// tests/provablyFairTaiXiu.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getProvablyFairRound, generateRecentHistory } from '../src/modules/Entertainment/TaiXiu/utils/provablyFair.js';
import { getDiceFromRoundId } from '../cloudflare-worker/src/index.js';

test('1. Client getProvablyFairRound khớp 100% kết quả xúc xắc với Server getDiceFromRoundId', async () => {
  const SECRET_SALT = 'windhub_taixiu_secret_salt_2026';

  for (let cycle = 1000; cycle < 1020; cycle++) {
    const clientRound = getProvablyFairRound(cycle, 'tai-xiu-50s');
    const serverDice = await getDiceFromRoundId(cycle, SECRET_SALT);

    assert.deepEqual(clientRound.dice, serverDice, `Cycle ${cycle} dice must match exactly`);
    assert.equal(clientRound.total, serverDice[0] + serverDice[1] + serverDice[2]);

    const expectedOutcome = (serverDice[0] === serverDice[1] && serverDice[1] === serverDice[2])
      ? 'BAO'
      : (clientRound.total >= 11 ? 'TAI' : 'XIU');
    assert.equal(clientRound.outcome, expectedOutcome);
  }
});

test('2. generateRecentHistory tạo đúng 50 ván soi cầu đồng nhất', () => {
  const currentCycle = 5000;
  const history = generateRecentHistory(currentCycle, 'tai-xiu-50s', 50);

  assert.equal(history.length, 50);
  assert.equal(history[0].roundId, `TX-50S-${currentCycle - 1}`);
  assert.equal(history[49].roundId, `TX-50S-${currentCycle - 50}`);

  for (const h of history) {
    assert.equal(h.dice.length, 3);
    assert.ok(h.dice.every((d) => d >= 1 && d <= 6));
    assert.equal(h.total, h.dice[0] + h.dice[1] + h.dice[2]);
    assert.ok(['TAI', 'XIU', 'BAO'].includes(h.outcome));
  }
});
