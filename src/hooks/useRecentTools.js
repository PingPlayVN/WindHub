import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'windhub-recent-tools-v1';
const UPDATE_EVENT = 'windhub:recent-tools-updated';
const MAX_RECENT = 6;

function readRecent() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.lastOpenedAt === 'number'
    );
  } catch {
    return [];
  }
}

function writeRecent(entries) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function trackRecentToolOpen(id, scope = 'tool') {
  if (!id) return;
  const current = readRecent();
  const existing = current.find((item) => item.id === id && item.scope === scope);
  const nextItem = {
    id,
    scope,
    lastOpenedAt: Date.now(),
    openCount: (existing?.openCount || 0) + 1,
  };
  const next = [
    nextItem,
    ...current.filter((item) => !(item.id === id && item.scope === scope)),
  ].slice(0, MAX_RECENT);
  writeRecent(next);
}

export function formatRelativeVisit(timestamp) {
  if (!timestamp) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Vừa mở';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}

export default function useRecentTools(scopeFilter = null) {
  const [items, setItems] = useState(readRecent);

  useEffect(() => {
    const sync = () => setItems(readRecent());
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const recordOpen = useCallback((id, scope = scopeFilter || 'tool') => {
    trackRecentToolOpen(id, scope);
  }, [scopeFilter]);

  const clearRecent = useCallback(() => {
    if (!scopeFilter) {
      writeRecent([]);
      return;
    }
    const remaining = readRecent().filter((item) => item.scope !== scopeFilter);
    writeRecent(remaining);
  }, [scopeFilter]);

  const filtered = scopeFilter
    ? items.filter((item) => item.scope === scopeFilter)
    : items;

  return {
    recentItems: filtered,
    recordOpen,
    clearRecent,
  };
}
