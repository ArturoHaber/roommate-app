import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, ChoreAssignment, LeaderboardEntry } from '../types';
import { generateId } from '../utils/generateId';
import { addDays, startOfWeek, isAfter, isBefore, isToday } from 'date-fns';

interface ChoreState {
  chores: Chore[];
  assignments: ChoreAssignment[];
  
  // Actions
  addChore: (chore: Omit<Chore, 'id' | 'createdAt'>) => void;
  removeChore: (choreId: string) => void;
  completeChore: (assignmentId: string, completedBy: string) => void;
  generateWeeklyAssignments: (memberIds: string[]) => void;
  getMyAssignments: (userId: string) => ChoreAssignment[];
  getOverdueAssignments: (userId: string) => ChoreAssignment[];
  getLeaderboard: () => LeaderboardEntry[];
  getChoreById: (choreId: string) => Chore | undefined;
  initializeDefaultChores: (householdId: string) => void;
}

const DEFAULT_CHORES: Omit<Chore, 'id' | 'householdId' | 'createdAt'>[] = [
  { name: 'Take out trash', description: 'Empty all bins and take to curb', icon: 'trash-2', frequency: 'weekly', pointValue: 3 },
  { name: 'Do dishes', description: 'Wash dishes or load/unload dishwasher', icon: 'coffee', frequency: 'daily', pointValue: 2 },
  { name: 'Clean bathroom', description: 'Scrub toilet, sink, and shower', icon: 'droplet', frequency: 'weekly', pointValue: 5 },
  { name: 'Vacuum common areas', description: 'Vacuum living room and hallways', icon: 'wind', frequency: 'weekly', pointValue: 4 },
  { name: 'Mop floors', description: 'Mop kitchen and bathroom floors', icon: 'home', frequency: 'biweekly', pointValue: 4 },
  { name: 'Wipe counters', description: 'Clean kitchen counters and stovetop', icon: 'layout', frequency: 'daily', pointValue: 2 },
  { name: 'Buy supplies', description: 'Restock toilet paper, soap, etc.', icon: 'shopping-bag', frequency: 'monthly', pointValue: 3 },
  { name: 'Take out recycling', description: 'Sort and take out recyclables', icon: 'refresh-cw', frequency: 'weekly', pointValue: 2 },
];

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      assignments: [],

      initializeDefaultChores: (householdId: string) => {
        const existingChores = get().chores;
        if (existingChores.length > 0) return;

        const chores: Chore[] = DEFAULT_CHORES.map((chore) => ({
          ...chore,
          id: generateId(),
          householdId,
          createdAt: new Date(),
        }));
        set({ chores });
      },

      addChore: (choreData) => {
        const chore: Chore = {
          ...choreData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({ chores: [...state.chores, chore] }));
      },

      removeChore: (choreId: string) => {
        set((state) => ({
          chores: state.chores.filter((c) => c.id !== choreId),
          assignments: state.assignments.filter((a) => a.choreId !== choreId),
        }));
      },

      completeChore: (assignmentId: string, completedBy: string) => {
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id === assignmentId) {
              return {
                ...a,
                completedAt: new Date(),
                completedBy,
                isBonus: a.assignedTo !== completedBy,
              };
            }
            return a;
          }),
        }));
      },

      generateWeeklyAssignments: (memberIds: string[]) => {
        const { chores, assignments } = get();
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        
        // Check if we already have assignments for this week
        const hasThisWeek = assignments.some(
          (a) => isAfter(new Date(a.dueDate), weekStart)
        );
        if (hasThisWeek) return;

        const newAssignments: ChoreAssignment[] = [];
        let memberIndex = 0;

        // Weekly chores
        const weeklyChores = chores.filter((c) => c.frequency === 'weekly');
        weeklyChores.forEach((chore) => {
          newAssignments.push({
            id: generateId(),
            choreId: chore.id,
            assignedTo: memberIds[memberIndex % memberIds.length],
            dueDate: addDays(weekStart, 6), // End of week
            completedAt: null,
            completedBy: null,
            isBonus: false,
          });
          memberIndex++;
        });

        // Daily chores - rotate through the week
        const dailyChores = chores.filter((c) => c.frequency === 'daily');
        for (let day = 0; day < 7; day++) {
          dailyChores.forEach((chore) => {
            newAssignments.push({
              id: generateId(),
              choreId: chore.id,
              assignedTo: memberIds[(memberIndex + day) % memberIds.length],
              dueDate: addDays(weekStart, day),
              completedAt: null,
              completedBy: null,
              isBonus: false,
            });
          });
        }

        set((state) => ({
          assignments: [...state.assignments, ...newAssignments],
        }));
      },

      getMyAssignments: (userId: string) => {
        const { assignments } = get();
        const now = new Date();
        return assignments.filter(
          (a) => a.assignedTo === userId && 
                 !a.completedAt && 
                 (isToday(new Date(a.dueDate)) || isAfter(new Date(a.dueDate), now))
        );
      },

      getOverdueAssignments: (userId: string) => {
        const { assignments } = get();
        const now = new Date();
        return assignments.filter(
          (a) => a.assignedTo === userId && 
                 !a.completedAt && 
                 isBefore(new Date(a.dueDate), now) &&
                 !isToday(new Date(a.dueDate))
        );
      },

      getLeaderboard: () => {
        const { assignments, chores } = get();
        const leaderboard: Map<string, LeaderboardEntry> = new Map();

        assignments.forEach((assignment) => {
          if (!assignment.completedBy) return;
          
          const chore = chores.find((c) => c.id === assignment.choreId);
          if (!chore) return;

          const existing = leaderboard.get(assignment.completedBy) || {
            userId: assignment.completedBy,
            points: 0,
            completedChores: 0,
            bonusChores: 0,
          };

          existing.points += assignment.isBonus ? chore.pointValue * 1.5 : chore.pointValue;
          existing.completedChores++;
          if (assignment.isBonus) existing.bonusChores++;

          leaderboard.set(assignment.completedBy, existing);
        });

        return Array.from(leaderboard.values()).sort((a, b) => b.points - a.points);
      },

      getChoreById: (choreId: string) => {
        return get().chores.find((c) => c.id === choreId);
      },
    }),
    {
      name: 'chore-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
