import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { formatTimeForDisplay } from '../hooks/useNotificationPreferences';

interface NotificationSettingsScreenProps {
    onBack: () => void;
}

// Cheeky messages for when users try to mute responsibilities
const RESPONSIBILITY_MESSAGES = [
    "Nice try! You can't silence your responsibilities 😏",
    "Your roommates are watching... 👀",
    "Accountability isn't optional here!",
    "Did you really think that would work? 😂",
    "The chores won't do themselves!",
    "Your future self will thank you for keeping this on.",
];

const getRandomMessage = () => {
    return RESPONSIBILITY_MESSAGES[Math.floor(Math.random() * RESPONSIBILITY_MESSAGES.length)];
};

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ onBack }) => {
    // Mutable preferences
    const [choreCompletions, setChoreCompletions] = useState(true);
    const [householdActivity, setHouseholdActivity] = useState(true);
    const [dailyDigest, setDailyDigest] = useState(false);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('08:00');
    const [appHaptics, setAppHaptics] = useState(true);

    // Switch colors
    const switchTrackOff = COLORS.gray700;
    const switchTrackOn = COLORS.primary;
    const switchThumbOff = COLORS.gray500;
    const switchThumbOn = '#FFFFFF';

    // Handler for locked toggles (the fun part!)
    const handleLockedToggle = (name: string) => {
        const message = getRandomMessage();
        if (Platform.OS === 'web') {
            window.alert(message);
        } else {
            Alert.alert(
                `Can't Mute ${name}`,
                message,
                [{ text: 'Fine... 😤', style: 'default' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Mutable Alerts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OPTIONAL</Text>

                    <View style={styles.card}>
                        {/* Chore Completions */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Completions</Text>
                                <Text style={styles.settingDescription}>When tasks are finished</Text>
                            </View>
                            <Switch
                                value={choreCompletions}
                                onValueChange={setChoreCompletions}
                                trackColor={{ false: switchTrackOff, true: switchTrackOn }}
                                thumbColor={choreCompletions ? switchThumbOn : switchThumbOff}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Household Updates */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Household Updates</Text>
                                <Text style={styles.settingDescription}>New members & changes</Text>
                            </View>
                            <Switch
                                value={householdActivity}
                                onValueChange={setHouseholdActivity}
                                trackColor={{ false: switchTrackOff, true: switchTrackOn }}
                                thumbColor={householdActivity ? switchThumbOn : switchThumbOff}
                            />
                        </View>
                    </View>
                </View>

                {/* Daily Digest Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DAILY DIGEST</Text>

                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Morning Summary</Text>
                                <Text style={styles.settingDescription}>AI overview of your day</Text>
                            </View>
                            <Switch
                                value={dailyDigest}
                                onValueChange={setDailyDigest}
                                trackColor={{ false: switchTrackOff, true: switchTrackOn }}
                                thumbColor={dailyDigest ? switchThumbOn : switchThumbOff}
                            />
                        </View>

                        {dailyDigest && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.timeSelector}>
                                    <Text style={styles.timeSelectorLabel}>Deliver at</Text>
                                    <View style={styles.timeOptions}>
                                        {['07:00', '08:00', '09:00', '10:00'].map((time) => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeOption,
                                                    reminderTime === time && styles.timeOptionActive,
                                                ]}
                                                onPress={() => setReminderTime(time)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timeOptionText,
                                                        reminderTime === time && styles.timeOptionTextActive,
                                                    ]}
                                                >
                                                    {formatTimeForDisplay(time)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Schedule Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SCHEDULE</Text>

                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Quiet Hours</Text>
                                <Text style={styles.settingDescription}>Pause during sleep</Text>
                            </View>
                            <Switch
                                value={quietHoursEnabled}
                                onValueChange={setQuietHoursEnabled}
                                trackColor={{ false: switchTrackOff, true: switchTrackOn }}
                                thumbColor={quietHoursEnabled ? switchThumbOn : switchThumbOff}
                            />
                        </View>

                        {quietHoursEnabled && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.quietHoursRow}>
                                    <TouchableOpacity style={styles.quietTimeBlock}>
                                        <Text style={styles.quietTimeLabel}>From</Text>
                                        <View style={styles.quietTimeValueRow}>
                                            <Text style={styles.quietTimeValue}>10:00 PM</Text>
                                            <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.quietTimeDivider} />
                                    <TouchableOpacity style={styles.quietTimeBlock}>
                                        <Text style={styles.quietTimeLabel}>Until</Text>
                                        <View style={styles.quietTimeValueRow}>
                                            <Text style={styles.quietTimeValue}>8:00 AM</Text>
                                            <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>

                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                                <Text style={styles.settingDescription}>Vibration on actions</Text>
                            </View>
                            <Switch
                                value={appHaptics}
                                onValueChange={setAppHaptics}
                                trackColor={{ false: switchTrackOff, true: switchTrackOn }}
                                thumbColor={appHaptics ? switchThumbOn : switchThumbOff}
                            />
                        </View>
                    </View>
                </View>

                {/* LOCKED Section - THE FUN PART */}
                <View style={styles.section}>
                    <View style={styles.lockedHeader}>
                        <Text style={styles.sectionTitle}>ACCOUNTABILITY</Text>
                        <Feather name="lock" size={12} color={COLORS.textTertiary} />
                    </View>

                    <View style={[styles.card, styles.lockedCard]}>
                        {/* Nudges - LOCKED */}
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => handleLockedToggle('Nudges')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingInfo}>
                                <View style={styles.lockedLabelRow}>
                                    <Text style={styles.settingLabel}>Nudges</Text>
                                    <View style={styles.lockedBadge}>
                                        <Text style={styles.lockedBadgeText}>Always On</Text>
                                    </View>
                                </View>
                                <Text style={styles.settingDescription}>When roommates nudge you</Text>
                            </View>
                            <View style={styles.lockedSwitch}>
                                <View style={styles.lockedSwitchTrack}>
                                    <View style={styles.lockedSwitchThumb} />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Chore Reminders - LOCKED */}
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => handleLockedToggle('Reminders')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingInfo}>
                                <View style={styles.lockedLabelRow}>
                                    <Text style={styles.settingLabel}>Chore Reminders</Text>
                                    <View style={styles.lockedBadge}>
                                        <Text style={styles.lockedBadgeText}>Always On</Text>
                                    </View>
                                </View>
                                <Text style={styles.settingDescription}>Alerts when chores are due</Text>
                            </View>
                            <View style={styles.lockedSwitch}>
                                <View style={styles.lockedSwitchTrack}>
                                    <View style={styles.lockedSwitchThumb} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.lockedNote}>
                        Some notifications can't be muted. Accountability is part of the deal! 🤝
                    </Text>
                </View>

                {/* Footer */}
                <Text style={styles.footerText}>
                    Settings are saved automatically.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textTertiary,
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    card: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    settingInfo: {
        flex: 1,
        marginRight: SPACING.lg,
    },
    settingLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: COLORS.gray700,
        marginLeft: SPACING.lg,
    },
    timeSelector: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    timeSelectorLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    timeOptions: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    timeOption: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
    },
    timeOptionActive: {
        backgroundColor: COLORS.primary,
    },
    timeOptionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    timeOptionTextActive: {
        color: '#FFFFFF',
    },
    quietHoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    quietTimeBlock: {
        flex: 1,
    },
    quietTimeDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.gray700,
        marginHorizontal: SPACING.lg,
    },
    quietTimeLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    quietTimeValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    quietTimeValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    // Locked section styles
    lockedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    lockedCard: {
        borderWidth: 1,
        borderColor: COLORS.gray700,
        borderStyle: 'dashed',
    },
    lockedLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: 2,
    },
    lockedBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    lockedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    lockedSwitch: {
        opacity: 0.5,
    },
    lockedSwitchTrack: {
        width: 51,
        height: 31,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    lockedSwitchThumb: {
        width: 27,
        height: 27,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
    },
    lockedNote: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        marginTop: SPACING.sm,
        marginLeft: SPACING.xs,
        fontStyle: 'italic',
    },
    footerText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginTop: SPACING.lg,
        lineHeight: 18,
    },
});

export default NotificationSettingsScreen;
