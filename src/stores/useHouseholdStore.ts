import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Household, User } from '../types';
import { generateId } from '../utils/generateId';

interface HouseholdState {
  household: Household | null;
  members: User[];

  // Actions
  createHousehold: (name: string, creatorId: string) => string;
  joinHousehold: (inviteCode: string, user: User) => boolean;
  addMember: (user: User) => void;
  removeMember: (userId: string) => void;
  leaveHousehold: () => void;
}

// Generate a simple invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Mock roommates for demo
const MOCK_ROOMMATES: User[] = [
  {
    id: 'mock-1',
    name: 'Alex Chen',
    email: 'alex@example.com',
    avatarColor: '#6366F1',
    householdId: 'demo-household',
    createdAt: new Date(),
  },
  {
    id: 'mock-2',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    avatarColor: '#22C55E',
    householdId: 'demo-household',
    createdAt: new Date(),
  },
  {
    id: 'mock-3',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    avatarColor: '#F97316',
    householdId: 'demo-household',
    createdAt: new Date(),
  },
];

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      household: null,
      members: [],

      createHousehold: (name: string, creatorId: string) => {
        const inviteCode = generateInviteCode();
        const household: Household = {
          id: generateId(),
          name,
          inviteCode,
          members: [creatorId],
          createdAt: new Date(),
        };
        set({ household, members: [] });
        return inviteCode;
      },

      joinHousehold: (inviteCode: string, user: User) => {
        // For demo, any code works and adds mock roommates
        const household: Household = {
          id: 'demo-household',
          name: 'The Apartment',
          inviteCode,
          members: ['mock-1', 'mock-2', 'mock-3', user.id],
          createdAt: new Date(),
        };
        set({
          household,
          members: [...MOCK_ROOMMATES, { ...user, householdId: household.id }]
        });
        return true;
      },

      addMember: (user: User) => {
        set((state) => ({
          members: [...state.members, user],
          household: state.household
            ? { ...state.household, members: [...state.household.members, user.id] }
            : null,
        }));
      },

      removeMember: (userId: string) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== userId),
          household: state.household
            ? { ...state.household, members: state.household.members.filter((id) => id !== userId) }
            : null,
        }));
      },

      leaveHousehold: () => {
        set({ household: null, members: [] });
      },
    }),
    {
      name: 'household-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
