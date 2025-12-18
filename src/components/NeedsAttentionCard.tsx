import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_WEIGHT } from '../constants/theme';
import { ChoreAssignment, Chore, User, Nudge } from '../types';
import { differenceInHours } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type AttentionStatus = 'needs_doing' | 'lingering' | 'nudged' | 'blocked';

interface AttentionSummary {
    total: number;
    lingering: number;
    nudged: number;
    topChore: string | null;
}

interface NeedsAttentionCardProps {
    assignments: ChoreAssignment[];
    chores: Chore[];
    members: User[];
    nudges: Nudge[];
    currentUserId: string;
    onPress: () => void;
}

// =============================================================================
// LINGERING THRESHOLDS (hours)
// =============================================================================

const LINGERING_THRESHOLDS: Record<string, number> = {
    'dishes': 12,
    'do dishes': 12,
    'trash': 48,
    'take out trash': 48,
    'recycling': 72,
    'bathroom': 48,
    'clean bathroom': 48,
    'vacuum': 72,
    'mop': 72,
    'default': 24,
};

const getLingeringThreshold = (choreName: string): number => {
    const lowerName = choreName.toLowerCase();
    for (const [key, hours] of Object.entries(LINGERING_THRESHOLDS)) {
        if (lowerName.includes(key)) {
            return hours;
        }
    }
    return LINGERING_THRESHOLDS.default;
};

// =============================================================================
// COMPUTE SUMMARY
// =============================================================================

const computeAttentionSummary = (
    assignments: ChoreAssignment[],
    chores: Chore[],
    nudges: Nudge[],
    currentUserId: string
): AttentionSummary => {
    const now = new Date();
    let total = 0;
    let lingering = 0;
    let nudged = 0;
    let topChore: string | null = null;

    const nudgedUserIds = new Set(
        nudges
            .filter(n => !n.isRead && n.targetUserId)
            .map(n => n.targetUserId)
    );

    const incompleteAssignments = assignments.filter(a => !a.completedAt);

    for (const assignment of incompleteAssignments) {
        const chore = chores.find(c => c.id === assignment.choreId);
        if (!chore || !chore.isActive) continue;

        total++;
        if (!topChore) topChore = chore.name;

        const dueDate = new Date(assignment.dueDate);
        const hoursSinceDue = differenceInHours(now, dueDate);
        const threshold = getLingeringThreshold(chore.name);

        if (nudgedUserIds.has(assignment.assignedTo)) {
            nudged++;
        } else if (hoursSinceDue > threshold) {
            lingering++;
        }
    }

    return { total, lingering, nudged, topChore };
};

// =============================================================================
// COMPONENT
// =============================================================================

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
    assignments,
    chores,
    members,
    nudges,
    currentUserId,
    onPress,
}) => {
    const summary = computeAttentionSummary(assignments, chores, nudges, currentUserId);

    // Empty state - house is peaceful
    if (summary.total === 0) {
        return (
            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
                <LinearGradient
                    colors={['rgba(45, 212, 191, 0.08)', 'rgba(45, 212, 191, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                >
                    <View style={styles.peacefulContent}>
                        <Text style={styles.peacefulEmoji}>🦫</Text>
                        <View style={styles.peacefulText}>
                            <Text style={styles.peacefulTitle}>House is peaceful</Text>
                            <Text style={styles.peacefulSubtitle}>Everything's handled</Text>
                        </View>
                    </View>
                    <Feather name="chevron-right" size={18} color={COLORS.textTertiary} />
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Items need attention
    const urgentCount = summary.lingering + summary.nudged;
    const hasUrgent = urgentCount > 0;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={hasUrgent
                    ? ['rgba(251, 146, 160, 0.12)', 'rgba(251, 146, 160, 0.04)']
                    : ['rgba(129, 140, 248, 0.08)', 'rgba(129, 140, 248, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                {/* Left: Icon + Summary */}
                <View style={styles.leftContent}>
                    <View style={[styles.iconBubble, hasUrgent && styles.iconBubbleUrgent]}>
                        <Feather
                            name="home"
                            size={18}
                            color={hasUrgent ? COLORS.accent : COLORS.primary}
                        />
                        {urgentCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{urgentCount}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.textContent}>
                        <Text style={styles.title}>
                            {summary.total} {summary.total === 1 ? 'thing' : 'things'} need attention
                        </Text>
                        {hasUrgent ? (
                            <Text style={styles.subtitle}>
                                {summary.lingering > 0 && `${summary.lingering} lingering`}
                                {summary.lingering > 0 && summary.nudged > 0 && ' · '}
                                {summary.nudged > 0 && `${summary.nudged} nudged`}
                            </Text>
                        ) : (
                            <Text style={styles.subtitleMuted}>
                                {summary.topChore ? `Starting with ${summary.topChore}` : 'Tap to view'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Right: Arrow */}
                <View style={styles.arrowContainer}>
                    <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md + 4,
        paddingHorizontal: SPACING.md,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SPACING.md,
    },
    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    iconBubbleUrgent: {
        backgroundColor: COLORS.accent + '15',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    textContent: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.accent,
        fontWeight: FONT_WEIGHT.medium,
    },
    subtitleMuted: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Peaceful state
    peacefulContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    peacefulEmoji: {
        fontSize: 28,
    },
    peacefulText: {
        flex: 1,
    },
    peacefulTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    peacefulSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondary,
    },
});

export default NeedsAttentionCard;
