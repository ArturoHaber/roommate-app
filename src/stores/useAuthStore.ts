import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { generateId } from '../utils/generateId';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  
  // Actions
  login: (name: string, email: string) => void;
  logout: () => void;
  setHousehold: (householdId: string) => void;
  completeOnboarding: () => void;
}

const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,

      login: (name: string, email: string) => {
        const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const newUser: User = {
          id: generateId(),
          name,
          email,
          avatarColor: randomColor,
          householdId: null,
          createdAt: new Date(),
        };
        set({ user: newUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, isOnboarded: false });
      },

      setHousehold: (householdId: string) => {
        set((state) => ({
          user: state.user ? { ...state.user, householdId } : null,
        }));
      },

      completeOnboarding: () => {
        set({ isOnboarded: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
