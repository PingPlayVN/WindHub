import {
  Blocks,
  Command,
  FolderKanban,
  Gamepad2,
  LayoutGrid,
  Radio,
  Settings,
} from 'lucide-react';

export const PRIMARY_NAV_ITEMS = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    subtitle: 'Trung tâm điều khiển & Tài nguyên',
    icon: LayoutGrid,
    mobileDock: true,
  },
  {
    id: 'files',
    path: '/files',
    label: 'Quản lý Tệp',
    shortLabel: 'Tệp tin',
    subtitle: 'Kho lưu trữ đám mây & Xem trước',
    icon: FolderKanban,
    mobileDock: true,
  },
  {
    id: 'tools',
    path: '/tools',
    label: 'Công cụ',
    shortLabel: 'Công cụ',
    subtitle: 'Hệ sinh thái công cụ kỹ thuật, học tập & đồ họa',
    icon: Command,
    mobileDock: true,
  },
  {
    id: 'extensions',
    path: '/extensions',
    label: 'Tiện ích mở rộng',
    shortLabel: 'Tiện ích',
    subtitle: 'Phân tích tín hiệu OSINT & Nhận diện thị giác',
    icon: Blocks,
    mobileDock: true,
  },
  {
    id: 'p2p',
    path: '/p2p',
    label: 'P2P Share',
    shortLabel: 'P2P',
    subtitle: 'Truyền tệp & Tin nhắn trực tiếp WebRTC',
    icon: Radio,
    mobileDock: true,
  },
  {
    id: 'entertainment',
    path: '/entertainment',
    label: 'Giải trí',
    shortLabel: 'Giải trí',
    subtitle: 'Trò chơi Offline & Sòng bạc dân gian trực tuyến',
    icon: Gamepad2,
    mobileDock: false,
    accent: true,
  },
];

export const SYSTEM_ROUTES = [
  {
    id: 'settings',
    path: '/settings',
    label: 'Cài đặt hệ thống',
    shortLabel: 'Cài đặt',
    subtitle: 'Giao diện, Liquid Glass & Tài khoản',
    icon: Settings,
  },
];

export function isNavPathActive(itemPath, currentPathname) {
  if (itemPath === '/') return currentPathname === '/';
  if (itemPath === '/entertainment') {
    return currentPathname.startsWith('/entertainment') || currentPathname === '/lottery';
  }
  return currentPathname === itemPath || currentPathname.startsWith(`${itemPath}/`);
}

export function getRouteMetadata(pathname) {
  const matchedPrimary = PRIMARY_NAV_ITEMS.find((item) => isNavPathActive(item.path, pathname));
  if (matchedPrimary) return matchedPrimary;
  const matchedSystem = SYSTEM_ROUTES.find((item) => isNavPathActive(item.path, pathname));
  if (matchedSystem) return matchedSystem;
  return PRIMARY_NAV_ITEMS[0];
}
