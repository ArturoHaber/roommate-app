import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useChoreStore } from '../stores/useChoreStore';
import { calculateHouseHealth, calculateRoomHealth, getHealthTier } from '../utils/houseHealthUtils';
import { RoomType } from '../types';

// Room icons mapping
const ROOM_ICONS: Record<RoomType, string> = {
    kitchen: 'coffee',
    living_room: 'tv',
    bedroom: 'moon',
    bathroom: 'droplet',
    dining: 'grid',
    other: 'box',
};

// Minimal Health Gauge Component
const HealthGauge = ({ score, color }: { score: number; color: string }) => {
    const size = 180;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <View style={styles.gaugeContainer}>
            <Svg width={size} height={size}>
                <Defs>
                    <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color} />
                        <Stop offset="100%" stopColor={color + 'CC'} />
                    </SvgGradient>
                </Defs>

                {/* Background Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={COLORS.gray800}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress Arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#gaugeGrad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Center Content */}
            <View style={styles.gaugeCenter}>
                <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
                <Text style={styles.gaugePercent}>%</Text>
            </View>
        </View>
    );
};

// Room Health Card
const RoomCard = ({
    roomLabel,
    score,
    color,
    emoji,
    overdueCount,
    icon
}: {
    roomLabel: string;
    score: number;
    color: string;
    emoji: string;
    overdueCount: number;
    icon: string;
}) => (
    <View style={styles.roomCard}>
        <View style={styles.roomLeft}>
            <View style={[styles.roomIcon, { backgroundColor: color + '20' }]}>
                <Feather name={icon as any} size={20} color={color} />
            </View>
            <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{roomLabel}</Text>
                {overdueCount > 0 && (
                    <Text style={styles.roomOverdue}>{overdueCount} overdue</Text>
                )}
            </View>
        </View>
        <View style={styles.roomRight}>
            <Text style={[styles.roomScore, { color }]}>{score}%</Text>
            <Text style={styles.roomEmoji}>{emoji}</Text>
        </View>
    </View>
);

export const HousePulseScreen = () => {
    const navigation = useNavigation();
    const { chores, assignments } = useChoreStore();

    // Calculate health data
    const houseHealth = useMemo(() =>
        calculateHouseHealth(assignments, chores),
        [assignments, chores]
    );

    const roomHealths = useMemo(() =>
        calculateRoomHealth(assignments, chores),
        [assignments, chores]
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Health</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Health Gauge */}
                <HealthGauge score={houseHealth.score} color={houseHealth.color} />

                {/* Status Label */}
                <View style={[styles.statusBadge, { backgroundColor: houseHealth.color + '20' }]}>
                    <Text style={[styles.statusText, { color: houseHealth.color }]}>
                        {houseHealth.emoji} {houseHealth.label}
                    </Text>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{houseHealth.overdueCount}</Text>
                        <Text style={styles.statLabel}>Overdue</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{houseHealth.dueTodayCount}</Text>
                        <Text style={styles.statLabel}>Due Today</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                            {houseHealth.completedTodayCount}
                        </Text>
                        <Text style={styles.statLabel}>Done Today</Text>
                    </View>
                </View>

                {/* Room Breakdown */}
                {roomHealths.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Rooms</Text>
                        <View style={styles.roomList}>
                            {roomHealths.map((room) => (
                                <RoomCard
                                    key={room.room}
                                    roomLabel={room.roomLabel}
                                    score={room.score}
                                    color={room.color}
                                    emoji={room.emoji}
                                    overdueCount={room.overdueCount}
                                    icon={ROOM_ICONS[room.room]}
                                />
                            ))}
                        </View>
                    </>
                )}

                {/* Empty State */}
                {roomHealths.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🏠</Text>
                        <Text style={styles.emptyTitle}>No rooms to display</Text>
                        <Text style={styles.emptySubtext}>Add chores to see room health breakdown</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
        alignItems: 'center',
    },

    // Gauge
    gaugeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    gaugeCenter: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    gaugeScore: {
        fontSize: 52,
        fontWeight: '800',
        letterSpacing: -2,
    },
    gaugePercent: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginLeft: 2,
    },

    // Status Badge
    statusBadge: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.xl,
    },
    statusText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.gray800,
    },
    statValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },

    // Section Title
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        alignSelf: 'flex-start',
        marginBottom: SPACING.md,
    },

    // Room List
    roomList: {
        width: '100%',
        gap: SPACING.sm,
    },
    roomCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    roomLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    roomIcon: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roomOverdue: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        marginTop: 2,
    },
    roomRight: {
        alignItems: 'flex-end',
    },
    roomScore: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
    },
    roomEmoji: {
        fontSize: 16,
        marginTop: 2,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl * 2,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    emptySubtext: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
});
