import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, ChoreAssignment, LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabase';
import { addDays, startOfWeek, isAfter, isBefore, isToday, isSameDay } from 'date-fns';

interface ChoreState {
  chores: Chore[];
  assignments: ChoreAssignment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChores: (householdId: string) => Promise<void>;
  fetchAssignments: (householdId: string) => Promise<void>;
  addChore: (chore: Omit<Chore, 'id' | 'createdAt'>) => Promise<void>;
  removeChore: (choreId: string) => Promise<void>;
  completeChore: (assignmentId: string, completedBy: string) => Promise<void>;
  getMyAssignments: (userId: string) => ChoreAssignment[];
  getAssignmentsForDate: (date: Date) => ChoreAssignment[];
  getOverdueAssignments: (userId: string) => ChoreAssignment[];
  getLeaderboard: () => LeaderboardEntry[];
  getChoreById: (choreId: string) => Chore | undefined;
  seedTestChores: (householdId: string, memberIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      assignments: [],
      isLoading: false,
      error: null,

      // ========================================================================
      // FETCH CHORES FROM SUPABASE
      // ========================================================================
      fetchChores: async (householdId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('chores')
            .select('*')
            .eq('household_id', householdId)
            .eq('is_active', true);

          if (error) throw error;

          const chores: Chore[] = (data || []).map(row => ({
            id: row.id,
            householdId: row.household_id,
            roomId: row.room_id,
            name: row.name,
            description: row.description || '',
            icon: row.icon,
            room: row.room,
            frequency: row.frequency,
            interval: row.interval_days,
            assignedDays: row.assigned_days,
            pointValue: row.point_value,
            isActive: row.is_active,
            createdAt: new Date(row.created_at),
          }));

          set({ chores, isLoading: false });
        } catch (error: any) {
          console.error('[ChoreStore] fetchChores error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // FETCH ASSIGNMENTS FROM SUPABASE
      // ========================================================================
      fetchAssignments: async (householdId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Get all chore IDs for this household first
          const { chores } = get();
          const choreIds = chores.map(c => c.id);

          if (choreIds.length === 0) {
            set({ assignments: [], isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('chore_assignments')
            .select('*')
            .in('chore_id', choreIds)
            .order('due_date', { ascending: true });

          if (error) throw error;

          const assignments: ChoreAssignment[] = (data || []).map(row => ({
            id: row.id,
            choreId: row.chore_id,
            assignedTo: row.assigned_to,
            dueDate: new Date(row.due_date),
            completedAt: row.completed_at ? new Date(row.completed_at) : null,
            completedBy: row.completed_by,
            isBonus: row.is_bonus,
            createdAt: new Date(row.created_at),
          }));

          set({ assignments, isLoading: false });
        } catch (error: any) {
          console.error('[ChoreStore] fetchAssignments error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // ADD CHORE TO SUPABASE
      // ========================================================================
      addChore: async (choreData) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('chores')
            .insert({
              household_id: choreData.householdId,
              room_id: choreData.roomId,
              name: choreData.name,
              description: choreData.description,
              icon: choreData.icon,
              room: choreData.room,
              frequency: choreData.frequency,
              interval_days: choreData.interval,
              assigned_days: choreData.assignedDays,
              point_value: choreData.pointValue,
              is_active: choreData.isActive,
            })
            .select()
            .single();

          if (error) throw error;

          const newChore: Chore = {
            id: data.id,
            householdId: data.household_id,
            roomId: data.room_id,
            name: data.name,
            description: data.description || '',
            icon: data.icon,
            room: data.room,
            frequency: data.frequency,
            interval: data.interval_days,
            assignedDays: data.assigned_days,
            pointValue: data.point_value,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
          };

          set(state => ({ chores: [...state.chores, newChore], isLoading: false }));
        } catch (error: any) {
          console.error('[ChoreStore] addChore error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // REMOVE CHORE FROM SUPABASE
      // ========================================================================
      removeChore: async (choreId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('chores')
            .delete()
            .eq('id', choreId);

          if (error) throw error;

          set(state => ({
            chores: state.chores.filter(c => c.id !== choreId),
            assignments: state.assignments.filter(a => a.choreId !== choreId),
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('[ChoreStore] removeChore error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // COMPLETE CHORE ASSIGNMENT IN SUPABASE
      // ========================================================================
      completeChore: async (assignmentId: string, completedBy: string) => {
        set({ isLoading: true, error: null });
        try {
          const assignment = get().assignments.find(a => a.id === assignmentId);
          const isBonus = assignment ? assignment.assignedTo !== completedBy : false;

          const { error } = await supabase
            .from('chore_assignments')
            .update({
              completed_at: new Date().toISOString(),
              completed_by: completedBy,
              is_bonus: isBonus,
            })
            .eq('id', assignmentId);

          if (error) throw error;

          set(state => ({
            assignments: state.assignments.map(a => {
              if (a.id === assignmentId) {
                return {
                  ...a,
                  completedAt: new Date(),
                  completedBy,
                  isBonus,
                };
              }
              return a;
            }),
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('[ChoreStore] completeChore error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // GETTERS (Local, computed from state)
      // ========================================================================
      getMyAssignments: (userId: string) => {
        const { assignments } = get();
        const now = new Date();
        return assignments.filter(
          a => a.assignedTo === userId &&
            !a.completedAt &&
            (isToday(new Date(a.dueDate)) || isAfter(new Date(a.dueDate), now))
        );
      },

      getAssignmentsForDate: (date: Date) => {
        const { assignments } = get();
        return assignments.filter(a => isSameDay(new Date(a.dueDate), date));
      },

      getOverdueAssignments: (userId: string) => {
        const { assignments } = get();
        const now = new Date();
        return assignments.filter(
          a => a.assignedTo === userId &&
            !a.completedAt &&
            isBefore(new Date(a.dueDate), now) &&
            !isToday(new Date(a.dueDate))
        );
      },

      getLeaderboard: () => {
        const { assignments, chores } = get();
        const leaderboard: Map<string, LeaderboardEntry> = new Map();

        assignments.forEach(assignment => {
          if (!assignment.completedBy) return;

          const chore = chores.find(c => c.id === assignment.choreId);
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
        return get().chores.find(c => c.id === choreId);
      },

      // ========================================================================
      // SEED TEST CHORES (Dev/Demo Helper)
      // ========================================================================
      seedTestChores: async (householdId: string, memberIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // Default test chores
          const testChores = [
            { name: 'Do dishes', description: 'Wash dishes or load/unload dishwasher', icon: 'coffee', room: 'kitchen', frequency: 'daily', point_value: 2 },
            { name: 'Take out trash', description: 'Empty all bins and take to curb', icon: 'trash-2', room: 'other', frequency: 'weekly', point_value: 3 },
            { name: 'Clean bathroom', description: 'Scrub toilet, sink, and shower', icon: 'droplet', room: 'bathroom', frequency: 'weekly', point_value: 5 },
            { name: 'Vacuum living room', description: 'Vacuum living room and hallways', icon: 'wind', room: 'living_room', frequency: 'weekly', point_value: 4 },
            { name: 'Mop floors', description: 'Mop kitchen and bathroom floors', icon: 'home', room: 'kitchen', frequency: 'weekly', point_value: 4 },
            { name: 'Wipe counters', description: 'Clean kitchen counters and stovetop', icon: 'layout', room: 'kitchen', frequency: 'daily', point_value: 2 },
          ];

          // Insert chores
          const { data: insertedChores, error: choreError } = await supabase
            .from('chores')
            .insert(testChores.map(c => ({
              household_id: householdId,
              name: c.name,
              description: c.description,
              icon: c.icon,
              room: c.room,
              frequency: c.frequency,
              point_value: c.point_value,
              is_active: true,
            })))
            .select();

          if (choreError) throw choreError;

          // Create assignments for each chore, distributed among members
          const now = new Date();
          const assignments = (insertedChores || []).map((chore, idx) => {
            const assignedMember = memberIds[idx % memberIds.length];
            // Vary due dates: some today, some past (to trigger Lingering)
            const daysAgo = idx % 3 === 0 ? 2 : (idx % 3 === 1 ? 0 : 1);
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() - daysAgo);

            return {
              chore_id: chore.id,
              assigned_to: assignedMember,
              due_date: dueDate.toISOString().split('T')[0],
            };
          });

          const { error: assignmentError } = await supabase
            .from('chore_assignments')
            .insert(assignments);

          if (assignmentError) throw assignmentError;

          // Refresh data
          await get().fetchChores(householdId);
          await get().fetchAssignments(householdId);

          console.log('[ChoreStore] Test data seeded successfully');
          set({ isLoading: false });
        } catch (error: any) {
          console.error('[ChoreStore] seedTestChores error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'chore-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist locally as cache; Supabase is source of truth
        chores: state.chores,
        assignments: state.assignments,
      }),
    }
  )
);
