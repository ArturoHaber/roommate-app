import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { Avatar, TaskDetailModal } from './index';
import { Chore, NudgeTone } from '../types';

const { height } = Dimensions.get('window');

// =============================================================================
// EMOJI + COLOR MAP
// =============================================================================

const CHORE_STYLES: Record<string, { emoji: string; color: string; bgColor: string; category: string }> = {
    'dishes': { emoji: '🍽️', color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.12)', category: 'Kitchen' },
    'do dishes': { emoji: '🍽️', color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.12)', category: 'Kitchen' },
    'trash': { emoji: '🗑️', color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.12)', category: 'General' },
    'take out trash': { emoji: '🗑️', color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.12)', category: 'General' },
    'bathroom': { emoji: '🚿', color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'Bathroom' },
    'clean bathroom': { emoji: '🚿', color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'Bathroom' },
    'vacuum': { emoji: '🧹', color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.12)', category: 'General' },
    'mop': { emoji: '🧽', color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.12)', category: 'General' },
    'mop floors': { emoji: '🧽', color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.12)', category: 'General' },
    'counters': { emoji: '✨', color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.12)', category: 'Kitchen' },
    'wipe counters': { emoji: '✨', color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.12)', category: 'Kitchen' },
    'laundry': { emoji: '👕', color: '#818CF8', bgColor: 'rgba(129, 140, 248, 0.12)', category: 'Personal' },
    'groceries': { emoji: '🛒', color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.12)', category: 'General' },
    'default': { emoji: '📋', color: '#94A3B8', bgColor: 'rgba(148, 163, 184, 0.10)', category: 'General' },
};

const getChoreStyle = (choreName: string) => {
    const lower = choreName.toLowerCase();
    for (const [key, style] of Object.entries(CHORE_STYLES)) {
        if (lower.includes(key)) return style;
    }
    return CHORE_STYLES.default;
};

// =============================================================================
// DUE DATE FORMATTING
// =============================================================================

const formatDueDate = (dueDate: Date): { text: string; isUrgent: boolean; isPastDue: boolean } => {
    const now = new Date();
    const isPastDue = isPast(dueDate) && !isToday(dueDate);

    if (isPastDue) {
        const daysOverdue = differenceInDays(now, dueDate);
        if (daysOverdue === 1) return { text: 'Yesterday', isUrgent: true, isPastDue: true };
        if (daysOverdue <= 7) return { text: `${daysOverdue}d overdue`, isUrgent: true, isPastDue: true };
        return { text: 'Overdue', isUrgent: true, isPastDue: true };
    }

    if (isToday(dueDate)) {
        const hoursLeft = differenceInHours(dueDate, now);
        if (hoursLeft <= 2) return { text: 'Due soon', isUrgent: true, isPastDue: false };
        return { text: 'Today', isUrgent: false, isPastDue: false };
    }

    if (isTomorrow(dueDate)) return { text: 'Tomorrow', isUrgent: false, isPastDue: false };

    const daysUntil = differenceInDays(dueDate, now);
    if (daysUntil <= 7) return { text: format(dueDate, 'EEEE'), isUrgent: false, isPastDue: false };

    return { text: format(dueDate, 'MMM d'), isUrgent: false, isPastDue: false };
};

// =============================================================================
// PROPS
// =============================================================================

