import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Brain, ClipboardPaste } from 'lucide-react';
import useVocabulary from './hooks/useVocabulary';
import PracticePanel from './components/PracticePanel';
import BoardManager from './components/BoardManager';
import QuickImportPanel from './components/QuickImportPanel';

const views = [
  { id: 'words', label: 'Bảng từ', icon: BookOpen },
  { id: 'import', label: 'Nhập nhanh', icon: ClipboardPaste },
  { id: 'practice', label: 'Dò bài', icon: Brain },
];

export default function VocabularyPractice() {
  const {
    boards,
    selectedBoardIds,
    createBoard,
    renameBoard,
    deleteBoard,
    toggleBoardCollapsed,
    toggleBoardSelection,
    addWord,
    addWords,
    removeWord,
  } = useVocabulary();
  const [activeView, setActiveView] = useState('words');
  const [importBoardId, setImportBoardId] = useState(boards[0]?.id || '');
  const importBoard = boards.find((board) => board.id === importBoardId) || boards[0] || null;
  const selectedBoards = boards.filter((board) => selectedBoardIds.includes(board.id));
  const selectedWords = selectedBoards.flatMap((board) => board.words);
  const practiceKey = selectedBoardIds.slice().sort().join('|') || 'no-selected-boards';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">Vocabulary practice</p>
          <p className="mt-1 text-sm text-slate-400">Tạo bảng, nhập nhanh và ôn từ theo lựa chọn của bạn.</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 bg-black/30 p-1" role="tablist" aria-label="Chế độ từ vựng">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeView === id}
              onClick={() => setActiveView(id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${activeView === id ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {activeView === 'words' ? (
            <BoardManager
              boards={boards}
              selectedBoardIds={selectedBoardIds}
              onToggleSelection={toggleBoardSelection}
              onCreateBoard={createBoard}
              onRenameBoard={renameBoard}
              onDeleteBoard={deleteBoard}
              onToggleCollapsed={toggleBoardCollapsed}
              onAddWord={addWord}
              onRemoveWord={removeWord}
            />
          ) : activeView === 'import' ? (
            <QuickImportPanel
              boards={boards}
              boardId={importBoard?.id || ''}
              onBoardChange={setImportBoardId}
              onImport={addWords}
            />
          ) : (
            <PracticePanel key={practiceKey} words={selectedWords} boards={selectedBoards} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}