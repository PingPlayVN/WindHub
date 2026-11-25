import { create } from 'zustand';

function getStoredSidebarCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('windhub-sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  isSidebarCollapsed: getStoredSidebarCollapsed(),
  toggleSidebarCollapse: () =>
    set((state) => {
      const next = !state.isSidebarCollapsed;
      try {
        window.localStorage.setItem('windhub-sidebar-collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return { isSidebarCollapsed: next };
    }),

  isLoginOpen: false,
  openLogin: () => set({ isLoginOpen: true }),
  closeLogin: () => set({ isLoginOpen: false }),

  isCommandOpen: false,
  openCommand: () => set({ isCommandOpen: true }),
  closeCommand: () => set({ isCommandOpen: false }),
  toggleCommand: () => set((state) => ({ isCommandOpen: !state.isCommandOpen })),
}));