interface ChoresCompProps {
    /** Height multiplier for the component (0.0 to 1.0 of screen height) */
    heightRatio?: number;
    /** Whether to show the history section below */
    showHistory?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ChoresComp: React.FC<ChoresCompProps> = ({
    heightRatio = 0.45,
    showHistory = false,
}) => {
    const { user } = useAuthStore();
    const { chores, assignments, completeChore } = useChoreStore();
    const { members } = useHouseholdStore();

    const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Chore | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    if (!user) return null;

    // Get user info for avatar
    const getUserInfo = (userId: string) => {
        if (userId === user.id) {
            return { name: user.name || user.email?.split('@')[0] || 'You', color: user.avatarColor || COLORS.primary };
        }
        const member = members.find(m => m.id === userId);
        return { name: member?.name || 'User', color: member?.avatarColor || COLORS.gray500 };
    };

    // =============================================================================
    // DATA FILTERING & SECTIONING
    // =============================================================================

    const allTasks = useMemo(() => {
        return assignments
            .filter(a => !a.completedAt)
            .map(a => {
                const chore = chores.find(c => c.id === a.choreId);
                const dueDate = new Date(a.dueDate);
                const dueInfo = formatDueDate(dueDate);
                const style = getChoreStyle(chore?.name || '');
                const ownerInfo = getUserInfo(a.assignedTo);

                return {
                    id: a.id,
                    name: chore?.name || 'Task',
                    emoji: style.emoji,
                    color: style.color,
                    bgColor: style.bgColor,
                    dueText: dueInfo.text,
                    isUrgent: dueInfo.isUrgent,
                    isPastDue: dueInfo.isPastDue,
                    category: style.category,
                    owner: ownerInfo,
                    assignedTo: a.assignedTo,
                    dueDate: dueDate,
                };
            });
    }, [assignments, chores, user.id, members]);

    const filteredTasks = useMemo(() => {
        let tasks = allTasks;
        if (activeTab === 'mine') {
            tasks = tasks.filter(t => t.assignedTo === user.id);
        }
        if (categoryFilter) {
            tasks = tasks.filter(t => t.category === categoryFilter);
        }
        return tasks;
    }, [allTasks, activeTab, categoryFilter, user.id]);

    // Split into sections
    const { dueNow, dueLater } = useMemo(() => {
        const nowTasks: typeof filteredTasks = [];
        const laterTasks: typeof filteredTasks = [];

        filteredTasks.forEach(t => {
            if (t.isPastDue || isToday(t.dueDate)) {
                nowTasks.push(t);
            } else {
                laterTasks.push(t);
            }
        });

        const sortByDate = (a: any, b: any) => a.dueDate.getTime() - b.dueDate.getTime();
        return {
            dueNow: nowTasks.sort(sortByDate),
            dueLater: laterTasks.sort(sortByDate),
        };
    }, [filteredTasks]);

    // Completed History
    const historyTasks = useMemo(() => {
        return assignments
            .filter(a => a.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
            .slice(0, 5)
            .map(a => {
                const chore = chores.find(c => c.id === a.choreId);
                const style = getChoreStyle(chore?.name || '');
                const runnerInfo = getUserInfo(a.completedBy || a.assignedTo);
                return {
                    id: a.id,
                    name: chore?.name || 'Task',
                    emoji: style.emoji,
                    user: runnerInfo,
                    time: format(new Date(a.completedAt!), 'MMM d, h:mm a'),
                    color: style.color,
                };
            });
    }, [assignments, chores, members]);

    const handleComplete = (id: string) => {
        completeChore(id, user.id);
        setModalVisible(false);
    };

    const handleTaskPress = (assignmentId: string) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment) {
            const chore = chores.find(c => c.id === assignment.choreId);
            if (chore) {
                setSelectedTask(chore);
                setModalVisible(true);
            }
        }
    };

