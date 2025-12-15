import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { Avatar } from './Avatar';

export interface ActivityItem {
    id: string;
    user: string;
    userColor: string;
    type: 'complete' | 'nudge';
    chore: string;
    time: string;
}

interface ActivityDetailModalProps {
    activity: ActivityItem | null;
    onClose: () => void;
}

// Mock stats - in real app would come from stores
const getPersonStats = (user: string) => ({
    tasksThisWeek: Math.floor(Math.random() * 8) + 2,
    totalTasks: Math.floor(Math.random() * 50) + 15,
    streak: Math.floor(Math.random() * 5) + 1,
});

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onClose }) => {
    if (!activity) return null;

    const stats = getPersonStats(activity.user);

    return (
        <Modal
            visible={activity !== null}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Activity Details</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Feather name="x" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.detailContent}>
                    {/* Activity Card */}
                    <View style={styles.detailCard}>
                        <View style={styles.detailHeader}>
                            <Avatar name={activity.user} color={activity.userColor} size="lg" />
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailUser}>{activity.user}</Text>
                                <Text style={styles.detailTime}>{activity.time}</Text>
                            </View>
                            <View style={[
                                styles.detailBadge,
                                activity.type === 'complete' ? styles.badgeComplete : styles.badgeNudge
                            ]}>
                                <Feather
                                    name={activity.type === 'complete' ? 'check-circle' : 'send'}
                                    size={14}
                                    color={activity.type === 'complete' ? COLORS.success : COLORS.primary}
                                />
                                <Text style={[
                                    styles.badgeText,
                                    { color: activity.type === 'complete' ? COLORS.success : COLORS.primary }
                                ]}>
                                    {activity.type === 'complete' ? 'Completed' : 'Nudge'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailBody}>
                            <Text style={styles.detailLabel}>
                                {activity.type === 'complete' ? 'Task Completed' : 'Nudge Message'}
                            </Text>
                            <Text style={styles.detailChore}>{activity.chore}</Text>
                        </View>
                    </View>

                    {/* Completed Task: Show Person's Stats */}
                    {activity.type === 'complete' && (
                        <>
                            {/* Activity Stats */}
                            <View style={styles.statsCard}>
                                <Text style={styles.statsTitle}>{activity.user}'s Activity</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{stats.tasksThisWeek}</Text>
                                        <Text style={styles.statLabel}>This Week</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{stats.totalTasks}</Text>
                                        <Text style={styles.statLabel}>All Time</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{stats.streak}🔥</Text>
                                        <Text style={styles.statLabel}>Day Streak</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Kudos Section */}
                            <View style={styles.kudosSection}>
                                <Text style={styles.kudosTitle}>Send kudos 🎉</Text>
                                <View style={styles.kudosRow}>
                                    {['🎉', '👏', '🙌', '❤️', '🔥'].map((emoji) => (
                                        <TouchableOpacity
                                            key={emoji}
                                            style={styles.kudosButton}
                                            onPress={() => {
                                                Alert.alert('Kudos sent!', `You sent ${emoji} to ${activity.user}!`);
                                                onClose();
                                            }}
                                        >
                                            <Text style={styles.kudosEmoji}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {/* Nudge View: Show context */}
                    {activity.type === 'nudge' && (
                        <View style={styles.nudgeInfo}>
                            <View style={styles.nudgeIconWrap}>
                                <Feather name="bell" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.nudgeText}>
                                Friendly reminder sent to help keep the household running smoothly!
                            </Text>
                            <Text style={styles.nudgeHint}>
                                Nudges help roommates stay on track without awkward conversations 💬
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    detailContent: {
        padding: SPACING.lg,
    },
    detailCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    detailInfo: {
        flex: 1,
    },
    detailUser: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    detailTime: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    detailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        gap: 4,
    },
    badgeComplete: {
        backgroundColor: COLORS.success + '20',
    },
    badgeNudge: {
        backgroundColor: COLORS.primary + '20',
    },
    badgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    detailBody: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
        paddingTop: SPACING.lg,
    },
    detailLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    detailChore: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    // Stats Card
    statsCard: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    statsTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.gray700,
    },
    statValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    // Kudos Section
    kudosSection: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    kudosTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    kudosRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    kudosButton: {
        width: 52,
        height: 52,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kudosEmoji: {
        fontSize: 24,
    },
    // Nudge Info
    nudgeInfo: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        alignItems: 'center',
    },
    nudgeIconWrap: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    nudgeText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    nudgeHint: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
