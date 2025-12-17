import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, PanResponder, Dimensions, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_DRAG = 120; // Max drag distance
const QUOTE_BOX_WIDTH = MAX_DRAG - 8; // Width of revealed quote area

const STATUS_EMOJIS = ['😴', '👨‍💻', '🎮', '🏃', '🤔', '👀', '🏠', '🍕', '🎉', '🧘', '🎧', '📚'];

const DAILY_BRIEFING = "The kitchen is spotless, but the recycling is piling up. Trash day is tomorrow!";

// Easter egg: Roommate wisdom quotes
const ROOMMATE_WISDOM = [
    { emoji: '🧘', text: "He who finishes the toilet paper must replace it." },
    { emoji: '🍳', text: "The best roommate cooks for two." },
    { emoji: '🎵', text: "Headphones after 11pm." },
    { emoji: '🧹', text: "A clean kitchen is a happy kitchen." },
    { emoji: '🌙', text: "The 2am fridge light sees all." },
    { emoji: '🚿', text: "Short showers = hot water for all." },
    { emoji: '🗑️', text: "Trash jenga is not a sport." },
    { emoji: '🔑', text: "Lock the door. Every time." },
    { emoji: '🧀', text: "Label your food or it's fair game." },
    { emoji: '💸', text: "Venmo requests age like wine." },
    { emoji: '🎮', text: "Share the TV, unite the house." },
    { emoji: '🛋️', text: "Common area = shared duty." },
    { emoji: '☕', text: "First awake makes coffee." },
    { emoji: '🐱', text: "Feed the pet, even if not yours." },
    { emoji: '📦', text: "Your packages, your problem." },
];

import { useNavigation } from '@react-navigation/native';

