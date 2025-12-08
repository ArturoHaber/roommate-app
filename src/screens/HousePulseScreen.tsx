import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// Mock Data
const ROOM_STATS = [
    { id: 'kitchen', name: 'Kitchen', score: 45, icon: 'coffee', lastCleaned: '2 days ago' },
    { id: 'living', name: 'Living Room', score: 92, icon: 'tv', lastCleaned: 'Today' },
    { id: 'bath', name: 'Bathroom', score: 78, icon: 'droplet', lastCleaned: 'Yesterday' },
    { id: 'bedroom', name: 'Bedroom', score: 88, icon: 'moon', lastCleaned: 'Today' },
];

// Premium Animated Gauge Component
const HealthGauge = ({ score, size = 220 }: { score: number; size?: number }) => {
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getGradientColors = (score: number) => {
        if (score >= 80) return { start: '#10B981', end: '#34D399' }; // Success
        if (score >= 50) return { start: '#F59E0B', end: '#FBBF24' }; // Warning
        return { start: '#EF4444', end: '#F87171' }; // Error
    };

    const colors = getGradientColors(score);

    const getStatusText = (score: number) => {
        if (score >= 90) return { emoji: '✨', text: 'Sparkling' };
        if (score >= 75) return { emoji: '👍', text: 'Looking Good' };
        if (score >= 50) return { emoji: '🧹', text: 'Needs Love' };
        return { emoji: '🚿', text: 'Time to Clean' };
    };

    const status = getStatusText(score);

    return (
        <View style={styles.gaugeContainer}>
            {/* Glow Effect Background */}
            <View style={[styles.gaugeGlow, { backgroundColor: colors.start + '15' }]} />

            <Svg width={size} height={size}>
                <Defs>
                    <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.start} />
                        <Stop offset="100%" stopColor={colors.end} />
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

                {/* Progress Arc with Gradient */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#grad)"
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
                <Text style={styles.gaugeScore}>{score}</Text>
                <View style={styles.gaugeLabelContainer}>
                    <Text style={styles.gaugeLabel}>HEALTH</Text>
                </View>
            </View>

            {/* Status Badge Below Gauge */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusEmoji}>{status.emoji}</Text>
                <Text style={styles.statusText}>{status.text}</Text>
            </View>
        </View>
    );
};

// Room Health Card Component
const RoomCard = ({ room }: { room: typeof ROOM_STATS[0] }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return COLORS.success;
        if (score >= 50) return COLORS.warning;
        return COLORS.error;
    };

    const color = getScoreColor(room.score);

    return (
        <TouchableOpacity style={styles.roomCard} activeOpacity={0.8}>
            <View style={styles.roomLeft}>
                <View style={[styles.roomIcon, { backgroundColor: color + '20' }]}>
                    <Feather name={room.icon as any} size={22} color={color} />
                </View>
                <View>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomSubtext}>Cleaned {room.lastCleaned}</Text>
                </View>
            </View>

            <View style={styles.roomRight}>
                <View style={styles.roomScoreContainer}>
                    <Text style={[styles.roomScoreValue, { color }]}>{room.score}</Text>
                    <Text style={styles.roomScorePercent}>%</Text>
                </View>
                <View style={styles.roomProgressBar}>
                    <View style={[styles.roomProgressFill, { width: `${room.score}%`, backgroundColor: color }]} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const HousePulseScreen = () => {
    const navigation = useNavigation();
    const overallScore = 72;
    const streakDays = 5;
    const weeklyImprovement = 8;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Health</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Premium Health Gauge */}
                <HealthGauge score={overallScore} />

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statValue}>{streakDays}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>📈</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>+{weeklyImprovement}%</Text>
                        <Text style={styles.statLabel}>This Week</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>🏆</Text>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Badges</Text>
                    </View>
                </View>

                {/* Room Health Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Room Health</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionAction}>History</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.roomList}>
                    {ROOM_STATS.map((room) => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                </View>

                {/* Insight Card */}
                <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                        <Feather name="trending-up" size={18} color={COLORS.primary} />
                        <Text style={styles.insightTitle}>Weekly Insight</Text>
                    </View>
                    <Text style={styles.insightText}>
                        Your Kitchen has been below 50% for 3 days. A quick 10-minute clean could boost your overall score by 15 points!
                    </Text>
                    <TouchableOpacity style={styles.insightButton}>
                        <Text style={styles.insightButtonText}>Start Kitchen Clean</Text>
                        <Feather name="arrow-right" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

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
        width: 40,
        height: 40,
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
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
    },

    // Premium Gauge
    gaugeContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
        position: 'relative',
    },
    gaugeGlow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        top: -30,
    },
    gaugeCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gaugeScore: {
        fontSize: 64,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -2,
    },
    gaugeLabelContainer: {
        marginTop: -4,
    },
    gaugeLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 3,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.md,
    },
    statusEmoji: {
        fontSize: 20,
    },
    statusText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.gray800,
        marginHorizontal: SPACING.md,
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    statValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // Section Header
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
    sectionAction: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Room Cards
    roomList: {
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    roomCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    roomLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roomIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roomSubtext: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    roomRight: {
        alignItems: 'flex-end',
    },
    roomScoreContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    roomScoreValue: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
    },
    roomScorePercent: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginLeft: 1,
    },
    roomProgressBar: {
        width: 60,
        height: 4,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
        marginTop: 4,
        overflow: 'hidden',
    },
    roomProgressFill: {
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
    },

    // Insight Card
    insightCard: {
        backgroundColor: COLORS.primary + '10',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    insightTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.primary,
    },
    insightText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    insightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    insightButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
