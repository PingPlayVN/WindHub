import { useEffect, useMemo, useState } from 'react';
import { Activity, BrainCircuit, Crown, Dices, Gauge, Pause, Play, RotateCcw, Swords, Trophy, Users } from 'lucide-react';
import { BATTLE_MODES, createBattleRoyaleArena, stepBattleRoyaleArena } from './engine/battleRoyaleEngine';

const SPEED_OPTIONS = [1, 4, 12, 30];

function MetricCard({ title, value, detail, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}<span className={`rounded-xl p-2 ${tone}`}><Icon size={16} /></span></div>
      <div className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  );
}

function AgentCard({ agent, rank, champion }) {
  const winRate = agent.rounds ? (agent.wins / agent.rounds) * 100 : 0;
  return (
    <div className={`rounded-2xl border p-4 ${champion ? 'border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">#{rank}</div><div><div className="flex items-center gap-1 text-sm font-bold text-slate-950 dark:text-white">{agent.name} {champion && <Crown size={14} className="text-amber-500" />}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{agent.strategy.name} · {agent.strategy.style}</div></div></div><div className="text-right"><div className="text-lg font-black text-violet-600 dark:text-violet-300">{agent.elo}</div><div className="text-[10px] uppercase tracking-wider text-slate-400">Elo</div></div></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800"><b className="block text-sm text-slate-900 dark:text-white">{winRate.toFixed(0)}%</b><span className="text-slate-500">Win rate</span></div><div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800"><b className="block text-sm text-slate-900 dark:text-white">{agent.wins}</b><span className="text-slate-500">Thắng</span></div><div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800"><b className="block text-sm text-slate-900 dark:text-white">{agent.score.toFixed(0)}</b><span className="text-slate-500">Điểm</span></div></div>
      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{agent.lastAction}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.max(5, agent.learning * 100)}%` }} /></div>
    </div>
  );
}

export default function AILab() {
  const [arena, setArena] = useState(() => createBattleRoyaleArena({ agentCount: 4, gameType: 'random' }));
  const [agentCount, setAgentCount] = useState(4);
  const [gameType, setGameType] = useState('random');
  const [speed, setSpeed] = useState(4);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => setArena((current) => stepBattleRoyaleArena(current)), 1000 / speed);
    return () => window.clearInterval(interval);
  }, [isRunning, speed]);

  const champion = arena.agents[0];
  const lastWinner = arena.agents.find((agent) => agent.id === arena.lastWinnerId);
  const averageElo = useMemo(() => Math.round(arena.agents.reduce((sum, agent) => sum + agent.elo, 0) / arena.agents.length), [arena.agents]);
  const newMatch = () => { setArena(createBattleRoyaleArena({ agentCount, gameType, seed: Date.now() % 100000 })); setIsRunning(false); };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div className="flex items-start gap-4"><div className="rounded-2xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-300"><Swords size={30} /></div><div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500">WINDHUB / AI BATTLE</div><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">AI Battle Royale</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Các AI local đấu trong cùng một điều kiện công bằng.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setIsRunning((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-500">{isRunning ? <Pause size={16} /> : <Play size={16} />}{isRunning ? 'Tạm dừng' : 'Bắt đầu trận'}</button><button type="button" onClick={newMatch} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><RotateCcw size={16} /> Trận mới</button></div></div>
        <div className="mt-6 grid gap-3 rounded-2xl bg-slate-950 p-4 text-white md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-end"><label className="text-xs font-bold uppercase tracking-wider text-slate-400">Môn đấu<select value={gameType} onChange={(event) => setGameType(event.target.value)} className="mt-2 block w-full rounded-xl border-0 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white"><option value="random">Random mỗi trận</option>{BATTLE_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số AI: {agentCount}<input type="range" min="2" max="8" value={agentCount} onChange={(event) => setAgentCount(Number(event.target.value))} className="mt-4 block w-full accent-rose-500" /></label><label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tốc độ<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-2 block w-full rounded-xl border-0 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white">{SPEED_OPTIONS.map((value) => <option key={value} value={value}>{value} vòng/giây</option>)}</select></label><button type="button" onClick={newMatch} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-rose-100"><Dices size={16} /> Random trận</button></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard title="Trạng thái" value={isRunning ? 'Đang đấu' : 'Sẵn sàng'} detail={`Vòng ${arena.round}`} icon={Activity} tone="bg-emerald-100 text-emerald-700" /><MetricCard title="Môn đấu" value={arena.mode.name} detail={arena.mode.label} icon={Swords} tone="bg-rose-100 text-rose-700" /><MetricCard title="Điều kiện" value="Công bằng" detail="Cùng môn, cùng luật, không ưu tiên AI" icon={Dices} tone="bg-amber-100 text-amber-700" /><MetricCard title="Elo trung bình" value={averageElo} detail={`${arena.agents.length} AI đang tham chiến`} icon={Gauge} tone="bg-violet-100 text-violet-700" /></section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"><div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Battle board</div><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Xếp hạng theo Elo · Vòng #{arena.round}</h2></div><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Users size={15} /> {arena.agents.length}/8</div></div><div className="grid gap-3 md:grid-cols-2">{arena.agents.map((agent, index) => <AgentCard key={agent.id} agent={agent} rank={index + 1} champion={index === 0 && arena.round > 0} />)}</div></div><div className="space-y-6"><div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500"><Trophy size={15} /> Nhà vô địch hiện tại</div><div className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{arena.round ? champion?.name : 'Chưa có'}</div><div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{arena.round ? `${champion?.elo} Elo · ${champion?.wins} chiến thắng` : 'Bấm Bắt đầu trận để khai hỏa.'}</div></div><div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20"><div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">Thắng vòng gần nhất</div><div className="mt-2 text-xl font-black text-slate-950 dark:text-white">{lastWinner?.name ?? 'Chưa có'}</div><div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Kết quả từng vòng có thể thay đổi.</div></div><div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Log trận đấu</div><div className="space-y-3">{arena.eventLog.slice(0, 5).map((event, index) => <div key={`${event.timeStamp}-${index}`} className="border-l-2 border-rose-400 pl-3 text-sm text-slate-600 dark:text-slate-300"><div className="text-[10px] uppercase text-slate-400">{event.timeStamp}</div>{event.message}</div>)}</div></div></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><BrainCircuit size={15} /> Cách tính trận</div><div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3"><div><b className="text-slate-950 dark:text-white">1. Mỗi AI có chiến thuật riêng.</b><p className="mt-1">Phòng thủ, tốc độ, phân tích, liều lĩnh hoặc dài hạn.</p></div><div><b className="text-slate-950 dark:text-white">2. Mỗi vòng cùng một điều kiện.</b><p className="mt-1">Không có luật random làm AI này được lợi hơn AI khác.</p></div><div><b className="text-slate-950 dark:text-white">3. Sau vòng đấu, AI học.</b><p className="mt-1">Elo, win rate, điểm và chiến thuật được cập nhật ngay.</p></div></div></section>
    </div>
  );
}