export const HouseStatus = () => {
    const navigation = useNavigation();

    // Real data from stores
    const { user, updateProfile } = useAuthStore();
    const { members } = useHouseholdStore();

    // Current user for display (authenticated user)
    const currentUser = user ? {
        id: user.id,
        name: user.name,
        color: user.avatarColor || '#818CF8',
        emoji: user.statusEmoji || '👀',
        status: user.statusText || 'Available',
    } : { id: '', name: 'User', color: '#818CF8', emoji: '👀', status: 'Available' };

    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [currentWisdom, setCurrentWisdom] = useState(ROOMMATE_WISDOM[0]);

    // Safe guard: If no household (e.g. anonymous user just authenticated but household creation lagging), return empty
    // or a placeholder.
    const { household } = useHouseholdStore(); // Need to get household to check

    // Use ref for index since PanResponder doesn't see state updates
    const quoteIndexRef = useRef(0);
    const hasPickedQuote = useRef(false);

    // Animated value for X-only swipe with tension
    const translateX = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    const handleStatusSelect = async (emoji: string) => {
        await updateProfile({ statusEmoji: emoji });
        setIsStatusModalVisible(false);
    };

    // Pick next quote (only once per drag)
    const pickNextQuote = () => {
        if (!hasPickedQuote.current) {
            hasPickedQuote.current = true;
            quoteIndexRef.current = (quoteIndexRef.current + 1) % ROOMMATE_WISDOM.length;
            setCurrentWisdom(ROOMMATE_WISDOM[quoteIndexRef.current]);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to horizontal movement
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
            },
            onPanResponderGrant: () => {
                hasPickedQuote.current = false; // Reset for new drag
                Animated.spring(scale, {
                    toValue: 0.98,
                    useNativeDriver: true, // Use native driver for performance
                    tension: 300,
                    friction: 20,
                }).start();
            },
            onPanResponderMove: (_, gestureState) => {
                // X-axis only with increasing tension as you drag further
                // Using a curve that slows down as you approach max
                const rawX = gestureState.dx;

                // Only allow dragging left (negative X) to reveal right side
                if (rawX < 0) {
                    // Apply tension: the more you drag, the harder it gets
                    const progress = Math.min(Math.abs(rawX) / 200, 1);
                    const tension = 1 - (progress * 0.6); // Starts at 1, goes down to 0.4
                    const dampedX = Math.max(-MAX_DRAG, rawX * tension);
                    translateX.setValue(dampedX);

                    // Trigger quote reveal when dragged enough
                    if (Math.abs(dampedX) > 40) {
                        pickNextQuote();
                    }
                } else {
                    // Small resistance for right drag
                    translateX.setValue(rawX * 0.15);
                }
            },
            onPanResponderRelease: () => {
                hasPickedQuote.current = false; // Reset

                // Spring back with elastic feel
                Animated.parallel([
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 60,
                        friction: 8,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 200,
                        friction: 15,
                    }),
                ]).start();
            },
        })
    ).current;

    // Safe guard: If no household (e.g. anonymous user just authenticated but household creation lagging), return empty
    // or a placeholder.
    if (!members.length) {
        return null;
    }



    return (
        <View style={styles.container}>
            {/* ... (keep existing quoteBox code) ... */}
            <View style={styles.quoteBox}>
                <Text style={styles.quoteEmoji}>{currentWisdom.emoji}</Text>
                <Text style={styles.quoteText} numberOfLines={4}>{currentWisdom.text}</Text>
            </View>

            {/* Main Card (swipeable horizontally) */}
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        transform: [
                            { translateX: translateX },
                            { scale: scale },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <LinearGradient
                    colors={[COLORS.gray800, COLORS.gray900]}
                    style={styles.card}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={{ flex: 1, marginRight: SPACING.md }}>
                            <Text
                                style={styles.greeting}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
                                Good Morning, {currentUser.name}
                            </Text>
                            <Text style={styles.houseName}>{household?.name || 'My Household'}</Text>
                        </View>

                        {/* User Status Trigger */}
                        <TouchableOpacity
                            style={[styles.userStatusButton, { borderColor: currentUser.color }]}
                            onPress={() => setIsStatusModalVisible(true)}
                        >
                            <Text style={styles.userStatusEmoji}>{currentUser.emoji}</Text>
                            <View style={[styles.activeDot, { backgroundColor: currentUser.color }]} />
                        </TouchableOpacity>
                    </View>

                    {/* AI Briefing */}
                    <View style={styles.briefingContainer}>
                        <Feather name="cpu" size={14} color={COLORS.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.briefingText}>
                            {DAILY_BRIEFING}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* House Health Entry Point */}
                    <TouchableOpacity
                        style={styles.healthCard}
                        onPress={() => navigation.navigate('HousePulse' as never)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.healthLeft}>
                            <View style={styles.healthIconContainer}>
                                <Feather name="activity" size={20} color={COLORS.success} />
                            </View>
                            <View>
                                <Text style={styles.healthLabel}>HOUSE HEALTH</Text>
                                <Text style={[styles.healthValue, { color: COLORS.success }]}>72% - Sparkling ✨</Text>
                            </View>
                        </View>
                        <View style={styles.healthRight}>
                            <Text style={styles.tapHint}>Details</Text>
                            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>

            {/* Status Modal */}
            <Modal
                visible={isStatusModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsStatusModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsStatusModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Your Status</Text>
                            <TouchableOpacity onPress={() => setIsStatusModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Emoji Grid */}
                        <View style={styles.emojiGrid}>
                            {STATUS_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[
                                        styles.emojiOption,
                                        currentUser.emoji === emoji && styles.emojiOptionSelected
                                    ]}
                                    onPress={() => handleStatusSelect(emoji)}
                                >
                                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalDivider} />

                        {/* Roommates List */}
                        <Text style={styles.sectionTitle}>Roommates</Text>
                        <View style={styles.roommatesList}>
                            {members.filter(m => m.id !== currentUser.id).map((member) => (
                                <View key={member.id} style={styles.roommateRow}>
                                    <View style={styles.roommateInfo}>
                                        <Avatar name={member.name} color={member.avatarColor || '#818CF8'} size="sm" />
                                        <Text style={styles.roommateName}>{member.name}</Text>
                                    </View>
                                    <Text style={styles.roommateEmoji}>{member.statusEmoji || '👀'}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        position: 'relative',
    },
    // Quote box (fixed on RIGHT side, reveals as card slides left)
    quoteBox: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.lg,
        width: QUOTE_BOX_WIDTH,
        bottom: 0,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    quoteEmoji: {
        fontSize: 28,
        marginBottom: SPACING.sm,
    },
    quoteText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 16,
    },
    // Card wrapper (animated)
    cardWrapper: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
    },
    card: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    greeting: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    houseName: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    userStatusButton: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        position: 'relative',
        ...SHADOWS.md,
    },
    userStatusEmoji: {
        fontSize: 24,
    },
    activeDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 2,
        borderColor: COLORS.gray900,
    },
    briefingContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary + '10',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
    },
    briefingText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginBottom: SPACING.md,
    },
    // House Health Entry Card
    healthCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.gray700 + '50',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    healthLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    healthIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    healthLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    healthValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    healthRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tapHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    emojiOption: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    emojiOptionSelected: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    emojiOptionText: {
        fontSize: 24,
    },
    modalDivider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    roommatesList: {
        gap: SPACING.md,
    },
    roommateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    roommateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roommateName: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    roommateEmoji: {
        fontSize: 20,
    },
});
