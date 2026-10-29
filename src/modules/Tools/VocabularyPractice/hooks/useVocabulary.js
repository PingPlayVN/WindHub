import { useEffect, useState } from 'react';

const STORAGE_KEY = 'windhub-vocabulary-practice';
const DEFAULT_BOARD_ID = 'default-vocabulary-board';

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultBoard(words = []) {
  return { id: DEFAULT_BOARD_ID, name: 'Từ vựng của tôi', words, collapsed: false };
}

function readLibrary() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored)) {
      const words = stored.filter((word) => word?.id && word?.english && word?.vietnamese);
      return { boards: [createDefaultBoard(words)], selectedBoardIds: [DEFAULT_BOARD_ID] };
    }

    if (stored && Array.isArray(stored.boards)) {
      const boards = stored.boards
        .filter((board) => board?.id && board?.name)
        .map((board) => ({
          ...board,
          words: Array.isArray(board.words)
            ? board.words.filter((word) => word?.id && word?.english && word?.vietnamese)
            : [],
          collapsed: Boolean(board.collapsed),
        }));
      const safeBoards = boards.length ? boards : [createDefaultBoard()];
      const validIds = new Set(safeBoards.map((board) => board.id));
      const selectedBoardIds = Array.isArray(stored.selectedBoardIds)
        ? stored.selectedBoardIds.filter((id) => validIds.has(id))
        : [];
      return {
        boards: safeBoards,
        selectedBoardIds: Array.isArray(stored.selectedBoardIds) ? selectedBoardIds : [safeBoards[0].id],
      };
    }
  } catch {
    return { boards: [createDefaultBoard()], selectedBoardIds: [DEFAULT_BOARD_ID] };
  }

  return { boards: [createDefaultBoard()], selectedBoardIds: [DEFAULT_BOARD_ID] };
}

const normalizePair = (word) => `${word.english.trim().toLocaleLowerCase()}\u0000${word.vietnamese.trim().toLocaleLowerCase()}`;

export default function useVocabulary() {
  const [library, setLibrary] = useState(readLibrary);
  const { boards, selectedBoardIds } = library;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch {}
  }, [library]);

  const createBoard = (name) => {
    const board = { id: createId(), name: name.trim(), words: [], collapsed: false };
    if (!board.name) return null;
    setLibrary((current) => ({
      boards: [...current.boards, board],
      selectedBoardIds: [...current.selectedBoardIds, board.id],
    }));
    return board.id;
  };

  const renameBoard = (id, name) => {
    const nextName = name.trim();
    if (!nextName) return;
    setLibrary((current) => ({
      ...current,
      boards: current.boards.map((board) => board.id === id ? { ...board, name: nextName } : board),
    }));
  };

  const deleteBoard = (id) => {
    setLibrary((current) => {
      if (current.boards.length <= 1) return current;
      const nextBoards = current.boards.filter((board) => board.id !== id);
      const nextSelectedIds = current.selectedBoardIds.filter((boardId) => boardId !== id);
      return {
        boards: nextBoards,
        selectedBoardIds: nextSelectedIds.length ? nextSelectedIds : [nextBoards[0].id],
      };
    });
  };

  const toggleBoardCollapsed = (id) => {
    setLibrary((current) => ({
      ...current,
      boards: current.boards.map((board) => board.id === id ? { ...board, collapsed: !board.collapsed } : board),
    }));
  };

  const toggleBoardSelection = (id) => {
    setLibrary((current) => ({
      ...current,
      selectedBoardIds: current.selectedBoardIds.includes(id)
        ? current.selectedBoardIds.filter((boardId) => boardId !== id)
        : [...current.selectedBoardIds, id],
    }));
  };

  const addWord = (boardId, entry, wordId) => {
    setLibrary((current) => ({
      ...current,
      boards: current.boards.map((board) => {
        if (board.id !== boardId) return board;
        if (wordId) {
          return { ...board, words: board.words.map((word) => word.id === wordId ? { ...word, ...entry } : word) };
        }
        return { ...board, words: [{ ...entry, id: createId(), createdAt: Date.now() }, ...board.words] };
      }),
    }));
  };

  const addWords = (boardId, entries) => {
    setLibrary((current) => ({
      ...current,
      boards: current.boards.map((board) => {
        if (board.id !== boardId) return board;
        const knownPairs = new Set(board.words.map(normalizePair));
        const newWords = entries
          .filter((entry) => {
            const key = normalizePair(entry);
            if (knownPairs.has(key)) return false;
            knownPairs.add(key);
            return true;
          })
          .map((entry) => ({ ...entry, id: createId(), createdAt: Date.now() }));
        return { ...board, words: [...newWords.reverse(), ...board.words] };
      }),
    }));
  };

  const removeWord = (boardId, wordId) => {
    setLibrary((current) => ({
      ...current,
      boards: current.boards.map((board) => board.id === boardId
        ? { ...board, words: board.words.filter((word) => word.id !== wordId) }
        : board),
    }));
  };

  return {
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
  };
}