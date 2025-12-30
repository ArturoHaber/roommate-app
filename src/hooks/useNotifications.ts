/**
 * useNotifications Hook
 * 
 * Handles push notification setup, token registration, and notification handling.
 * This hook should be used at the app root level to ensure notifications work globally.
 */

import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    type: 'nudge' | 'chore_reminder' | 'chore_completed' | 'activity' | 'daily_digest';
    targetScreen?: string;
    targetId?: string;
    [key: string]: any;
}

interface UseNotificationsReturn {
    expoPushToken: string | null;
    isLoading: boolean;
    error: string | null;
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
    registerToken: () => Promise<void>;
    unregisterToken: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuthStore();
    const { household } = useHouseholdStore();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    /**
     * Request notification permissions from the user
     */
    const requestPermission = async (): Promise<boolean> => {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        const granted = finalStatus === 'granted';
        setHasPermission(granted);
        return granted;
    };

    /**
     * Get the Expo Push Token for this device
     */
    const getExpoPushToken = async (): Promise<string | null> => {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        try {
            // Get the project ID from app config
            const { data: token } = await Notifications.getExpoPushTokenAsync({
                projectId: 'ef7b1a66-8ad1-4ad7-9090-6293d86b3b81', // From app.json
            });
            return token;
        } catch (err) {
            console.error('Failed to get push token:', err);
            return null;
        }
    };

    /**
     * Register the push token with Supabase
     */
    const registerToken = async (): Promise<void> => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            const granted = await requestPermission();
            if (!granted) {
                setError('Notification permission denied');
                return;
            }

            const token = await getExpoPushToken();
            if (!token) {
                setError('Failed to get push token');
                return;
            }

            setExpoPushToken(token);

            // Upsert the token to Supabase
            const { error: upsertError } = await supabase
                .from('push_tokens')
                .upsert(
                    {
                        user_id: user.id,
                        expo_push_token: token,
                        device_name: Device.deviceName || 'Unknown Device',
                        platform: Platform.OS,
                        is_active: true,
                        last_used_at: new Date().toISOString(),
                    },
                    {
                        onConflict: 'expo_push_token',
                    }
                );

            if (upsertError) {
                console.error('Failed to register token:', upsertError);
                setError('Failed to register for notifications');
            }
        } catch (err: any) {
            console.error('Error registering notifications:', err);
            setError(err.message || 'Failed to set up notifications');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Unregister (deactivate) the push token
     */
    const unregisterToken = async (): Promise<void> => {
        if (!user || !expoPushToken) return;

        try {
            await supabase
                .from('push_tokens')
                .update({ is_active: false })
                .eq('expo_push_token', expoPushToken);
        } catch (err) {
            console.error('Failed to unregister token:', err);
        }
    };

    /**
     * Handle notification received while app is in foreground
     */
    const handleNotificationReceived = (notification: Notifications.Notification) => {
        console.log('Notification received:', notification);
        // You can show a custom in-app banner here if desired
    };

    /**
     * Handle user tapping on a notification
     */
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as NotificationData;
        console.log('Notification tapped:', data);

        // Deep link to the appropriate screen based on notification type
        if (data?.type) {
            switch (data.type) {
                case 'nudge':
                    // Navigate to nudge screen
                    // navigation.navigate('NudgeScreen');
                    break;
                case 'chore_reminder':
                case 'chore_completed':
                    // Navigate to chores tab
                    // navigation.navigate('ChoresTab');
                    break;
                case 'activity':
                    // Navigate to activity history
                    // navigation.navigate('ActivityHistoryScreen');
                    break;
                case 'daily_digest':
                    // Navigate to dashboard
                    // navigation.navigate('DashboardTab');
                    break;
            }
        }
    };

    // Set up notification listeners on mount
    useEffect(() => {
        // Check existing permission status
        Notifications.getPermissionsAsync().then(({ status }) => {
            setHasPermission(status === 'granted');
        });

        // Listen for notifications when app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(
            handleNotificationReceived
        );

        // Listen for notification taps
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            handleNotificationResponse
        );

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    // Auto-register token when user logs in and has a household
    useEffect(() => {
        if (user && household && hasPermission) {
            registerToken();
        }
    }, [user?.id, household?.id, hasPermission]);

    return {
        expoPushToken,
        isLoading,
        error,
        hasPermission,
        requestPermission,
        registerToken,
        unregisterToken,
    };
}

/**
 * Send a local notification (for testing)
 */
export async function sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "🏠 CribUp Test",
            body: "Push notifications are working!",
            data: { type: 'test' },
        },
        trigger: null, // Immediate
    });
}

/**
 * Set the badge count on the app icon
 */
export async function setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
}
