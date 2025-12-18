import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_WEIGHT } from '../constants/theme';
import { Avatar } from '../components';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useNudgeStore } from '../stores/useNudgeStore';
import { differenceInHours, formatDistanceToNowStrict } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

type AttentionStatus = 'needs_doing' | 'lingering' | 'nudged';

interface AttentionItem {
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
    sortPriority: number;
    dueDate: Date;
}

// =============================================================================
// LINGERING THRESHOLDS
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
        if (lowerName.includes(key)) return hours;
    }
    return LINGERING_THRESHOLDS.default;
};

// =============================================================================
// STATUS STYLING
// =============================================================================

const getStatusStyle = (status: AttentionStatus) => {
    switch (status) {
        case 'nudged':
            return { color: COLORS.warning, bgColor: COLORS.warning + '15', icon: 'bell' as const };
        case 'lingering':
            return { color: COLORS.accent, bgColor: COLORS.accent + '15', icon: 'clock' as const };
        default:
            return { color: COLORS.textSecondary, bgColor: COLORS.gray700, icon: 'circle' as const };
    }
};

// =============================================================================
// SCREEN
// =============================================================================

export const NeedsAttentionScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { chores, assignments } = useChoreStore();
    const { members } = useHouseholdStore();
    const { nudges } = useNudgeStore();

    if (!user) return null;

    // Compute attention items
    const now = new Date();
    const nudgedUserIds = new Set(
        nudges.filter(n => !n.isRead && n.targetUserId).map(n => n.targetUserId)
    );

    const attentionItems: AttentionItem[] = [];

    assignments.filter(a => !a.completedAt).forEach(assignment => {
        const chore = chores.find(c => c.id === assignment.choreId);
        if (!chore || !chore.isActive) return;

        const owner = members.find(m => m.id === assignment.assignedTo);
        if (!owner) return;

        const dueDate = new Date(assignment.dueDate);
        const hoursSinceDue = differenceInHours(now, dueDate);
        const threshold = getLingeringThreshold(chore.name);

        let status: AttentionStatus = 'needs_doing';
        let statusLabel = 'Needs doing';
        let sortPriority = 3;

        if (nudgedUserIds.has(assignment.assignedTo)) {
            status = 'nudged';
            statusLabel = 'Nudged';
            sortPriority = 1;
        } else if (hoursSinceDue > threshold) {
            status = 'lingering';
            statusLabel = 'Lingering';
            sortPriority = 2;
        }

        const lastUpdated = assignment.createdAt
            ? formatDistanceToNowStrict(new Date(assignment.createdAt), { addSuffix: true })
            : '';

        attentionItems.push({
            id: `attention-${assignment.id}`,
            assignmentId: assignment.id,
            choreId: chore.id,
            choreName: chore.name,
            choreIcon: chore.icon,
            ownerName: assignment.assignedTo === user.id ? 'You' : owner.name,
            ownerColor: owner.avatarColor,
            ownerId: owner.id,
            status,
            statusLabel,
            contextLabel: assignment.assignedTo === user.id ? 'Personal' : 'Shared',
            lastUpdated,
            sortPriority,
            dueDate,
        });
    });

    // Sort
    attentionItems.sort((a, b) => {
        if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
        return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Needs Attention</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{attentionItems.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: COLORS.accent }]}>
                            {attentionItems.filter(i => i.status === 'lingering').length}
                        </Text>
                        <Text style={styles.statLabel}>Lingering</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                            {attentionItems.filter(i => i.status === 'nudged').length}
                        </Text>
                        <Text style={styles.statLabel}>Nudged</Text>
                    </View>
                </View>

                {/* Empty State */}
                {attentionItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🦫</Text>
                        <Text style={styles.emptyTitle}>House is peaceful</Text>
                        <Text style={styles.emptySubtitle}>
                            Everything's handled — time to relax
                        </Text>
                    </View>
                ) : (
                    /* Items List */
                    <View style={styles.listContainer}>
                        {attentionItems.map((item, index) => {
                            const statusStyle = getStatusStyle(item.status);
                            const isLast = index === attentionItems.length - 1;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.itemCard, !isLast && styles.itemCardBorder]}
                                    activeOpacity={0.7}
                                >
                                    {/* Icon */}
                                    <View style={styles.itemIcon}>
                                        <Feather
                                            name={item.choreIcon as any}
                                            size={20}
                                            color={COLORS.textSecondary}
                                        />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.itemContent}>
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

                                    {/* Right side */}
                                    <View style={styles.itemRight}>
                                        <View style={styles.ownerRow}>
                                            <Avatar
                                                name={item.ownerName}
                                                color={item.ownerColor}
                                                size="xs"
                                            />
                                            <Text style={styles.ownerName}>{item.ownerName}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                                            <Feather name={statusStyle.icon} size={10} color={statusStyle.color} />
                                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                                {item.statusLabel}
                                            </Text>
                                        </View>
                                    </View>

                                    <Feather
                                        name="chevron-right"
                                        size={16}
                                        color={COLORS.textTertiary}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        padding: SPACING.md,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    listContainer: {
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
    itemCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    itemContent: {
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
        marginRight: SPACING.sm,
        gap: 4,
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ownerName: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.textSecondary,
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
});

export default NeedsAttentionScreen;
