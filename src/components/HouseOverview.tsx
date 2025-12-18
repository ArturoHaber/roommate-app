import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { isToday, isPast } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

/**
 * HouseOverview - Calm, peaceful task status header
 * Shows household emoji from Supabase + task counts
 */
export const HouseOverview: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { assignments } = useChoreStore();
    const { household } = useHouseholdStore();

    if (!user) return null;

    // My pending tasks
    const myPendingTasks = useMemo(() => {
        return assignments.filter(a => !a.completedAt && a.assignedTo === user.id);
    }, [assignments, user.id]);

    // Calculate urgency
    const urgencyData = useMemo(() => {
        let overdue = 0;
        let dueToday = 0;

        myPendingTasks.forEach(a => {
            const dueDate = new Date(a.dueDate);
            if (isPast(dueDate) && !isToday(dueDate)) {
                overdue++;
            } else if (isToday(dueDate)) {
                dueToday++;
            }
        });

        return { overdue, dueToday, urgent: overdue + dueToday };
    }, [myPendingTasks]);

    // Household total
    const totalPending = assignments.filter(a => !a.completedAt).length;

    // Status
    const isPeaceful = myPendingTasks.length === 0;

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('NeedsAttention' as never)}
        >
            <LinearGradient
                colors={['rgba(129, 140, 248, 0.08)', 'rgba(99, 102, 241, 0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
            >
                {/* TOP ROW: House Emoji + Title (centered) */}
                <View style={styles.topRow}>
                    <Text style={styles.houseEmoji}>{household?.emoji || '🏠'}</Text>
                    <Text style={styles.title}>{household?.name || 'House'} Status</Text>
                </View>

                <Text style={styles.subtitle}>
                    {isPeaceful
                        ? 'All caught up'
                        : urgencyData.overdue > 0
                            ? `${urgencyData.overdue} need${urgencyData.overdue === 1 ? 's' : ''} attention`
                            : 'Tasks pending'
                    }
                </Text>

                {/* STATS ROW */}
                <View style={styles.statsRow}>
                    {/* Your Tasks */}
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>{myPendingTasks.length}</Text>
                        <Text style={styles.statLabel}>Yours</Text>
                    </View>

                    <View style={styles.statDivider} />

                    {/* Household Tasks */}
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>{totalPending}</Text>
                        <Text style={styles.statLabel}>Household</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    gradientCard: {
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },

    // Top Row
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    houseEmoji: {
        fontSize: 20,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginTop: 2,
        marginBottom: SPACING.sm,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SPACING.xs,
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
});

export default HouseOverview;
