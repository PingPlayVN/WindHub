// src/modules/Tools/CasioSpell/components/SnakeGameGuide.jsx
import { useState } from 'react';
import {
  Gamepad2,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { SNAKE_GAME_DATA } from '../data/snakeGameData.js';
import { KeyBadgeRenderer } from './StepGuide.jsx';

export default function SnakeGameGuide() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeStepTab, setActiveStepTab] = useState(0); // 0 = all, 1 = Step 1, 2 = Step 2...
  const [expandedHexBlock, setExpandedHexBlock] = useState(1);

  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success('Đã sao chép mã phím vào bộ nhớ tạm!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Banner Giới thiệu Snake Game */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-black p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Gamepad2 size={18} />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                Homebrew Game · Casio fx-580VN X
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                100% Đã kiểm chứng
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {SNAKE_GAME_DATA.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {SNAKE_GAME_DATA.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Cpu size={13} />
                <span>Kiến trúc: Renesas nX-U8/100 Core</span>
              </span>
              <span>•</span>
              <span>{SNAKE_GAME_DATA.author}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(
              SNAKE_GAME_DATA.steps.map(s => `=== ${s.title} ===\n${s.actions?.map(a => `${a.label}:\n${a.keys}`).join('\n') || ''}`).join('\n\n'),
              'all-snake'
            )}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-bold text-xs transition shadow-sm"
          >
            {copiedKey === 'all-snake' ? <Check size={14} /> : <Copy size={14} />}
            <span>Sao chép toàn bộ</span>
          </button>
        </div>
      </div>

      {/* 1. MỘT SỐ KHÁI NIỆM & QUY ƯỚC PHÍM GÕ HEX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khái niệm Overflow */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-500 tracking-wider">
            <Sparkles size={15} />
            <span>Khái niệm tràn bộ nhớ (Overflow)</span>
          </div>

          <div className="space-y-3 text-xs">
            {SNAKE_GAME_DATA.concepts.map((concept, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {concept.name}:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.keys, `concept-${idx}`)}
                    className="p-1 text-slate-400 hover:text-amber-500 transition"
                    title="Sao chép tổ hợp"
                  >
                    {copiedKey === `concept-${idx}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="overflow-x-auto py-1">
                  <KeyBadgeRenderer text={concept.keys} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {concept.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quy ước phím gõ Hex */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-sky-500 tracking-wider">
            <Terminal size={15} />
            <span>Quy ước gõ mã Hex trong Quickcpymax</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Khi màn hình ở trình nạp Quickcpymax, các phím ký tự hex từ a đến f được gán tương ứng:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {SNAKE_GAME_DATA.hexKeyMap.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-center">
                <span className="block font-bold text-sky-500 text-sm">{item.char}</span>
                <span className="block text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  bấm <strong className="text-amber-500">{item.key}</strong>
                </span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-600 dark:text-sky-300 font-mono">
            💡 Ví dụ: Muốn nhập <strong className="text-white bg-sky-600 px-1.5 py-0.5 rounded">4e</strong> thì gõ: <span className="font-bold">[4] [cos]</span>. Phím 0-9 nhập bình thường.
          </div>
        </div>
      </div>

      {/* 2. THANH LỰA CHỌN BƯỚC */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveStepTab(0)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition shrink-0 ${
            activeStepTab === 0
              ? 'bg-emerald-500 text-black shadow-xs font-bold'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tất cả các bước (1-5)
        </button>

        {SNAKE_GAME_DATA.steps.map((s) => (
          <button
            key={s.stepNumber}
            type="button"
            onClick={() => setActiveStepTab(s.stepNumber)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition shrink-0 ${
              activeStepTab === s.stepNumber
                ? 'bg-emerald-500 text-black shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bước {s.stepNumber}
          </button>
        ))}
      </div>

      {/* 3. NỘI DUNG CÁC BƯỚC THỰC HIỆN */}
      <div className="space-y-6">
        {SNAKE_GAME_DATA.steps
          .filter((s) => activeStepTab === 0 || activeStepTab === s.stepNumber)
          .map((step) => (
            <div
              key={step.stepNumber}
              className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500 text-xs font-mono font-bold">
                      {step.stepNumber}
                    </span>
                    <span>{step.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {step.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(
                    step.actions?.map(a => `${a.label}:\n${a.keys}`).join('\n\n') ||
                    step.subSections?.map(sub => `${sub.name}:\n${sub.keys}`).join('\n\n') || '',
                    `step-${step.stepNumber}`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition border border-slate-200 dark:border-zinc-800"
                >
                  {copiedKey === `step-${step.stepNumber}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>Sao chép bước này</span>
                </button>
              </div>

              {/* Step Actions (for Steps 1, 2, 4, 5) */}
              {step.actions && (
                <div className="space-y-3">
                  {step.actions.map((act, actIdx) => (
                    <div
                      key={actIdx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/70 dark:border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {act.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(act.keys, `act-${step.stepNumber}-${actIdx}`)}
                          className="p-1 text-slate-400 hover:text-emerald-500 transition"
                          title="Sao chép dãy phím"
                        >
                          {copiedKey === `act-${step.stepNumber}-${actIdx}` ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>

                      <div className="overflow-x-auto py-1">
                        <KeyBadgeRenderer text={act.keys} />
                      </div>

                      {act.note && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                          📌 {act.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-sections for Step 3 (3.1 -> 3.4) */}
              {step.subSections && (
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-sky-500 uppercase tracking-wider">
                    Các giai đoạn kích hoạt Quickcpymax:
                  </div>

                  {step.subSections.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/70 dark:border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {sub.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.keys, `sub-${sIdx}`)}
                          className="p-1 text-slate-400 hover:text-emerald-500 transition"
                          title="Sao chép dãy phím"
                        >
                          {copiedKey === `sub-${sIdx}` ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>

                      <div className="overflow-x-auto py-1 max-h-48 custom-scrollbar">
                        <KeyBadgeRenderer text={sub.keys} />
                      </div>
                    </div>
                  ))}

                  {/* 7 HEX BLOCKS INJECTION SECTION */}
                  {step.hexBlocks && (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-emerald-500 font-mono flex items-center gap-2">
                            <Layers size={16} />
                            <span>Bảng Nạp 7 Khối Mã Hex (Inject Hex vào e9e0)</span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Mỗi khối gồm 6 dòng (96 bytes). Kết thúc mỗi khối bằng phím <strong className="text-amber-500">[MENU] [3]</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {step.hexBlocks.map((blk) => {
                          const isExpanded = expandedHexBlock === blk.blockIndex;
                          const blockHexRaw = blk.hex.join('\n');
                          return (
                            <div
                              key={blk.blockIndex}
                              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs"
                            >
                              <div
                                onClick={() => setExpandedHexBlock(isExpanded ? null : blk.blockIndex)}
                                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                                    {blk.blockIndex}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {blk.title} (96 bytes)
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    Kết thúc: {blk.endKey}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(blockHexRaw, `hex-blk-${blk.blockIndex}`);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-500 transition"
                                    title="Sao chép toàn bộ khối Hex"
                                  >
                                    {copiedKey === `hex-blk-${blk.blockIndex}` ? (
                                      <Check size={13} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 pt-1 border-t border-slate-100 dark:border-zinc-900 bg-slate-900/40 font-mono text-xs">
                                  <div className="space-y-1 overflow-x-auto custom-scrollbar py-2 text-emerald-400 leading-relaxed selection:bg-emerald-950">
                                    {blk.hex.map((line, lIdx) => (
                                      <div key={lIdx} className="flex gap-4">
                                        <span className="text-zinc-600 select-none w-6 text-right">
                                          {(lIdx * 16).toString(16).padStart(2, '0')}
                                        </span>
                                        <span className="font-bold tracking-wider">{line}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-right text-[11px] text-amber-400 font-mono">
                                    👉 Kết thúc khối này: bấm phím <strong className="bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">[MENU] [3]</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 4. CÁCH CHƠI & ĐIỀU KHIỂN */}
      <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Gamepad2 size={20} className="text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cách chơi & Bàn phím điều khiển con rắn
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Sau khi hoàn thành Bước 5 và bấm <span className="font-bold text-emerald-500 font-mono">[CALC] [=]</span>, màn hình máy tính Casio fx-580VN X sẽ load game Rắn săn mồi. Sử dụng các phím điều hướng để di chuyển con rắn ăn điểm:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {SNAKE_GAME_DATA.controls.map((c, cIdx) => (
            <div
              key={cIdx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-center space-y-1"
            >
              <span className="block text-base font-bold text-emerald-400">{c.key}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">{c.action}</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Khi tắt máy hoặc bấm [ON] hoặc reset máy [SHIFT] [9] [3] [=] [=], toàn bộ RAM sẽ được khôi phục về trạng thái bình thường của Casio fx-580VN X, không gây hỏng hóc hay ảnh hưởng đến phần cứng máy tính.
          </span>
        </div>
      </div>
    </div>
  );
}
