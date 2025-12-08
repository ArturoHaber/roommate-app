import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RoomCard, AddTaskModal, TaskDetailModal, ExpandableFAB, ChoresCalendarWidget } from '../components';
import { Chore, NudgeTone } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { Avatar } from '../components/Avatar';

type Tab = 'overview' | 'all_chores';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (SPACING.lg * 2);

// Mock Data for Mission Control
const MY_CURRENT_CHORE = {
    id: '101',
    name: 'Clean the Bathroom',
    description: 'Scrub the sink, toilet, and mirror.',
    due: 'Today',
    points: 10,
    icon: 'droplet' as const,
    room: 'bathroom',
    frequency: 'weekly',
    pointValue: 10,
    householdId: 'h1',
    createdAt: new Date(),
} as Chore;

const WEEKLY_OVERVIEW = {
    total: 12,
    completed: 8,
    upcoming: [
        { id: '301', user: 'Sam', task: 'Trash', day: 'Tue', color: '#34D399' },
        { id: '302', user: 'Alex', task: 'Dishes', day: 'Wed', color: '#EC4899' },
        { id: '303', user: 'You', task: 'Vacuum', day: 'Thu', color: '#818CF8' },
    ]
};

// New Chore Radar Data (Sorted by Relevance/Urgency)
const CHORE_RADAR = [
    {
        id: '401',
        task: 'Pay Rent',
        room: 'General',
        assignee: { name: 'Everyone', color: COLORS.error },
        due: 'Overdue (1d)',
        status: 'do_now'
    },
    {
        id: '201',
        task: 'Take out Trash',
        room: 'Kitchen',
        assignee: { name: 'Sam', color: '#34D399' },
        due: 'Late (2h)',
        status: 'do_now'
    },
    {
        id: '402',
        task: 'Wipe Counters',
        room: 'Kitchen',
        assignee: { name: 'Alex', color: '#EC4899' },
        due: 'Today',
        status: 'do_soon'
    },
    {
        id: '405',
        task: 'Load Dishwasher',
        room: 'Kitchen',
        assignee: { name: 'Sam', color: '#34D399' },
        due: 'Today',
        status: 'do_soon'
    },
    {
        id: '202',
        task: 'Living Room Vacuum',
        room: 'Living Room',
        assignee: { name: 'Casey', color: '#FBBF24' },
        due: 'Tomorrow',
        status: 'coming_up'
    },
    {
        id: '403',
        task: 'Water Plants',
        room: 'Living Room',
        assignee: { name: 'You', color: '#818CF8' },
        due: 'Fri',
        status: 'coming_up'
    },
] as const;


const INITIAL_CHORES: Chore[] = [
    { id: '1', name: 'Dishes', room: 'kitchen', frequency: 'daily', pointValue: 3, icon: 'droplet', householdId: 'h1', description: '', createdAt: new Date() },
    { id: '2', name: 'Trash', room: 'kitchen', frequency: 'weekly', pointValue: 2, icon: 'trash-2', householdId: 'h1', description: '', createdAt: new Date() },
    { id: '3', name: 'Vacuum', room: 'living_room', frequency: 'weekly', pointValue: 5, icon: 'wind', householdId: 'h1', description: '', createdAt: new Date() },
    { id: '4', name: 'Clean Mirror', room: 'bathroom', frequency: 'weekly', pointValue: 3, icon: 'maximize', householdId: 'h1', description: '', createdAt: new Date() },
    { id: '5', name: 'Scrub Toilet', room: 'bathroom', frequency: 'weekly', pointValue: 5, icon: 'disc', householdId: 'h1', description: '', createdAt: new Date() },
];

const ROOMS = [
    { id: 'kitchen', name: 'Kitchen', icon: 'coffee', colors: ['#F59E0B', '#D97706'] },
    { id: 'living_room', name: 'Living Room', icon: 'tv', colors: ['#3B82F6', '#2563EB'] },
    { id: 'bathroom', name: 'Bathroom', icon: 'droplet', colors: ['#06B6D4', '#0891B2'] },
    { id: 'bedroom', name: 'Bedroom', icon: 'moon', colors: ['#8B5CF6', '#7C3AED'] },
    { id: 'dining', name: 'Dining', icon: 'layout', colors: ['#EC4899', '#DB2777'] },
    { id: 'other', name: 'Other', icon: 'grid', colors: ['#10B981', '#059669'] },
] as const;

