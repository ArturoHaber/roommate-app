/**
 * useNotificationPreferences Hook
 * 
 * Manages user notification preferences stored in Supabase.
 * Provides methods to fetch, update, and sync preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

export interface NotificationPreferences {
    userId: string;
    choreReminders: boolean;
    nudges: boolean;
    householdActivity: boolean;
    choreCompletions: boolean;
    dailyDigest: boolean;
    reminderTime: string;       // HH:MM format
    reminderHoursBefore: number;
    quietHoursEnabled: boolean;
    quietHoursStart: string;    // HH:MM format
    quietHoursEnd: string;      // HH:MM format
    timezone: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
    choreReminders: true,
    nudges: true,
    householdActivity: true,
    choreCompletions: true,
    dailyDigest: false,
    reminderTime: '08:00',
    reminderHoursBefore: 2,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

interface UseNotificationPreferencesReturn {
    preferences: NotificationPreferences | null;
    isLoading: boolean;
    error: string | null;
    updatePreference: <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ) => Promise<void>;
    refreshPreferences: () => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
    const { user } = useAuthStore();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Transform database row to camelCase preferences object
     */
    const transformFromDb = (row: any): NotificationPreferences => ({
        userId: row.user_id,
        choreReminders: row.chore_reminders,
        nudges: row.nudges,
        householdActivity: row.household_activity,
        choreCompletions: row.chore_completions,
        dailyDigest: row.daily_digest,
        reminderTime: row.reminder_time?.slice(0, 5) || '08:00',
        reminderHoursBefore: row.reminder_hours_before || 2,
        quietHoursEnabled: row.quiet_hours_enabled,
        quietHoursStart: row.quiet_hours_start?.slice(0, 5) || '22:00',
        quietHoursEnd: row.quiet_hours_end?.slice(0, 5) || '08:00',
        timezone: row.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    /**
     * Fetch preferences from Supabase
     */
    const fetchPreferences = useCallback(async () => {
        if (!user) {
            setPreferences(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) {
                // If no row exists yet, create default preferences
                if (fetchError.code === 'PGRST116') {
                    const { data: newData, error: insertError } = await supabase
                        .from('notification_preferences')
                        .insert({
                            user_id: user.id,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        })
                        .select()
                        .single();

                    if (insertError) {
                        throw insertError;
                    }
                    setPreferences(transformFromDb(newData));
                } else {
                    throw fetchError;
                }
            } else {
                setPreferences(transformFromDb(data));
            }
        } catch (err: any) {
            console.error('Failed to fetch notification preferences:', err);
            setError(err.message || 'Failed to load preferences');
            // Fall back to defaults
            setPreferences({
                userId: user.id,
                ...DEFAULT_PREFERENCES,
            });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    /**
     * Update a single preference
     */
    const updatePreference = async <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ): Promise<void> => {
        if (!user || !preferences) return;

        // Optimistic update
        setPreferences((prev) => prev ? { ...prev, [key]: value } : null);

        // Map camelCase to snake_case for database
        const keyMap: { [key: string]: string } = {
            choreReminders: 'chore_reminders',
            nudges: 'nudges',
            householdActivity: 'household_activity',
            choreCompletions: 'chore_completions',
            dailyDigest: 'daily_digest',
            reminderTime: 'reminder_time',
            reminderHoursBefore: 'reminder_hours_before',
            quietHoursEnabled: 'quiet_hours_enabled',
            quietHoursStart: 'quiet_hours_start',
            quietHoursEnd: 'quiet_hours_end',
            timezone: 'timezone',
        };

        const dbKey = keyMap[key as string] || key;

        try {
            const { error: updateError } = await supabase
                .from('notification_preferences')
                .update({ [dbKey]: value })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Failed to update preference:', updateError);
                // Revert optimistic update
                fetchPreferences();
            }
        } catch (err) {
            console.error('Error updating preference:', err);
            fetchPreferences();
        }
    };

    // Fetch on mount and when user changes
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        isLoading,
        error,
        updatePreference,
        refreshPreferences: fetchPreferences,
    };
}

/**
 * Utility to format time for display
 */
export function formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Utility to parse display time back to 24h format
 */
export function parseDisplayTime(displayTime: string): string {
    const match = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '08:00';

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}
