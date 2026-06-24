import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { store } from '../lib/storage';

type Role = 'agent' | 'citizen';

interface AuthState {
  user: any | null;
  session: any | null;
  role: Role;
  isLoading: boolean;
  setSession: (session: any) => void;
  setRole: (role: Role) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: 'citizen',
  isLoading: false,

  setSession: (session) => set({
    session,
    user: session?.user ?? null,
  }),

  setRole: (role) => {
    store.set('user_role', role);
    set({ role });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  initialize: async () => {
    const savedRole = await store.get<Role>('user_role');
    if (savedRole) {
      set({ role: savedRole });
    }
  },
}));
