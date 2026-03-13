import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const savedToken = localStorage.getItem('formforge_token');
const savedUser = localStorage.getItem('formforge_user');
let initialUser = null;
try {
  initialUser = savedUser ? JSON.parse(savedUser) : null;
} catch {
  localStorage.removeItem('formforge_token');
  localStorage.removeItem('formforge_user');
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  token: savedToken,
  isAuthenticated: !!(savedToken && initialUser),

  login: (user, token) => {
    localStorage.setItem('formforge_token', token);
    localStorage.setItem('formforge_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('formforge_token');
    localStorage.removeItem('formforge_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('formforge_token');
    const userStr = localStorage.getItem('formforge_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('formforge_token');
        localStorage.removeItem('formforge_user');
      }
    }
  },
}));