    const handleMorePress = () => {
        Alert.alert(
            "Filter by Room",
            "Select a specific area to focus on:",
            [
                { text: "All Rooms", onPress: () => setCategoryFilter(null) },
                { text: "Kitchen", onPress: () => setCategoryFilter('Kitchen') },
                { text: "Bathroom", onPress: () => setCategoryFilter('Bathroom') },
                { text: "General", onPress: () => setCategoryFilter('General') },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleNudge = (task: Chore, tone: NudgeTone) => {
        Alert.alert(`Nudge Sent!`, `You nudged about "${task.name}" with a ${tone} tone.`);
    };

    const handleSnitch = (task: Chore, tone: NudgeTone) => {
        Alert.alert(`Reported!`, `You reported an issue with "${task.name}" (${tone}).`);
    };

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const renderTaskCard = (task: typeof dueNow[0]) => (
        <TouchableOpacity
            key={task.id}
            style={styles.choreCard}
            activeOpacity={0.8}
            onPress={() => handleTaskPress(task.id)}
        >
            {/* Left: Emoji Icon */}
            <View style={[styles.cardIconWrap, { backgroundColor: task.bgColor }]}>
                <Text style={styles.cardEmoji}>{task.emoji}</Text>
            </View>

            {/* Center: Task Info */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{task.name}</Text>
                <View style={styles.cardMeta}>
                    <Text style={[
                        styles.cardDue,
                        task.isPastDue && styles.cardDueOverdue,
                        task.isUrgent && !task.isPastDue && styles.cardDueUrgent
                    ]}>
                        {task.dueText}
                    </Text>
                    <View style={styles.cardDot} />
                    <View style={styles.cardOwnerRow}>
                        <Avatar name={task.owner.name} color={task.owner.color} size="xs" />
                        <Text style={styles.cardOwnerName}>{task.owner.name}</Text>
                    </View>
                </View>
            </View>

            {/* Right: Complete Button */}
            <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: task.bgColor }]}
                onPress={() => handleComplete(task.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Feather name="check" size={16} color={task.color} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <View>
            {/* THE CHORE SPACE */}
            <View style={[styles.choreSpace, { height: height * heightRatio }]}>
                {/* Filter Bar */}
                <View style={styles.filterBar}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
                            onPress={() => setActiveTab('mine')}
                        >
                            <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>Your tasks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                            onPress={() => setActiveTab('all')}
                        >
                            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All tasks</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
                        <Text style={styles.moreText}>{categoryFilter || 'More...'}</Text>
                        <Feather name="chevron-down" size={12} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Task List */}
                <ScrollView
                    style={styles.taskScroll}
                    contentContainerStyle={styles.taskScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* DUE NOW SECTION */}
                    {dueNow.length > 0 && (
                        <View style={styles.taskSection}>
                            <Text style={styles.sectionTitle}>Due now</Text>
                            {dueNow.map(renderTaskCard)}
                        </View>
                    )}

                    {/* DIVIDER */}
                    {dueNow.length > 0 && dueLater.length > 0 && (
                        <View style={styles.smoothDivider} />
                    )}

                    {/* DUE LATER SECTION */}
                    {dueLater.length > 0 && (
                        <View style={styles.taskSection}>
                            <Text style={styles.sectionTitle}>Due later</Text>
                            {dueLater.map(renderTaskCard)}
                        </View>
                    )}

                    {/* EMPTY STATE */}
                    {dueNow.length === 0 && dueLater.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>✨</Text>
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptySubtitle}>No pending chores found</Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* HISTORY SECTION (optional) */}
            {showHistory && (
                <View style={styles.historySection}>
                    <Text style={styles.historyLabel}>History</Text>
                    <View style={styles.historyCard}>
                        {historyTasks.length > 0 ? (
                            historyTasks.map((h, i) => (
                                <View key={h.id} style={[styles.historyItem, i === 0 && styles.historyItemFirst]}>
                                    <Text style={styles.historyEmoji}>{h.emoji}</Text>
                                    <View style={styles.historyContent}>
                                        <Text style={styles.historyText}>
                                            <Text style={{ color: h.user.color, fontWeight: '600' }}>{h.user.name}</Text> did {h.name}
                                        </Text>
                                        <Text style={styles.historyTime}>{h.time}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyHistory}>No recent activity</Text>
                        )}
                    </View>
                </View>
            )}

            {/* MODAL */}
            <TaskDetailModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                task={selectedTask}
                currentUser={user}
                onEdit={(t) => Alert.alert('Edit', `Editing ${t.name}`)}
                onMarkDone={(t) => {
                    const assignment = assignments.find(a => a.choreId === t.id && !a.completedAt);
                    if (assignment) handleComplete(assignment.id);
                }}
                onNudge={handleNudge}
                onSnitch={handleSnitch}
            />
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    // CHORE SPACE
    choreSpace: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },

    // Filter Bar
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: BORDER_RADIUS.lg,
        padding: 2,
    },
    tab: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.md - 2,
    },
    tabActive: {
        backgroundColor: COLORS.surfaceElevated,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textTertiary,
    },
    tabTextActive: {
        color: COLORS.textPrimary,
    },
    moreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: SPACING.sm,
    },
    moreText: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },

    // Task List
    taskScroll: {
        flex: 1,
    },
    taskScrollContent: {
        padding: SPACING.md,
    },
    taskSection: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
        marginLeft: 4,
    },
    smoothDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginVertical: SPACING.md,
        marginHorizontal: SPACING.lg,
    },

    // CHORE CARD - Polished, modern design
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        paddingRight: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    cardIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    cardEmoji: {
        fontSize: 20,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardDue: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textTertiary,
    },
    cardDueOverdue: {
        color: COLORS.error,
    },
    cardDueUrgent: {
        color: COLORS.warning,
    },
    cardDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.textTertiary,
        marginHorizontal: 6,
        opacity: 0.5,
    },
    cardOwnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardOwnerName: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textTertiary,
    },
    completeButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.xs,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    // HISTORY SECTION
    historySection: {
        marginTop: SPACING.xl,
    },
    historyLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    historyCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.03)',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.03)',
    },
    historyItemFirst: {
        borderTopWidth: 0,
        paddingTop: 0,
    },
    historyEmoji: {
        fontSize: 18,
        marginRight: SPACING.md,
    },
    historyContent: {
        flex: 1,
    },
    historyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    historyTime: {
        fontSize: 11,
        color: COLORS.textTertiary,
    },
    emptyHistory: {
        fontSize: 13,
        color: COLORS.textTertiary,
        textAlign: 'center',
        paddingVertical: SPACING.sm,
    },
});

export default ChoresComp;
