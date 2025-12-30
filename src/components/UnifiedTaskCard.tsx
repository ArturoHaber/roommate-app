import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { Avatar } from './Avatar';
import { getChoreEmoji } from '../utils/choreStyles';

// Unified task data interface - single source of truth
export interface TaskDisplayData {
    id: string;
    choreId: string;
    name: string;
    icon: string;
    dueText: string;        // "Today", "Tomorrow", "Friday"
    room: string;
    points: number;
    isUrgent: boolean;
    assignee?: { name: string; color: string };
    isCompleted?: boolean;
}

interface UnifiedTaskCardProps {
    task: TaskDisplayData;
    variant?: 'compact' | 'grid' | 'full';
    onPress?: () => void;           // Opens TaskDetailModal
    onComplete?: () => void;        // Quick complete action
    isSelected?: boolean;           // For multi-select in grids
    showAssignee?: boolean;         // Show who's assigned
    showCompleteButton?: boolean;   // Show the checkmark button
}

export const UnifiedTaskCard: React.FC<UnifiedTaskCardProps> = ({
    task,
    variant = 'compact',
    onPress,
    onComplete,
    isSelected = false,
    showAssignee = false,
    showCompleteButton = true,
}) => {
    // Grid variant - for CompleteSheet selection
    if (variant === 'grid') {
        return (
            <TouchableOpacity
                style={[
                    styles.gridCard,
                    isSelected && styles.gridCardSelected,
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={styles.gridEmoji}>
                    {getChoreEmoji(task)}
                </Text>
                <Text style={styles.gridName} numberOfLines={1}>
                    {task.name}
                </Text>
                <Text style={styles.gridPoints}>
                    +{task.points} pts
                </Text>
                {isSelected && (
                    <View style={styles.selectedCheck}>
                        <Feather name="check" size={14} color={COLORS.white} />
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    // Compact variant (default) - for lists
    return (
        <TouchableOpacity
            style={[
                styles.compactCard,
                task.isUrgent && styles.compactCardUrgent,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.compactLeft}>
                <View style={[
                    styles.compactIcon,
                    task.isUrgent && styles.compactIconUrgent,
                ]}>
                    <Feather
                        name={task.icon as any}
                        size={18}
                        color={task.isUrgent ? COLORS.error : COLORS.textSecondary}
                    />
                </View>
                <View style={styles.compactInfo}>
                    <Text style={styles.compactName}>{task.name}</Text>
                    <Text style={[
                        styles.compactDue,
                        task.isUrgent && styles.compactDueUrgent,
                    ]}>
                        {task.dueText} • {task.room}
                    </Text>
                </View>
            </View>

            <View style={styles.compactRight}>
                {showAssignee && task.assignee && (
                    <Avatar
                        name={task.assignee.name}
                        color={task.assignee.color}
                        size="sm"
                    />
                )}

                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{task.points}</Text>
                </View>

                {showCompleteButton && onComplete && (
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={(e) => {
                            e.stopPropagation?.();
                            onComplete();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="check" size={18} color={COLORS.success} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // Compact variant (list items)
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    compactCardUrgent: {
        borderColor: COLORS.error + '50',
        backgroundColor: COLORS.error + '08',
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SPACING.md,
    },
    compactIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactIconUrgent: {
        backgroundColor: COLORS.error + '15',
    },
    compactInfo: {
        flex: 1,
    },
    compactName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    compactDue: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    compactDueUrgent: {
        color: COLORS.error,
    },
    compactRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pointsBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.primary,
    },
    doneButton: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },

    // Grid variant (selection grids)
    gridCard: {
        width: '48%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.gray800,
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    gridCardSelected: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.success + '10',
    },
    gridEmoji: {
        fontSize: 28,
        marginBottom: SPACING.xs,
    },
    gridName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    gridPoints: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    selectedCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
