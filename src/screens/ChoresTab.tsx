import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert, Dimensions, RefreshControl, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Avatar, CookingModal, ActivityDetailModal, ActivityItem, CompleteSheet, LogSheet, ReportSheet, UnifiedTaskCard, TaskDetailModal, TaskDisplayData, NeedsAttentionCard, ChoresComp, HouseStatusHeader, HouseOverview, LogActivityButton } from '../components';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useNudgeStore } from '../stores/useNudgeStore';
import { getChoreStyle } from '../utils/choreStyles';

// Activity types for the feed
interface Activity {
    id: string;
    type: 'complete' | 'nudge';
    user: string;
    userColor: string;
    chore: string;
    time: string;
    target?: string;
}

export const ChoresTab = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { chores, assignments, completeChore, getLeaderboard, fetchChores, fetchAssignments, seedTestChores, clearAllAssignments, reassignAllToMember, generateAssignments } = useChoreStore();
    const { members, household } = useHouseholdStore();
    const { nudges, sendNudge } = useNudgeStore();

    const [completeSheetVisible, setCompleteSheetVisible] = useState(false);
    const [quickLogVisible, setQuickLogVisible] = useState(false);
    const [nudgeVisible, setNudgeVisible] = useState(false);
    const [isCookingVisible, setIsCookingVisible] = useState(false);
    const [snitchVisible, setSnitchVisible] = useState(false);
    const [activityExpanded, setActivityExpanded] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [selectedRoommate, setSelectedRoommate] = useState<typeof members[0] | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskDisplayData | null>(null);
    const [devMenuVisible, setDevMenuVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    // iOS workaround for tintColor bug
    const [spinnerColor, setSpinnerColor] = useState(Platform.OS === 'ios' ? undefined : '#FFFFFF');

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        if (!household?.id) return;

        setRefreshing(true);
        try {
            await Promise.all([
                fetchChores(household.id),
                fetchAssignments(household.id),
            ]);
        } catch (error) {
            console.error('[HouseholdScreen] Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [household?.id, fetchChores, fetchAssignments]);

    // iOS workaround: Set tintColor after mount
    useEffect(() => {
        if (Platform.OS === 'ios') {
            const timer = setTimeout(() => {
                setSpinnerColor('#FFFFFF');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, []);

    // Fetch chores from Supabase on mount
    useEffect(() => {
        if (household?.id) {
            fetchChores(household.id).then(() => {
                fetchAssignments(household.id);
            });
        }
    }, [household?.id]);

    if (!user) return null;

    // Get my assignments (upcoming and today)
    const myAssignments = assignments
        .filter(a => a.assignedTo === user.id && !a.completedAt)
        .map(a => {
            const chore = chores.find(c => c.id === a.choreId);
            const dueDate = new Date(a.dueDate);
            const isUrgent = isPast(dueDate) && !isToday(dueDate);

            let dueText = format(dueDate, 'EEE');
            if (isToday(dueDate)) dueText = 'Today';
            else if (isTomorrow(dueDate)) dueText = 'Tomorrow';
            else if (isPast(dueDate)) dueText = 'Overdue';

            return {
                id: a.id,
                choreId: a.choreId,
                name: chore?.name || 'Unknown',
                icon: chore?.icon || 'circle',
                due: dueText,
                room: chore?.name.includes('bathroom') ? 'Bathroom' :
                    chore?.name.includes('kitchen') || chore?.name.includes('dishes') ? 'Kitchen' : 'General',
                urgent: isUrgent || isToday(dueDate),
                points: chore?.pointValue || 3,
            };
        })
        .sort((a, b) => (a.urgent === b.urgent ? 0 : a.urgent ? -1 : 1))
        .slice(0, 5);

    // Convert myAssignments to TaskDisplayData format with emoji styling
    const displayTasks = myAssignments.map(a => {
        const style = getChoreStyle({ name: a.name, icon: a.icon });
        return {
            id: a.id,
            choreId: a.choreId,
            name: a.name,
            icon: a.icon,
            dueText: a.due,
            room: a.room,
            isUrgent: a.urgent,
            points: a.points,
            emoji: style.emoji,
            color: style.color,
            bgColor: style.bgColor,
        };
    });

    // Get leaderboard for fairness bars
    const leaderboard = getLeaderboard();
    const maxCount = Math.max(...leaderboard.map(l => l.completedChores), 1);

    // Build activity feed from completed assignments - useMemo for real-time updates
    const activityFeed: Activity[] = useMemo(() => {
        const feed: Activity[] = [];

        // Add completed assignments (sorted by completion date)
        const completedAssignments = assignments
            .filter(a => a.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
            .slice(0, 10);

        completedAssignments.forEach(a => {
            const chore = chores.find(c => c.id === a.choreId);
            const completedById = a.completedBy || a.assignedTo;
            let completedBy = members.find(m => m.id === completedById);

            // Check if it's the current user
            if (completedById === user.id) {
                completedBy = {
                    id: user.id,
                    name: user.name || 'You',
                    avatarColor: user.avatarColor || COLORS.primary
                } as any;
            }

            if (completedBy && chore) {
                const completedDate = new Date(a.completedAt!);
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60));
                const timeText = diffHours < 1 ? 'Just now' :
                    diffHours < 24 ? `${diffHours}h ago` :
                        `${Math.floor(diffHours / 24)}d ago`;

                feed.push({
                    id: a.id,
                    type: 'complete',
                    user: completedBy.name,
                    userColor: completedBy.avatarColor,
                    chore: chore.name,
                    time: timeText,
                });
            }
        });

        // Add nudges
        nudges.slice(0, 3).forEach(n => {
            const sender = members.find(m => m.id === n.createdBy) ||
                (n.createdBy === user.id ? { name: 'You', avatarColor: user.avatarColor } : null);
            if (sender) {
                feed.push({
                    id: n.id,
                    type: 'nudge',
                    user: sender.name,
                    userColor: sender.avatarColor,
                    chore: n.message.substring(0, 20) + '...',
                    time: format(new Date(n.createdAt), 'h:mm a'),
                });
            }
        });

        return feed;
    }, [assignments, chores, members, user, nudges]);

    // Get roommates (exclude self)
    const roommates = members.filter(m => m.id !== user.id);

    // Quick log handler
    const handleQuickLog = (choreId: string, choreName: string, points: number) => {
        // Find an assignment for this chore or create an ad-hoc completion
        const assignment = assignments.find(a => a.choreId === choreId && !a.completedAt);
        if (assignment) {
            completeChore(assignment.id, user.id);
        }
        setQuickLogVisible(false);
        Alert.alert('✓ Logged!', `${choreName} marked as complete. +${points} points!`);
    };

    // Mark done from Your Turn list
    const handleMarkDone = (assignmentId: string, choreName: string, points: number) => {
        completeChore(assignmentId, user.id);
        Alert.alert('✓ Done!', `${choreName} marked as complete. +${points} points!`);
    };

    // Nudge handler
    const handleNudge = (choreName: string) => {
        if (!selectedRoommate || !household) return;

        sendNudge({
            householdId: household.id,
            tone: 'polite',
            message: `Hey! Quick reminder about ${choreName} 👋`,
            targetUserId: selectedRoommate.id,
            createdBy: user.id,
        });

        setNudgeVisible(false);
        setSelectedRoommate(null);
        Alert.alert('👋 Nudge Sent!', `${selectedRoommate.name} has been reminded about ${choreName}`);
    };

    // Cooking submit handler
    const handleCookingSubmit = (eaterIds: string[]) => {
        setIsCookingVisible(false);
        Alert.alert(
            '🍽️ Dishes Assigned!',
            `Dishes have been assigned to ${eaterIds.length} ${eaterIds.length === 1 ? 'person' : 'people'}. They'll see it in their tasks.`,
            [{ text: 'OK' }]
        );
    };

    // Snitch submit handler
    const handleSnitchSubmit = (issue: string) => {
        setSnitchVisible(false);
        Alert.alert(
            '👀 Reported!',
            'Your household has been notified. Justice will be served.',
            [{ text: 'OK' }]
        );
    };

    // Build fairness data from leaderboard
    const fairnessData = leaderboard.map(entry => {
        const member = members.find(m => m.id === entry.userId) ||
            (entry.userId === user.id ? { name: 'You', avatarColor: user.avatarColor } : null);
        return {
            name: member?.name || 'Unknown',
            color: member?.avatarColor || COLORS.gray600,
            count: entry.completedChores,
        };
    });

    // If no leaderboard yet, show current members with 0
    const displayFairness = fairnessData.length > 0 ? fairnessData : [
        { name: 'You', color: user.avatarColor, count: 0 },
        ...roommates.slice(0, 2).map(r => ({ name: r.name, color: r.avatarColor, count: 0 }))
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={spinnerColor}
                        colors={[COLORS.primary]}
                        progressBackgroundColor={COLORS.gray800}
                        progressViewOffset={Platform.OS === 'android' ? 0 : 10}
                    />
                }
            >

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chores</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        {/* Dev Menu Button */}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setDevMenuVisible(true)}
                        >
                            <Feather name="terminal" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        {/* Component Gallery (Dev Audit) */}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('ComponentGallery' as never)}
                        >
                            <Feather name="search" size={20} color={COLORS.warning} />
                        </TouchableOpacity>
                        {/* Manage Chores */}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('ChoreManagement' as never)}
                        >
                            <Feather name="sliders" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ========================================== */}
                {/* HOUSE OVERVIEW - Rich Dashboard Header */}
                {/* ========================================== */}
                <HouseOverview />

                {/* Chores Component */}
                <ChoresComp heightRatio={0.42} showHistory={false} />

                {/* Log Activity Button */}
                <LogActivityButton />

                {/* Divider for clean separation */}
                <View style={{ height: SPACING.xl }} />

                {/* 
                ============================================================
                ARCHIVED: iOS Glass Action Bar + HouseStatusHeader
                Keeping for potential future use
                ============================================================
                <View style={styles.actionBar}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => setCompleteSheetVisible(true)}>
                        <View style={styles.actionCardInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.08)' }]}>
                                <Feather name="check" size={18} color="#6EE7B7" />
                            </View>
                            <Text style={styles.actionCardLabel}>Complete</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity style={styles.actionCard} onPress={() => setQuickLogVisible(true)}>
                        <View style={styles.actionCardInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(167, 139, 250, 0.08)' }]}>
                                <Feather name="plus" size={18} color="#A78BFA" />
                            </View>
                            <Text style={styles.actionCardLabel}>Log</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity style={styles.actionCard} onPress={() => setSnitchVisible(true)}>
                        <View style={styles.actionCardInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(251, 146, 160, 0.08)' }]}>
                                <Feather name="eye" size={18} color="#FDA4AF" />
                            </View>
                            <Text style={styles.actionCardLabel}>Snitch</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <HouseStatusHeader compact />
                */}

                {/* Activity Feed */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                    </View>

                    {activityFeed.length > 0 ? (
                        <View style={styles.activityList}>
                            {(activityExpanded ? activityFeed.slice(0, 4) : activityFeed.slice(0, 1)).map((activity) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={styles.activityItem}
                                    onPress={() => setSelectedActivity(activity)}
                                    activeOpacity={0.7}
                                >
                                    <Avatar name={activity.user} color={activity.userColor} size="sm" />
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityText}>
                                            {activity.type === 'complete' ? (
                                                <><Text style={styles.activityUser}>{activity.user}</Text> completed <Text style={styles.activityChore}>{activity.chore}</Text></>
                                            ) : (
                                                <><Text style={styles.activityUser}>{activity.user}</Text> sent a nudge</>
                                            )}
                                        </Text>
                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                    </View>
                                    <View style={[styles.activityIcon, activity.type === 'complete' ? styles.activityIconComplete : styles.activityIconNudge]}>
                                        <Feather
                                            name={activity.type === 'complete' ? 'check' : 'send'}
                                            size={12}
                                            color={activity.type === 'complete' ? COLORS.success : COLORS.primary}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {/* View Calendar Button - Only visible when expanded */}
                            {activityExpanded && (
                                <TouchableOpacity
                                    style={styles.calendarButton}
                                    onPress={() => navigation.navigate('ActivityHistory' as never)}
                                    activeOpacity={0.8}
                                >
                                    <Feather name="calendar" size={16} color={COLORS.primary} />
                                    <Text style={styles.calendarButtonText}>View Full Calendar</Text>
                                    <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                                </TouchableOpacity>
                            )}

                            {/* Expand/Collapse Button at bottom */}
                            {activityFeed.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => setActivityExpanded(!activityExpanded)}
                                    style={styles.expandButtonBottom}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.expandButtonText}>
                                        {activityExpanded ? 'Show Less' : 'Show More'}
                                    </Text>
                                    <Feather
                                        name={activityExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={14}
                                        color={COLORS.primary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>No activity yet. Complete a chore to get started!</Text>
                        </View>
                    )}
                </View>

                {/* Fairness Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>This Week</Text>
                        <Text style={styles.sectionSubtitle}>Fairness Tracker</Text>
                    </View>

                    <View style={styles.fairnessCard}>
                        {displayFairness.map((person, index) => (
                            <View key={person.name + index} style={styles.fairnessRow}>
                                <View style={styles.fairnessLeft}>
                                    <Avatar name={person.name} color={person.color} size="sm" />
                                    <Text style={styles.fairnessName} numberOfLines={1}>{person.name}</Text>
                                </View>
                                <View style={styles.fairnessBarContainer}>
                                    <View style={styles.fairnessBarBg}>
                                        <View
                                            style={[
                                                styles.fairnessBarFill,
                                                {
                                                    width: maxCount > 0 ? `${(person.count / maxCount) * 100}%` : '0%',
                                                    backgroundColor: person.color
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.fairnessCount}>{person.count}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Quick Log Sheet */}
            <LogSheet
                visible={quickLogVisible}
                onClose={() => setQuickLogVisible(false)}
            />

            {/* Nudge Modal */}
            <Modal
                visible={nudgeVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => { setNudgeVisible(false); setSelectedRoommate(null); }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedRoommate ? `Nudge ${selectedRoommate.name} about...` : 'Who needs a nudge?'}
                        </Text>
                        <TouchableOpacity onPress={() => { setNudgeVisible(false); setSelectedRoommate(null); }}>
                            <Feather name="x" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {!selectedRoommate ? (
                        <View style={styles.roommateList}>
                            {roommates.length > 0 ? roommates.map((roommate) => (
                                <TouchableOpacity
                                    key={roommate.id}
                                    style={styles.roommateOption}
                                    onPress={() => setSelectedRoommate(roommate)}
                                >
                                    <Avatar name={roommate.name} color={roommate.avatarColor} size="lg" />
                                    <Text style={styles.roommateName}>{roommate.name}</Text>
                                    <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            )) : (
                                <Text style={styles.emptyCardText}>No roommates yet. Invite someone to your household!</Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.quickGrid}>
                            {chores.slice(0, 5).map((chore) => (
                                <TouchableOpacity
                                    key={chore.id}
                                    style={styles.quickOption}
                                    onPress={() => handleNudge(chore.name)}
                                >
                                    <View style={[styles.quickOptionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                        <Feather name={chore.icon as any} size={24} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.quickOptionText}>{chore.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </Modal>

            {/* Cooking Modal */}
            <CookingModal
                visible={isCookingVisible}
                onClose={() => setIsCookingVisible(false)}
                onSubmit={handleCookingSubmit}
            />

            {/* Report Sheet (Snitch) */}
            <ReportSheet
                visible={snitchVisible}
                onClose={() => setSnitchVisible(false)}
            />

            {/* Complete Sheet */}
            <CompleteSheet
                visible={completeSheetVisible}
                onClose={() => setCompleteSheetVisible(false)}
            />

            {/* Activity Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                onClose={() => setSelectedActivity(null)}
            />

            {/* Task Detail Modal - Unified for all task cards */}
            <TaskDetailModal
                visible={selectedTask !== null}
                onClose={() => setSelectedTask(null)}
                task={selectedTask ? {
                    id: selectedTask.choreId,
                    name: selectedTask.name,
                    description: '',
                    icon: selectedTask.icon,
                    pointValue: selectedTask.points,
                    frequency: 'weekly',
                    householdId: household?.id || '',
                    createdAt: new Date(),
                    room: selectedTask.room as any,
                    isActive: true,
                    isPersonal: false,
                } : null}
                currentUser={user!}
                onEdit={() => { }}
                onMarkDone={(task) => {
                    if (selectedTask) {
                        handleMarkDone(selectedTask.id, selectedTask.name, selectedTask.points);
                        setSelectedTask(null);
                    }
                }}
                onNudge={() => { }}
                onSnitch={() => { }}
            />

            {/* Dev Menu Modal */}
            <Modal
                visible={devMenuVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDevMenuVisible(false)}
            >
                <View style={styles.devMenuOverlay}>
                    <View style={styles.devMenuContainer}>
                        <View style={styles.devMenuHeader}>
                            <Text style={styles.devMenuTitle}>🛠️ Dev Menu</Text>
                            <TouchableOpacity onPress={() => setDevMenuVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.devMenuContent}>
                            {/* Seed Test Data */}
                            <TouchableOpacity
                                style={styles.devMenuItem}
                                onPress={async () => {
                                    if (household?.id && user) {
                                        const allMemberIds = [...new Set([user.id, ...members.map(m => m.id)])];
                                        await seedTestChores(household.id, allMemberIds);
                                        setDevMenuVisible(false);
                                        Alert.alert('✓ Seeded', `Test chores added for ${allMemberIds.length} members`);
                                    }
                                }}
                            >
                                <Feather name="database" size={20} color={COLORS.primary} />
                                <View style={styles.devMenuItemContent}>
                                    <Text style={styles.devMenuItemTitle}>Seed Test Chores</Text>
                                    <Text style={styles.devMenuItemDesc}>Add default chores with 7-day assignments</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Clear All Assignments */}
                            <TouchableOpacity
                                style={styles.devMenuItem}
                                onPress={async () => {
                                    console.log('[DevMenu] Clear All Assignments button pressed');
                                    // Use window.confirm for web compatibility
                                    const confirmed = window.confirm('Clear All Assignments?\n\nThis will delete all task assignments. Chore templates will remain.');
                                    console.log('[DevMenu] User confirmed:', confirmed);
                                    if (confirmed && household?.id) {
                                        console.log('[DevMenu] Calling clearAllAssignments...');
                                        await clearAllAssignments(household.id);
                                        setDevMenuVisible(false);
                                        alert('✓ Cleared - All assignments removed');
                                    }
                                }}
                            >
                                <Feather name="trash-2" size={20} color={COLORS.error} />
                                <View style={styles.devMenuItemContent}>
                                    <Text style={styles.devMenuItemTitle}>Clear All Assignments</Text>
                                    <Text style={styles.devMenuItemDesc}>Remove all pending and completed tasks</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Regenerate Assignments */}
                            <TouchableOpacity
                                style={styles.devMenuItem}
                                onPress={async () => {
                                    if (household?.id) {
                                        const today = new Date();
                                        const nextWeek = addDays(today, 7);
                                        await generateAssignments(household.id, today, nextWeek);
                                        await fetchAssignments(household.id);
                                        setDevMenuVisible(false);
                                        Alert.alert('✓ Generated', 'Assignments created for next 7 days');
                                    }
                                }}
                            >
                                <Feather name="refresh-cw" size={20} color={COLORS.success} />
                                <View style={styles.devMenuItemContent}>
                                    <Text style={styles.devMenuItemTitle}>Regenerate Assignments</Text>
                                    <Text style={styles.devMenuItemDesc}>Create new assignments for next 7 days</Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.devMenuDivider} />
                            <Text style={styles.devMenuSectionTitle}>REASSIGN ALL TO:</Text>

                            {/* Current User */}
                            <TouchableOpacity
                                style={styles.devMenuItem}
                                onPress={async () => {
                                    if (household?.id && user) {
                                        await reassignAllToMember(household.id, user.id);
                                        setDevMenuVisible(false);
                                        Alert.alert('✓ Reassigned', `All pending tasks assigned to you`);
                                    }
                                }}
                            >
                                <Avatar name={user?.name || 'You'} color={user?.avatarColor || COLORS.primary} size="xs" />
                                <View style={styles.devMenuItemContent}>
                                    <Text style={styles.devMenuItemTitle}>{user?.name || 'You'} (Me)</Text>
                                    <Text style={styles.devMenuItemDesc}>Assign all pending tasks to yourself</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Other Members */}
                            {members.filter(m => m.id !== user?.id).map((member) => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={styles.devMenuItem}
                                    onPress={async () => {
                                        if (household?.id) {
                                            await reassignAllToMember(household.id, member.id);
                                            setDevMenuVisible(false);
                                            Alert.alert('✓ Reassigned', `All pending tasks assigned to ${member.name}`);
                                        }
                                    }}
                                >
                                    <Avatar name={member.name} color={member.avatarColor || COLORS.gray500} size="xs" />
                                    <View style={styles.devMenuItemContent}>
                                        <Text style={styles.devMenuItemTitle}>{member.name}</Text>
                                        <Text style={styles.devMenuItemDesc}>Assign all pending tasks to this member</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.devMenuCloseButton}
                            onPress={() => setDevMenuVisible(false)}
                        >
                            <Text style={styles.devMenuCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingHorizontal: SPACING.lg,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // iOS-style Glass Action Bar
    actionBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: SPACING.xl + SPACING.sm,
        marginTop: SPACING.xs,
        // Subtle inner shadow simulation
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 0,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.sm,
    },
    actionCardInner: {
        alignItems: 'center',
        gap: SPACING.xs + 2,
    },
    actionIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    // Liquid Glass Icon Styles
    liquidGlassIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        // Outer glow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    liquidGlassBase: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 14,
    },
    liquidGlassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
        borderRadius: 14,
    },
    liquidGlassEdge: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        // Inner border glow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionIconGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 14,
    },
    actionCardLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.textTertiary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    actionIndicator: {
        position: 'absolute',
        bottom: 0,
        left: '25%',
        right: '25%',
        height: 2,
        borderRadius: 1,
        opacity: 0.6,
    },
    actionDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginVertical: SPACING.lg,
    },


    // Legacy styles (keeping for backwards compat)
    quickActions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    actionButton: {
        flex: 1,
        ...SHADOWS.md,
    },
    actionGradient: {
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    actionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    actionSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    actionPill: {
        flex: 1,
        ...SHADOWS.sm,
    },
    pillGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        gap: 6,
    },
    pillEmoji: {
        fontSize: 16,
    },
    pillText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.white,
    },


    // Sections
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    sectionCount: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    sectionSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
    },
    seeAll: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Task Container - The distinct zone
    taskContainer: {
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.sm,
    },
    taskCardWrapper: {
        marginBottom: SPACING.xs,
    },
    // Reference-style cards (matching the design images)
    referenceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: SPACING.sm,
        borderLeftWidth: 4,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    circularBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    circularBadgeEmoji: {
        fontSize: 26,
    },
    referenceCardTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    // Legacy styles kept for compatibility
    nestedTaskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderLeftWidth: 3,
        // Subtle shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    emojiBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    emojiBadgeText: {
        fontSize: 24,
    },
    nestedTaskContent: {
        flex: 1,
    },
    nestedTaskName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    nestedTaskMeta: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    completeButton: {
        padding: SPACING.xs,
    },
    completeCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: SPACING.sm,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    emptyDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    // Legacy - keeping for other parts
    yourTurnContainer: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        overflow: 'hidden',
    },

    // Empty States
    emptyState: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyEmoji: {
        fontSize: 32,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    emptySubtext: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    emptyCard: {
        padding: SPACING.lg,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    emptyCardText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },

    // Chore List
    choreList: {
        gap: SPACING.sm,
    },
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    choreCardUrgent: {
        borderColor: COLORS.error + '50',
        backgroundColor: COLORS.error + '08',
    },
    choreLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    choreIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    choreIconUrgent: {
        backgroundColor: COLORS.error + '20',
    },
    choreName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    choreDue: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    choreDueUrgent: {
        color: COLORS.error,
    },
    doneButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Activity Feed
    activityList: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    activityUser: {
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    activityChore: {
        fontWeight: '600',
        color: COLORS.primary,  // Blue to match expanded view
    },
    activityTime: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    activityIcon: {
        width: 24,
        height: 24,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIconComplete: {
        backgroundColor: COLORS.success + '20',
    },
    activityIconNudge: {
        backgroundColor: COLORS.primary + '20',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expandButtonBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
    },
    expandButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        marginTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
    },
    calendarButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Fairness
    fairnessCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        gap: SPACING.md,
    },
    fairnessRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fairnessLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        width: 100,
    },
    fairnessName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    fairnessBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    fairnessBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
    },
    fairnessBarFill: {
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
    },
    fairnessCount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.textPrimary,
        width: 24,
        textAlign: 'right',
    },

    // Modals
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        paddingTop: SPACING.md,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    quickOption: {
        width: '47%',
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    quickOptionIcon: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    quickOptionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    roommateList: {
        gap: SPACING.md,
    },
    roommateOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        gap: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    roommateName: {
        flex: 1,
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    // Modal overlay styles (for snitch modal)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.gray900,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl + 20,
        paddingHorizontal: SPACING.lg,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.gray700,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    // Snitch modal options
    snitchOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
        gap: SPACING.md,
    },
    snitchOptionEmoji: {
        fontSize: 24,
    },
    snitchOptionText: {
        flex: 1,
    },
    snitchOptionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    snitchOptionSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // Activity Detail Modal
    activityDetailContent: {
        padding: SPACING.lg,
    },
    activityDetailCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    activityDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    activityDetailInfo: {
        flex: 1,
    },
    activityDetailUser: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    activityDetailTime: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    activityDetailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        gap: 4,
    },
    badgeComplete: {
        backgroundColor: COLORS.success + '20',
    },
    badgeNudge: {
        backgroundColor: COLORS.primary + '20',
    },
    activityDetailBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    badgeTextComplete: {
        color: COLORS.success,
    },
    badgeTextNudge: {
        color: COLORS.primary,
    },
    activityDetailBody: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
        paddingTop: SPACING.lg,
    },
    activityDetailLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    activityDetailChore: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    // Kudos Section
    kudosSection: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    kudosTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    kudosRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    kudosButton: {
        width: 52,
        height: 52,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kudosEmoji: {
        fontSize: 24,
    },
    // Activity Actions
    activityActions: {
        marginTop: SPACING.lg,
    },
    activityActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gray900,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        gap: SPACING.sm,
    },
    activityActionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // Emoji Task Cards
    emojiTaskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.xs,
    },
    taskCardEmoji: {
        fontSize: 28,
        marginRight: SPACING.md,
    },
    taskCardContent: {
        flex: 1,
    },
    taskCardName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    taskCardDue: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
    taskCardComplete: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    // House Status Section
    houseStatusCard: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    houseStatusGradient: {
        padding: SPACING.lg,
    },
    houseStatusTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    houseStatusEmoji: {
        fontSize: 40,
        marginRight: SPACING.md,
    },
    houseStatusText: {
        flex: 1,
    },
    houseStatusTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    houseStatusSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    houseStatusArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    houseStatusDivider: {
        height: 1,
        backgroundColor: COLORS.gray700,
        marginVertical: SPACING.md,
    },
    houseStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    houseStat: {
        flex: 1,
        alignItems: 'center',
    },
    houseStatNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    houseStatLabel: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    houseStatDividerVertical: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.gray700,
    },

    // =====================================================
    // iOS NATIVE DARK MODE STYLES
    // =====================================================

    iosSection: {
        marginBottom: SPACING.xl,
    },
    iosSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iosTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iosSectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    iosBadgePill: {
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    iosBadgeNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
    },
    iosBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    // Empty state
    iosEmptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl + SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
    },
    iosEmptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iosEmptyEmoji: {
        fontSize: 36,
    },
    iosEmptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    iosEmptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    // Card stack - grouped cards like iOS Settings
    iosCardStack: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    iosTaskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.gray700,
    },
    iosTaskCardFirst: {
        // First card in stack
    },
    iosTaskCardLast: {
        borderBottomWidth: 0,
    },
    iosTaskIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iosTaskEmoji: {
        fontSize: 24,
    },
    iosTaskContent: {
        flex: 1,
    },
    iosTaskTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iosTaskTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    iosUrgentDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent,
    },
    iosTaskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
    },
    iosTaskMeta: {
        fontSize: 12,
        color: COLORS.textTertiary,
    },
    iosTaskMetaDot: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginHorizontal: 2,
    },
    iosDoneButton: {
        padding: 8,
    },
    iosDoneCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iosTaskAction: {
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    iosTaskActionText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.primary,
    },

    // Dev Menu Styles
    devMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    devMenuContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        maxHeight: Dimensions.get('window').height * 0.75,
        paddingBottom: SPACING.xl,
    },
    devMenuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    devMenuTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    devMenuContent: {
        paddingHorizontal: SPACING.lg,
    },
    devMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    devMenuItemContent: {
        flex: 1,
    },
    devMenuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    devMenuItemDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    devMenuDivider: {
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: SPACING.md,
    },
    devMenuSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    devMenuCloseButton: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    devMenuCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});
