import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';

interface ActionItem {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
}

interface ExpandableFABProps {
    actions: ActionItem[];
}

export const ExpandableFAB = ({ actions }: ExpandableFABProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;

        Animated.spring(animation, {
            toValue,
            useNativeDriver: true,
            friction: 5,
            tension: 40,
        }).start();

        setIsOpen(!isOpen);
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const getActionStyle = (index: number) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * (index + 1)],
        });

        const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
        });

        return {
            transform: [{ translateY }],
            opacity,
        };
    };

    return (
        <View style={styles.container}>
            {isOpen && (
                <Pressable
                    style={styles.backdrop}
                    onPress={toggleMenu}
                />
            )}

            <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                    <Animated.View
                        key={action.label}
                        style={[styles.actionButtonContainer, getActionStyle(index)]}
                    >
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{action.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: action.color || COLORS.gray800 }]}
                            onPress={() => {
                                toggleMenu();
                                action.onPress();
                            }}
                        >
                            <Feather
                                name={action.icon}
                                size={20}
                                color={COLORS.white}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <Feather name="plus" size={24} color={COLORS.white} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Raised to clear Bottom Tab Bar
        right: SPACING.lg,
        alignItems: 'center',
        zIndex: 999,
    },
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
        shadowColor: COLORS.primary, // Glow effect
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        alignItems: 'flex-end',
        marginBottom: 56, // Height of FAB
    },
    actionButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        position: 'absolute',
        right: 8, // Center with FAB
        bottom: 0,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
        marginLeft: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    labelContainer: {
        backgroundColor: COLORS.gray800,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    label: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
});
