import { useState, useMemo } from 'react';
import {
  Calculator,
  Copy,
  Check,
  Terminal,
  Layers,
  Sliders,
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

import StepGuide from './components/StepGuide.jsx';
import HexBreakdown from './components/HexBreakdown.jsx';
import CharLookupModal from './components/CharLookupModal.jsx';

import { generate580Spell } from './utils/spell580.js';

const PRESETS = [
  { label: 'PASS KỲ THI', text: 'PASS KỲ THI', model: 'fx-580VN X' },
  { label: 'HELLO CASIO', text: 'HELLO CASIO', model: 'fx-580VN X' },
  { label: 'I LOVE YOU 3000', text: 'I LOVE YOU 3000', model: 'fx-580VN X' },
  { label: 'HACK CASIO 2026', text: 'HACK CASIO 2026', model: 'fx-580VN X' },
];

function TerminalSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl font-mono text-xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          <span className="text-zinc-500 text-xs ml-2">casio-fx580vnx: ~</span>
        </div>
        <div className="h-4 w-28 rounded bg-zinc-800" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 w-40 rounded bg-zinc-800" />
        <div className="h-4 w-3/4 rounded bg-zinc-800/80" />
        <div className="h-4 w-1/2 rounded bg-zinc-800/60" />
        <div className="h-4 w-5/6 rounded bg-zinc-800/70" />
        <div className="h-4 w-2/3 rounded bg-zinc-800/60" />
      </div>
    </div>
  );
}

