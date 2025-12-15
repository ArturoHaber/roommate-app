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
  logActivity: (category: string, details: string, userId: string) => void;
}

const DEFAULT_CHORES: Omit<Chore, 'id' | 'householdId' | 'createdAt'>[] = [
  { name: 'Take out trash', description: 'Empty all bins and take to curb', icon: 'trash-2', frequency: 'weekly', pointValue: 3, room: 'other', isActive: true },
  { name: 'Do dishes', description: 'Wash dishes or load/unload dishwasher', icon: 'coffee', frequency: 'daily', pointValue: 2, room: 'kitchen', isActive: true },
  { name: 'Clean bathroom', description: 'Scrub toilet, sink, and shower', icon: 'droplet', frequency: 'weekly', pointValue: 5, room: 'bathroom', isActive: true },
  { name: 'Vacuum common areas', description: 'Vacuum living room and hallways', icon: 'wind', frequency: 'weekly', pointValue: 4, room: 'living_room', isActive: true },
  { name: 'Mop floors', description: 'Mop kitchen and bathroom floors', icon: 'home', frequency: 'weekly', pointValue: 4, room: 'kitchen', isActive: true },
  { name: 'Wipe counters', description: 'Clean kitchen counters and stovetop', icon: 'layout', frequency: 'daily', pointValue: 2, room: 'kitchen', isActive: true },
  { name: 'Buy supplies', description: 'Restock toilet paper, soap, etc.', icon: 'shopping-bag', frequency: 'weekly', pointValue: 3, room: 'bathroom', isActive: true },
  { name: 'Take out recycling', description: 'Sort and take out recyclables', icon: 'refresh-cw', frequency: 'weekly', pointValue: 2, room: 'other', isActive: true },
];

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      assignments: [],

      initializeDefaultChores: (householdId: string) => {
        const existingChores = get().chores;
        if (existingChores.length > 0) return;

        // Add "Cook Dinner" to defaults if not present
        const cookChore: Omit<Chore, 'id' | 'householdId' | 'createdAt'> = {
          name: 'Cook Dinner',
          description: 'Prepare a meal for the house',
          icon: 'coffee',
          frequency: 'daily',
          pointValue: 5,
          room: 'kitchen',
          isActive: true
        };
        const allDefaults = [...DEFAULT_CHORES, cookChore];

        const chores: Chore[] = allDefaults.map((chore) => ({
          ...chore,
          id: generateId(),
          householdId,
          createdAt: new Date(),
        }) as Chore);
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

        // Helper: Find who did this chore last to determine next in line
        const getNextRotationalAssignee = (choreId: string, offset: number = 0): string => {
          if (memberIds.length === 0) return '';

          // Find the most recent assignment for this chore
          const history = assignments
            .filter(a => a.choreId === choreId && a.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

          let lastByIndex = 0;
          if (history.length > 0) {
            const lastUserId = history[0].completedBy || history[0].assignedTo;
            lastByIndex = memberIds.indexOf(lastUserId);
            if (lastByIndex === -1) lastByIndex = 0; // User might have left
          }

          // Rotate: Last + 1 + offset (for daily rotations)
          const nextIndex = (lastByIndex + 1 + offset) % memberIds.length;
          return memberIds[nextIndex];
        };

        // Weekly chores - Rotate based on history
        const weeklyChores = chores.filter((c) => c.frequency === 'weekly');
        weeklyChores.forEach((chore) => {
          newAssignments.push({
            id: generateId(),
            choreId: chore.id,
            assignedTo: getNextRotationalAssignee(chore.id),
            dueDate: addDays(weekStart, 6), // End of week
            completedAt: null,
            completedBy: null,
            isBonus: false,
            createdAt: new Date(),
          });
        });

        // Daily chores - Rotate day by day
        const dailyChores = chores.filter((c) => c.frequency === 'daily');
        // Filter out "Cook Dinner" from auto-assignment if it should be ad-hoc
        const rotationalDailyChores = dailyChores.filter(c => c.name !== 'Cook Dinner');

        for (let day = 0; day < 7; day++) {
          rotationalDailyChores.forEach((chore) => {
            newAssignments.push({
              id: generateId(),
              choreId: chore.id,
              assignedTo: getNextRotationalAssignee(chore.id, day),
              dueDate: addDays(weekStart, day),
              completedAt: null,
              completedBy: null,
              isBonus: false,
              createdAt: new Date(),
            });
          });
        }

        set((state) => ({
          assignments: [...state.assignments, ...newAssignments],
        }));
      },

      logActivity: (category: string, details: string, userId: string) => {
        // 1. Create a "Consequence" assignment if Cooked
        if (category === 'cooked') {
          const { chores } = get();
          // Find or create 'Clean Kitchen' chore
          let cleanChore = chores.find(c => c.name === 'Clean Kitchen');

          if (!cleanChore) {
            // If it doesn't exist, use "Wipe counters" or create ad-hoc
            cleanChore = chores.find(c => c.name === 'Wipe counters');
          }

          if (cleanChore) {
            const consequenceAssignment: ChoreAssignment = {
              id: generateId(),
              choreId: cleanChore.id,
              assignedTo: userId, // Assigned to self
              dueDate: new Date(), // Due today
              completedAt: null,
              completedBy: null,
              isBonus: false,
              createdAt: new Date(),
            };

            set(state => ({
              assignments: [...state.assignments, consequenceAssignment]
            }));
          }
        }

        // Note: In a real app we'd also add to an 'activityFeed' array here
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
