import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../constants/theme';

interface QuickAction {
    id: string;
    icon: string;
    emoji: string;
    label: string;
    color: string;
    onPress: () => void;
}

interface QuickLogFABProps {
    onCook: () => void;
    onLogChore: () => void;
    onGroceries: () => void;
    onSnitch: () => void;
}

/**
 * OPTION A: Floating Action Button
 * 
 * A FAB in the bottom-right corner that expands to show quick actions.
 * Always accessible from any screen.
 */
export const QuickLogFAB: React.FC<QuickLogFABProps> = ({
    onCook,
    onLogChore,
    onGroceries,
    onSnitch,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();
        setIsOpen(!isOpen);
    };

    const actions: QuickAction[] = [
        { id: 'cook', emoji: '🍳', icon: 'coffee', label: 'I cooked', color: '#F97316', onPress: onCook },
        { id: 'chore', emoji: '✅', icon: 'check-circle', label: 'Did a chore', color: '#22C55E', onPress: onLogChore },
        { id: 'groceries', emoji: '🛒', icon: 'shopping-bag', label: 'Bought groceries', color: '#3B82F6', onPress: onGroceries },
        { id: 'snitch', emoji: '👀', icon: 'eye', label: 'Report issue', color: '#EF4444', onPress: onSnitch },
    ];

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={styles.fabContainer}>
            {/* Backdrop */}
            {isOpen && (
                <TouchableOpacity
                    style={styles.fabBackdrop}
                    activeOpacity={1}
                    onPress={toggleMenu}
                />
            )}

            {/* Action Items */}
            {actions.map((action, index) => {
                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(60 * (index + 1))],
                });

                const opacity = animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                });

                const scale = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                });

                return (
                    <Animated.View
                        key={action.id}
                        style={[
                            styles.fabAction,
                            {
                                transform: [{ translateY }, { scale }],
                                opacity,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.fabActionButton}
                            onPress={() => {
                                toggleMenu();
                                action.onPress();
                            }}
                        >
                            <View style={[styles.fabActionIcon, { backgroundColor: action.color + '20' }]}>
                                <Text style={styles.fabActionEmoji}>{action.emoji}</Text>
                            </View>
                            <Text style={styles.fabActionLabel}>{action.label}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* Main FAB */}
            <TouchableOpacity onPress={toggleMenu} activeOpacity={0.9}>
                <LinearGradient
                    colors={[COLORS.primary, '#4F46E5']}
                    style={styles.fab}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <Feather name="plus" size={28} color={COLORS.white} />
                    </Animated.View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    // FAB Container
    fabContainer: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 1000,
    },
    fabBackdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -100,
        bottom: -100,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    fabAction: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fabActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingRight: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.md,
    },
    fabActionIcon: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    fabActionEmoji: {
        fontSize: 18,
    },
    fabActionLabel: {
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default QuickLogFAB;
