import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Animated, PanResponder, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { Avatar, TaskDetailModal } from './index';
import { Chore, NudgeTone } from '../types';
import { getChoreStyle } from '../utils/choreStyles';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { height, width } = Dimensions.get('window');

const SWIPE_THRESHOLD = 80;

// =============================================================================
// DUE DATE FORMATTING
// =============================================================================

const formatDueDate = (dueDate: Date): { text: string; isUrgent: boolean; isPastDue: boolean } => {
    const now = new Date();

    // Check if it's today first (before checking isPast to handle edge cases)
    if (isToday(dueDate)) {
        const hoursLeft = differenceInHours(dueDate, now);
        if (hoursLeft <= 2 && hoursLeft >= 0) return { text: 'Due soon', isUrgent: true, isPastDue: false };
        return { text: 'Due Today', isUrgent: false, isPastDue: false };
    }

    // Check if tomorrow
    if (isTomorrow(dueDate)) return { text: 'Tomorrow', isUrgent: false, isPastDue: false };

    // Check if in the past (truly overdue - not today)
    if (isPast(dueDate)) {
        const daysOverdue = differenceInDays(now, dueDate);
        // Handle edge case: 0 days difference means it's effectively "today" even if past midnight
        if (daysOverdue === 0) return { text: 'Due Today', isUrgent: false, isPastDue: false };
        if (daysOverdue === 1) return { text: 'Yesterday', isUrgent: true, isPastDue: true };
        if (daysOverdue <= 7) return { text: `${daysOverdue}d overdue`, isUrgent: true, isPastDue: true };
        return { text: 'Overdue', isUrgent: true, isPastDue: true };
    }

    // Future dates
    const daysUntil = differenceInDays(dueDate, now);
    if (daysUntil <= 7) return { text: `In ${daysUntil}d`, isUrgent: false, isPastDue: false };

    return { text: format(dueDate, 'MMM d'), isUrgent: false, isPastDue: false };
};

// =============================================================================
// SWIPEABLE CHORE CARD (with polish)
// =============================================================================

interface SwipeableChoreCardProps {
    task: {
        id: string;
        name: string;
        emoji: string;
        color: string;
        bgColor: string;
        dueText: string;
        isUrgent: boolean;
        isPastDue: boolean;
        owner: { name: string; color: string };
        assignedTo: string;
    };
    isMyTask: boolean;
    onPress: () => void;
    onComplete: () => void;
    onCompleteAndNotify: () => void;
    onNudge: () => void;
    onTakeOver: () => void;
}

