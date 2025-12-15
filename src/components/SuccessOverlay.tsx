import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuccessOverlayProps {
    visible: boolean;
    message?: string;
    subMessage?: string;
    points?: number;
    onComplete?: () => void;
    autoHideDuration?: number;
    variant?: 'success' | 'complete' | 'log' | 'report';
}

const VARIANTS = {
    success: { icon: 'check', color: COLORS.success, emoji: '✓' },
    complete: { icon: 'check-circle', color: COLORS.success, emoji: '✓' },
    log: { icon: 'plus-circle', color: COLORS.secondary, emoji: '📝' },
    report: { icon: 'eye', color: '#FDA4AF', emoji: '👁️' },
};

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
    visible,
    message = 'Success!',
    subMessage,
    points,
    onComplete,
    autoHideDuration = 1500,
    variant = 'success',
}) => {
    const [scaleAnim] = useState(new Animated.Value(0));
    const [opacityAnim] = useState(new Animated.Value(0));
    const [checkScale] = useState(new Animated.Value(0));
    const [rotateAnim] = useState(new Animated.Value(0));
    const [bounceAnim] = useState(new Animated.Value(0));
    const [confettiAnim] = useState([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);

    const variantConfig = VARIANTS[variant];

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
            checkScale.setValue(0);
            rotateAnim.setValue(0);
            bounceAnim.setValue(0);
            confettiAnim.forEach(a => a.setValue(0));

            // Sequence of animations
            Animated.sequence([
                // Fade in backdrop
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                // Spring in the card
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 120,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Checkmark animation (delayed)
            Animated.sequence([
                Animated.delay(200),
                Animated.spring(checkScale, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            // Subtle rotate for the check icon
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.elastic(1.5),
                useNativeDriver: true,
            }).start();

            // Bounce animation for points
            Animated.sequence([
                Animated.delay(400),
                Animated.spring(bounceAnim, {
                    toValue: 1,
                    tension: 150,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start();

            // Confetti burst
            confettiAnim.forEach((anim, index) => {
                Animated.sequence([
                    Animated.delay(250 + index * 50),
                    Animated.spring(anim, {
                        toValue: 1,
                        tension: 80,
                        friction: 6,
                        useNativeDriver: true,
                    }),
                ]).start();
            });

            // Auto-hide after duration
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0.8,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onComplete?.();
                });
            }, autoHideDuration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Confetti positions
    const confettiPositions = [
        { x: -80, y: -60, color: '#FFD700' },
        { x: 80, y: -50, color: '#FF69B4' },
        { x: -60, y: 40, color: '#00FF7F' },
        { x: 70, y: 50, color: '#1E90FF' },
        { x: -30, y: -80, color: '#FF6347' },
        { x: 40, y: -70, color: '#9370DB' },
    ];

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Confetti particles */}
                    {confettiAnim.map((anim, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.confetti,
                                {
                                    backgroundColor: confettiPositions[index].color,
                                    transform: [
                                        {
                                            translateX: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, confettiPositions[index].x],
                                            }),
                                        },
                                        {
                                            translateY: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, confettiPositions[index].y],
                                            }),
                                        },
                                        {
                                            scale: anim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0, 1.5, 0.8],
                                            }),
                                        },
                                        {
                                            rotate: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', `${45 + index * 30}deg`],
                                            }),
                                        },
                                    ],
                                    opacity: anim.interpolate({
                                        inputRange: [0, 0.3, 1],
                                        outputRange: [0, 1, 0.6],
                                    }),
                                },
                            ]}
                        />
                    ))}

                    {/* Check icon with rotation */}
                    <Animated.View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: variantConfig.color + '20' },
                            {
                                transform: [
                                    { scale: checkScale },
                                    { rotate: spin },
                                ],
                            },
                        ]}
                    >
                        <Feather
                            name={variantConfig.icon as any}
                            size={48}
                            color={variantConfig.color}
                        />
                    </Animated.View>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Sub message */}
                    {subMessage && (
                        <Text style={styles.subMessage}>{subMessage}</Text>
                    )}

                    {/* Points badge */}
                    {points !== undefined && (
                        <Animated.View
                            style={[
                                styles.pointsBadge,
                                {
                                    transform: [
                                        {
                                            scale: bounceAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0, 1.2, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Text style={styles.pointsText}>+{points} House Points!</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.gray900,
        borderRadius: 28,
        padding: SPACING.xxl,
        alignItems: 'center',
        minWidth: 280,
        borderWidth: 1,
        borderColor: COLORS.gray700,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    message: {
        fontSize: FONT_SIZE.xl + 4,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subMessage: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    pointsBadge: {
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        marginTop: SPACING.sm,
    },
    pointsText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.warning,
    },
    confetti: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 3,
    },
});
