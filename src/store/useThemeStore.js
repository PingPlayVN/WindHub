// src/store/useThemeStore.js
import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'light', // Mặc định là giao diện sáng
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
}));