import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  Gamepad2,
  Info,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/os/Button';
import { SNAKE_GAME_DATA } from '../data/snakeGameData.js';
import { KeyBadgeRenderer } from './StepGuide.jsx';

export default function SnakeGameGuide() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeStepTab, setActiveStepTab] = useState(0);
  const [expandedHexBlock, setExpandedHexBlock] = useState(1);

  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success('Đã sao chép mã phím vào bộ nhớ tạm!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-[var(--os-text-primary)]">
      {/* Intro Header Panel */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--os-success-border)] bg-[var(--os-success-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-success)]">
                <Gamepad2 size={15} />
                <span>Homebrew Native · Casio fx-580VN X</span>
              </span>
              <span className="rounded-md border border-[var(--os-success-border)] bg-[var(--os-surface-1)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--os-success)]">
                Đã kiểm chứng
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
              {SNAKE_GAME_DATA.title}
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
              {SNAKE_GAME_DATA.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[11px] text-[var(--os-text-muted)]">
              <span className="inline-flex items-center gap-1 text-[var(--os-success)] font-semibold">
                <Cpu size={13} />
                <span>Kiến trúc: Renesas nX-U8/100 Core</span>
              </span>
              <span>·</span>
              <span>{SNAKE_GAME_DATA.author}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={copiedKey === 'all-snake' ? <Check size={14} /> : <Copy size={14} />}
            onClick={() =>
              handleCopy(
                SNAKE_GAME_DATA.steps
                  .map(
                    (s) =>
                      `=== ${s.title} ===\n${
                        s.actions?.map((a) => `${a.label}:\n${a.keys}`).join('\n') || ''
                      }`
                  )
                  .join('\n\n'),
                'all-snake'
              )
            }
          >
            {copiedKey === 'all-snake' ? 'Đã chép' : 'Sao chép toàn bộ'}
          </Button>
        </div>
      </div>

      {/* Concepts & Hex Key Mapping */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-warning)]">
            <Zap size={14} />
            <span>Khái niệm tràn bộ nhớ (Overflow)</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {SNAKE_GAME_DATA.concepts.map((concept, idx) => (
              <div
                key={idx}
                className="os-sunken rounded-[var(--radius-md)] p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[var(--os-text-primary)]">
                    {concept.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.keys, `concept-${idx}`)}
                    className="rounded p-1 text-[var(--os-text-muted)] hover:text-[var(--os-accent)] cursor-pointer"
                    title="Sao chép tổ hợp"
                  >
                    {copiedKey === `concept-${idx}` ? (
                      <Check size={13} className="text-[var(--os-success)]" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto py-1">
                  <KeyBadgeRenderer text={concept.keys} />
                </div>
                <p className="text-[11px] text-[var(--os-text-muted)]">{concept.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-info)]">
            <Terminal size={14} />
            <span>Quy ước phím Hex trong Quickcpymax</span>
          </div>

          <p className="text-xs text-[var(--os-text-secondary)]">
            Trong trình nạp Quickcpymax, các ký tự hex từ a đến f được gán vào phím hàm:
          </p>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3">
            {SNAKE_GAME_DATA.hexKeyMap.map((item, idx) => (
              <div
                key={idx}
                className="os-sunken rounded-[var(--radius-sm)] p-2.5 text-center"
              >
                <span className="block text-sm font-extrabold text-[var(--os-info)]">
                  {item.char}
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--os-text-secondary)]">
                  bấm <strong className="text-[var(--os-accent)]">{item.key}</strong>
                </span>
              </div>
            ))}
          </div>

          <p className="rounded-[var(--radius-sm)] border border-[var(--os-info-border)] bg-[var(--os-info-soft)] p-2.5 font-mono text-[11px] text-[var(--os-text-primary)]">
            Ví dụ: Nhập <strong>4e</strong> bằng tổ hợp <strong>[4] [cos]</strong>. Các phím 0–9 bấm bình thường.
          </p>
        </div>
      </div>

      {/* Step Filter Pills */}
      <div className="os-sunken inline-flex flex-wrap items-center gap-1 rounded-[var(--radius-md)] p-1">
        <button
          type="button"
          onClick={() => setActiveStepTab(0)}
          className={`os-focus-ring rounded-[var(--radius-sm)] px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer transition-colors ${
            activeStepTab === 0
              ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
              : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
          }`}
        >
          Tất cả (Bước 1–5)
        </button>
        {SNAKE_GAME_DATA.steps.map((s) => (
          <button
            key={s.stepNumber}
            type="button"
            onClick={() => setActiveStepTab(s.stepNumber)}
            className={`os-focus-ring rounded-[var(--radius-sm)] px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer transition-colors ${
              activeStepTab === s.stepNumber
                ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
                : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            Bước {s.stepNumber}
          </button>
        ))}
      </div>

      {/* Step Cards */}
      <div className="space-y-4">
        {SNAKE_GAME_DATA.steps
          .filter((s) => activeStepTab === 0 || activeStepTab === s.stepNumber)
          .map((step) => (
            <div
              key={step.stepNumber}
              className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--os-border-subtle)] pb-3">
                <div>
                  <h4 className="flex items-center gap-2.5 text-base font-bold text-[var(--os-text-primary)]">
                    <span className="flex size-6 items-center justify-center rounded-md bg-[var(--os-success-soft)] font-mono text-xs font-bold text-[var(--os-success)] border border-[var(--os-success-border)]">
                      {step.stepNumber}
                    </span>
                    <span>{step.title}</span>
                  </h4>
                  <p className="mt-1 text-xs text-[var(--os-text-secondary)]">
                    {step.description}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  icon={
                    copiedKey === `step-${step.stepNumber}` ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )
                  }
                  onClick={() =>
                    handleCopy(
                      step.actions?.map((a) => `${a.label}:\n${a.keys}`).join('\n\n') ||
                        step.subSections?.map((sub) => `${sub.name}:\n${sub.keys}`).join('\n\n') ||
                        '',
                      `step-${step.stepNumber}`
                    )
                  }
                >
                  Sao chép bước
                </Button>
              </div>

              {step.actions && (
                <div className="space-y-3">
                  {step.actions.map((act, actIdx) => (
                    <div
                      key={actIdx}
                      className="os-sunken rounded-[var(--radius-md)] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--os-text-primary)]">
                          {act.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(act.keys, `act-${step.stepNumber}-${actIdx}`)}
                          className="rounded p-1 text-[var(--os-text-muted)] hover:text-[var(--os-accent)] cursor-pointer"
                          title="Sao chép dãy phím"
                        >
                          {copiedKey === `act-${step.stepNumber}-${actIdx}` ? (
                            <Check size={13} className="text-[var(--os-success)]" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      <div className="overflow-x-auto py-1">
                        <KeyBadgeRenderer text={act.keys} />
                      </div>
                      {act.note && (
                        <p className="font-mono text-[11px] text-[var(--os-warning)]">
                          Lưu ý: {act.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step.subSections && (
                <div className="space-y-4">
                  {step.subSections.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="os-sunken rounded-[var(--radius-md)] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--os-text-primary)]">
                          {sub.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.keys, `sub-${sIdx}`)}
                          className="rounded p-1 text-[var(--os-text-muted)] hover:text-[var(--os-accent)] cursor-pointer"
                          title="Sao chép dãy phím"
                        >
                          {copiedKey === `sub-${sIdx}` ? (
                            <Check size={13} className="text-[var(--os-success)]" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-x-auto custom-scrollbar py-1">
                        <KeyBadgeRenderer text={sub.keys} />
                      </div>
                    </div>
                  ))}

                  {step.hexBlocks && (
                    <div className="space-y-3 border-t border-[var(--os-border-subtle)] pt-3">
                      <div>
                        <h5 className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--os-success)]">
                          <Layers size={15} />
                          <span>Bảng nạp 7 khối mã Hex (Vùng 0xE9E0)</span>
                        </h5>
                        <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
                          Mỗi khối gồm 6 dòng (96 bytes). Kết thúc mỗi khối bằng tổ hợp{' '}
                          <strong className="text-[var(--os-warning)]">[MENU] [3]</strong>.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {step.hexBlocks.map((blk) => {
                          const isExpanded = expandedHexBlock === blk.blockIndex;
                          const blockHexRaw = blk.hex.join('\n');
                          return (
                            <div
                              key={blk.blockIndex}
                              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)]"
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  setExpandedHexBlock(isExpanded ? null : blk.blockIndex)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setExpandedHexBlock(isExpanded ? null : blk.blockIndex);
                                  }
                                }}
                                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[var(--os-surface-hover)]"
                              >
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="flex size-5 items-center justify-center rounded bg-[var(--os-success-soft)] font-mono text-xs font-bold text-[var(--os-success)]">
                                    {blk.blockIndex}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[var(--os-text-primary)]">
                                    {blk.title} (96 bytes)
                                  </span>
                                  <span className="rounded border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-warning)]">
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
                                    className="rounded p-1 text-[var(--os-text-muted)] hover:text-[var(--os-accent)] cursor-pointer"
                                    title="Sao chép khối Hex"
                                  >
                                    {copiedKey === `hex-blk-${blk.blockIndex}` ? (
                                      <Check size={13} className="text-[var(--os-success)]" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                  {isExpanded ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="border-t border-slate-800 bg-[#0b0e14] p-4 font-mono text-xs">
                                  <div className="space-y-1 overflow-x-auto custom-scrollbar text-emerald-400">
                                    {blk.hex.map((line, lIdx) => (
                                      <div key={lIdx} className="flex gap-4">
                                        <span className="w-6 select-none text-right text-slate-600">
                                          {(lIdx * 16).toString(16).padStart(2, '0')}
                                        </span>
                                        <span className="font-bold tracking-wider">{line}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[11px] text-amber-300">
                                    <ArrowRight size={12} />
                                    <span>Kết thúc khối: bấm [MENU] [3]</span>
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

      {/* Controls Footer */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-5 space-y-4">
        <h4 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
          <Gamepad2 size={18} className="text-[var(--os-success)]" />
          <span>Phím điều khiển trong trò chơi</span>
        </h4>
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs sm:grid-cols-4">
          {SNAKE_GAME_DATA.controls.map((c, cIdx) => (
            <div key={cIdx} className="os-sunken rounded-[var(--radius-md)] p-3 text-center">
              <span className="block text-base font-extrabold text-[var(--os-success)]">
                {c.key}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--os-text-secondary)]">
                {c.action}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] p-3 text-xs text-[var(--os-text-secondary)]">
          <Info size={15} className="mt-0.5 shrink-0 text-[var(--os-warning)]" />
          <span>
            Nhấn phím <strong>[ON]</strong> hoặc <strong>[SHIFT] [9] [3] [=] [=]</strong> để khôi phục toàn bộ RAM về trạng thái mặc định của Casio fx-580VN X.
          </span>
        </div>
      </div>
    </div>
  );
}