const SwipeableChoreCard: React.FC<SwipeableChoreCardProps> = ({
    task,
    isMyTask,
    onPress,
    onComplete,
    onCompleteAndNotify,
    onNudge,
    onTakeOver,
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const cardOpacity = useRef(new Animated.Value(1)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const [isCompleting, setIsCompleting] = useState(false);
    const [showUndoBar, setShowUndoBar] = useState(false);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingActionRef = useRef<(() => void) | null>(null);

    // Trigger haptic feedback
    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success') => {
        if (Platform.OS !== 'web') {
            switch (type) {
                case 'light':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'success':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
            }
        }
    }, []);

    // Animate card away with satisfying effect
    const animateComplete = useCallback((direction: 'right' | 'left', action: () => void) => {
        setIsCompleting(true);
        triggerHaptic('success');

        // Store the action for potential undo
        pendingActionRef.current = action;

        // Slide card away
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: direction === 'right' ? width : -width,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 0.95,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Show undo bar
            setShowUndoBar(true);

            // Execute action after a short delay (gives time to undo)
            undoTimeoutRef.current = setTimeout(() => {
                action();
                setShowUndoBar(false);
            }, 3000);
        });
    }, [triggerHaptic, translateX, cardOpacity, cardScale]);

    // Handle undo
    const handleUndo = useCallback(() => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
        setShowUndoBar(false);
        setIsCompleting(false);
        pendingActionRef.current = null;

        // Animate card back
        Animated.parallel([
            Animated.spring(translateX, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        triggerHaptic('light');
    }, [translateX, cardOpacity, cardScale, triggerHaptic]);

    const panResponder = useRef(
        PanResponder.create({
            // Capture the gesture immediately on touch start
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,

            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Claim horizontal swipes - be generous to avoid losing gestures
                const isHorizontal = Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
                return isHorizontal;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                // Capture more aggressively once we're clearly swiping horizontally
                return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
            },

            // CRITICAL: Refuse to give up the gesture once we have it
            onPanResponderTerminationRequest: () => false,

            onPanResponderGrant: () => {
                // Subtle scale down on grab for tactile feel
                Animated.spring(cardScale, {
                    toValue: 0.98,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 10,
                }).start();
            },
            onPanResponderMove: (_, gestureState) => {
                // Rubber-band effect - resistance increases as you drag further
                const maxDrag = 140;
                const resistance = 0.55; // Lower = more resistance
                let dx = gestureState.dx;

                // Apply rubber-band resistance
                if (Math.abs(dx) > SWIPE_THRESHOLD) {
                    const overflow = Math.abs(dx) - SWIPE_THRESHOLD;
                    const resistedOverflow = overflow * resistance;
                    dx = dx > 0
                        ? SWIPE_THRESHOLD + resistedOverflow
                        : -(SWIPE_THRESHOLD + resistedOverflow);
                }

                // Clamp to max
                const clampedDx = Math.max(-maxDrag, Math.min(maxDrag, dx));
                translateX.setValue(clampedDx);

                // Haptic feedback when crossing threshold
                if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD - 3 && Math.abs(gestureState.dx) < SWIPE_THRESHOLD + 3) {
                    triggerHaptic('light');
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Scale back to normal
                Animated.spring(cardScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 10,
                }).start();

                const velocity = gestureState.vx;
                const isRightSwipe = gestureState.dx > SWIPE_THRESHOLD || (gestureState.dx > 40 && velocity > 0.5);
                const isLeftSwipe = gestureState.dx < -SWIPE_THRESHOLD || (gestureState.dx < -40 && velocity < -0.5);

                if (isRightSwipe || isLeftSwipe) {
                    if (isMyTask) {
                        if (isRightSwipe) {
                            animateComplete('right', onComplete);
                        } else {
                            animateComplete('left', onCompleteAndNotify);
                        }
                    } else {
                        // For non-completing actions, snap back smoothly and execute
                        triggerHaptic('medium');
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 180,
                            friction: 12,
                        }).start();

                        if (isRightSwipe) {
                            onNudge();
                        } else {
                            onTakeOver();
                        }
                    }
                } else {
                    // Smooth snap-back with velocity consideration
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        velocity: -velocity * 0.5, // Use gesture velocity for natural feel
                        tension: 200,
                        friction: 12,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                // If gesture is interrupted, snap back smoothly
                Animated.spring(cardScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 10,
                }).start();
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 12,
                }).start();
            },
        })
    ).current;

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);

    // Action indicator interpolations
    const rightActionOpacity = translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const rightActionScale = translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0.8, 1],
        extrapolate: 'clamp',
    });

    const leftActionOpacity = translateX.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const leftActionScale = translateX.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    // Show undo bar instead of card when completing
    if (showUndoBar) {
        return (
            <View style={styles.swipeContainer}>
                <View style={styles.undoBar}>
                    <Text style={styles.undoText}>✅ Task completed</Text>
                    <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
                        <Text style={styles.undoButtonText}>Undo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.swipeContainer}>
            {/* LEFT action indicator (swipe right reveals this on left side) */}
            <Animated.View
                style={[
                    styles.swipeAction,
                    styles.swipeActionLeft,
                    {
                        backgroundColor: isMyTask ? COLORS.success + '20' : COLORS.primary + '20',
                        opacity: rightActionOpacity,
                        transform: [{ scale: rightActionScale }],
                    },
                ]}
            >
                <Text style={styles.swipeActionEmoji}>
                    {isMyTask ? '✅' : '👋'}
                </Text>
                <Text style={[styles.swipeActionText, { color: isMyTask ? COLORS.success : COLORS.primary }]}>
                    {isMyTask ? 'Complete' : 'Nudge'}
                </Text>
            </Animated.View>

            {/* RIGHT action indicator (swipe left reveals this on right side) */}
            <Animated.View
                style={[
                    styles.swipeAction,
                    styles.swipeActionRight,
                    {
                        backgroundColor: isMyTask ? COLORS.success + '20' : COLORS.success + '20',
                        opacity: leftActionOpacity,
                        transform: [{ scale: leftActionScale }],
                    },
                ]}
            >
                <Text style={styles.swipeActionEmoji}>
                    {isMyTask ? '✅📢' : '🤝'}
                </Text>
                <Text style={[styles.swipeActionText, { color: COLORS.success }]}>
                    {isMyTask ? 'Done + Tell' : 'Take Over'}
                </Text>
            </Animated.View>

            {/* Swipeable card */}
            <Animated.View
                style={[styles.choreCard, { transform: [{ translateX }, { scale: cardScale }], opacity: cardOpacity }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.choreCardInner}
                    activeOpacity={0.8}
                    onPress={onPress}
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

                    {/* Swipe hints on both sides */}
                    <View style={styles.swipeHints}>
                        <Feather name="chevrons-left" size={14} color={COLORS.textTertiary} style={{ opacity: 0.3 }} />
                        <Feather name="chevrons-right" size={14} color={COLORS.textTertiary} style={{ opacity: 0.3 }} />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
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
    const navigation = useNavigation();
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
                const style = getChoreStyle(chore || { name: 'Task' });
                const ownerInfo = getUserInfo(a.assignedTo);

                return {
                    id: a.id,
                    choreId: a.choreId,
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
                const style = getChoreStyle(chore || { name: 'Task' });
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

    const handleNudge = (task: typeof allTasks[0]) => {
        (navigation as any).navigate('NudgeScreen', {
            targetUserId: task.assignedTo,
            choreName: task.name,
        });
    };

    const handleCompleteAndNotify = (task: typeof allTasks[0]) => {
        // Complete the task
        completeChore(task.id, user.id);
        // Show notification that others will be notified
        Alert.alert(
            '✅ Done & Notified!',
            `Completed "${task.name}" and notified your housemates.`
        );
    };

    const handleTakeOver = (task: typeof allTasks[0]) => {
        Alert.alert(
            '🤝 Take Over Task',
            `Complete "${task.name}" for ${task.owner.name}? You'll earn credit for this.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Take Over',
                    onPress: () => {
                        completeChore(task.id, user.id);
                    },
                },
            ]
        );
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

    const handleNudgeModal = (task: Chore, tone: NudgeTone) => {
        Alert.alert(`Nudge Sent!`, `You nudged about "${task.name}" with a ${tone} tone.`);
    };

    const handleSnitch = (task: Chore, tone: NudgeTone) => {
        Alert.alert(`Reported!`, `You reported an issue with "${task.name}" (${tone}).`);
    };

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const renderTaskCard = (task: typeof dueNow[0]) => (
        <SwipeableChoreCard
            key={task.id}
            task={task}
            isMyTask={task.assignedTo === user.id}
            onPress={() => handleTaskPress(task.id)}
            onComplete={() => handleComplete(task.id)}
            onCompleteAndNotify={() => handleCompleteAndNotify(task)}
            onNudge={() => handleNudge(task)}
            onTakeOver={() => handleTakeOver(task)}
        />
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
                            <Text style={styles.emptyEmoji}>🎉</Text>
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'mine' ? 'You\'re free!' : 'All done!'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'mine'
                                    ? 'No chores are assigned to you right now'
                                    : 'All chores have been completed'}
                            </Text>
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
                onNudge={handleNudgeModal}
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

    // SWIPEABLE CHORE CARD
    swipeContainer: {
        marginBottom: SPACING.sm,
        height: 58,
    },
    swipeAction: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 80,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2,
    },
    swipeActionLeft: {
        left: 0,
    },
    swipeActionRight: {
        right: 0,
    },
    swipeActionEmoji: {
        fontSize: 20,
    },
    swipeActionText: {
        fontSize: 10,
        fontWeight: '700',
    },
    choreCard: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    choreCardInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        paddingRight: SPACING.md,
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
    swipeHint: {
        opacity: 0.3,
    },
    swipeHints: {
        flexDirection: 'row',
        gap: 2,
        opacity: 0.3,
    },

    // Undo bar
    undoBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.success + '15',
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    undoText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.success,
    },
    undoButton: {
        backgroundColor: COLORS.success,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.md,
    },
    undoButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        marginTop: SPACING.xl,
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

