const BATTLE_MODES = [
  { id: 'chess', name: 'Cờ vua', label: 'Chiếm không gian và kiểm soát trung tâm' },
  { id: 'xiangqi', name: 'Cờ tướng', label: 'Phá thế phòng thủ và ép đối thủ' },
  { id: 'tic-tac-toe', name: 'Tic-tac-toe', label: 'Đọc mẫu và chặn nước đi' },
  { id: 'prisoners-dilemma', name: "Prisoner's Dilemma", label: 'Hợp tác hay phản bội đúng lúc' },
  { id: 'algorithm', name: 'Đấu thuật toán', label: 'Tối ưu tốc độ và độ chính xác' },
  { id: 'survival', name: 'Sinh tồn tài nguyên', label: 'Tích trữ, mở rộng và sống sót' },
];

const STRATEGY_TEMPLATES = [
  { name: 'Nhà thám hiểm', style: 'liều lĩnh', attack: 0.9, defense: 0.35, adapt: 0.75 },
  { name: 'Nhà phân tích', style: 'tính toán', attack: 0.62, defense: 0.66, adapt: 0.86 },
  { name: 'Kẻ cơ hội', style: 'đọc tình huống', attack: 0.76, defense: 0.5, adapt: 0.92 },
  { name: 'Pháo đài', style: 'phòng thủ', attack: 0.42, defense: 0.94, adapt: 0.55 },
  { name: 'Tốc độ', style: 'tối ưu nhanh', attack: 0.72, defense: 0.44, adapt: 0.7 },
  { name: 'Ngoan cường', style: 'bền bỉ', attack: 0.58, defense: 0.78, adapt: 0.64 },
  { name: 'Chiến lược gia', style: 'dài hạn', attack: 0.68, defense: 0.72, adapt: 0.8 },
  { name: 'Kẻ gây rối', style: 'khó đoán', attack: 0.84, defense: 0.38, adapt: 0.88 },
];

