import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Avatar } from '../components/Avatar';

// Mock Data - Will be replaced with real store data
const ROOM_STATS = [
    { id: 'kitchen', name: 'Kitchen', score: 45, icon: 'coffee', lastCleaned: '2 days ago', lastCleanedBy: 'Alex', streakDays: 0, suggestedAction: 'Wipe down counters', actionTime: 5 },
    { id: 'living', name: 'Living Room', score: 92, icon: 'tv', lastCleaned: 'Today', lastCleanedBy: 'Sam', streakDays: 7, suggestedAction: 'Vacuum rug', actionTime: 10 },
    { id: 'bath', name: 'Bathroom', score: 78, icon: 'droplet', lastCleaned: 'Yesterday', lastCleanedBy: 'Jordan', streakDays: 3, suggestedAction: 'Clean mirror', actionTime: 5 },
    { id: 'bedroom', name: 'Bedroom', score: 88, icon: 'moon', lastCleaned: 'Today', lastCleanedBy: 'Casey', streakDays: 5, suggestedAction: 'Make bed', actionTime: 2 },
];

// Premium Animated Gauge Component
const HealthGauge = ({ score, size = 200 }: { score: number; size?: number }) => {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getGradientColors = (s: number) => {
        if (s >= 80) return { start: '#10B981', end: '#34D399' };
        if (s >= 50) return { start: '#F59E0B', end: '#FBBF24' };
        return { start: '#EF4444', end: '#F87171' };
    };

    const colors = getGradientColors(score);

    return (
        <View style={styles.gaugeContainer}>
            {/* Glow Effect */}
            <View style={[styles.gaugeGlow, { backgroundColor: colors.start + '15' }]} />

            <Svg width={size} height={size}>
                <Defs>
                    <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                <Text style={styles.gaugeScore}>{score}</Text>
                <Text style={styles.gaugeLabel}>HEALTH</Text>
            </View>
        </View>
    );
};

// Impact Opportunity Badge
const ImpactBadge = ({ points, onPress }: { points: number; onPress: () => void }) => (
    <TouchableOpacity style={styles.impactBadge} onPress={onPress} activeOpacity={0.8}>
        <Feather name="zap" size={16} color={COLORS.primary} />
        <Text style={styles.impactText}>+{points} points available</Text>
        <Feather name="chevron-right" size={16} color={COLORS.primary} />
    </TouchableOpacity>
);

