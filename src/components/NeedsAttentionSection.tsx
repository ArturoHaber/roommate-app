import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_WEIGHT } from '../constants/theme';
import { Avatar } from './Avatar';
import { ChoreAssignment, Chore, User, Nudge } from '../types';
import { differenceInHours, differenceInDays, formatDistanceToNowStrict } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export type AttentionStatus = 'needs_doing' | 'lingering' | 'nudged' | 'blocked';

export interface AttentionItem {
    id: string;
    assignmentId: string;
    choreId: string;
    choreName: string;
    choreIcon: string;
    ownerName: string;
    ownerColor: string;
    ownerId: string;
    status: AttentionStatus;
    statusLabel: string;
    contextLabel: 'Personal' | 'Shared';
    lastUpdated: string;
    sortPriority: number; // Lower = higher priority
    dueDate: Date;
}

interface NeedsAttentionSectionProps {
    assignments: ChoreAssignment[];
    chores: Chore[];
    members: User[];
    nudges: Nudge[];
    currentUserId: string;
    onItemPress: (item: AttentionItem) => void;
    maxItems?: number;
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
    'take out recycling': 72,
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
// COMPUTE ATTENTION ITEMS
// =============================================================================

const computeAttentionItems = (
    assignments: ChoreAssignment[],
    chores: Chore[],
    members: User[],
    nudges: Nudge[],
    currentUserId: string
): AttentionItem[] => {
    const now = new Date();
    const items: AttentionItem[] = [];

    // Get nudged assignment IDs for priority sorting
    const nudgedAssignmentIds = new Set(
        nudges
            .filter(n => !n.isRead && n.targetUserId)
            .map(n => n.targetUserId)
    );

    // Filter incomplete assignments
    const incompleteAssignments = assignments.filter(a => !a.completedAt);

    for (const assignment of incompleteAssignments) {
        const chore = chores.find(c => c.id === assignment.choreId);
        if (!chore || !chore.isActive) continue;

        const owner = members.find(m => m.id === assignment.assignedTo);
        if (!owner) continue;

        const dueDate = new Date(assignment.dueDate);
        const hoursSinceDue = differenceInHours(now, dueDate);
        const daysSinceDue = differenceInDays(now, dueDate);
        const lingeringThreshold = getLingeringThreshold(chore.name);

        // Determine status
        let status: AttentionStatus = 'needs_doing';
        let statusLabel = 'Needs doing';
        let sortPriority = 3;

        // Check if nudged
        const isNudged = nudgedAssignmentIds.has(assignment.assignedTo);
        if (isNudged) {
            status = 'nudged';
            statusLabel = 'Nudged';
            sortPriority = 1;
        } else if (hoursSinceDue > lingeringThreshold) {
            status = 'lingering';
            statusLabel = 'Lingering';
            sortPriority = 2;
        }

        // Context label
        const contextLabel: 'Personal' | 'Shared' =
            assignment.assignedTo === currentUserId ? 'Personal' : 'Shared';

        // Last updated text
        const lastUpdated = assignment.createdAt
            ? formatDistanceToNowStrict(new Date(assignment.createdAt), { addSuffix: true })
            : '';

        items.push({
            id: `attention-${assignment.id}`,
            assignmentId: assignment.id,
            choreId: chore.id,
            choreName: chore.name,
            choreIcon: chore.icon,
            ownerName: assignment.assignedTo === currentUserId ? 'You' : owner.name,
            ownerColor: owner.avatarColor,
            ownerId: owner.id,
            status,
            statusLabel,
            contextLabel,
            lastUpdated,
            sortPriority,
            dueDate,
        });
    }

    // Sort: nudged first, then lingering, then needs_doing, then by due date
    return items
        .sort((a, b) => {
            if (a.sortPriority !== b.sortPriority) {
                return a.sortPriority - b.sortPriority;
            }
            return a.dueDate.getTime() - b.dueDate.getTime();
        });
};

// =============================================================================
// STATUS STYLING
// =============================================================================

const getStatusStyle = (status: AttentionStatus) => {
    switch (status) {
        case 'nudged':
            return {
                color: COLORS.warning,
                bgColor: COLORS.warning + '15',
                icon: 'bell' as const,
            };
        case 'lingering':
            return {
                color: COLORS.accent,
                bgColor: COLORS.accent + '15',
                icon: 'clock' as const,
            };
        case 'blocked':
            return {
                color: COLORS.error,
                bgColor: COLORS.error + '15',
                icon: 'alert-circle' as const,
            };
        default:
            return {
                color: COLORS.textSecondary,
                bgColor: COLORS.gray700,
                icon: 'circle' as const,
            };
    }
};

// =============================================================================
// COMPONENT
// =============================================================================

export const NeedsAttentionSection: React.FC<NeedsAttentionSectionProps> = ({
    assignments,
    chores,
    members,
    nudges,
    currentUserId,
    onItemPress,
    maxItems = 5,
}) => {
    const attentionItems = computeAttentionItems(
        assignments,
        chores,
        members,
        nudges,
        currentUserId
    ).slice(0, maxItems);

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIcon}>
                        <Feather name="home" size={14} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.headerTitle}>House Needs Attention</Text>
                </View>
                {attentionItems.length > 0 && (
                    <Text style={styles.headerCount}>{attentionItems.length}</Text>
                )}
            </View>

            {/* Empty State or Attention Items */}
            {attentionItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🦫</Text>
                    <Text style={styles.emptyTitle}>House is peaceful</Text>
                    <Text style={styles.emptySubtitle}>Everything's handled — time to relax</Text>
                </View>
            ) : (
                <View style={styles.itemsContainer}>
                    {attentionItems.map((item, index) => {
                        const statusStyle = getStatusStyle(item.status);
                        const isLast = index === attentionItems.length - 1;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.itemCard,
                                    !isLast && styles.itemCardWithBorder,
                                ]}
                                onPress={() => onItemPress(item)}
                                activeOpacity={0.7}
                            >
                                {/* Left: Chore Info */}
                                <View style={styles.itemLeft}>
                                    <View style={styles.itemIcon}>
                                        <Feather
                                            name={item.choreIcon as any}
                                            size={18}
                                            color={COLORS.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.choreName}</Text>
                                        <View style={styles.itemMeta}>
                                            <Text style={styles.itemContext}>{item.contextLabel}</Text>
                                            {item.lastUpdated && (
                                                <>
                                                    <Text style={styles.itemDot}>•</Text>
                                                    <Text style={styles.itemTime}>{item.lastUpdated}</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Right: Owner + Status */}
                                <View style={styles.itemRight}>
                                    <View style={styles.ownerInfo}>
                                        <Avatar
                                            name={item.ownerName}
                                            color={item.ownerColor}
                                            size="xs"
                                        />
                                        <Text style={styles.ownerName} numberOfLines={1}>
                                            {item.ownerName}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                                        <Feather
                                            name={statusStyle.icon}
                                            size={10}
                                            color={statusStyle.color}
                                        />
                                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                            {item.statusLabel}
                                        </Text>
                                    </View>
                                </View>

                                {/* Chevron */}
                                <Feather
                                    name="chevron-right"
                                    size={16}
                                    color={COLORS.textTertiary}
                                    style={styles.chevron}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    headerIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: COLORS.secondary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
    },
    headerCount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        backgroundColor: COLORS.gray800,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    itemsContainer: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        overflow: 'hidden',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
    },
    itemCardWithBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    itemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemContext: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
    },
    itemDot: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginHorizontal: 4,
    },
    itemTime: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
    },
    itemRight: {
        alignItems: 'flex-end',
        gap: 4,
        marginRight: SPACING.sm,
    },
    ownerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ownerName: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.textSecondary,
        maxWidth: 60,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    statusText: {
        fontSize: 10,
        fontWeight: FONT_WEIGHT.semibold,
    },
    chevron: {
        marginLeft: 4,
    },
    emptyContainer: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: SPACING.sm,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
});

export default NeedsAttentionSection;
