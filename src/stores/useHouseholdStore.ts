import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Household, User, HouseholdMember } from '../types';
import { supabase } from '../lib/supabase';

interface HouseholdState {
  household: Household | null;
  members: User[];
  memberships: HouseholdMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createHousehold: (name: string, creatorId: string) => Promise<string | null>;
  createLocalHousehold: (name: string, emoji: string) => void; // Local-only, no Supabase
  validateInvite: (code: string) => Promise<any>; // Returns household preview data
  joinHousehold: (inviteCode: string, userId: string) => Promise<boolean>;
  fetchHousehold: (userId: string) => Promise<void>;
  updateHousehold: (updates: { name?: string; emoji?: string; address?: string }) => Promise<void>;
  leaveHousehold: (userId: string) => Promise<void>;
  getMemberIds: () => string[];
  clearError: () => void;
  clearHousehold: () => void;
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

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      household: null,
      members: [],
      memberships: [],
      isLoading: false,
      error: null,

      // ========================================================================
      // CREATE HOUSEHOLD
      // ========================================================================
      createHousehold: async (name: string, creatorId: string): Promise<string | null> => {
        set({ isLoading: true, error: null });

        try {
          const now = new Date();

          // 1. Insert household (DB generates invite_code)
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .insert({
              name,
              emoji: '🏠',
              subscription_tier: 'free',
              created_by: creatorId,
            })
            .select()
            .single();

          if (householdError) throw householdError;

          // 2. Add creator as admin member
          const { error: memberError } = await supabase
            .from('household_members')
            .insert({
              household_id: householdData.id,
              user_id: creatorId,
              role: 'admin',
            });

          if (memberError) throw memberError;

          // 3. Fetch creator profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', creatorId)
            .single();

          const household: Household = {
            id: householdData.id,
            name: householdData.name,
            emoji: householdData.emoji,
            inviteCode: householdData.invite_code,
            inviteExpiresAt: new Date(householdData.invite_expires_at),
            subscriptionTier: householdData.subscription_tier,
            createdBy: householdData.created_by,
            createdAt: new Date(householdData.created_at),
          };

          const creatorUser: User = profileData ? {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            avatarColor: profileData.avatar_color,
            statusEmoji: profileData.status_emoji,
            statusText: profileData.status_text,
            isVacationMode: profileData.is_vacation_mode,
            createdAt: new Date(profileData.created_at),
            updatedAt: new Date(profileData.updated_at),
          } : { id: creatorId, email: '', name: 'You', avatarColor: '#6366F1', isVacationMode: false, createdAt: now, updatedAt: now };

          set({
            household,
            members: [creatorUser],
            memberships: [{
              householdId: household.id,
              userId: creatorId,
              role: 'admin',
              joinedAt: now,
            }],
            isLoading: false,
          });

          return householdData.invite_code;
        } catch (error: any) {
          console.error('Create household error:', error);
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      // ========================================================================
      // CREATE LOCAL HOUSEHOLD (for local-first onboarding, no Supabase)
      // ========================================================================
      createLocalHousehold: (name: string, emoji: string) => {
        const now = new Date();
        const localId = `local_${Date.now()}`;
        const inviteCode = generateInviteCode();

        const household: Household = {
          id: localId,
          name,
          emoji: emoji || '🏠',
          inviteCode,
          inviteExpiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48hr
          subscriptionTier: 'free',
          createdBy: 'local_user',
          createdAt: now,
        };

        const localUser: User = {
          id: 'local_user',
          email: '',
          name: 'You',
          avatarColor: '#6366F1',
          isVacationMode: false,
          createdAt: now,
          updatedAt: now,
        };

        set({
          household,
          members: [localUser],
          memberships: [{
            householdId: localId,
            userId: 'local_user',
            role: 'admin',
            joinedAt: now,
          }],
          isLoading: false,
          error: null,
        });
      },

      // ========================================================================
      // JOIN HOUSEHOLD
      // ========================================================================
      // ========================================================================
      // VALIDATE INVITE
      // ========================================================================
      validateInvite: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          // Use secure RPC
          const { data, error } = await supabase.rpc('verify_invite_code', {
            invite_code_input: code,
          });

          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error('Invalid invite code');
          }

          // Data is an array due to SETOF/TABLE return
          return data[0];
        } catch (error: any) {
          console.error('Validate invite error:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      joinHousehold: async (inviteCode: string, userId: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          // 1. Verify code and get ID
          const { data: householdList, error: householdError } = await supabase.rpc('verify_invite_code', {
            invite_code_input: inviteCode,
          });

          if (householdError) throw householdError;
          if (!householdList || householdList.length === 0) {
            set({ error: 'Invalid invite code', isLoading: false });
            return false;
          }

          const householdToJoin = householdList[0]; // verify_invite_code returns TABLE/array



          // 3. Check if already a member
          const { data: existingMember } = await supabase
            .from('household_members')
            .select('*')
            .eq('household_id', householdToJoin.id)
            .eq('user_id', userId)
            .single();

          if (existingMember) {
            set({ error: 'You are already a member of this household', isLoading: false });
            return false;
          }

          // 4. Add user as member
          const { error: joinError } = await supabase
            .from('household_members')
            .insert({
              household_id: householdToJoin.id,
              user_id: userId,
              role: 'member',
            });

          if (joinError) throw joinError;

          // 5. Fetch full household with members
          await get().fetchHousehold(userId);

          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Join household error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // ========================================================================
      // FETCH HOUSEHOLD (for current user)
      // ========================================================================
      fetchHousehold: async (userId: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          // 1. Find user's household membership
          const { data: membershipData, error: membershipError } = await supabase
            .from('household_members')
            .select('household_id, role, joined_at')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle() instead of single() - doesn't error on 0 rows

          // If no membership found (or RLS blocked query), user has no household
          if (membershipError || !membershipData) {
            // PGRST116 = no rows returned, 406 = RLS blocked - both mean no membership
            console.log('No household membership found for user:', userId);
            set({ household: null, members: [], memberships: [], isLoading: false });
            return;
          }

          // 2. Fetch household
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .select('*')
            .eq('id', membershipData.household_id)
            .single();

          if (householdError) throw householdError;

          // 3. Fetch all members of this household
          const { data: allMemberships, error: membersError } = await supabase
            .from('household_members')
            .select(`
              household_id,
              user_id,
              role,
              joined_at,
              profiles:user_id (
                id,
                email,
                name,
                avatar_color,
                status_emoji,
                status_text,
                is_vacation_mode,
                created_at,
                updated_at
              )
            `)
            .eq('household_id', membershipData.household_id);

          if (membersError) throw membersError;

          // 4. Transform data
          const household: Household = {
            id: householdData.id,
            name: householdData.name,
            emoji: householdData.emoji,
            address: householdData.address,
            inviteCode: householdData.invite_code,
            inviteExpiresAt: new Date(householdData.invite_expires_at),
            subscriptionTier: householdData.subscription_tier,
            subscriptionExpiresAt: householdData.subscription_expires_at ? new Date(householdData.subscription_expires_at) : undefined,
            createdBy: householdData.created_by,
            createdAt: new Date(householdData.created_at),
          };

          const members: User[] = (allMemberships || []).map((m: any) => ({
            id: m.profiles.id,
            email: m.profiles.email,
            name: m.profiles.name,
            avatarColor: m.profiles.avatar_color,
            statusEmoji: m.profiles.status_emoji,
            statusText: m.profiles.status_text,
            isVacationMode: m.profiles.is_vacation_mode,
            createdAt: new Date(m.profiles.created_at),
            updatedAt: new Date(m.profiles.updated_at),
          }));

          const memberships: HouseholdMember[] = (allMemberships || []).map((m: any) => ({
            householdId: m.household_id,
            userId: m.user_id,
            role: m.role,
            joinedAt: new Date(m.joined_at),
          }));

          set({ household, members, memberships, isLoading: false });
        } catch (error: any) {
          console.error('Fetch household error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // UPDATE HOUSEHOLD
      // ========================================================================
      updateHousehold: async (updates: { name?: string; emoji?: string; address?: string }) => {
        const { household } = get();
        if (!household) return;

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('households')
            .update(updates)
            .eq('id', household.id);

          if (error) throw error;

          // Update local state
          set({
            household: { ...household, ...updates },
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Update household error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // LEAVE HOUSEHOLD
      // ========================================================================
      leaveHousehold: async (userId: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const { household } = get();
          if (!household) {
            set({ isLoading: false });
            return;
          }

          // Delete membership
          const { error } = await supabase
            .from('household_members')
            .delete()
            .eq('household_id', household.id)
            .eq('user_id', userId);

          if (error) throw error;

          set({ household: null, members: [], memberships: [], isLoading: false });
        } catch (error: any) {
          console.error('Leave household error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // ========================================================================
      // HELPER METHODS
      // ========================================================================
      getMemberIds: () => {
        return get().members.map(m => m.id);
      },

      clearError: () => {
        set({ error: null });
      },

      clearHousehold: () => {
        set({ household: null, members: [], memberships: [] });
      },
    }),
    {
      name: 'household-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
