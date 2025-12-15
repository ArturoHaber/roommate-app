import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Nudge } from '../types';
import { generateId } from '../utils/generateId';

interface NudgeState {
  nudges: Nudge[];

  // Actions
  sendNudge: (nudge: Omit<Nudge, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (nudgeId: string) => void;
  getMyNudges: (userId: string) => Nudge[];
  getUnreadCount: (userId: string) => number;
  clearNudges: () => void;
}

// Pre-defined gentle nudge templates
export const NUDGE_TEMPLATES = {
  dishes: {
    gentle: "Hey! The dishes are starting to pile up 🍽️",
    reminder: "Friendly reminder about the dishes in the sink",
    urgent: "The kitchen really needs some attention!",
  },
  trash: {
    gentle: "Trash day is coming up! 🗑️",
    reminder: "Don't forget - trash goes out tomorrow",
    urgent: "The trash is overflowing!",
  },
  bathroom: {
    gentle: "The bathroom could use some love 🚿",
    reminder: "Bathroom cleaning is due soon",
    urgent: "The bathroom really needs to be cleaned",
  },
  noise: {
    gentle: "Could we keep it down a bit? Thanks! 🔇",
    reminder: "Reminder: quiet hours are in effect",
    urgent: "It's getting pretty loud",
  },
  general: {
    gentle: "Quick heads up about the common areas ✨",
    reminder: "Friendly household reminder",
    urgent: "This needs attention soon",
  },
};

export const useNudgeStore = create<NudgeState>()(
  persist(
    (set, get) => ({
      nudges: [],

      sendNudge: (nudgeData) => {
        const nudge: Nudge = {
          ...nudgeData,
          id: generateId(),
          createdAt: new Date(),
          isRead: false,
        };
        set((state) => ({ nudges: [nudge, ...state.nudges] }));
      },

      markAsRead: (nudgeId: string) => {
        set((state) => ({
          nudges: state.nudges.map((n) =>
            n.id === nudgeId ? { ...n, isRead: true } : n
          ),
        }));
      },

      getMyNudges: (userId: string) => {
        const { nudges } = get();
        return nudges.filter(
          (n) => n.targetUserId === userId || n.targetUserId === null
        );
      },

      getUnreadCount: (userId: string) => {
        const { nudges } = get();
        return nudges.filter(
          (n) => (n.targetUserId === userId || n.targetUserId === null) && !n.isRead
        ).length;
      },

      clearNudges: () => {
        set({ nudges: [] });
      },
    }),
    {
      name: 'nudge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
