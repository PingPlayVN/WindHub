import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Brain, ClipboardPaste } from 'lucide-react';
import {
  StudioSegmentedBar,
  StudioWorkspaceHeader,
} from '@/components/studio/StudioPrimitives';
import useVocabulary from './hooks/useVocabulary';
import PracticePanel from './components/PracticePanel';
import BoardManager from './components/BoardManager';
import QuickImportPanel from './components/QuickImportPanel';

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
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id || '');
  const [importBoardId, setImportBoardId] = useState(boards[0]?.id || '');

  const resolvedActiveBoardId = boards.some((board) => board.id === activeBoardId)
    ? activeBoardId
    : boards[0]?.id || '';
  const importBoard = boards.find((board) => board.id === importBoardId) || boards[0] || null;
  const selectedBoards = boards.filter((board) => selectedBoardIds.includes(board.id));
  const selectedWords = selectedBoards.flatMap((board) => board.words);
  const totalWords = useMemo(
    () => boards.reduce((sum, b) => sum + b.words.length, 0),
    [boards]
  );
  const practiceKey = selectedBoardIds.slice().sort().join('|') || 'no-selected-boards';

  const views = useMemo(
    () => [
      { id: 'words', label: 'Bảng từ vựng', icon: BookOpen, count: totalWords },
      { id: 'import', label: 'Nhập hàng loạt', icon: ClipboardPaste },
      { id: 'practice', label: 'Luyện phản xạ', icon: Brain, count: selectedWords.length },
    ],
    [selectedWords.length, totalWords]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6 text-[var(--os-text-primary)]">
      <StudioWorkspaceHeader
        eyebrow="ACTIVE RECALL STUDIO"
        title="Vocabulary Practice"
        description="Tổ chức từ vựng theo chủ đề, bóc tách tự động danh sách song ngữ và rèn trí nhớ chủ động."
        emblemVariant="vocab"
        tone="emerald"
        badges={[`${boards.length} bảng`, `${totalWords} cặp từ`]}
        actions={
          <StudioSegmentedBar
            items={views}
            activeId={activeView}
            onSelect={setActiveView}
            layoutId="vocab-studio-view-pill"
            ariaLabel="Chế độ học từ vựng"
            size="sm"
          />
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
        >
          {activeView === 'words' ? (
            <BoardManager
              boards={boards}
              activeBoardId={resolvedActiveBoardId}
              onActiveBoardChange={setActiveBoardId}
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
            <PracticePanel
              key={practiceKey}
              words={selectedWords}
              boards={selectedBoards}
              onManageWords={() => setActiveView('words')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
