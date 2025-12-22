import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format, startOfWeek, addDays, isSameDay, formatDistanceToNow, isToday, isPast, differenceInDays } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Chore, ChoreAssignment, User, NudgeTone } from '../types';
import { Avatar } from './Avatar';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useNavigation } from '@react-navigation/native';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: Chore | null;
    assignment?: ChoreAssignment | null;
    currentUser: User;
    onEdit: (task: Chore) => void;
    onMarkDone: (task: Chore) => void;
    onNudge: (task: Chore, tone: NudgeTone) => void;
    onSnitch: (task: Chore, tone: NudgeTone) => void;
}

const TONES: { id: NudgeTone; label: string; icon: string }[] = [
    { id: 'polite', label: 'Polite', icon: '🥺' },
    { id: 'funny', label: 'Funny', icon: '🤡' },
    { id: 'passive_aggressive', label: 'Passive', icon: '💀' },
    { id: 'urgent', label: 'Urgent', icon: '🚨' },
];

export const TaskDetailModal = ({
    visible,
    onClose,
    task,
    assignment,
    currentUser,
    onEdit,
    onMarkDone,
    onNudge,
    onSnitch
}: TaskDetailModalProps) => {
    const [nudgeMode, setNudgeMode] = useState<'nudge' | 'snitch' | null>(null);
    const navigation = useNavigation();

    const { assignments, chores, completeChore } = useChoreStore();
    const { members } = useHouseholdStore();

    // ==========================================================================
    // DERIVED DATA
    // ==========================================================================

    const getMemberInfo = (userId: string) => {
        if (userId === currentUser.id) {
            return {
                id: userId,
                name: currentUser.name || currentUser.email?.split('@')[0] || 'You',
                avatarColor: currentUser.avatarColor || COLORS.primary,
            };
        }
        const member = members.find(m => m.id === userId);
        return {
            id: userId,
            name: member?.name || 'Unknown',
            avatarColor: member?.avatarColor || COLORS.gray500,
        };
    };

    const currentAssignment = useMemo(() => {
        if (assignment) return assignment;
        if (!task) return null;
        return assignments.find(a => a.choreId === task.id && !a.completedAt) || null;
    }, [assignment, task, assignments]);

    const assignee = useMemo(() => {
        if (!currentAssignment) return null;
        return getMemberInfo(currentAssignment.assignedTo);
    }, [currentAssignment, members, currentUser]);

    const isAssignedToMe = currentAssignment?.assignedTo === currentUser.id;

    // Due date formatting
    const dueInfo = useMemo(() => {
        if (!currentAssignment) return null;
        const dueDate = new Date(currentAssignment.dueDate);
        const isPastDue = isPast(dueDate) && !isToday(dueDate);
        const daysUntil = differenceInDays(dueDate, new Date());

        let text = '';
        let isUrgent = false;

        if (isPastDue) {
            const daysOverdue = Math.abs(daysUntil);
            text = daysOverdue === 1 ? 'Due yesterday' : `${daysOverdue} days overdue`;
            isUrgent = true;
        } else if (isToday(dueDate)) {
            text = 'Due today';
            isUrgent = true;
        } else if (daysUntil === 1) {
            text = 'Due tomorrow';
        } else if (daysUntil <= 7) {
            text = `Due ${format(dueDate, 'EEEE')}`;
        } else {
            text = `Due ${format(dueDate, 'MMM d')}`;
        }

        return { text, isUrgent, date: dueDate };
    }, [currentAssignment]);

    // Is this a personal or shared task?
    const isPersonalTask = useMemo(() => {
        if (!task) return false;
        // Check if "personal" or "laundry" (typically personal)
        const name = task.name.toLowerCase();
        return name.includes('personal') || name.includes('laundry') || name.includes('room');
    }, [task]);

    // History
    const choreHistory = useMemo(() => {
        if (!task) return [];
        return assignments
            .filter(a => a.choreId === task.id && a.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
            .slice(0, 10)
            .map(a => ({
                ...a,
                completedByInfo: getMemberInfo(a.completedBy || a.assignedTo),
            }));
    }, [task, assignments, members, currentUser]);

    const lastCompletion = choreHistory[0] || null;

    // Week calendar
    const weekCalendar = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today);
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        return days.map((label, index) => {
            const date = addDays(weekStart, index);
            const isCurrentDay = isSameDay(date, today);
            const wasCompleted = choreHistory.some(h =>
                h.completedAt && isSameDay(new Date(h.completedAt), date)
            );
            return { label, date, isToday: isCurrentDay, wasCompleted };
        });
    }, [choreHistory]);

    // ==========================================================================
    // HANDLERS
    // ==========================================================================

    const handleToneSelect = (tone: NudgeTone) => {
        if (!task) return;
        if (nudgeMode === 'nudge') {
            onNudge(task, tone);
        } else if (nudgeMode === 'snitch') {
            onSnitch(task, tone);
        }
        setNudgeMode(null);
    };

    const handleTakeOver = () => {
        if (!task || !currentAssignment) return;
        Alert.alert(
            'Take Over Task',
            `Complete "${task.name}" and earn credit for doing someone else's task?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Take Over',
                    onPress: () => {
                        completeChore(currentAssignment.id, currentUser.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const handleClose = () => {
        setNudgeMode(null);
        onClose();
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (!task) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Feather name="chevron-down" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => onEdit(task)}
                        >
                            <Feather name="more-horizontal" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero Section */}
                    <View style={styles.hero}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                            <Feather name={task.icon as any} size={40} color={COLORS.primary} />
                        </View>
                        <Text style={styles.taskName}>{task.name}</Text>
                        <Text style={styles.roomName}>{task.room?.replace('_', ' ')} • {task.frequency}</Text>

                        {/* Personal/Shared Badge */}
                        <View style={[styles.typeBadge, isPersonalTask ? styles.personalBadge : styles.sharedBadge]}>
                            <Feather
                                name={isPersonalTask ? 'user' : 'users'}
                                size={12}
                                color={isPersonalTask ? COLORS.warning : COLORS.primary}
                            />
                            <Text style={[styles.typeText, isPersonalTask ? styles.personalText : styles.sharedText]}>
                                {isPersonalTask ? 'Personal' : 'Shared'}
                            </Text>
                        </View>
                    </View>

                    {/* Current Turn Card */}
                    <View style={styles.assigneeCard}>
                        <Text style={styles.sectionTitleCentered}>Current Turn</Text>

                        <View style={styles.assigneeCentered}>
                            {assignee ? (
                                <>
                                    <Avatar name={assignee.name} size="lg" color={assignee.avatarColor} />
                                    <Text style={styles.assigneeNameCentered}>{assignee.name}</Text>
                                    <Text style={styles.assigneeStatusCentered}>
                                        {isAssignedToMe ? "It's your turn!" : `${assignee.name}'s turn`}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.noAssigneePlaceholder}>
                                        <Feather name="user" size={24} color={COLORS.textTertiary} />
                                    </View>
                                    <Text style={styles.assigneeNameCentered}>Unassigned</Text>
                                    <Text style={styles.assigneeStatusCentered}>This task needs an assignee</Text>
                                </>
                            )}
                        </View>

                        {/* Due Date */}
                        {dueInfo && (
                            <View style={[styles.dueBadge, dueInfo.isUrgent && styles.dueBadgeUrgent]}>
                                <Feather name="clock" size={14} color={dueInfo.isUrgent ? COLORS.error : COLORS.textSecondary} />
                                <Text style={[styles.dueText, dueInfo.isUrgent && styles.dueTextUrgent]}>
                                    {dueInfo.text}
                                </Text>
                            </View>
                        )}

                        {/* Primary Actions */}
                        <View style={styles.actionRow}>
                            {isAssignedToMe ? (
                                <TouchableOpacity style={styles.doneButton} onPress={() => onMarkDone(task)}>
                                    <Feather name="check-circle" size={20} color={COLORS.white} />
                                    <Text style={styles.doneButtonText}>Mark as Done</Text>
                                </TouchableOpacity>
                            ) : nudgeMode ? (
                                <View style={styles.toneContainer}>
                                    <Text style={styles.toneTitle}>
                                        {nudgeMode === 'nudge' ? 'Send a Nudge' : 'Report Issue'}
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toneScroll}>
                                        {TONES.map(tone => (
                                            <TouchableOpacity
                                                key={tone.id}
                                                style={styles.toneButton}
                                                onPress={() => handleToneSelect(tone.id)}
                                            >
                                                <Text style={styles.toneIcon}>{tone.icon}</Text>
                                                <Text style={styles.toneLabel}>{tone.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity style={styles.cancelToneButton} onPress={() => setNudgeMode(null)}>
                                        <Text style={styles.cancelToneText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.nudgeButton}
                                        onPress={() => {
                                            onClose();
                                            (navigation as any).navigate('NudgeScreen', {
                                                targetUserId: assignee?.id,
                                                choreName: task.name,
                                            });
                                        }}
                                    >
                                        <Text style={styles.nudgeButtonText}>👋 Nudge</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.takeOverButton} onPress={handleTakeOver}>
                                        <Feather name="arrow-right-circle" size={16} color={COLORS.success} />
                                        <Text style={styles.takeOverButtonText}>Take Over</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* History Section */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>History</Text>
                        <View style={styles.historyCard}>
                            {/* Last completion info */}
                            <View style={styles.historyTop}>
                                {lastCompletion ? (
                                    <>
                                        <Text style={styles.historyDate}>
                                            {formatDistanceToNow(new Date(lastCompletion.completedAt!), { addSuffix: true })}
                                        </Text>
                                        <Text style={styles.historyAction}>
                                            Completed by {lastCompletion.completedByInfo.name}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.historyDate}>No history yet</Text>
                                        <Text style={styles.historyAction}>Be the first to complete this!</Text>
                                    </>
                                )}
                            </View>

                            {/* Week calendar - fixed overflow */}
                            <View style={styles.historyCalendarContainer}>
                                {weekCalendar.map((day, i) => (
                                    <View key={i} style={[
                                        styles.historyDay,
                                        day.wasCompleted && styles.historyDayCompleted,
                                        day.isToday && styles.historyDayToday
                                    ]}>
                                        <Text style={[
                                            styles.historyDayText,
                                            day.wasCompleted && styles.historyDayTextCompleted
                                        ]}>{day.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: COLORS.gray900,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        height: '85%',
        marginTop: 'auto',
        ...SHADOWS.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    closeButton: {
        padding: SPACING.sm,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    menuButton: {
        padding: SPACING.sm,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
    },
    content: {
        padding: SPACING.lg,
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    taskName: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textTransform: 'capitalize',
        marginBottom: SPACING.sm,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    personalBadge: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
    },
    sharedBadge: {
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
    },
    typeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    personalText: {
        color: COLORS.warning,
    },
    sharedText: {
        color: COLORS.primary,
    },

    // Section title
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textTertiary,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionTitleCentered: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textTertiary,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },

    // Assignee Card - Centered
    assigneeCard: {
        backgroundColor: COLORS.gray800,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    assigneeCentered: {
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    assigneeNameCentered: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: SPACING.sm,
    },
    assigneeStatusCentered: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    noAssigneePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.gray700,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Due Badge
    dueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.lg,
        alignSelf: 'center',
    },
    dueBadgeUrgent: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    dueText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    dueTextUrgent: {
        color: COLORS.error,
    },

    // Actions
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    doneButton: {
        flex: 1,
        backgroundColor: COLORS.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
    },
    doneButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT_SIZE.md,
    },
    nudgeButton: {
        flex: 1,
        backgroundColor: COLORS.gray700,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    nudgeButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    takeOverButton: {
        flex: 1,
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.3)',
    },
    takeOverButtonText: {
        color: COLORS.success,
        fontWeight: '600',
    },

    // Stats Section
    statsSection: {
        marginBottom: SPACING.xl,
    },

    // History Card - Fixed overflow
    historyCard: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
    },
    historyTop: {
        marginBottom: SPACING.md,
    },
    historyDate: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.sm,
        marginBottom: 2,
    },
    historyAction: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
    historyCalendarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    historyDay: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyDayCompleted: {
        backgroundColor: COLORS.success,
    },
    historyDayToday: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    historyDayText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    historyDayTextCompleted: {
        color: COLORS.white,
    },

    // Tone selection
    toneContainer: {
        flex: 1,
        alignItems: 'center',
    },
    toneTitle: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
    },
    toneScroll: {
        gap: SPACING.sm,
        paddingBottom: SPACING.sm,
    },
    toneButton: {
        alignItems: 'center',
        backgroundColor: COLORS.gray700,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        minWidth: 65,
    },
    toneIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    toneLabel: {
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
    },
    cancelToneButton: {
        marginTop: SPACING.sm,
    },
    cancelToneText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.sm,
    },
});
