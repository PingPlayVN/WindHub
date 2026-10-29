import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  setAuth: (user, isAdmin) => set({ user, isAdmin, isLoading: false }),
}));
