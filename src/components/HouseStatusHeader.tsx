import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';

interface HouseStatusHeaderProps {
    /** Whether to use a compact (skinnier) layout */
    compact?: boolean;
}

export const HouseStatusHeader: React.FC<HouseStatusHeaderProps> = ({ compact = false }) => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { assignments } = useChoreStore();

    if (!user) return null;

    const incompleteCount = assignments.filter(a => !a.completedAt).length;
    const myCount = assignments.filter(a => !a.completedAt && a.assignedTo === user.id).length;
    const othersCount = incompleteCount - myCount;
    const doneCount = assignments.filter(a => a.completedAt).length;

    const isPeaceful = incompleteCount === 0;

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NeedsAttention' as never)}
        >
            <LinearGradient
                colors={
                    isPeaceful
                        ? ['rgba(52, 211, 153, 0.12)', 'rgba(52, 211, 153, 0.04)']
                        : ['rgba(129, 140, 248, 0.10)', 'rgba(167, 139, 250, 0.06)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, compact && styles.gradientCompact]}
            >
                {/* Top Row - Emoji + Status */}
                <View style={styles.topRow}>
                    <Text style={[styles.emoji, compact && styles.emojiCompact]}>
                        {isPeaceful ? '🏡' : '🏠'}
                    </Text>
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, compact && styles.titleCompact]}>
                            {isPeaceful
                                ? 'House is peaceful'
                                : `${incompleteCount} thing${incompleteCount !== 1 ? 's' : ''} need attention`
                            }
                        </Text>
                        {!compact && (
                            <Text style={styles.subtitle}>
                                {isPeaceful ? "Everyone's done their part" : 'Tap to see details'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.arrowContainer}>
                        <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
                    </View>
                </View>

                {/* Stats Row - Only when not compact */}
                {!compact && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statNumber}>{myCount}</Text>
                                <Text style={styles.statLabel}>Yours</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statNumber}>{othersCount}</Text>
                                <Text style={styles.statLabel}>Others</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={[styles.statNumber, { color: COLORS.success }]}>{doneCount}</Text>
                                <Text style={styles.statLabel}>Done</Text>
                            </View>
                        </View>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    gradientCompact: {
        paddingVertical: SPACING.md,
    },

    // Top Row
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    emojiCompact: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    titleCompact: {
        fontSize: 15,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginVertical: SPACING.md,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    stat: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textTertiary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
});

export default HouseStatusHeader;
