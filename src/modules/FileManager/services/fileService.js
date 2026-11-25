import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

const filesCollection = collection(db, 'windhub_files');
const sortConfigDocument = doc(db, 'windhub_settings', 'sort_config');
const FILE_CACHE_KEY = 'windhub_files_cache';

function readCachedFiles() {
  try {
    const cachedValue = localStorage.getItem(FILE_CACHE_KEY);
    if (!cachedValue) return [];
    const parsed = JSON.parse(cachedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedFiles(files) {
  try {
    localStorage.setItem(FILE_CACHE_KEY, JSON.stringify(files));
  } catch {
    // Ignore cache write failures without breaking the app.
  }
}

export function subscribeToFiles(onChange, onError) {
  const cachedFiles = readCachedFiles();
  if (cachedFiles.length) {
    onChange(cachedFiles, { fromCache: true });
  }

  return onSnapshot(
    query(filesCollection),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty && cachedFiles.length) {
        return;
      }
      const nextFiles = snapshot.docs.map((file) => ({ id: file.id, ...file.data() }));
      if (!snapshot.metadata.fromCache) {
        writeCachedFiles(nextFiles);
      }
      onChange(nextFiles, { fromCache: snapshot.metadata.fromCache });
    },
    (error) => {
      if (cachedFiles.length) {
        onChange(cachedFiles, { fromCache: true, hasError: true });
        return;
      }
      onError?.(error);
    }
  );
}

export async function fetchFileById(itemId) {
  if (!itemId) return null;
  try {
    const snap = await getDoc(doc(filesCollection, itemId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch {
    return null;
  }
}

export function subscribeToSortConfig(onChange) {
  return onSnapshot(sortConfigDocument, (snapshot) => {
    if (snapshot.exists()) onChange(snapshot.data());
  });
}

export function createFile(data) {
  return addDoc(filesCollection, data);
}

export function updateFile(fileId, data) {
  return updateDoc(doc(filesCollection, fileId), data);
}

export function removeFile(fileId) {
  return deleteDoc(doc(filesCollection, fileId));
}

export function saveGlobalSort(folderId, sort) {
  return setDoc(sortConfigDocument, { [folderId]: sort }, { merge: true });
}
