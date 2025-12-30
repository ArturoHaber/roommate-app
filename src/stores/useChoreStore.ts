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
  updateChore: (choreId: string, updates: Partial<Omit<Chore, 'id' | 'createdAt' | 'householdId'>>) => Promise<void>;
  removeChore: (choreId: string) => Promise<void>;
  completeChore: (assignmentId: string, completedBy: string) => Promise<void>;
  getMyAssignments: (userId: string) => ChoreAssignment[];
  getAssignmentsForDate: (date: Date) => ChoreAssignment[];
  getEffectiveAssignmentsForDate: (date: Date) => ChoreAssignment[]; // Includes overdue for today
  getOverdueAssignments: (userId: string) => ChoreAssignment[];
  getLeaderboard: () => LeaderboardEntry[];
  getChoreById: (choreId: string) => Chore | undefined;
  seedTestChores: (householdId: string, memberIds: string[]) => Promise<void>;
  clearAllAssignments: (householdId: string) => Promise<void>;
  reassignAllToMember: (householdId: string, memberId: string) => Promise<void>;
  clearError: () => void;

  // Activity Logging
  logActivity: (category: string, detail: string, userId: string, householdId: string) => Promise<void>;

  // Assignment Algorithm
  getNextAssignee: (choreId: string) => Promise<string | null>;
  generateAssignments: (householdId: string, startDate: Date, endDate: Date) => Promise<void>;
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
            isPersonal: row.is_personal || false,
            personalOwnerId: row.personal_owner_id,
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
            isPersonal: data.is_personal || false,
            personalOwnerId: data.personal_owner_id,
            createdAt: new Date(data.created_at),
          };

          set(state => ({ chores: [...state.chores, newChore], isLoading: false }));
        } catch (error: any) {
          console.error('[ChoreStore] addChore error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // UPDATE CHORE IN SUPABASE
      // ========================================================================
      updateChore: async (choreId: string, updates: Partial<Omit<Chore, 'id' | 'createdAt' | 'householdId'>>) => {
        set({ isLoading: true, error: null });
        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
          if (updates.room !== undefined) dbUpdates.room = updates.room;
          if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
          if (updates.interval !== undefined) dbUpdates.interval_days = updates.interval;
          if (updates.assignedDays !== undefined) dbUpdates.assigned_days = updates.assignedDays;
          if (updates.pointValue !== undefined) dbUpdates.point_value = updates.pointValue;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

          const { error } = await supabase
            .from('chores')
            .update(dbUpdates)
            .eq('id', choreId);

          if (error) throw error;

          set(state => ({
            chores: state.chores.map(c => {
              if (c.id === choreId) {
                return { ...c, ...updates };
              }
              return c;
            }),
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('[ChoreStore] updateChore error:', error);
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
          if (!assignment) throw new Error('Assignment not found');

          const isBonus = assignment.assignedTo !== completedBy;

          // 1. Mark assignment as complete
          const { error } = await supabase
            .from('chore_assignments')
            .update({
              completed_at: new Date().toISOString(),
              completed_by: completedBy,
              is_bonus: isBonus,
            })
            .eq('id', assignmentId);

          if (error) throw error;

          // 2. Increment completion count for fairness tracking
          // This updates the round-robin rotation
          const { error: countError } = await supabase.rpc('increment_chore_completion', {
            p_chore_id: assignment.choreId,
            p_user_id: completedBy,
          });

          if (countError) {
            console.warn('[ChoreStore] Failed to increment completion count:', countError);
            // Don't throw - this is non-critical
          }

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

      // Get assignments for a date, with overdue items rolled forward to today
      // This reflects reality: if you didn't do it yesterday, you still need to do it today
      getEffectiveAssignmentsForDate: (date: Date) => {
        const { assignments } = get();
        const today = new Date();
        const isQueryingToday = isToday(date);

        return assignments.filter(a => {
          const dueDate = new Date(a.dueDate);

          // Exact match for the queried date
          if (isSameDay(dueDate, date)) return true;

          // If querying today, include incomplete overdue items
          if (isQueryingToday && !a.completedAt && isBefore(dueDate, today) && !isToday(dueDate)) {
            return true;
          }

          return false;
        });
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
          // Simple test chores (just 5)
          const today = new Date();
          const todayDay = today.getDay();
          const testChores = [
            { name: 'Do dishes', description: 'Wash dishes or load/unload dishwasher', icon: '🍽️', room: 'kitchen', frequency: 'daily', point_value: 2, assigned_days: null },
            { name: 'Take out trash', description: 'Empty all bins and take to curb', icon: '🗑️', room: 'other', frequency: 'weekly', point_value: 3, assigned_days: [todayDay] },
            { name: 'Clean bathroom', description: 'Scrub toilet, sink, and shower', icon: '🚿', room: 'bathroom', frequency: 'weekly', point_value: 5, assigned_days: [(todayDay + 1) % 7] },
            { name: 'Vacuum living room', description: 'Vacuum living room and hallways', icon: '🧹', room: 'living_room', frequency: 'weekly', point_value: 4, assigned_days: [(todayDay + 2) % 7] },
            { name: 'Wipe counters', description: 'Clean kitchen counters and stovetop', icon: '✨', room: 'kitchen', frequency: 'daily', point_value: 2, assigned_days: null },
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
              assigned_days: c.assigned_days,
              is_active: true,
              is_personal: false,
            })))
            .select();

          if (choreError) throw choreError;
          console.log(`[ChoreStore] Created ${insertedChores?.length || 0} test chores`);

          // Create just a few assignments for today - evenly distributed
          const todayStr = today.toISOString().split('T')[0];
          const assignmentsToCreate: Array<{
            chore_id: string;
            assigned_to: string;
            due_date: string;
          }> = [];

          if (insertedChores && insertedChores.length > 0) {
            insertedChores.forEach((chore, index) => {
              const assignee = memberIds[index % memberIds.length];

              // Daily chores and weekly chores due today get assigned
              if (chore.frequency === 'daily') {
                assignmentsToCreate.push({
                  chore_id: chore.id,
                  assigned_to: assignee,
                  due_date: todayStr,
                });
              } else if (chore.frequency === 'weekly') {
                const assignedDays = chore.assigned_days || [];
                if (assignedDays.includes(todayDay)) {
                  assignmentsToCreate.push({
                    chore_id: chore.id,
                    assigned_to: assignee,
                    due_date: todayStr,
                  });
                }
              }
            });
          }

          // Insert assignments
          if (assignmentsToCreate.length > 0) {
            const { error: assignError } = await supabase
              .from('chore_assignments')
              .insert(assignmentsToCreate);

            if (assignError) throw assignError;
          }

          console.log(`[ChoreStore] Created ${assignmentsToCreate.length} test assignments`);

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

      // ========================================================================
      // ASSIGNMENT ALGORITHM
      // ========================================================================

      // Clear all assignments for a household (Dev/Demo Helper)
      clearAllAssignments: async (householdId: string) => {
        console.log('[ChoreStore] clearAllAssignments called with householdId:', householdId);
        set({ isLoading: true, error: null });
        try {
          const { chores, assignments } = get();
          console.log('[ChoreStore] Current chores count:', chores.length);
          console.log('[ChoreStore] Current assignments count:', assignments.length);

          const choreIds = chores.filter(c => c.householdId === householdId).map(c => c.id);
          console.log('[ChoreStore] Chore IDs for this household:', choreIds.length, choreIds);

          if (choreIds.length === 0) {
            console.log('[ChoreStore] No chores found for this household, clearing local state anyway');
            // Even if no chores in local state, try to clear from DB directly
          }

          // Try deleting directly from all assignments we know about
          const assignmentIds = assignments.map(a => a.id);
          console.log('[ChoreStore] Attempting to delete assignments by ID:', assignmentIds.length);

          if (assignmentIds.length > 0) {
            const { error, count } = await supabase
              .from('chore_assignments')
              .delete()
              .in('id', assignmentIds)
              .select();

            console.log('[ChoreStore] Delete result - error:', error, 'count:', count);

            if (error) {
              console.error('[ChoreStore] Delete error:', error);
              throw error;
            }
          }

          set({ assignments: [], isLoading: false });
          console.log('[ChoreStore] All assignments cleared successfully');
        } catch (error: any) {
          console.error('[ChoreStore] clearAllAssignments error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // Reassign all pending assignments to a specific member (Dev/Demo Helper)
      reassignAllToMember: async (householdId: string, memberId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { assignments, chores } = get();
          const choreIds = chores.filter(c => c.householdId === householdId).map(c => c.id);

          // Get pending assignment IDs for this household
          const pendingAssignmentIds = assignments
            .filter(a => choreIds.includes(a.choreId) && !a.completedAt)
            .map(a => a.id);

          if (pendingAssignmentIds.length === 0) {
            set({ isLoading: false });
            return;
          }

          const { error } = await supabase
            .from('chore_assignments')
            .update({ assigned_to: memberId })
            .in('id', pendingAssignmentIds);

          if (error) throw error;

          // Update local state
          set(state => ({
            assignments: state.assignments.map(a => {
              if (pendingAssignmentIds.includes(a.id)) {
                return { ...a, assignedTo: memberId };
              }
              return a;
            }),
            isLoading: false,
          }));

          console.log(`[ChoreStore] ${pendingAssignmentIds.length} assignments reassigned to ${memberId}`);
        } catch (error: any) {
          console.error('[ChoreStore] reassignAllToMember error:', error);
          set({ error: error.message, isLoading: false });
        }
      },
      // Get next assignee for a chore using database function (fairness-based)
      getNextAssignee: async (choreId: string) => {
        try {
          const { data, error } = await supabase.rpc('get_next_chore_assignee', {
            p_chore_id: choreId,
          });

          if (error) {
            console.error('[ChoreStore] getNextAssignee error:', error);
            return null;
          }

          return data as string | null;
        } catch (error) {
          console.error('[ChoreStore] getNextAssignee exception:', error);
          return null;
        }
      },

      // Generate assignments for a date range based on chore frequencies
      generateAssignments: async (householdId: string, startDate: Date, endDate: Date) => {
        set({ isLoading: true, error: null });
        try {
          const { chores } = get();
          const householdChores = chores.filter(c => c.householdId === householdId && c.isActive);

          const assignmentsToCreate: Array<{
            chore_id: string;
            assigned_to: string;
            due_date: string;
          }> = [];

          // Iterate through each day in the range
          for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            const dateStr = date.toISOString().split('T')[0];

            for (const chore of householdChores) {
              let shouldAssign = false;

              switch (chore.frequency) {
                case 'daily':
                  shouldAssign = true;
                  break;
                case 'weekly':
                  // Check if this day is in the assigned days array
                  shouldAssign = chore.assignedDays?.includes(dayOfWeek) || false;
                  break;
                case 'interval':
                  // For interval, we'd need to track last assignment date
                  // For now, skip interval chores (implement later)
                  shouldAssign = false;
                  break;
              }

              if (shouldAssign) {
                // Check if assignment already exists for this chore and date
                const existing = get().assignments.find(
                  a => a.choreId === chore.id &&
                    new Date(a.dueDate).toISOString().split('T')[0] === dateStr
                );

                if (!existing) {
                  // Get next assignee from the algorithm
                  const assignee = await get().getNextAssignee(chore.id);

                  if (assignee) {
                    assignmentsToCreate.push({
                      chore_id: chore.id,
                      assigned_to: assignee,
                      due_date: dateStr,
                    });
                  }
                }
              }
            }
          }

          // Batch insert all assignments
          if (assignmentsToCreate.length > 0) {
            const { error } = await supabase
              .from('chore_assignments')
              .insert(assignmentsToCreate);

            if (error) throw error;

            // Refresh assignments from database
            await get().fetchAssignments(householdId);
          }

          console.log(`[ChoreStore] Generated ${assignmentsToCreate.length} assignments`);
          set({ isLoading: false });
        } catch (error: any) {
          console.error('[ChoreStore] generateAssignments error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      // ========================================================================
      // LOG ACTIVITY - Assign Dishes to Eaters
      // When someone cooks, those who ate get assigned dish duty
      // ========================================================================
      logActivity: async (category: string, detail: string, userId: string, householdId: string) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          // Find or create a "Dishes" chore for this household
          let choreId: string;
          const dishChoreName = 'Do dishes';
          const existingChore = get().chores.find(
            c => c.name.toLowerCase().includes('dish') && c.householdId === householdId
          );

          if (existingChore) {
            choreId = existingChore.id;
          } else {
            // Create a dishes chore template
            const { data: newChore, error: choreError } = await supabase
              .from('chores')
              .insert({
                household_id: householdId,
                name: dishChoreName,
                description: 'Wash, dry, and put away dishes',
                icon: '🍽️',
                room: 'kitchen',
                frequency: 'interval', // Triggered by cooking, not scheduled
                point_value: 3,
                is_active: true,
                is_personal: false,
              })
              .select()
              .single();

            if (choreError) throw choreError;
            choreId = newChore.id;

            // Add to local chores list
            const newChoreObj: Chore = {
              id: newChore.id,
              householdId: newChore.household_id,
              name: newChore.name,
              description: newChore.description || '',
              icon: newChore.icon,
              room: newChore.room,
              frequency: newChore.frequency,
              pointValue: newChore.point_value,
              isActive: newChore.is_active,
              isPersonal: false,
              createdAt: new Date(newChore.created_at),
            };
            set(state => ({ chores: [...state.chores, newChoreObj] }));
          }

          // Create a PENDING assignment (not completed) for the user who ate
          const { data: assignment, error: assignError } = await supabase
            .from('chore_assignments')
            .insert({
              chore_id: choreId,
              assigned_to: userId,
              due_date: todayStr,
              // NO completed_at - this is pending!
              is_bonus: false,
            })
            .select()
            .single();

          if (assignError) throw assignError;

          // Add to local assignments
          const newAssignment: ChoreAssignment = {
            id: assignment.id,
            choreId: assignment.chore_id,
            assignedTo: assignment.assigned_to,
            dueDate: new Date(assignment.due_date),
            completedAt: null, // Pending!
            completedBy: null,
            isBonus: false,
            createdAt: new Date(assignment.created_at),
          };

          set(state => ({
            assignments: [...state.assignments, newAssignment],
            isLoading: false,
          }));

          console.log(`[ChoreStore] Assigned dishes to user ${userId} (from cooking)`);
        } catch (error: any) {
          console.error('[ChoreStore] logActivity error:', error);
          set({ error: error.message, isLoading: false });
        }
      },
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
