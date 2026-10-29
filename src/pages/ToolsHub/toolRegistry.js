import { lazy } from 'react';

const toolModules = import.meta.glob('../../modules/Tools/*/index.jsx');

const formatToolName = (folderName) => folderName
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ')
  .trim()
  .split(/\s+/)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

let casioSpellImporter = null;
const otherEntries = [];

for (const [path, importer] of Object.entries(toolModules)) {
  const id = path.split('/').slice(-2, -1)[0];
  if (id === 'CasioSpell') {
    casioSpellImporter = importer;
  } else {
    const title = id === 'ImageArtStudio'
      ? 'Image → ASCII Studio'
      : formatToolName(id);

    otherEntries.push({
      id,
      title,
      isLocked: false,
      Component: lazy(async () => {
        const module = await importer();
        return { default: module.default?.tool?.Component || module.default };
      }),
    });
  }
}

// Card Casio fx-580VN X (Chuẩn thuật toán Tool-spell-on-CASIO-fx-580VN-X của Phong2k11® & AxesMC)
const casio580Entry = {
  id: 'Casio580Spell',
  title: 'Casio fx-580VN X Spell',
  subtitle: 'Viết chữ & tràn bộ nhớ Basic Overflow trên Casio fx-580VN X',
  badge: 'ClassWiz · 17 Ký tự',
  isLocked: false,
  Component: casioSpellImporter
    ? lazy(async () => {
      const module = await casioSpellImporter();
      return { default: module.default?.tool?.Component || module.default };
    })
    : null,
};

// Sắp xếp thứ tự hiển thị: Từ vựng -> Casio 580 -> Image Art -> Các công cụ khác
export const toolEntries = [
  ...otherEntries.filter((t) => t.id === 'VocabularyPractice'),
  casio580Entry,
  ...otherEntries.filter((t) => t.id !== 'VocabularyPractice'),
].filter(Boolean);