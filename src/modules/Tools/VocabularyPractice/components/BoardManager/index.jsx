import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Layers3, Pencil, Plus, Trash2, X } from 'lucide-react';
import Button from '@/components/os/Button';
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
      {/* Create New Board Bar */}
      <form
        onSubmit={createBoard}
        className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3"
      >
        <label className="sr-only" htmlFor="new-vocabulary-board">
          Tên bảng mới
        </label>
        <input
          id="new-vocabulary-board"
          value={newBoardName}
          onChange={(event) => setNewBoardName(event.target.value)}
          placeholder="Nhập tên bảng chủ đề mới (ví dụ: IELTS Reading, Giao tiếp IT)..."
          maxLength={48}
          className="os-focus-ring h-9.5 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 text-xs sm:text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!newBoardName.trim()}
          icon={<Plus size={14} />}
        >
          Tạo bảng mới
        </Button>
      </form>

      {/* Boards Accordion Stack */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {boards.map((board) => {
            const isActive = board.id === activeBoard?.id;
            const isSelected = selectedBoardIds.includes(board.id);

            return (
              <motion.article
                key={board.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                onClick={(event) => handleBoardSurfaceClick(event, board)}
                className={`overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--os-surface-1)] transition-colors ${
                  isActive
                    ? 'border-[var(--os-accent-border)] shadow-[var(--os-shadow-xs)]'
                    : 'border-[var(--os-border-default)]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5 px-3.5 py-3 sm:px-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(board.id)}
                    aria-label={`Chọn bảng ${board.name} để dò bài`}
                    className="size-4 shrink-0 accent-[var(--os-accent)] cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => activateBoard(board)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border ${
                        isActive
                          ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                          : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-muted)]'
                      }`}
                    >
                      <Layers3 size={15} />
                    </span>
                    <span className="min-w-0">
                      {editingBoardId === board.id ? (
                        <span className="sr-only">Đang đổi tên bảng</span>
                      ) : (
                        <span className="block truncate text-sm font-bold text-[var(--os-text-primary)]">
                          {board.name}
                        </span>
                      )}
                      <span className="block font-mono text-[11px] text-[var(--os-text-muted)]">
                        {board.words.length} cặp từ ·{' '}
                        <span className={isSelected ? 'text-[var(--os-success)] font-semibold' : ''}>
                          {isSelected ? 'Đang chọn ôn tập' : 'Tạm ẩn khi dò bài'}
                        </span>
                      </span>
                    </span>
                  </button>

                  {editingBoardId === board.id ? (
                    <form onSubmit={saveBoardName} className="flex min-w-0 flex-1 items-center gap-1.5">
                      <input
                        autoFocus
                        value={editingBoardName}
                        onChange={(event) => setEditingBoardName(event.target.value)}
                        maxLength={48}
                        aria-label="Tên bảng"
                        className="os-focus-ring min-w-0 flex-1 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs text-[var(--os-text-primary)] focus:border-[var(--os-accent)]"
                      />
                      <button
                        type="submit"
                        aria-label="Lưu tên bảng"
                        className="rounded p-1.5 text-[var(--os-success)] hover:bg-[var(--os-surface-hover)] cursor-pointer"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Hủy đổi tên"
                        onClick={() => setEditingBoardId(null)}
                        className="rounded p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={`Đổi tên ${board.name}`}
                        title="Đổi tên bảng"
                        onClick={() => {
                          setEditingBoardId(board.id);
                          setEditingBoardName(board.name);
                        }}
                        className="rounded-md p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa ${board.name}`}
                        title="Xóa bảng"
                        disabled={boards.length <= 1}
                        onClick={() => onDeleteBoard(board.id)}
                        className="rounded-md p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    aria-expanded={!board.collapsed}
                    aria-label={`${board.collapsed ? 'Mở' : 'Thu gọn'} bảng ${board.name}`}
                    onClick={() => onToggleCollapsed(board.id)}
                    className="rounded-md p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
                  >
                    <motion.span
                      className="block"
                      animate={{ rotate: board.collapsed ? -90 : 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {!board.collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/40 p-3.5 sm:p-4">
                        {isActive ? (
                          <div className="grid gap-4 lg:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.22fr)]">
                            <WordForm
                              key={`${board.id}:${editingWord?.id || 'new'}`}
                              word={editingWord}
                              onSave={saveWord}
                              onCancel={() => setEditingWord(null)}
                            />
                            <WordList
                              words={board.words}
                              onEdit={setEditingWord}
                              onDelete={(wordId) => onRemoveWord(board.id, wordId)}
                            />
                          </div>
                        ) : (
                          <WordList
                            words={board.words}
                            onEdit={(word) => {
                              onActiveBoardChange(board.id);
                              setEditingWord(word);
                            }}
                            onDelete={(wordId) => onRemoveWord(board.id, wordId)}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
