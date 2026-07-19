import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
  loadFromStorage: () => {
    const token = localStorage.getItem("token");
    if (token) {
      set({ token });
    }
  },
}));
