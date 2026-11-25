import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Gamepad2,
  Layers,
  Lock,
  Plus,
  Share2,
  Sliders,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/os/Button';
import {
  StudioSegmentedBar,
  StudioWorkspaceHeader,
} from '@/components/studio/StudioPrimitives';

import StepGuide from './components/StepGuide.jsx';
import HexBreakdown from './components/HexBreakdown.jsx';
import CharLookupModal from './components/CharLookupModal.jsx';
import SnakeGameGuide from './components/SnakeGameGuide.jsx';

import { generate580Spell } from './utils/spell580.js';

const PRESETS = [
  { label: 'PASS KỲ THI', text: 'PASS KỲ THI', model: 'fx-580VN X' },
  { label: 'HELLO CASIO', text: 'HELLO CASIO', model: 'fx-580VN X' },
  { label: 'I LOVE YOU 3000', text: 'I LOVE YOU 3000', model: 'fx-580VN X' },
  { label: 'Rắn săn mồi (Native)', isAdvanced: true, model: 'fx-580VN X' },
];

const OUTPUT_TABS = [
  { id: 'steps', label: 'Hướng dẫn bấm phím', icon: Layers },
  { id: 'raw', label: 'Màn hình Console', icon: Terminal },
  { id: 'hex', label: 'Giải mã Byte Hex', icon: Sliders },
];

function TerminalSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-slate-800 bg-[#0b0e14] p-6 font-mono text-xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-slate-700" />
          <div className="size-2.5 rounded-full bg-slate-700" />
          <div className="size-2.5 rounded-full bg-slate-700" />
        </div>
        <div className="h-4 w-24 rounded bg-slate-800" />
      </div>
      <div className="space-y-2.5 pt-1">
        <div className="h-3.5 w-44 rounded bg-slate-800" />
        <div className="h-3.5 w-3/4 rounded bg-slate-800/80" />
        <div className="h-3.5 w-1/2 rounded bg-slate-800/60" />
        <div className="h-3.5 w-5/6 rounded bg-slate-800/70" />
      </div>
    </div>
  );
}

