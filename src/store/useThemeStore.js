import { create } from 'zustand';

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('windhub-theme') === 'dark' ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

export const useThemeStore = create((set) => ({
  theme: getStoredTheme(),
  toggleTheme: () => set((state) => {
    const theme = state.theme === 'light' ? 'dark' : 'light';
    try {
      window.localStorage.setItem('windhub-theme', theme);
    } catch {
      // Theme still works if browser storage is unavailable.
    }
    applyTheme(theme);
    return { theme };
  }),
}));
