// src/modules/FileManager/utils/fileCardVisuals.jsx
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  FileCode,
  Globe,
} from 'lucide-react';

/**
 * Phân tích phần mở rộng và loại tệp để trả về thông tin giao diện (màu sắc, gradient, badge)
 */
export function getFileCategoryInfo(file) {
  if (file.type === 'folder') {
    return {
      category: 'folder',
      label: 'THƯ MỤC',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-amber-500',
      icon: Folder,
    };
  }

  const name = file.name || file.url || '';
  const ext = name.split('.').pop().toLowerCase().split('?')[0];

  if (file.type === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
    return {
      category: 'image',
      label: ext.length <= 4 ? ext.toUpperCase() : 'ẢNH',
      badgeColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
      gradient: 'from-sky-500/15 via-blue-500/5 to-transparent dark:from-sky-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-sky-500',
      icon: ImageIcon,
    };
  }

  if (file.type === 'video' || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return {
      category: 'video',
      label: ext.length <= 4 ? ext.toUpperCase() : 'VIDEO',
      badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
      gradient: 'from-purple-500/15 via-indigo-500/5 to-transparent dark:from-purple-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-purple-500',
      icon: Video,
    };
  }

  if (file.type === 'audio' || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
    return {
      category: 'audio',
      label: ext.length <= 4 ? ext.toUpperCase() : 'AUDIO',
      badgeColor: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20',
      gradient: 'from-pink-500/15 via-rose-500/5 to-transparent dark:from-pink-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-pink-500',
      icon: Music,
    };
  }

  if (['pdf'].includes(ext)) {
    return {
      category: 'pdf',
      label: 'PDF',
      badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      gradient: 'from-rose-500/15 via-red-500/5 to-transparent dark:from-rose-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-rose-500',
      icon: FileText,
    };
  }

  if (['doc', 'docx'].includes(ext)) {
    return {
      category: 'word',
      label: 'DOCX',
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent dark:from-blue-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-blue-500',
      icon: FileText,
    };
  }

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return {
      category: 'excel',
      label: 'EXCEL',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent dark:from-emerald-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-emerald-500',
      icon: FileSpreadsheet,
    };
  }

  if (['ppt', 'pptx'].includes(ext)) {
    return {
      category: 'powerpoint',
      label: 'PPTX',
      badgeColor: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
      gradient: 'from-orange-500/15 via-amber-500/5 to-transparent dark:from-orange-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-orange-500',
      icon: FileText,
    };
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      category: 'archive',
      label: ext.toUpperCase(),
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      gradient: 'from-amber-500/15 via-yellow-500/5 to-transparent dark:from-amber-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-amber-500',
      icon: Archive,
    };
  }

  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) {
    return {
      category: 'code',
      label: ext.toUpperCase(),
      badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
      gradient: 'from-teal-500/15 via-cyan-500/5 to-transparent dark:from-teal-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
      accentColor: 'text-teal-500',
      icon: FileCode,
    };
  }

  return {
    category: 'document',
    label: ext && ext.length <= 5 ? ext.toUpperCase() : 'TỆP',
    badgeColor: 'text-slate-600 dark:text-zinc-400 bg-slate-500/10 border-slate-500/20',
    gradient: 'from-slate-500/15 via-zinc-500/5 to-transparent dark:from-zinc-400/15 dark:via-zinc-900/50 dark:to-zinc-900/30',
    accentColor: 'text-slate-500 dark:text-zinc-400',
    icon: Globe,
  };
}
