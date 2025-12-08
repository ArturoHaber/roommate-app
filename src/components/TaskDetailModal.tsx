import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Chore, User, NudgeTone } from '../types';
import { Avatar } from './Avatar';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: Chore | null;
    currentUser: User;
    onEdit: (task: Chore) => void;
    onMarkDone: (task: Chore) => void;
    onNudge: (task: Chore, tone: NudgeTone) => void;
    onSnitch: (task: Chore, tone: NudgeTone) => void;
}

// Mock Leaderboard Data
const MOCK_LEADERBOARD = [
    { id: 'u1', name: 'Alex', count: 12, avatarColor: '#818CF8' },
    { id: 'u2', name: 'Sam', count: 8, avatarColor: '#34D399' },
    { id: 'u3', name: 'Jordan', count: 3, avatarColor: '#F472B6' },
];

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
    currentUser,
    onEdit,
    onMarkDone,
    onNudge,
    onSnitch
}: TaskDetailModalProps) => {
    const [nudgeMode, setNudgeMode] = useState<'nudge' | 'snitch' | null>(null);

    if (!task) return null;

    // Mock Assignee Logic (Random for now if not set)
    const assignee = MOCK_LEADERBOARD[0];
    const isAssignedToMe = assignee.id === currentUser.id;

    const handleToneSelect = (tone: NudgeTone) => {
        if (nudgeMode === 'nudge') {
            onNudge(task, tone);
        } else if (nudgeMode === 'snitch') {
            onSnitch(task, tone);
        }
        setNudgeMode(null);
    };

    const handleClose = () => {
        setNudgeMode(null);
        onClose();
    };

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

                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{task.pointValue} Points</Text>
                        </View>
                    </View>

                    {/* Assignee Card */}
                    <View style={styles.assigneeCard}>
                        <Text style={styles.sectionTitle}>Current Turn</Text>
                        <View style={styles.assigneeRow}>
                            <View style={styles.assigneeInfo}>
                                <Avatar name={assignee.name} size="md" />
                                <View>
                                    <Text style={styles.assigneeName}>{assignee.name}</Text>
                                    <Text style={styles.assigneeStatus}>
                                        {isAssignedToMe ? "It's your turn!" : "Assigned to Alex"}
                                    </Text>
                                </View>
                            </View>
                        </View>

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
                                    <TouchableOpacity style={styles.nudgeButton} onPress={() => setNudgeMode('nudge')}>
                                        <Text style={styles.nudgeButtonText}>👋 Nudge</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.snitchButton} onPress={() => setNudgeMode('snitch')}>
                                        <Text style={styles.snitchButtonText}>🚨 Snitch</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* History (Moved Up) */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>History</Text>
                        <View style={styles.historyCard}>
                            <View style={styles.historyHeader}>
                                <View>
                                    <Text style={styles.historyDate}>Yesterday</Text>
                                    <Text style={styles.historyAction}>Completed by Alex</Text>
                                </View>
                                <View style={styles.historyCalendar}>
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                        <View key={i} style={[
                                            styles.historyDay,
                                            (i === 2 || i === 5) && styles.historyDayCompleted, // Mock data
                                            i === 6 && styles.historyDayToday
                                        ]}>
                                            <Text style={[
                                                styles.historyDayText,
                                                (i === 2 || i === 5) && styles.historyDayTextCompleted
                                            ]}>{day}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Leaderboard (Moved Down) */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>Leaderboard</Text>
                        <View style={styles.leaderboardCard}>
                            {MOCK_LEADERBOARD.map((user, index) => (
                                <View key={user.id} style={styles.leaderboardRow}>
                                    <View style={styles.rankContainer}>
                                        <Text style={styles.rankText}>#{index + 1}</Text>
                                    </View>
                                    <View style={styles.leaderboardUser}>
                                        <Avatar name={user.name} size="sm" />
                                        <Text style={styles.leaderboardName}>{user.name}</Text>
                                    </View>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{user.count}</Text>
                                    </View>
                                </View>
                            ))}
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
        height: '92%',
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
    hero: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
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
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textTransform: 'capitalize',
        marginBottom: SPACING.md,
    },
    pointsBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: FONT_SIZE.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    assigneeCard: {
        backgroundColor: COLORS.gray800,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    assigneeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    assigneeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    assigneeName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    assigneeStatus: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.md,
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
    snitchButton: {
        flex: 1,
        backgroundColor: COLORS.error + '20',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.error + '50',
    },
    snitchButtonText: {
        color: COLORS.error,
        fontWeight: '600',
    },
    statsSection: {
        marginBottom: SPACING.xl,
    },
    leaderboardCard: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray700,
    },
    rankContainer: {
        width: 30,
    },
    rankText: {
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    leaderboardUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    leaderboardName: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    countBadge: {
        backgroundColor: COLORS.gray700,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    countText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT_SIZE.sm,
    },
    historyCard: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    historyCalendar: {
        flexDirection: 'row',
        gap: 4,
    },
    historyDay: {
        width: 24,
        height: 24,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyDayCompleted: {
        backgroundColor: COLORS.success,
    },
    historyDayToday: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    historyDayText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    historyDayTextCompleted: {
        color: COLORS.white,
    },
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
        gap: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    toneButton: {
        alignItems: 'center',
        backgroundColor: COLORS.gray700,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        minWidth: 70,
    },
    toneIcon: {
        fontSize: 24,
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