export const HouseholdScreen = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [chores, setChores] = useState<Chore[]>(INITIAL_CHORES);

    // Modal States
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<string | undefined>(undefined);
    const [selectedTask, setSelectedTask] = useState<Chore | null>(null);

    // Grouping Logic
    const doNowChores = CHORE_RADAR.filter(c => c.status === 'do_now');
    const doSoonChores = CHORE_RADAR.filter(c => c.status === 'do_soon');
    const comingUpChores = CHORE_RADAR.filter(c => c.status === 'coming_up');

    const handleSaveTask = (task: Partial<Chore>) => {
        if (task.id) {
            setChores(chores.map(c => c.id === task.id ? { ...c, ...task } as Chore : c));
        } else {
            const newChore: Chore = {
                id: Math.random().toString(),
                householdId: 'h1',
                description: '',
                createdAt: new Date(),
                ...task
            } as Chore;
            setChores([...chores, newChore]);
        }
        setIsAddModalVisible(false);
        setSelectedTask(null);
    };

    const openAddModal = (roomId?: string) => {
        setSelectedRoom(roomId);
        setSelectedTask(null);
        setIsAddModalVisible(true);
    };

    const openTaskDetail = (task: Chore) => {
        setSelectedTask(task);
        setIsDetailModalVisible(true);
    };

    const handleEditFromDetail = (task: Chore) => {
        setIsDetailModalVisible(false);
        setTimeout(() => {
            setSelectedTask(task);
            setIsAddModalVisible(true);
        }, 300);
    };

    const handleMarkDone = (task: Chore) => {
        setIsDetailModalVisible(false);
        Alert.alert("Chore Completed!", `You earned ${task.pointValue} points.`);
    };

    const handleNudge = (task: Chore, tone: NudgeTone) => {
        console.log(`Nudge: ${task.name} with tone: ${tone}`);
        setIsDetailModalVisible(false);
        setSelectedTask(null);
    };

    const handleSnitch = (task: Chore, tone: NudgeTone) => {
        console.log(`Snitch: ${task.name} with tone: ${tone}`);
        setIsDetailModalVisible(false);
        setSelectedTask(null);
    };

    const handleAction = (item: any) => {
        if (item.status === 'do_now' || item.status === 'do_soon') {
            Alert.alert("Nudge Sent", `Reminded ${item.assignee.name} about ${item.task}!`);
        } else {
            Alert.alert("Coming Up", `${item.task} is due ${item.due}.`);
        }
    };

    const FABActions = [
        {
            icon: 'plus' as const,
            label: 'Add Task',
            onPress: () => openAddModal(),
        },
    ];

    // --- Sub-Components (Internal) ---

    // ... MissionCard & HousePulseCard (Unchanged) ...
    const MissionCard = () => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.carouselItem}
            onPress={() => openTaskDetail(MY_CURRENT_CHORE)}
        >
            <LinearGradient
                colors={[COLORS.primary, '#6366F1']}
                style={styles.heroCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.heroHeader}>
                    <View style={styles.iconContainer}>
                        <Feather name={MY_CURRENT_CHORE.icon as any} size={24} color={COLORS.white} />
                    </View>
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{MY_CURRENT_CHORE.pointValue} PTS</Text>
                    </View>
                </View>

                <View style={styles.heroContent}>
                    <Text style={styles.heroEyebrow}>YOUR MISSION TODAY</Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>{MY_CURRENT_CHORE.name}</Text>
                    <Text style={styles.heroDesc}>{MY_CURRENT_CHORE.description}</Text>
                </View>

                <View style={styles.heroFooter}>
                    <Text style={styles.heroDue}>Due {MY_CURRENT_CHORE.due}</Text>
                    <View style={styles.tapHint}>
                        <Text style={styles.tapHintText}>Tap for details</Text>
                        <Feather name="arrow-right" size={14} color={COLORS.white} />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const HousePulseCard = () => (
        <View style={styles.carouselItem}>
            <LinearGradient
                colors={[COLORS.gray800, COLORS.gray900]}
                style={[styles.heroCard, { borderWidth: 1, borderColor: COLORS.gray700 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.heroHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.gray700 }]}>
                        <Feather name="activity" size={24} color={COLORS.textSecondary} />
                    </View>
                    <View style={[styles.pointsBadge, { backgroundColor: COLORS.success + '20' }]}>
                        <Text style={[styles.pointsText, { color: COLORS.success }]}>{WEEKLY_OVERVIEW.completed}/{WEEKLY_OVERVIEW.total} Done</Text>
                    </View>
                </View>

                <View style={styles.heroContent}>
                    <Text style={styles.heroEyebrow}>HOUSE PULSE</Text>
                    <Text style={styles.heroTitle}>Weekly Overview</Text>

                    <View style={styles.pulseRow}>
                        {WEEKLY_OVERVIEW.upcoming.map((item, index) => (
                            <View key={item.id} style={styles.pulseItem}>
                                <Avatar name={item.user} color={item.color} size="sm" />
                                <View>
                                    <Text style={styles.pulseDay}>{item.day}</Text>
                                    <Text style={styles.pulseTask}>{item.task}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </View>
    );

    const RadarSection = ({ title, items, type }: { title: string, items: readonly typeof CHORE_RADAR[number][], type: 'do_now' | 'do_soon' | 'coming_up' }) => {
        if (items.length === 0) return null;

        const [collapsed, setCollapsed] = useState(false);

        // Peaceful Color Scheme
        // Do Now = Success (Green) - "Go" / Active
        // Do Soon = Info/Blue - Clear but calm
        // Coming Up = Text Secondary/Gray - Background
        const headerColor = type === 'do_now' ? COLORS.success : type === 'do_soon' ? '#3B82F6' : COLORS.textSecondary;
        const icon = type === 'do_now' ? 'play-circle' : type === 'do_soon' ? 'clock' : 'calendar';

        return (
            <View style={styles.radarSection}>
                <TouchableOpacity
                    style={styles.radarSectionHeader}
                    onPress={() => setCollapsed(!collapsed)}
                    activeOpacity={0.7}
                >
                    <Feather name={icon} size={14} color={headerColor} />
                    <Text style={[styles.radarSectionTitle, { color: headerColor }]}>{title} ({items.length})</Text>
                    <View style={styles.radarSectionLine} />
                    <Feather name={collapsed ? "chevron-down" : "chevron-up"} size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {!collapsed && (
                    <View style={styles.radarGroup}>
                        {items.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.radarItem,
                                    item.status === 'do_now' && styles.radarItemHighlight
                                ]}
                                onPress={() => openTaskDetail({
                                    ...MY_CURRENT_CHORE, // Using helper to cast mock data to Chore type for now
                                    id: item.id,
                                    name: item.task,
                                    room: (item.room.toLowerCase().replace(' ', '_') as any),
                                } as Chore)}
                            >
                                <View style={styles.radarLeft}>
                                    <Text style={[styles.radarTaskName, item.status === 'coming_up' && styles.textMuted]}>{item.task}</Text>
                                    <Text style={styles.radarMetaText}>{item.room} • {item.assignee.name}</Text>
                                </View>

                                <View style={styles.radarRight}>
                                    {type !== 'coming_up' && (
                                        <View style={styles.radarAction}>
                                            <Feather name="bell" size={16} color={type === 'do_now' ? COLORS.success : COLORS.textSecondary} />
                                        </View>
                                    )}
                                    {type === 'coming_up' && (
                                        <Text style={styles.radarDate}>{item.due}</Text>
                                    )}
                                    <Feather name="chevron-right" size={14} color={COLORS.gray700} style={{ marginLeft: 8 }} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Navigation */}
            <View style={styles.navContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        style={[styles.navItem, activeTab === 'overview' && styles.navItemActive]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.navText, activeTab === 'overview' && styles.navTextActive]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navItem, activeTab === 'all_chores' && styles.navItemActive]}
                        onPress={() => setActiveTab('all_chores')}
                    >
                        <Text style={[styles.navText, activeTab === 'all_chores' && styles.navTextActive]}>All Chores</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.content}>

                {/* 1. OVERVIEW (MISSION CONTROL) */}
                {activeTab === 'overview' && (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* THE HEART: Carousel */}
                        <Text style={styles.sectionTitle}>Dashboard</Text>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                            decelerationRate="fast"
                            snapToInterval={CARD_WIDTH + SPACING.md}
                        >
                            <MissionCard />
                            <HousePulseCard />
                        </ScrollView>

                        {/* Paging Indicator (Simple) */}
                        <View style={styles.pagingIndicator}>
                            <View style={[styles.dot, styles.dotActive]} />
                            <View style={styles.dot} />
                        </View>

                        {/* CHORE RADAR - SECTIONED */}
                        <Text style={styles.mainSectionTitle}>Chore Radar</Text>
                        <View style={styles.radarContainer}>
                            <RadarSection title="Do Now" items={doNowChores} type="do_now" />
                            <RadarSection title="Do Soon" items={doSoonChores} type="do_soon" />
                            <RadarSection title="Coming Up" items={comingUpChores} type="coming_up" />
                        </View>


                        {/* CALENDAR - Chore History */}
                        <ChoresCalendarWidget />

                    </ScrollView>
                )}

                {/* 2. ALL CHORES (MANAGEMENT) */}
                {activeTab === 'all_chores' && (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.viewDescription}>Manage house chores and edit habits.</Text>
                        {ROOMS.map(room => (
                            <RoomCard
                                key={room.id}
                                roomName={room.name}
                                icon={room.icon}
                                gradientColors={[...room.colors] as [string, string]}
                                tasks={chores.filter(c => c.room === room.id)}
                                onEditTask={openTaskDetail}
                                onAddTask={() => openAddModal(room.id)}
                            />
                        ))}
                    </ScrollView>
                )}

            </View>

            {/* Modals */}
            <AddTaskModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onSave={handleSaveTask}
                initialRoom={selectedRoom}
                initialTask={selectedTask}
            />

            <TaskDetailModal
                visible={isDetailModalVisible}
                task={selectedTask}
                currentUser={user!}
                onClose={() => setIsDetailModalVisible(false)}
                onEdit={handleEditFromDetail}
                onMarkDone={handleMarkDone}
                onNudge={handleNudge}
                onSnitch={handleSnitch}
            />

            {/* FAB - Only show on All Chores tab for easy adding */}
            {
                activeTab === 'all_chores' && (
                    <ExpandableFAB actions={FABActions} />
                )
            }
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // Navigation Bar
    navContainer: {
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        backgroundColor: COLORS.background,
        zIndex: 10,
    },
    navBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.full,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    navItem: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.full,
    },
    navItemActive: {
        backgroundColor: COLORS.gray800,
        ...SHADOWS.sm,
    },
    navText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    navTextActive: {
        color: COLORS.white,
        fontWeight: '700',
    },

    // Content Areas
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
        marginLeft: SPACING.sm,
    },
    mainSectionTitle: {
        fontSize: FONT_SIZE.md, // Larger for main header
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
        marginLeft: SPACING.sm,
    },
    viewDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.sm,
    },

    // Carousel
    carouselContent: {
        paddingRight: SPACING.lg, // Space for last card
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    carouselItem: {
        width: CARD_WIDTH,
    },

    // Hero Card (Shared Styles)
    heroCard: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        height: 220, // Fixed height for carousel uniformity
        justifyContent: 'space-between',
        ...SHADOWS.lg,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsBadge: {
        backgroundColor: COLORS.warning,
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsText: {
        color: COLORS.gray900,
        fontWeight: '800',
        fontSize: FONT_SIZE.xs,
    },
    heroContent: {
        justifyContent: 'center',
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: SPACING.xs,
        lineHeight: 30,
    },
    heroDesc: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    heroDue: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tapHintText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },

    // Pulse Content
    pulseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
    },
    pulseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        flex: 1,
        marginRight: 8,
    },
    pulseDay: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    pulseTask: {
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },

    // Paging Dots
    pagingIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: SPACING.xl,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
    },
    dotActive: {
        backgroundColor: COLORS.primary,
        width: 16,
    },

    // Radar Section (The New Design)
    radarContainer: {
        marginBottom: SPACING.xl,
        gap: SPACING.lg,
    },
    radarSection: {
        marginBottom: SPACING.sm,
    },
    radarSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    radarSectionTitle: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    radarSectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray800,
    },
    radarGroup: {
        gap: SPACING.sm,
    },
    radarItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        // Card shadow for depth
        ...SHADOWS.sm,
    },
    radarItemHighlight: {
        borderColor: COLORS.success + '30', // Subtle Green border
        backgroundColor: COLORS.success + '05', // Very subtle green tint
    },
    radarLeft: {
        gap: 2,
    },
    radarTaskName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    textMuted: {
        color: COLORS.textSecondary,
    },
    radarMetaText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    radarRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radarAction: {
        padding: 4,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
    },
    radarDate: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        fontWeight: '600',
    },

    // Teaser
    gamificationTeaser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    teaserText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontStyle: 'italic',
    },
});
