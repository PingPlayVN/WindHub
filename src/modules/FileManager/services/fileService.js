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

export function subscribeToFiles(onChange, onError) {
  return onSnapshot(query(filesCollection), (snapshot) => {
    onChange(snapshot.docs.map((file) => ({ id: file.id, ...file.data() })));
  }, onError);
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
