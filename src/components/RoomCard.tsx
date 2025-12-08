import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Chore } from '../types';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface RoomCardProps {
    roomName: string;
    icon: keyof typeof Feather.glyphMap;
    gradientColors: [string, string];
    tasks: Chore[];
    onAddTask: () => void;
    onEditTask: (task: Chore) => void;
}

export const RoomCard = ({ roomName, icon, gradientColors, tasks, onAddTask, onEditTask }: RoomCardProps) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={toggleExpand}
                style={styles.touchable}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Feather name={icon} size={24} color={COLORS.white} />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.roomName}>{roomName}</Text>
                            <Text style={styles.taskCount}>{tasks.length} Tasks</Text>
                        </View>
                        <Feather
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={24}
                            color={COLORS.white}
                            style={{ opacity: 0.8 }}
                        />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {tasks.length > 0 ? (
                        tasks.map((task, index) => (
                            <TouchableOpacity
                                key={task.id}
                                style={styles.taskItem}
                                onPress={() => onEditTask(task)}
                            >
                                <View style={styles.taskLeft}>
                                    <View style={[styles.taskIcon, { backgroundColor: COLORS.gray800 }]}>
                                        <Feather name={task.icon as any} size={16} color={COLORS.textSecondary} />
                                    </View>
                                    <View>
                                        <Text style={styles.taskName}>{task.name}</Text>
                                        <Text style={styles.taskFreq}>{task.frequency}</Text>
                                    </View>
                                </View>
                                <View style={styles.pointsBadge}>
                                    <Text style={styles.pointsText}>{task.pointValue} pts</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No tasks yet</Text>
                    )}

                    <TouchableOpacity style={styles.addButton} onPress={onAddTask}>
                        <Feather name="plus" size={16} color={COLORS.primary} />
                        <Text style={styles.addButtonText}>Add Task</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.gray900,
        overflow: 'hidden',
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    touchable: {
        width: '100%',
    },
    gradient: {
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    titleContainer: {
        flex: 1,
    },
    roomName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 2,
    },
    taskCount: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    content: {
        padding: SPACING.md,
        backgroundColor: COLORS.gray900,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    taskLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    taskIcon: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    taskFreq: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        textTransform: 'capitalize',
    },
    pointsBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    pointsText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        padding: SPACING.md,
        fontStyle: 'italic',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
        marginTop: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        borderStyle: 'dashed',
    },
    addButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
});