const MODE_WEIGHTS = {
  chess: { attack: 0.36, defense: 0.34, adapt: 0.3 },
  xiangqi: { attack: 0.32, defense: 0.4, adapt: 0.28 },
  'tic-tac-toe': { attack: 0.28, defense: 0.32, adapt: 0.4 },
  'prisoners-dilemma': { attack: 0.22, defense: 0.24, adapt: 0.54 },
  algorithm: { attack: 0.2, defense: 0.2, adapt: 0.6 },
  survival: { attack: 0.24, defense: 0.48, adapt: 0.28 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomFrom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMode(gameType, random) {
  if (gameType !== 'random') return BATTLE_MODES.find((mode) => mode.id === gameType) ?? BATTLE_MODES[0];
  return BATTLE_MODES[Math.floor(random() * BATTLE_MODES.length)];
}

function scoreAgent(agent, mode, random, round) {
  const weights = MODE_WEIGHTS[mode.id] ?? MODE_WEIGHTS.chess;
  const fit = agent.strategy.attack * weights.attack + agent.strategy.defense * weights.defense + agent.strategy.adapt * weights.adapt;
  const explorationCost = agent.exploration * (1.5 + weights.adapt);
  const learningBonus = agent.learning * (12 + weights.adapt * 8);
  const winRate = agent.rounds ? agent.wins / agent.rounds : 0;
  const comebackBonus = (1 - winRate) * 9;
  const dominancePenalty = winRate * 11;
  const streakPenalty = Math.max(0, agent.currentStreak - 1) * 14;
  const longRunLearning = Math.log1p(round) * agent.strategy.adapt * 2;
  return Math.max(0, 40 + fit * 58 + learningBonus + comebackBonus - dominancePenalty - streakPenalty - explorationCost + (random() - 0.5) * 12 + longRunLearning);
}

function getStrategyFit(template, mode) {
  const weights = MODE_WEIGHTS[mode.id] ?? MODE_WEIGHTS.chess;
  return template.attack * weights.attack + template.defense * weights.defense + template.adapt * weights.adapt;
}

function updateLearning(agent, opponent, mode, won, random) {
  const reward = won ? 0.06 : -0.025;
  const learningGain = won ? 0.025 : 0.01;
  agent.learning = Number(clamp(agent.learning + learningGain, 0.1, 1).toFixed(3));
  agent.exploration = Number(clamp(agent.exploration * 0.985 + (won ? -0.008 : 0.012), 0.08, 0.85).toFixed(3));
  agent.strategy.attack = Number(clamp(agent.strategy.attack + reward + (opponent.strategy.attack - agent.strategy.attack) * 0.08 + (random() - 0.5) * 0.025, 0.1, 1).toFixed(3));
  agent.strategy.defense = Number(clamp(agent.strategy.defense + reward + (opponent.strategy.defense - agent.strategy.defense) * 0.08 + (random() - 0.5) * 0.025, 0.1, 1).toFixed(3));
  agent.strategy.adapt = Number(clamp(agent.strategy.adapt + reward + (opponent.strategy.adapt - agent.strategy.adapt) * 0.1 + (random() - 0.5) * 0.025, 0.1, 1).toFixed(3));

  const currentFit = getStrategyFit(agent.strategy, mode);
  const candidates = STRATEGY_TEMPLATES
    .filter((template) => template.name !== agent.strategy.name)
    .map((template) => ({ template, fit: getStrategyFit(template, mode) }))
    .sort((left, right) => right.fit - left.fit);
  const bestCandidate = candidates[0];
  const improvement = (bestCandidate?.fit ?? currentFit) - currentFit;
  const shouldChangeStyle = bestCandidate && improvement > 0.045 && (won ? random() < 0.18 : random() < 0.62);
  if (shouldChangeStyle) {
    const nextStyle = bestCandidate.template;
    if (nextStyle) {
      agent.strategy.name = nextStyle.name;
      agent.strategy.style = nextStyle.style;
      agent.strategy.attack = Number(((agent.strategy.attack + nextStyle.attack) / 2).toFixed(3));
      agent.strategy.defense = Number(((agent.strategy.defense + nextStyle.defense) / 2).toFixed(3));
      agent.strategy.adapt = Number(((agent.strategy.adapt + nextStyle.adapt) / 2).toFixed(3));
      agent.lastAction = `Đổi sang phong cách ${nextStyle.style} để hợp luật trận`;
    }
  }
  agent.strategy.version = (agent.strategy.version ?? 1) + 1;
}

export function createBattleRoyaleArena({ gameType = 'random', agentCount = 4, seed = Date.now() } = {}) {
  const random = randomFrom(seed);
  const mode = pickMode(gameType, random);
  const count = Math.min(8, Math.max(2, Number(agentCount) || 4));
  const agents = Array.from({ length: count }, (_, index) => {
    const template = STRATEGY_TEMPLATES[index];
    return {
      id: `AI-${String(index + 1).padStart(2, '0')}`,
      name: `AI ${String(index + 1).padStart(2, '0')}`,
      strategy: { ...template, version: 1 },
      exploration: Number((0.25 + random() * 0.45).toFixed(3)),
      score: 0,
      elo: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      rounds: 0,
      currentStreak: 0,
      learning: Number((0.35 + random() * 0.35).toFixed(3)),
      lastAction: 'Đang chờ trận',
    };
  });

  return {
    seed,
    gameType,
    mode,
    round: 0,
    status: 'ready',
    agents,
    scoreSeries: [{ round: 0, value: 0 }],
    lastWinnerId: null,
    eventLog: [{ timeStamp: '00:00:00', message: `${mode.name}: tất cả AI bắt đầu với cùng điều kiện thi đấu.`, type: 'info' }],
  };
}

export function stepBattleRoyaleArena(arena) {
  if (!arena || !Array.isArray(arena.agents)) return arena;

  const next = { ...arena, round: arena.round + 1, status: 'running', agents: arena.agents.map((agent) => ({ ...agent, strategy: { ...agent.strategy } })), eventLog: [...(arena.eventLog ?? [])] };
  const random = randomFrom((arena.seed ?? 7) + next.round * 97);
  const scored = next.agents.map((agent) => ({ agent, battleScore: scoreAgent(agent, arena.mode, random, next.round) })).sort((left, right) => right.battleScore - left.battleScore);
  const winner = scored[0]?.agent;
  const runnerUp = scored[1]?.agent;
  const averageElo = next.agents.reduce((sum, agent) => sum + agent.elo, 0) / Math.max(1, next.agents.length);
  const fieldSize = Math.max(1, next.agents.length - 1);
  const strategySnapshot = new Map(next.agents.map((agent) => [agent.id, { ...agent.strategy }]));

  scored.forEach(({ agent, battleScore }, index) => {
    agent.rounds += 1;
    agent.score = Number((agent.score + battleScore).toFixed(1));
    agent.lastAction = index === 0 ? `Thắng vòng bằng chiến thuật ${agent.strategy.style}` : 'Đang học từ đối thủ mạnh hơn';
    if (index === 0) {
      agent.wins += 1;
      agent.currentStreak = Math.max(1, agent.currentStreak + 1);
      const expected = 1 / (1 + 10 ** ((averageElo - agent.elo) / 400));
      agent.elo = Math.round(1000 + (agent.elo - 1000) * 0.92 + 20 * (1 - expected));
      updateLearning(agent, { strategy: strategySnapshot.get((runnerUp ?? agent).id) }, arena.mode, true, random);
    } else {
      agent.losses += 1;
      agent.currentStreak = 0;
      const expected = 1 / (1 + 10 ** ((averageElo - agent.elo) / 400));
      const actual = (fieldSize - index) / fieldSize;
      agent.elo = Math.round(1000 + (agent.elo - 1000) * 0.92 + 20 * (actual - expected));
      updateLearning(agent, { strategy: strategySnapshot.get((winner ?? agent).id) }, arena.mode, false, random);
    }
  });

  next.agents.sort((left, right) => right.elo - left.elo || right.wins - left.wins || right.score - left.score);
  next.lastWinnerId = winner?.id ?? null;
  next.scoreSeries = [...(arena.scoreSeries ?? []), { round: next.round, value: winner ? Number(winner.score.toFixed(1)) : 0 }].slice(-30);
  next.eventLog.unshift({ timeStamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: `${winner?.name ?? 'AI'} thắng vòng ${next.round}; các AI khác đã cập nhật chiến thuật từ kết quả.`, type: 'success' });
  next.eventLog = next.eventLog.slice(0, 10);
  return next;
}

export { BATTLE_MODES };