export default function CasioSpell() {
  const [selectedModel, setSelectedModel] = useState('fx-580VN X');
  const [inputText, setInputText] = useState('PASS KỲ THI');
  const [method580, setMethod580] = useState('var'); // 'var' | 'inj' | 'advanced'
  const [multiLines580, setMultiLines580] = useState([
    'PASS KY THI',
    'CASIO FX-580VN X',
    'WINDHUB TOOL 2026',
    'SUCCESS',
  ]);

  const [activeTab, setActiveTab] = useState('steps');
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [advancedItem, setAdvancedItem] = useState('snake');

  const handleShareTool = async () => {
    const shareUrl = `${window.location.origin}/tools?toolId=Casio580Spell`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết truy cập nhanh Casio fx-580VN X Spell!');
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Casio fx-580VN X Spell',
          text: 'Tool Spell viết chữ trên máy tính Casio ClassWiz 580',
          url: shareUrl,
        });
      } catch {
        // Ignore AbortError
      }
    }
  };

  const triggerLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 180);
  };

  const handleSelectModel = (model) => {
    if (model.isLocked) {
      toast.info(`Tính năng cho dòng máy ${model.name} đang được nghiên cứu và sắp ra mắt!`);
      return;
    }
    if (model.id === selectedModel) return;
    triggerLoading();
    setSelectedModel(model.id);
  };

  const handleSelectMethod580 = (method) => {
    if (method === method580) return;
    triggerLoading();
    setMethod580(method);
    if (method === 'advanced') {
      setActiveTab('advanced');
    } else if (activeTab === 'advanced') {
      setActiveTab('steps');
    }
  };

  const handleSelectTab = (tab) => {
    if (tab === activeTab) return;
    triggerLoading();
    setActiveTab(tab);
    if (tab === 'advanced') {
      setMethod580('advanced');
    } else if (method580 === 'advanced') {
      setMethod580('var');
    }
  };

  const result580 = useMemo(() => {
    if (method580 === 'inj') {
      return generate580Spell(multiLines580.filter(Boolean), 'inj');
    }
    return generate580Spell(inputText, 'var');
  }, [inputText, method580, multiLines580]);

  const handleCopyRawTerminal = () => {
    const textToCopy = result580.rawTerminalOutput || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedRaw(true);
    toast.success('Đã sao chép chính xác kết quả Console');
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result580.rawTerminalOutput || '');
    setCopiedAll(true);
    toast.success('Đã sao chép toàn bộ nội dung hướng dẫn!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const applyPreset = (preset) => {
    triggerLoading();
    setSelectedModel(preset.model);
    if (preset.isAdvanced) {
      handleSelectMethod580('advanced');
      toast.info('Đã mở Hướng dẫn Game Rắn săn mồi (Snake Game)!');
      return;
    }
    if (method580 === 'advanced') {
      setMethod580('var');
      setActiveTab('steps');
    }
    setInputText(preset.text);
    toast.info(`Đã nạp mẫu: "${preset.label}"`);
  };

  const lcdPreviewLines = useMemo(() => {
    if (method580 === 'advanced') {
      return ['SNAKE GAME v1.0', 'ADDR: 0xE9E0', '672 BYTES READY'];
    }
    if (method580 === 'inj') {
      return multiLines580.filter(Boolean).slice(0, 4);
    }
    return [result580.centeredText || inputText || ' '];
  }, [inputText, method580, multiLines580, result580.centeredText]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-8 text-[var(--os-text-primary)]">
      {/* 1. COMMERCIAL WORKBENCH HEADER */}
      <StudioWorkspaceHeader
        eyebrow="HARDWARE COMPILER"
        title="Casio fx-580VN X Spell Workbench"
        description="Tự động căn giữa 17 ký tự, biên dịch chuỗi tràn bộ nhớ Basic Overflow, QuickCPY++ đa dòng và mã máy nX-U8/100."
        emblemVariant="casio"
        tone="sky"
        badges={['ClassWiz', 'UTF-8 → Hex']}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<BookOpen size={14} />}
              onClick={() => setIsLookupOpen(true)}
            >
              Bảng mã Hex
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Share2 size={14} />}
              onClick={handleShareTool}
            >
              Chia sẻ
            </Button>
            {method580 !== 'advanced' && (
              <Button
                variant="primary"
                size="sm"
                icon={copiedAll ? <Check size={14} /> : <Copy size={14} />}
                onClick={handleCopyAll}
              >
                {copiedAll ? 'Đã chép toàn bộ' : 'Sao chép tất cả'}
              </Button>
            )}
          </>
        }
      />

      {/* 2. HARDWARE TARGET & METHOD BAR */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Hardware Model Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)] pr-1">
            Dòng máy:
          </span>
          {[
            { id: 'fx-580VN X', name: 'Casio fx-580VN X', isLocked: false },
            { id: 'fx-880BTG', name: 'Casio fx-880BTG', isLocked: true },
          ].map((m) => {
            const active = m.id === selectedModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectModel(m)}
                className={`os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-bold transition-colors ${
                  m.isLocked
                    ? 'border-dashed border-[var(--os-border-default)] text-[var(--os-text-muted)] opacity-70 cursor-not-allowed'
                    : active
                    ? 'border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]'
                    : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] cursor-pointer'
                }`}
              >
                <span>{m.name}</span>
                {m.isLocked && <Lock size={12} className="text-[var(--os-warning)]" />}
              </button>
            );
          })}
        </div>

        {/* Overflow Method Switcher */}
        {selectedModel === 'fx-580VN X' && (
          <div className="os-sunken inline-flex flex-wrap items-center gap-1 rounded-[var(--radius-md)] p-1">
            {[
              { id: 'var', label: 'Biến A, B, C' },
              { id: 'inj', label: 'QuickCPY++ (8 dòng)' },
              { id: 'advanced', label: 'Nạp Game Native', icon: Gamepad2 },
            ].map((m) => {
              const active = method580 === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMethod580(m.id)}
                  className={`os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                    active
                      ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs border border-[var(--os-border-default)]'
                      : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. INPUT WORKBENCH + LIVE LCD TELEMETRY */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.65fr] items-start">
        {/* Left: Input Editor */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5 space-y-4">
          {method580 === 'advanced' ? (
            <div className="space-y-3">
              <p className="font-mono text-xs font-semibold text-[var(--os-text-secondary)]">
                Chọn chương trình mã máy (Homebrew) nạp vào RAM Casio fx-580VN X:
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdvancedItem('snake');
                    setActiveTab('advanced');
                  }}
                  className={`os-focus-ring rounded-[var(--radius-md)] border p-4 text-left cursor-pointer transition-all ${
                    advancedItem === 'snake'
                      ? 'border-[var(--os-success-border)] bg-[var(--os-success-soft)]'
                      : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] hover:border-[var(--os-border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--os-text-primary)]">
                      <Gamepad2 size={16} className="text-[var(--os-success)]" />
                      <span>Rắn săn mồi (Snake)</span>
                    </span>
                    <span className="rounded-md bg-[var(--os-surface-1)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--os-success)]">
                      Đang chọn
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--os-text-secondary)]">
                    Xóa vùng 0xE9E0, nạp 7 khối Hex (672 bytes) qua Quickcpymax và khởi chạy trực tiếp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toast.info('Flappy Bird Casio đang được tối ưu hóa mã máy và sẽ cập nhật sớm.')
                  }
                  className="rounded-[var(--radius-md)] border border-dashed border-[var(--os-border-default)] bg-[var(--os-surface-2)]/50 p-4 text-left opacity-65 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--os-text-secondary)]">
                      <Cpu size={16} />
                      <span>Flappy Bird LCD</span>
                    </span>
                    <span className="rounded-md bg-[var(--os-surface-3)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-muted)]">
                      Sắp ra mắt
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--os-text-muted)]">
                    Trò chơi vượt chướng ngại vật trên ma trận điểm LCD 192×63.
                  </p>
                </button>
              </div>
            </div>
          ) : method580 === 'inj' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-text-secondary)]">
                  Trình soạn đa dòng QuickCPY++
                </label>
                <span className="font-mono text-[11px] text-[var(--os-text-muted)]">
                  {multiLines580.length}/8 dòng · tối đa 32 ký tự/dòng
                </span>
              </div>

              <div className="space-y-2">
                {multiLines580.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-2.5">
                    <span className="w-14 shrink-0 font-mono text-xs font-bold text-[var(--os-info)]">
                      Dòng {lIdx + 1}
                    </span>
                    <input
                      type="text"
                      maxLength={32}
                      value={line}
                      onChange={(e) => {
                        const next = [...multiLines580];
                        next[lIdx] = e.target.value;
                        setMultiLines580(next);
                      }}
                      placeholder={`Nội dung dòng ${lIdx + 1}...`}
                      className="os-focus-ring h-10 flex-1 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 font-mono text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {multiLines580.length < 8 && (
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={<Plus size={13} />}
                    onClick={() =>
                      setMultiLines580([...multiLines580, `DONG ${multiLines580.length + 1}`])
                    }
                  >
                    Thêm dòng
                  </Button>
                )}
                {multiLines580.length > 1 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<Trash2 size={13} />}
                    onClick={() => setMultiLines580(multiLines580.slice(0, -1))}
                  >
                    Xóa dòng cuối
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="casio-spell-input"
                  className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-text-secondary)]"
                >
                  Chuỗi văn bản cần hiển thị
                </label>
                <span className="font-mono text-xs font-semibold text-[var(--os-info)]">
                  {inputText.length} / 17 ký tự
                </span>
              </div>
              <input
                id="casio-spell-input"
                type="text"
                value={inputText}
                maxLength={17}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập văn bản (hỗ trợ tiếng Việt có dấu)..."
                className="os-focus-ring h-12 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 font-mono text-base font-bold tracking-wide text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
              />
              <p className="text-xs text-[var(--os-text-muted)]">
                Tự động căn giữa màn hình 17 cột và chuyển đổi ký tự tiếng Việt sang mã 2-byte F4xx.
              </p>
            </div>
          )}

          {/* Quick Sample Presets */}
          <div className="border-t border-[var(--os-border-subtle)] pt-3.5">
            <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
              Mẫu nạp nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    p.isAdvanced
                      ? 'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-success)] hover:opacity-90'
                      : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-text-primary)]'
                  }`}
                >
                  {p.isAdvanced && <Gamepad2 size={13} />}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live LCD Preview + Register Telemetry */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
              Mô phỏng màn hình LCD
            </span>
            <span className="font-mono text-[10px] font-bold text-[var(--os-success)]">
              192 × 63 px
            </span>
          </div>

          {/* Authentic ClassWiz LCD Screen */}
          <div className="rounded-[var(--radius-md)] border-2 border-[#2d3542] bg-[#c7d5c6] p-3 text-[#121a14] shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-black/10 pb-1 font-mono text-[9px] font-bold opacity-75">
              <span>M · D · Math</span>
              <span>{selectedModel}</span>
            </div>
            <div className="my-2.5 flex min-h-12 flex-col justify-center font-mono">
              {lcdPreviewLines.map((line, i) => (
                <p
                  key={i}
                  className={`truncate font-black tracking-[0.12em] ${
                    lcdPreviewLines.length > 1 ? 'text-xs leading-snug' : 'text-center text-base sm:text-lg'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Telemetry Key-Value Rows */}
          {isLoading ? (
            <div className="space-y-2 animate-pulse py-1">
              <div className="h-4 w-full rounded bg-[var(--os-surface-3)]" />
              <div className="h-4 w-4/5 rounded bg-[var(--os-surface-3)]" />
              <div className="h-4 w-3/5 rounded bg-[var(--os-surface-3)]" />
            </div>
          ) : (
            <dl className="divide-y divide-[var(--os-border-subtle)] font-mono text-xs">
              <div className="flex items-center justify-between py-2">
                <dt className="text-[var(--os-text-muted)]">Chế độ nạp</dt>
                <dd className="font-bold text-[var(--os-info)]">
                  {method580 === 'var'
                    ? 'Basic Overflow'
                    : method580 === 'inj'
                    ? 'QuickCPY++'
                    : 'Quickcpymax Hex'}
                </dd>
              </div>
              {method580 === 'advanced' ? (
                <>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-[var(--os-text-muted)]">Dung lượng</dt>
                    <dd className="font-bold text-[var(--os-success)]">7 Khối · 672 bytes</dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-[var(--os-text-muted)]">Địa chỉ RAM</dt>
                    <dd className="font-bold text-[var(--os-text-primary)]">0xE9E0</dd>
                  </div>
                </>
              ) : method580 === 'var' ? (
                <>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-[var(--os-text-muted)]">Ký tự mồi Hex</dt>
                    <dd className="font-bold text-[var(--os-accent)]">
                      {result580.char1?.join('') || 'C'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-[var(--os-text-muted)]">Biến thanh ghi</dt>
                    <dd className="font-bold text-[var(--os-text-primary)]">
                      {result580.variablesPrinted?.join(', ') || 'A'}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <dt className="text-[var(--os-text-muted)]">Địa chỉ nạp</dt>
                  <dd className="font-bold text-[var(--os-text-primary)]">
                    0x{result580.address || 'EA30'}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <p className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] px-3 py-2 text-[11px] leading-relaxed text-[var(--os-text-muted)]">
            <Zap size={13} className="mt-0.5 shrink-0 text-[var(--os-accent)]" />
            <span>
              {method580 === 'advanced'
                ? 'Mã máy thực thi trực tiếp trên RAM, tự khôi phục nguyên trạng khi nhấn phím ON.'
                : 'Thuật toán tự tính byte tràn và căn lề chính xác cho bộ đệm màn hình.'}
            </span>
          </p>
        </div>
      </div>

      {/* 4. OUTPUT SECTION */}
      {method580 === 'advanced' ? (
        <SnakeGameGuide />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto no-scrollbar">
            <StudioSegmentedBar
              items={OUTPUT_TABS}
              activeId={activeTab}
              onSelect={handleSelectTab}
              layoutId="casio-output-tab-pill"
              ariaLabel="Chế độ xem kết quả Casio"
            />
          </div>

          {activeTab === 'steps' && (
            <StepGuide steps={result580.steps} loading={isLoading} />
          )}

          {activeTab === 'raw' && (
            <div>
              {isLoading ? (
                <TerminalSkeleton />
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-slate-800 bg-[#0b0e14] font-mono shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-[#111620] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-rose-500/80" />
                      <span className="size-2.5 rounded-full bg-amber-500/80" />
                      <span className="size-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-xs font-semibold text-slate-300">
                        casio-fx580vnx // raw-sequence
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyRawTerminal}
                      className="os-focus-ring inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      {copiedRaw ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                      <span>{copiedRaw ? 'Đã sao chép' : 'Sao chép Console'}</span>
                    </button>
                  </div>

                  <pre className="overflow-x-auto p-5 text-xs sm:text-sm leading-relaxed text-emerald-400 whitespace-pre-wrap select-all">
                    {result580.rawTerminalOutput}
                  </pre>

                  <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2.5 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={13} />
                      <span>Chuẩn thuật toán Casio ClassWiz fx-580VN X</span>
                    </span>
                    <span>UTF-8 · HEX</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hex' && (
            <HexBreakdown
              text={method580 === 'inj' ? multiLines580.join(' ') : inputText}
              loading={isLoading}
            />
          )}
        </div>
      )}

      <CharLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />
    </div>
  );
}
