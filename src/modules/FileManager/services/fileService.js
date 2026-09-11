import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
    onChange(cachedFiles);
  }

  return onSnapshot(query(filesCollection), (snapshot) => {
    const nextFiles = snapshot.docs.map((file) => ({ id: file.id, ...file.data() }));
    writeCachedFiles(nextFiles);
    onChange(nextFiles);
  }, (error) => {
    if (cachedFiles.length) {
      onChange(cachedFiles);
      return;
    }
    onError?.(error);
  });
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
