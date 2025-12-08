import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { Avatar } from './Avatar';
import { TaskDetailModal } from './TaskDetailModal';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useNudgeStore } from '../stores/useNudgeStore';

// Types (would normally import these)
interface Chore {
    id: string;
    name: string;
    assignedTo: string; // User ID
    dueDate: Date;
    completed: boolean;
    points: number;
    icon: string;
}

interface User {
    id: string;
    name: string;
    avatarColor: string;
}

// Mock Data
const MOCK_USERS: Record<string, User> = {
    'u1': { id: 'u1', name: 'Alex', avatarColor: '#818CF8' },
    'u2': { id: 'u2', name: 'Sam', avatarColor: '#FB7185' },
    'u3': { id: 'u3', name: 'Jordan', avatarColor: '#34D399' },
};

const MOCK_CHORES: Chore[] = [
    { id: 'c1', name: 'Dishes', assignedTo: 'u1', dueDate: new Date(), completed: false, points: 3, icon: 'droplet' },
    { id: 'c2', name: 'Trash', assignedTo: 'u2', dueDate: new Date(), completed: true, points: 2, icon: 'trash-2' },
    { id: 'c3', name: 'Vacuum', assignedTo: 'u3', dueDate: addDays(new Date(), 1), completed: false, points: 5, icon: 'wind' },
    { id: 'c4', name: 'Plants', assignedTo: 'u1', dueDate: addDays(new Date(), 2), completed: false, points: 1, icon: 'sun' },
];

export const ChoreTimeline = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedChore, setSelectedChore] = useState<any>(null);

    const { user } = useAuthStore();
    const { members, household } = useHouseholdStore();
    const { assignments } = useChoreStore();
    const { sendNudge } = useNudgeStore();

    if (!user) return null;

    const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    const handlePrevWeek = () => {
        setCurrentWeekStart(prev => subWeeks(prev, 1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart(prev => addWeeks(prev, 1));
    };

    const getChoresForDate = (date: Date) => {
        // Use MOCK_CHORES for now to show data
        return MOCK_CHORES.filter(chore => {
            return isSameDay(chore.dueDate, date);
        }).map(chore => ({
            ...chore,
            choreId: chore.name, // Map for compatibility
            userId: chore.assignedTo
        }));
    };

    const renderDay = (date: Date, index: number) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());
        const dayChores = getChoresForDate(date);
        const hasChores = dayChores.length > 0;

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.dayContainer,
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                ]}
                onPress={() => setSelectedDate(date)}
            >
                <Text style={[styles.dayName, isSelected && styles.selectedText]}>
                    {format(date, 'EEE')}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>
                    {format(date, 'd')}
                </Text>
                {hasChores && (
                    <View style={[styles.dot, isSelected && styles.selectedDot]} />
                )}
            </TouchableOpacity>
        );
    };

    const renderChoreList = () => {
        const chores = getChoresForDate(selectedDate);

        if (chores.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No chores for this day</Text>
                </View>
            );
        }

        return (
            <View style={styles.choreList}>
                {chores.map((chore) => {
                    const assignee = MOCK_USERS[chore.userId] || members.find(m => m.id === chore.userId);
                    const isMe = chore.userId === user.id || chore.userId === 'u1'; // Mock 'me' check

                    return (
                        <TouchableOpacity
                            key={chore.id}
                            style={[styles.choreCard, isMe && styles.myChoreCard]}
                            onPress={() => setSelectedChore({ ...chore, assignee })}
                        >
                            <View style={[styles.choreIcon, { backgroundColor: isMe ? COLORS.primary + '20' : COLORS.gray700 }]}>
                                <Feather
                                    name={isMe ? "star" : "circle"}
                                    size={20}
                                    color={isMe ? COLORS.primary : COLORS.textSecondary}
                                />
                            </View>
                            <View style={styles.choreContent}>
                                <Text style={[styles.choreTitle, isMe && styles.myChoreTitle]}>
                                    {chore.choreId}
                                </Text>
                                <View style={styles.assigneeRow}>
                                    {assignee && (
                                        <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
                                    )}
                                    <Text style={styles.assigneeName}>
                                        {isMe ? 'You' : assignee?.name}
                                    </Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header with Navigation */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
                    <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.weekTitle}>
                    {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d')}
                </Text>
                <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
                    <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Calendar Strip */}
            <View style={styles.calendarStrip}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daysScroll}
                >
                    {days.map((day, index) => renderDay(day, index))}
                </ScrollView>
            </View>

            {/* Chore List for Selected Day */}
            {renderChoreList()}

            {/* Chore Detail Modal */}
            <TaskDetailModal
                visible={!!selectedChore}
                onClose={() => setSelectedChore(null)}
                task={selectedChore}
                currentUser={user || { id: 'u1', name: 'Me' } as any}
                onEdit={() => {
                    console.log('Edit from dashboard');
                    setSelectedChore(null);
                }}
                onMarkDone={() => {
                    console.log('Mark done from dashboard');
                    setSelectedChore(null);
                }}
                onNudge={(task, tone) => {
                    console.log(`Nudge from dashboard: ${task.name} (${tone})`);
                    setSelectedChore(null);
                }}
                onSnitch={(task, tone) => {
                    console.log(`Snitch from dashboard: ${task.name} (${tone})`);
                    setSelectedChore(null);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginHorizontal: SPACING.lg, // Added margin
        ...SHADOWS.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    weekTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    navButton: {
        padding: SPACING.xs,
    },
    calendarStrip: {
        marginBottom: SPACING.md,
    },
    daysScroll: {
        gap: SPACING.sm,
    },
    dayContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        minWidth: 50,
    },
    selectedDay: {
        backgroundColor: COLORS.primary,
    },
    todayDay: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    dayName: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    selectedText: {
        color: COLORS.white,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    selectedDot: {
        backgroundColor: COLORS.white,
    },
    choreList: {
        gap: SPACING.sm,
    },
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    myChoreCard: {
        borderColor: COLORS.primary + '50',
        backgroundColor: COLORS.primary + '10',
    },
    choreIcon: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    choreContent: {
        flex: 1,
    },
    choreTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    myChoreTitle: {
        color: COLORS.primary,
    },
    assigneeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    assigneeName: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    emptyState: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    modalBody: {
        gap: SPACING.lg,
    },
    assigneeSection: {
        gap: SPACING.sm,
    },
    label: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    assigneeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.gray800,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'flex-start',
        paddingRight: SPACING.lg,
    },
    assigneeBadgeText: {
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    nudgeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
    },
    nudgeButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
});
