import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert,
    Animated, Dimensions, PanResponder
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isTomorrow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { Avatar, TaskDetailModal } from '../components';
import { Chore, NudgeTone } from '../types';

const { width, height } = Dimensions.get('window');

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
// MAIN SCREEN
// =============================================================================

export const ChoresCalmScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { chores, assignments, completeChore, fetchChores, fetchAssignments, seedTestChores } = useChoreStore();
    const { members, household } = useHouseholdStore();

    const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Chore | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Fetch on mount
    React.useEffect(() => {
        if (household?.id) {
            fetchChores(household.id).then(() => fetchAssignments(household.id));
        }
    }, [household?.id]);

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
        const now = new Date();
        const nowTasks: typeof filteredTasks = [];
        const laterTasks: typeof filteredTasks = [];

        filteredTasks.forEach(t => {
            if (t.isPastDue || isToday(t.dueDate)) {
                nowTasks.push(t);
            } else {
                laterTasks.push(t);
            }
        });

        // Sort each section
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
            activeOpacity={0.7}
            onPress={() => handleTaskPress(task.id)}
        >
            {/* Left: Icon Wrapper */}
            <View style={[styles.cardIconWrap, { backgroundColor: task.bgColor }]}>
                <Text style={styles.cardEmoji}>{task.emoji}</Text>
            </View>

            {/* Center: Info */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{task.name}</Text>
                <Text style={[
                    styles.cardDue,
                    task.isPastDue && styles.cardDueOverdue,
                    task.isUrgent && !task.isPastDue && styles.cardDueUrgent
                ]}>
                    {task.dueText}
                </Text>
            </View>

            {/* Right: Actions & Owner */}
            <View style={styles.cardRight}>
                <TouchableOpacity
                    style={[styles.checkmarkCircle, { borderColor: task.color }]}
                    onPress={() => handleComplete(task.id)}
                >
                    <Feather name="check" size={14} color={task.color} />
                </TouchableOpacity>

                <View style={styles.cardAvatar}>
                    <Avatar name={task.owner.name} color={task.owner.color} size="xs" />
                </View>
            </View>
        </TouchableOpacity>
    );

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainWrapper}>
                {/* Header at the top */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>CribUp</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        {/* Dev: Add test data */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={async () => {
                                if (household?.id && members.length > 0) {
                                    await seedTestChores(household.id, members.map(m => m.id));
                                    Alert.alert('✓', 'Test chores added');
                                }
                            }}
                        >
                            <Feather name="database" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        {/* Manage Chores */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('ChoreManagement' as never)}
                        >
                            <Feather name="sliders" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* THE CHORE SPACE - THE INTEGRATED COMPONENT */}
                <View style={styles.choreSpace}>
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

                {/* HISTORY SECTION */}
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

                {/* Bottom Spacer for Tab Bar */}
                <View style={{ height: 100 }} />
            </View>
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
    mainWrapper: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -1,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // =========================================================================
    // THE INTEGRATED CHORE SPACE
    // =========================================================================
    choreSpace: {
        height: height * 0.52, // Fixed height space
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

    // CHORE CARD
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.xs,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.02)',
    },
    cardIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    cardEmoji: {
        fontSize: 22,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
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
    cardRight: {
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    checkmarkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    cardAvatar: {
        marginTop: 'auto',
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

    // =========================================================================
    // HISTORY SECTION
    // =========================================================================
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

export default ChoresCalmScreen;
