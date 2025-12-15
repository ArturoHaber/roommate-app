import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CribUp - Supabase Configuration
const supabaseUrl = 'https://tqebdkbddrpwpedstotj.supabase.co';
const supabaseAnonKey = 'sb_publishable_0Nr5qcgyzbW-0OHRcmOLTA_U4piHVLe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // Required for OAuth redirect on web!
    },
});

// Helper to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
};

// Helper to get user's household ID
export const getUserHouseholdId = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', userId)
        .single();
    return data?.household_id ?? null;
};