export default function CasioSpell() {
  // Casio fx-580VN X là máy tính chính được chọn mặc định
  const [selectedModel, setSelectedModel] = useState('fx-580VN X');
  const [inputText, setInputText] = useState('PASS KỲ THI');
  const [method580, setMethod580] = useState('var'); // 'var' (A, B, C) | 'inj' (QuickCPY++)
  const [multiLines580, setMultiLines580] = useState([
    'PASS KY THI',
    'CASIO FX-580VN X',
    'WINDHUB TOOL 2026',
    'SUCCESS',
  ]);

  // Tabs: 'steps' (Step-by-step Cards - Mặc định) | 'raw' (Terminal) | 'hex' (Hex Breakdown)
  const [activeTab, setActiveTab] = useState('steps');
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chia sẻ nhanh liên kết truy cập công cụ
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
    setTimeout(() => setIsLoading(false), 200);
  };

  const handleSelectModel = (model) => {
    if (model.isLocked) {
      toast.info(`Tính năng cho dòng máy ${model.name} đang được phát triển và sắp ra mắt!`);
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
  };

  const handleSelectTab = (tab) => {
    if (tab === activeTab) return;
    triggerLoading();
    setActiveTab(tab);
  };

  // Tính toán kết quả cho Casio 580
  const result580 = useMemo(() => {
    if (method580 === 'inj') {
      return generate580Spell(multiLines580.filter(Boolean), 'inj');
    }
    return generate580Spell(inputText, 'var');
  }, [inputText, method580, multiLines580]);

  // Sao chép raw terminal output
  const handleCopyRawTerminal = () => {
    const textToCopy = result580.rawTerminalOutput || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedRaw(true);
    toast.success('Đã sao chép chính xác kết quả Console');
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Sao chép toàn bộ công thức
  const handleCopyAll = () => {
    navigator.clipboard.writeText(result580.rawTerminalOutput || '');
    setCopiedAll(true);
    toast.success('Đã sao chép toàn bộ nội dung hướng dẫn!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const applyPreset = (preset) => {
    triggerLoading();
    setSelectedModel(preset.model);
    setInputText(preset.text);
    toast.info(`Đã chọn mẫu: "${preset.label}"`);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-800 dark:text-slate-100 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-orange-500/5 to-transparent border border-sky-500/20">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-sky-500 uppercase tracking-widest">
            <Calculator size={16} />
            <span>Tool-Casio</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">
            Tool Spell trên CASIO fx-580VN X
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tự động căn giữa 17 ký tự, tràn bộ nhớ Basic Overflow và nạp mã hex vào biến A, B, C.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShareTool}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            title="Sao chép liên kết chia sẻ công cụ"
          >
            <Share2 size={14} className="text-sky-500" />
            <span>Chia sẻ công cụ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLookupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <BookOpen size={14} className="text-sky-500" />
            <span>Tra mã Hex</span>
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-mono shadow-sm transition"
          >
            {copiedAll ? <Check size={14} /> : <Copy size={14} />}
            <span>Sao chép tất cả</span>
          </button>
        </div>
      </div>

      {/* Model Selection Tabs - fx-580VN X & fx-880BTG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            id: 'fx-580VN X',
            name: 'Casio fx-580VN X',
            badge: 'Sẵn sàng · Hoàn thiện 100%',
            desc: 'Biến A-B-C, Basic Overflow, căn giữa 17 ký tự',
            isLocked: false,
          },
          {
            id: 'fx-880BTG',
            name: 'Casio fx-880BTG',
            badge: 'Sắp ra mắt',
            desc: 'Hỗ trợ dòng ClassWiz thế hệ mới fx-880BTG (Đang phát triển)',
            isLocked: true,
          },
        ].map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectModel(m)}
              className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all relative ${m.isLocked
                  ? 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 opacity-75 cursor-not-allowed hover:border-amber-400/50'
                  : isSelected
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/20 shadow-md scale-[1.01]'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {m.name}
                  {m.isLocked && <Lock size={14} className="text-amber-500" />}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${m.isLocked
                      ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-slate-300 dark:border-zinc-700 text-slate-500'
                    }`}
                >
                  {m.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Input Field & Method Selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Nội dung cần Spell ({selectedModel})
              </label>

              {/* Method switch for 580VN X */}
              {selectedModel === 'fx-580VN X' && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleSelectMethod580('var')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${method580 === 'var'
                      ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Biến A, B, C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMethod580('inj')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${method580 === 'inj'
                      ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Inject QuickCPY++
                  </button>
                </div>
              )}
            </div>

            {/* Input Inputs based on model & method */}
            {selectedModel === 'fx-580VN X' && method580 === 'inj' ? (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400 pb-1">
                  Nhập từ 1 đến 8 dòng (mỗi dòng tối đa 32 ký tự theo chuẩn QuickCPY++):
                </div>
                {multiLines580.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-500 w-14 shrink-0">
                      Dòng {lIdx + 1}:
                    </span>
                    <input
                      type="text"
                      maxLength={32}
                      value={line}
                      onChange={(e) => {
                        const newLines = [...multiLines580];
                        newLines[lIdx] = e.target.value;
                        setMultiLines580(newLines);
                      }}
                      placeholder={`Nội dung dòng ${lIdx + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm font-mono focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-1 text-xs font-mono">
                  {multiLines580.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setMultiLines580([...multiLines580, `Dòng ${multiLines580.length + 1}`])}
                      className="text-sky-500 hover:underline font-semibold"
                    >
                      + Thêm dòng (Tối đa 8)
                    </button>
                  )}
                  {multiLines580.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMultiLines580(multiLines580.slice(0, -1))}
                      className="text-slate-400 hover:text-rose-500 hover:underline"
                    >
                      - Xóa dòng cuối
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={inputText}
                  maxLength={selectedModel === 'fx-580VN X' ? 17 : 48}
                  onChange={(e) => {
                    setInputText(e.target.value);
                  }}
                  placeholder="Nhập chữ cần spell trên máy tính..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-base font-semibold focus:outline-none focus:border-sky-500 transition font-mono"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 px-1">
                  <span>Tối đa 17 ký tự (tự động căn giữa)</span>
                  <span>{inputText.length} / 17 ký tự</span>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <span className="block text-xs font-mono text-slate-400 mb-2">Mẫu gợi ý nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-sky-500 hover:text-white transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200 dark:border-zinc-800">
              Thông số cấu hình ({selectedModel})
            </h4>

            {isLoading ? (
              <div className="space-y-2.5 animate-pulse py-1">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-44 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
            ) : (
              <div className="text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Model:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedModel}</span>
                </div>

                {selectedModel === 'fx-580VN X' && (
                  <>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Phương pháp:</span>
                      <span className="font-bold text-sky-500">
                        {method580 === 'var' ? 'Biến A, B, C (Basic Overflow)' : 'Inject QuickCPY++'}
                      </span>
                    </div>

                    {method580 === 'var' ? (
                      <>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Ký tự Hex cần lấy:</span>
                          <span className="font-bold text-sky-500">
                            {result580.char1?.join('') || 'C'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Số biến sử dụng:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {result580.variablesPrinted?.join(', ') || 'A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>Chuỗi căn giữa:</span>
                          <span className="font-bold text-emerald-500">
                            "{result580.centeredText || ''}"
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Địa chỉ inject:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {result580.address || 'EA30'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 leading-relaxed">
              💡 Thuật toán tự động tính toán byte tràn và chèn mã hex chuẩn xác vào RAM.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => handleSelectTab('steps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'steps'
            ? 'bg-sky-500 text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
        >
          <Layers size={16} />
          <span>Hướng dẫn từng bước (Card View)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('raw')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'raw'
            ? 'bg-sky-500 text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
        >
          <Terminal size={16} />
          <span>Màn hình Console</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('hex')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'hex'
            ? 'bg-sky-500 text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
        >
          <Sliders size={16} />
          <span>Bảng phân tích mã Hex</span>
        </button>
      </div>

      {/* TAB 1: STEP BY STEP GUIDE (CARD VIEW) - MẶC ĐỊNH */}
      {activeTab === 'steps' && (
        <div className="space-y-6">
          <StepGuide steps={result580.steps} loading={isLoading} />
        </div>
      )}

      {/* TAB 2: RAW TERMINAL OUTPUT */}
      {activeTab === 'raw' && (
        <div className="space-y-4">
          {isLoading ? (
            <TerminalSkeleton />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-3 font-mono">
              {/* Terminal Window Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-zinc-400 text-xs ml-2 font-mono font-medium">
                    Casio fx-580VN X Spell
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRawTerminal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-mono border border-zinc-700"
                >
                  {copiedRaw ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedRaw ? 'Đã sao chép' : 'Sao chép Output'}</span>
                </button>
              </div>

              {/* Exact Terminal Console Text */}
              <div className="pt-2 text-xs sm:text-sm text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed select-all overflow-x-auto selection:bg-emerald-950 selection:text-emerald-300">
                {result580.rawTerminalOutput}
              </div>

              {/* Verified Badge */}
              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={13} />
                  <span>Chuẩn thuật toán Casio ClassWiz fx-580VN X</span>
                </span>
                <span className="text-zinc-600">Encoding: UTF-8</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HEX BREAKDOWN */}
      {activeTab === 'hex' && (
        <HexBreakdown
          text={
            method580 === 'inj'
              ? multiLines580.join(' ')
              : inputText
          }
          model={selectedModel}
          loading={isLoading}
        />
      )}

      {/* Character Lookup Modal */}
      <CharLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />
    </div>
  );
}
