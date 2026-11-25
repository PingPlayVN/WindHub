import { lazy } from 'react';

const toolModules = import.meta.glob('../../modules/Tools/*/index.jsx');

const formatToolName = (folderName) =>
  folderName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const TOOL_METADATA = {
  VocabularyPractice: {
    title: 'Vocabulary Practice',
    subtitle:
      'Quản lý đa bảng từ vựng, bóc tách danh sách hàng loạt và luyện phản xạ song ngữ chủ động với 3 lượt gợi nhớ.',
    category: 'language',
    categoryLabel: 'Học tập & Ngôn ngữ',
    emblem: 'vocab',
    accent: 'emerald',
    badge: 'Active Recall',
    runtimeNote: 'Lưu cục bộ · Tức thì',
    tags: ['Đa bảng từ', 'Nhập hàng loạt', ' Phản xạ 3 lượt'],
  },
  ImageArtStudio: {
    title: 'Image → ASCII Studio',
    subtitle:
      'Biến đổi ảnh sang nghệ thuật ký tự ASCII, Braille, Block, Edge và Floyd–Steinberg Dither qua luồng Web Worker riêng.',
    category: 'graphics',
    categoryLabel: 'Đồ họa & Ký tự',
    emblem: 'ascii',
    accent: 'orange',
    badge: '9 Chế độ Render',
    runtimeNote: 'Web Worker · 100% Local',
    tags: ['ASCII & Braille', 'Floyd–Steinberg', 'PNG · SVG · HTML'],
  },
};

let casioSpellImporter = null;
const otherEntries = [];

for (const [path, importer] of Object.entries(toolModules)) {
  const id = path.split('/').slice(-2, -1)[0];
  if (id === 'CasioSpell') {
    casioSpellImporter = importer;
  } else {
    const meta = TOOL_METADATA[id] || {};
    otherEntries.push({
      id,
      title: meta.title || formatToolName(id),
      subtitle: meta.subtitle || 'Công cụ xử lý chuyên biệt trên nền tảng WindHub',
      category: meta.category || 'utility',
      categoryLabel: meta.categoryLabel || 'Tiện ích',
      emblem: meta.emblem || 'casio',
      accent: meta.accent || 'orange',
      badge: meta.badge || 'WindHub Tool',
      runtimeNote: meta.runtimeNote || '100% Client-side',
      tags: meta.tags || ['Local Processing'],
      isLocked: false,
      Component: lazy(async () => {
        const module = await importer();
        return { default: module.default?.tool?.Component || module.default };
      }),
    });
  }
}

const casio580Entry = {
  id: 'Casio580Spell',
  title: 'Casio fx-580VN X Spell',
  subtitle:
    'Biên dịch chuỗi chữ 17 ký tự Basic Overflow, nạp 8 dòng QuickCPY++ và hướng dẫn nạp mã máy trên Casio ClassWiz.',
  category: 'hardware',
  categoryLabel: 'Kỹ thuật & Máy tính',
  emblem: 'casio',
  accent: 'sky',
  badge: 'ClassWiz · 0xEA30',
  runtimeNote: 'Chuẩn fx-580VN X',
  tags: ['Basic Overflow', 'QuickCPY++', 'Giải mã Hex'],
  featured: true,
  isLocked: false,
  Component: casioSpellImporter
    ? lazy(async () => {
        const module = await casioSpellImporter();
        return { default: module.default?.tool?.Component || module.default };
      })
    : null,
};

export const taiXiuToolEntry = {
  id: 'TaiXiuGame',
  title: 'Tài Xỉu Dân Gian',
  subtitle: 'Lắc 3 xúc xắc truyền thống, nặn đĩa kịch tính và nhận quà điểm danh xu miễn phí',
  category: 'entertainment',
  categoryLabel: 'Giải trí',
  badge: 'Trò chơi dân gian',
  isLocked: false,
  isDirectLink: true,
  link: '/entertainment/tai-xiu',
};

export const toolEntries = [
  casio580Entry,
  ...otherEntries.filter((t) => t.id === 'ImageArtStudio'),
  ...otherEntries.filter((t) => t.id !== 'ImageArtStudio'),
].filter(Boolean);
