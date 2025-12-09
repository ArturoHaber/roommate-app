import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

interface SwipeableHouseCardProps {
    houseName: string;
    houseEmoji: string;
    healthScore: number;
    onCook: () => void;
    onLogChore: () => void;
    onSnitch: () => void;
    onPress: () => void;
}

/**
 * OPTION B: Swipeable House Card
 * 
 * The house status card on dashboard that reveals quick actions when swiped left.
 * Contextual - actions appear where they make sense.
 */
export const SwipeableHouseCard: React.FC<SwipeableHouseCardProps> = ({
    houseName,
    houseEmoji,
    healthScore,
    onCook,
    onLogChore,
    onSnitch,
    onPress,
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [actionsVisible, setActionsVisible] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -150));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    Animated.spring(translateX, {
                        toValue: -150,
                        useNativeDriver: true,
                    }).start();
                    setActionsVisible(true);
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                    setActionsVisible(false);
                }
            },
        })
    ).current;

    const closeActions = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
        setActionsVisible(false);
    };

    const handleAction = (action: () => void) => {
        closeActions();
        action();
    };

    const getHealthColor = () => {
        if (healthScore >= 80) return COLORS.success;
        if (healthScore >= 50) return COLORS.warning;
        return COLORS.error;
    };

    return (
        <View style={styles.container}>
            {/* Hidden Actions (revealed on swipe) */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F9731620' }]}
                    onPress={() => handleAction(onCook)}
                >
                    <Text style={styles.actionEmoji}>🍳</Text>
                    <Text style={styles.actionLabel}>Cook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#22C55E20' }]}
                    onPress={() => handleAction(onLogChore)}
                >
                    <Text style={styles.actionEmoji}>✅</Text>
                    <Text style={styles.actionLabel}>Log</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleAction(onSnitch)}
                >
                    <Text style={styles.actionEmoji}>👀</Text>
                    <Text style={styles.actionLabel}>Snitch</Text>
                </TouchableOpacity>
            </View>

            {/* Main Card (swipeable) */}
            <Animated.View
                style={[styles.card, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={styles.cardContent}>
                    <LinearGradient
                        colors={[COLORS.gray800, COLORS.gray900]}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        {/* Swipe Hint */}
                        <View style={styles.swipeHint}>
                            <Feather name="chevron-left" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.swipeHintText}>Swipe for actions</Text>
                        </View>

                        <View style={styles.cardHeader}>
                            <View style={styles.houseInfo}>
                                <View style={styles.houseIconContainer}>
                                    <Text style={styles.houseEmoji}>{houseEmoji}</Text>
                                </View>
                                <View>
                                    <Text style={styles.houseName}>{houseName}</Text>
                                    <Text style={styles.houseSubtitle}>Tap for details</Text>
                                </View>
                            </View>
                            <View style={styles.healthBadge}>
                                <View style={[styles.healthDot, { backgroundColor: getHealthColor() }]} />
                                <Text style={[styles.healthText, { color: getHealthColor() }]}>{healthScore}%</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        height: 100,
    },
    actionsContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: SPACING.xs,
        gap: SPACING.xs,
    },
    actionButton: {
        width: 46,
        height: 80,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    actionEmoji: {
        fontSize: 20,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    card: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    cardContent: {
        flex: 1,
    },
    cardGradient: {
        flex: 1,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    swipeHint: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.5,
    },
    swipeHintText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginLeft: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    houseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    houseIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    houseEmoji: {
        fontSize: 24,
    },
    houseName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    houseSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    healthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.xs,
    },
    healthDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    healthText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default SwipeableHouseCard;
