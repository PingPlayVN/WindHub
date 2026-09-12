import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BATTLE_MODES,
  createBattleRoyaleArena,
  stepBattleRoyaleArena,
} from '../src/modules/AILab/engine/battleRoyaleEngine.js';

test('battle royale creates between two and eight AI with distinct strategies', () => {
  const arena = createBattleRoyaleArena({ agentCount: 8, seed: 11 });

  assert.equal(arena.agents.length, 8);
  assert.ok(arena.agents.every((agent) => agent.id && agent.strategy.name && Number.isFinite(agent.elo)));
  assert.ok(BATTLE_MODES.some((mode) => mode.id === arena.mode.id));
});

test('battle rounds update rankings, Elo and learning parameters', () => {
  const arena = createBattleRoyaleArena({ agentCount: 4, gameType: 'algorithm', seed: 11 });
  const before = arena.agents.map((agent) => ({ id: agent.id, exploration: agent.exploration, version: agent.strategy.version }));
  const next = stepBattleRoyaleArena(arena);

  assert.equal(next.round, 1);
  assert.equal(next.agents.length, 4);
  assert.ok(next.agents.every((agent) => Number.isFinite(agent.elo) && agent.strategy.version > 1));
  assert.ok(next.agents.some((agent) => agent.exploration !== before.find((item) => item.id === agent.id).exploration));
  assert.ok(next.eventLog[0].message.includes('thắng vòng'));
});

test('AI styles adapt to the selected game over multiple fair rounds', () => {
  const arena = createBattleRoyaleArena({ agentCount: 4, gameType: 'survival', seed: 21 });
  const initialStyles = new Map(arena.agents.map((agent) => [agent.id, agent.strategy.name]));
  const next = stepBattleRoyaleArena(stepBattleRoyaleArena(arena));

  assert.ok(next.agents.every((agent) => agent.strategy.version > 2));
  assert.ok(next.agents.some((agent) => agent.strategy.name !== initialStyles.get(agent.id) || agent.lastAction.includes('Đang học')));
  assert.equal(next.modifier, undefined);
});