// Priority Action Card
const PriorityActionCard = ({ room, onStart, onDone }: {
    room: typeof ROOM_STATS[0];
    onStart: () => void;
    onDone: () => void;
}) => {
    const potentialScore = Math.min(100, room.score + 30);

    return (
        <LinearGradient
            colors={[COLORS.error + '15', COLORS.error + '05']}
            style={styles.priorityCard}
        >
            <View style={styles.priorityHeader}>
                <View style={styles.priorityBadge}>
                    <Feather name="alert-circle" size={14} color={COLORS.error} />
                    <Text style={styles.priorityBadgeText}>PRIORITY</Text>
                </View>
            </View>

            <Text style={styles.priorityTitle}>
                {room.name} is dragging down your score
            </Text>

            {/* Progress Preview */}
            <View style={styles.progressPreview}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressCurrent, { width: `${room.score}%` }]} />
                    <View style={[styles.progressPotential, { left: `${room.score}%`, width: `${potentialScore - room.score}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>{room.score}%</Text>
                    <Feather name="arrow-right" size={12} color={COLORS.textSecondary} />
                    <Text style={[styles.progressLabel, { color: COLORS.success }]}>{potentialScore}%</Text>
                </View>
            </View>

            <View style={styles.quickWinRow}>
                <Feather name="clock" size={14} color={COLORS.textSecondary} />
                <Text style={styles.quickWinText}>
                    Quick Win: {room.suggestedAction} ({room.actionTime} min)
                </Text>
            </View>

            <View style={styles.priorityActions}>
                <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.8}>
                    <Feather name="play" size={16} color={COLORS.white} />
                    <Text style={styles.startButtonText}>Start Timer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.8}>
                    <Feather name="check" size={16} color={COLORS.success} />
                    <Text style={styles.doneButtonText}>Mark Done</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

// Room Card Component
const RoomCard = ({ room, onPress }: { room: typeof ROOM_STATS[0]; onPress: () => void }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return COLORS.success;
        if (score >= 50) return COLORS.warning;
        return COLORS.error;
    };

    const color = getScoreColor(room.score);
    const isGood = room.score >= 80;

    return (
        <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.roomLeft}>
                <View style={[styles.roomIcon, { backgroundColor: color + '20' }]}>
                    <Feather name={room.icon as any} size={20} color={color} />
                </View>
                <View style={styles.roomInfo}>
                    <View style={styles.roomNameRow}>
                        <Text style={styles.roomName}>{room.name}</Text>
                        {room.streakDays > 0 && (
                            <View style={styles.miniStreak}>
                                <Text style={styles.miniStreakText}>🔥 {room.streakDays}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.roomSubtext}>Cleaned {room.lastCleaned}</Text>
                </View>
            </View>

            <View style={styles.roomRight}>
                <Text style={[styles.roomScore, { color }]}>{room.score}%</Text>
                {isGood ? (
                    <View style={styles.goodBadge}>
                        <Feather name="check" size={10} color={COLORS.success} />
                        <Text style={styles.goodBadgeText}>Great</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.fixBadge}>
                        <Text style={styles.fixBadgeText}>Fix</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Room Detail Modal
const RoomDetailModal = ({
    visible,
    room,
    onClose,
    onMarkDone
}: {
    visible: boolean;
    room: typeof ROOM_STATS[0] | null;
    onClose: () => void;
    onMarkDone: () => void;
}) => {
    if (!room) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return COLORS.success;
        if (score >= 50) return COLORS.warning;
        return COLORS.error;
    };

    const color = getScoreColor(room.score);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={[styles.modalIcon, { backgroundColor: color + '20' }]}>
                            <Feather name={room.icon as any} size={28} color={color} />
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalTitle}>{room.name}</Text>
                    <Text style={[styles.modalScore, { color }]}>{room.score}% Health</Text>

                    {/* Stats */}
                    <View style={styles.modalStats}>
                        <View style={styles.modalStatItem}>
                            <Text style={styles.modalStatLabel}>Last Cleaned</Text>
                            <Text style={styles.modalStatValue}>{room.lastCleaned}</Text>
                        </View>
                        <View style={styles.modalStatDivider} />
                        <View style={styles.modalStatItem}>
                            <Text style={styles.modalStatLabel}>Cleaned By</Text>
                            <View style={styles.modalStatRow}>
                                <Avatar name={room.lastCleanedBy} size="xs" />
                                <Text style={styles.modalStatValue}>{room.lastCleanedBy}</Text>
                            </View>
                        </View>
                        <View style={styles.modalStatDivider} />
                        <View style={styles.modalStatItem}>
                            <Text style={styles.modalStatLabel}>Streak</Text>
                            <Text style={styles.modalStatValue}>
                                {room.streakDays > 0 ? `🔥 ${room.streakDays} days` : 'No streak'}
                            </Text>
                        </View>
                    </View>

                    {/* Suggested Action */}
                    <View style={styles.suggestedAction}>
                        <Text style={styles.suggestedLabel}>SUGGESTED ACTION</Text>
                        <Text style={styles.suggestedText}>{room.suggestedAction}</Text>
                        <Text style={styles.suggestedTime}>~{room.actionTime} minutes</Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.modalActionButton} onPress={onMarkDone} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark || COLORS.primary]}
                            style={styles.modalActionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Feather name="check-circle" size={20} color={COLORS.white} />
                            <Text style={styles.modalActionText}>Mark as Cleaned</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Blitz Mode Button
const BlitzModeButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity style={styles.blitzButton} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
            colors={[COLORS.primary, '#7C3AED']}
            style={styles.blitzGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Feather name="zap" size={20} color={COLORS.white} />
            <Text style={styles.blitzText}>Start Blitz Mode</Text>
            <View style={styles.blitzBadge}>
                <Text style={styles.blitzBadgeText}>15 min</Text>
            </View>
        </LinearGradient>
    </TouchableOpacity>
);

export const HousePulseScreen = () => {
    const navigation = useNavigation();
    const [selectedRoom, setSelectedRoom] = useState<typeof ROOM_STATS[0] | null>(null);

    // Calculate overall score and find priority room
    const overallScore = Math.round(ROOM_STATS.reduce((acc, r) => acc + r.score, 0) / ROOM_STATS.length);
    const priorityRoom = ROOM_STATS.reduce((min, r) => r.score < min.score ? r : min, ROOM_STATS[0]);
    const impactPoints = 100 - overallScore; // Simplified calculation
    const streakDays = 5;
    const weeklyImprovement = 8;

    const handleStartClean = () => {
        // Navigate to chores or start timer
        navigation.navigate('Chores' as never);
    };

    const handleMarkDone = () => {
        // Mark the room's suggested chore as done
        setSelectedRoom(null);
        // TODO: Call store action
    };

    const handleBlitzMode = () => {
        // Start blitz mode timer
        // TODO: Implement blitz mode
    };

    const scrollToTop = () => {
        // Scroll behavior if needed
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Health</Text>
                <TouchableOpacity style={styles.historyButton}>
                    <Feather name="bar-chart-2" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Health Gauge */}
                <HealthGauge score={overallScore} />

                {/* Impact Opportunity */}
                <ImpactBadge points={impactPoints} onPress={scrollToTop} />

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

                {/* Priority Action Card */}
                {priorityRoom.score < 80 && (
                    <PriorityActionCard
                        room={priorityRoom}
                        onStart={handleStartClean}
                        onDone={handleMarkDone}
                    />
                )}

                {/* Room Health Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Room Health</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionAction}>History</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.roomList}>
                    {ROOM_STATS.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onPress={() => setSelectedRoom(room)}
                        />
                    ))}
                </View>

                {/* Blitz Mode */}
                <BlitzModeButton onPress={handleBlitzMode} />

            </ScrollView>

            {/* Room Detail Modal */}
            <RoomDetailModal
                visible={!!selectedRoom}
                room={selectedRoom}
                onClose={() => setSelectedRoom(null)}
                onMarkDone={handleMarkDone}
            />
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
    historyButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 120,
    },

    // Gauge
    gaugeContainer: {
        alignItems: 'center',
        marginBottom: SPACING.sm,
        position: 'relative',
    },
    gaugeGlow: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        top: -30,
    },
    gaugeCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gaugeScore: {
        fontSize: 56,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -2,
    },
    gaugeLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 3,
        marginTop: -4,
    },

    // Impact Badge
    impactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.primary + '15',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    impactText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
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
        fontSize: 22,
        marginBottom: 4,
    },
    statValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // Priority Action Card
    priorityCard: {
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.error + '30',
    },
    priorityHeader: {
        marginBottom: SPACING.sm,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    priorityBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.error,
        letterSpacing: 1,
    },
    priorityTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    progressPreview: {
        marginBottom: SPACING.md,
    },
    progressBar: {
        height: 8,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        position: 'relative',
    },
    progressCurrent: {
        height: '100%',
        backgroundColor: COLORS.error,
        borderRadius: BORDER_RADIUS.full,
    },
    progressPotential: {
        position: 'absolute',
        height: '100%',
        backgroundColor: COLORS.success + '50',
        borderRadius: BORDER_RADIUS.full,
    },
    progressLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.xs,
    },
    progressLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    quickWinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    quickWinText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    priorityActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    startButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    startButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.white,
    },
    doneButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.success + '15',
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    doneButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.success,
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
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    roomCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
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
    roomNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    miniStreak: {
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    miniStreakText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.warning,
    },
    roomSubtext: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    roomRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    roomScore: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
    },
    goodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.sm,
    },
    goodBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.success,
    },
    fixBadge: {
        backgroundColor: COLORS.error + '15',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.sm,
    },
    fixBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.error,
    },

    // Blitz Mode
    blitzButton: {
        marginBottom: SPACING.xl,
    },
    blitzGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
    },
    blitzText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    blitzBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    blitzBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.white,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.gray900,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    modalIcon: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    modalScore: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    modalStats: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    modalStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    modalStatLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    modalStatValue: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    modalStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalStatDivider: {
        width: 1,
        backgroundColor: COLORS.gray700,
    },
    suggestedAction: {
        backgroundColor: COLORS.primary + '10',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
    },
    suggestedLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    suggestedText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    suggestedTime: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    modalActionButton: {
        overflow: 'hidden',
        borderRadius: BORDER_RADIUS.lg,
    },
    modalActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
    },
    modalActionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
});
