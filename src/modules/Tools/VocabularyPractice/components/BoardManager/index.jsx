import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Layers3, Pencil, Plus, Trash2, X } from 'lucide-react';
import WordForm from '../WordForm';
import WordList from '../WordList';

export default function BoardManager({
  boards,
  activeBoardId,
  onActiveBoardChange,
  selectedBoardIds,
  onToggleSelection,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onToggleCollapsed,
  onAddWord,
  onRemoveWord,
}) {
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [editingWord, setEditingWord] = useState(null);
  const activeBoard = boards.find((board) => board.id === activeBoardId) || boards[0] || null;

  const activateBoard = (board) => {
    onActiveBoardChange(board.id);
    if (board.collapsed) onToggleCollapsed(board.id);
    setEditingWord(null);
  };

  const handleBoardSurfaceClick = (event, board) => {
    if (event.target.closest('button, input, textarea, select, form, a')) return;
    activateBoard(board);
  };

  const createBoard = (event) => {
    event.preventDefault();
    const boardId = onCreateBoard(newBoardName);
    if (!boardId) return;
    onActiveBoardChange(boardId);
    setNewBoardName('');
    setEditingWord(null);
  };

  const saveBoardName = (event) => {
    event.preventDefault();
    onRenameBoard(editingBoardId, editingBoardName);
    setEditingBoardId(null);
  };

  const saveWord = (entry) => {
    if (!activeBoard) return;
    onAddWord(activeBoard.id, entry, editingWord?.id);
    setEditingWord(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {boards.map((board) => {
            const isActive = board.id === activeBoard?.id;
            const isSelected = selectedBoardIds.includes(board.id);

            return (
              <motion.article
                key={board.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: isActive ? -1 : 0, scale: isActive ? 1.005 : 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{
                  layout: { duration: 0.2 },
                  opacity: { duration: 0.2 },
                  y: { type: 'spring', stiffness: 420, damping: 30 },
                  scale: { type: 'spring', stiffness: 420, damping: 30 },
                }}
                onClick={(event) => handleBoardSurfaceClick(event, board)}
                className={`overflow-hidden rounded-xl border bg-[#101319] transition-colors duration-300 ${isActive ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]' : 'border-slate-800'}`}
              >
                <div className="flex min-w-0 items-center gap-2 p-3 sm:gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(board.id)}
                    aria-label={`Chọn bảng ${board.name} để dò bài`}
                    className="h-4 w-4 shrink-0 accent-amber-400"
                  />
                  <button type="button" onClick={() => activateBoard(board)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <Layers3 size={16} className={isActive ? 'shrink-0 text-amber-300' : 'shrink-0 text-slate-500'} />
                    <span className="min-w-0">
                      {editingBoardId === board.id ? (
                        <span className="sr-only">Đang đổi tên bảng</span>
                      ) : (
                        <span className={`block truncate text-sm font-semibold ${isActive ? 'text-amber-200' : 'text-slate-200'}`}>{board.name}</span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-slate-500">{board.words.length} từ · {isSelected ? 'được chọn để dò' : 'chưa chọn dò'}</span>
                    </span>
                  </button>

                  {editingBoardId === board.id ? (
                    <form onSubmit={saveBoardName} className="flex min-w-0 flex-1 items-center gap-1">
                      <input autoFocus value={editingBoardName} onChange={(event) => setEditingBoardName(event.target.value)} maxLength={48} aria-label="Tên bảng" className="min-w-0 flex-1 rounded-md border border-slate-700 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                      <button type="submit" aria-label="Lưu tên bảng" className="rounded-md p-1.5 text-emerald-300 hover:bg-white/5"><Check size={15} /></button>
                      <button type="button" aria-label="Hủy đổi tên" onClick={() => setEditingBoardId(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/5"><X size={15} /></button>
                    </form>
                  ) : (
                    <>
                      <button type="button" aria-label={`Đổi tên ${board.name}`} title="Đổi tên bảng" onClick={() => { setEditingBoardId(board.id); setEditingBoardName(board.name); }} className="rounded-md p-2 text-slate-500 transition hover:bg-white/5 hover:text-amber-300">
                        <Pencil size={15} />
                      </button>
                      <button type="button" aria-label={`Xóa ${board.name}`} title="Xóa bảng" disabled={boards.length <= 1} onClick={() => onDeleteBoard(board.id)} className="rounded-md p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-25">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                  <button type="button" aria-expanded={!board.collapsed} aria-label={`${board.collapsed ? 'Mở' : 'Thu gọn'} bảng ${board.name}`} title={board.collapsed ? 'Mở bảng' : 'Thu gọn bảng'} onClick={() => onToggleCollapsed(board.id)} className="rounded-md p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
                    <motion.span className="block" animate={{ rotate: board.collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={17} /></motion.span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {!board.collapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <div className="border-t border-slate-800 p-3 sm:p-4">
                        <AnimatePresence mode="wait" initial={false}>
                          {isActive ? (
                            <motion.div
                              key={`editor-${board.id}`}
                              initial={{ opacity: 0, y: 10, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.995 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              className="grid gap-4 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]"
                            >
                              <WordForm key={`${board.id}:${editingWord?.id || 'new'}`} word={editingWord} onSave={saveWord} onCancel={() => setEditingWord(null)} />
                              <WordList words={board.words} onEdit={setEditingWord} onDelete={(wordId) => onRemoveWord(board.id, wordId)} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`preview-${board.id}`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.16 }}
                            >
                              <WordList words={board.words} onEdit={(word) => { onActiveBoardChange(board.id); setEditingWord(word); }} onDelete={(wordId) => onRemoveWord(board.id, wordId)} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={createBoard} className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-700 bg-[#101319] p-3">
        <label className="sr-only" htmlFor="new-vocabulary-board">Tên bảng mới</label>
        <input
          id="new-vocabulary-board"
          value={newBoardName}
          onChange={(event) => setNewBoardName(event.target.value)}
          placeholder="Tên bảng từ vựng mới"
          maxLength={48}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-black/40 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400"
        />
        <button type="submit" disabled={!newBoardName.trim()} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
          <Plus size={15} /> Tạo bảng
        </button>
      </motion.form>
    </div>
  );
}