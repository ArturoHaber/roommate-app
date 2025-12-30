import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, PanResponder, Dimensions, Share, TextInput, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';
import { calculateHouseHealth } from '../utils/houseHealthUtils';

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
    const { chores, assignments } = useChoreStore();

    // Calculate house health score with memoization
    const houseHealth = useMemo(() => {
        return calculateHouseHealth(assignments, chores);
    }, [assignments, chores]);

    // Animated value for score display
    const animatedScore = useRef(new Animated.Value(houseHealth.score)).current;

    // Animate score changes
    useEffect(() => {
        Animated.spring(animatedScore, {
            toValue: houseHealth.score,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
        }).start();
    }, [houseHealth.score]);

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
    const [selectedMember, setSelectedMember] = useState<any>(null); // null = list view, object = detail view
    const [modalMode, setModalMode] = useState<'list' | 'emoji-picker' | 'member-actions'>('list');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

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
        setModalMode('list');
        setSelectedMember(null);
    };

    const handleStartNameEdit = () => {
        setEditedName(currentUser.name);
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        const trimmedName = editedName.trim();
        if (trimmedName && trimmedName !== currentUser.name) {
            await updateProfile({ name: trimmedName });
        }
        setIsEditingName(false);
        Keyboard.dismiss();
    };

    const handleCancelNameEdit = () => {
        setIsEditingName(false);
        setEditedName('');
        Keyboard.dismiss();
    };

    const handleMemberPress = (member: any) => {
        setSelectedMember(member);
        if (member.id === currentUser.id) {
            setModalMode('emoji-picker');
        } else {
            setModalMode('member-actions');
        }
    };

    const handleBackToList = () => {
        setModalMode('list');
        setSelectedMember(null);
    };

    const handleCloseModal = () => {
        setIsStatusModalVisible(false);
        setModalMode('list');
        setSelectedMember(null);
    };

    const handleSendNudge = () => {
        if (selectedMember) {
            (navigation as any).navigate('NudgeScreen', {
                targetUserId: selectedMember.id,
                choreName: 'general',
            });
            handleCloseModal();
        }
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
            onStartShouldSetPanResponderCapture: () => false,

            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Claim horizontal swipes - be generous to avoid losing gestures
                const isHorizontal = Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
                return isHorizontal;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                // Capture more aggressively once we're clearly swiping horizontally
                return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
            },

            // CRITICAL: Refuse to give up the gesture once we have it
            onPanResponderTerminationRequest: () => false,

            onPanResponderGrant: () => {
                hasPickedQuote.current = false; // Reset for new drag
                Animated.spring(scale, {
                    toValue: 0.98,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 15,
                }).start();
            },
            onPanResponderMove: (_, gestureState) => {
                // X-axis only with rubber-band tension
                const rawX = gestureState.dx;

                // Only allow dragging left (negative X) to reveal right side
                if (rawX < 0) {
                    // Rubber-band effect: resistance increases past threshold
                    const threshold = 60;
                    const resistance = 0.4;
                    let dampedX = rawX;

                    if (Math.abs(rawX) > threshold) {
                        const overflow = Math.abs(rawX) - threshold;
                        dampedX = -(threshold + overflow * resistance);
                    }

                    dampedX = Math.max(-MAX_DRAG, dampedX);
                    translateX.setValue(dampedX);

                    // Trigger quote reveal when dragged enough
                    if (Math.abs(dampedX) > 40) {
                        pickNextQuote();
                    }
                } else {
                    // Small rubber-band resistance for right drag
                    translateX.setValue(rawX * 0.2);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                hasPickedQuote.current = false; // Reset

                // Spring back with velocity for natural feel
                const velocity = gestureState.vx;
                Animated.parallel([
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        velocity: -velocity * 0.5,
                        tension: 180,
                        friction: 12,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 200,
                        friction: 12,
                    }),
                ]).start();
            },
            onPanResponderTerminate: () => {
                // If gesture is interrupted, snap back smoothly
                hasPickedQuote.current = false;
                Animated.parallel([
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 200,
                        friction: 12,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 200,
                        friction: 12,
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
                            {isEditingName ? (
                                <View style={styles.nameEditContainer}>
                                    <TextInput
                                        style={styles.nameInput}
                                        value={editedName}
                                        onChangeText={setEditedName}
                                        autoFocus
                                        selectTextOnFocus
                                        onSubmitEditing={handleSaveName}
                                        onBlur={handleSaveName}
                                        returnKeyType="done"
                                        placeholder="Your name"
                                        placeholderTextColor={COLORS.textTertiary}
                                    />
                                    <TouchableOpacity onPress={handleSaveName} style={styles.nameEditButton}>
                                        <Feather name="check" size={18} color={COLORS.success} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleCancelNameEdit} style={styles.nameEditButton}>
                                        <Feather name="x" size={18} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleStartNameEdit}
                                    style={styles.greetingContainer}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={styles.greetingPrefix}
                                        numberOfLines={1}
                                    >
                                        Good Morning,{' '}
                                    </Text>
                                    <View style={styles.nameWrapper}>
                                        <Text
                                            style={styles.greeting}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {currentUser.name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
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
                            <Animated.View style={[
                                styles.healthIconContainer,
                                {
                                    backgroundColor: houseHealth.color + '20',
                                    transform: [{
                                        scale: animatedScore.interpolate({
                                            inputRange: [0, 50, 100],
                                            outputRange: [0.9, 1, 1.1],
                                            extrapolate: 'clamp',
                                        })
                                    }]
                                }
                            ]}>
                                <Feather name="activity" size={20} color={houseHealth.color} />
                            </Animated.View>
                            <View>
                                <Text style={styles.healthLabel}>HOUSE HEALTH</Text>
                                <Text style={[styles.healthValue, { color: houseHealth.color }]}>
                                    {houseHealth.score}% - {houseHealth.label} {houseHealth.emoji}
                                </Text>
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
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCloseModal}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            {modalMode !== 'list' ? (
                                <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                                    <Feather name="arrow-left" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 32 }} />
                            )}
                            <Text style={styles.modalTitle}>
                                {modalMode === 'list' ? 'Household' :
                                    modalMode === 'emoji-picker' ? 'Your Status' :
                                        selectedMember?.name}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* LIST VIEW - All Members */}
                        {modalMode === 'list' && (
                            <View style={styles.roommatesList}>
                                {/* Current User First */}
                                <TouchableOpacity
                                    style={[styles.roommateRow, styles.roommateRowSelf]}
                                    onPress={() => handleMemberPress(currentUser)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.roommateInfo}>
                                        <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
                                        <View>
                                            <Text style={styles.roommateName}>{currentUser.name}</Text>
                                            <Text style={styles.youLabel}>You • Tap to change status</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.roommateEmoji}>{currentUser.emoji}</Text>
                                </TouchableOpacity>

                                {/* Other Members */}
                                {members.filter(m => m.id !== currentUser.id).map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={styles.roommateRow}
                                        onPress={() => handleMemberPress(member)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.roommateInfo}>
                                            <Avatar name={member.name} color={member.avatarColor || '#818CF8'} size="sm" />
                                            <Text style={styles.roommateName}>{member.name}</Text>
                                        </View>
                                        <View style={styles.roommateRight}>
                                            <Text style={styles.roommateEmoji}>{member.statusEmoji || '👀'}</Text>
                                            <Feather name="chevron-right" size={16} color={COLORS.textTertiary} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* EMOJI PICKER - For Self */}
                        {modalMode === 'emoji-picker' && (
                            <View>
                                <Text style={styles.pickerSubtitle}>How are you feeling?</Text>
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
                            </View>
                        )}

                        {/* MEMBER ACTIONS - For Others */}
                        {modalMode === 'member-actions' && selectedMember && (
                            <View style={styles.memberActionsContainer}>
                                {/* Member Info */}
                                <View style={styles.memberInfoLarge}>
                                    <Avatar name={selectedMember.name} color={selectedMember.avatarColor || '#818CF8'} size="lg" />
                                    <Text style={styles.memberNameLarge}>{selectedMember.name}</Text>
                                    <Text style={styles.memberStatusLarge}>{selectedMember.statusEmoji || '👀'}</Text>
                                </View>

                                <View style={styles.actionDivider} />

                                {/* Actions */}
                                <TouchableOpacity style={styles.actionButton} onPress={handleSendNudge}>
                                    <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                        <Feather name="bell" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>Send Nudge</Text>
                                        <Text style={styles.actionDesc}>Remind them about a task</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        // Could add more actions here like view profile, etc.
                                        handleCloseModal();
                                    }}
                                >
                                    <View style={[styles.actionIcon, { backgroundColor: COLORS.gray700 }]}>
                                        <Feather name="user" size={20} color={COLORS.textSecondary} />
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionTitle}>View Activity</Text>
                                        <Text style={styles.actionDesc}>See their recent tasks</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        )}
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
    roommateRowSelf: {
        borderWidth: 1,
        borderColor: COLORS.primary + '50',
        backgroundColor: COLORS.primary + '10',
    },
    roommateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roommateRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    roommateName: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    youLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    roommateEmoji: {
        fontSize: 20,
    },
    // Back button in header
    backButton: {
        padding: 4,
    },
    // Emoji picker subtitle
    pickerSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    // Member actions view
    memberActionsContainer: {
        gap: SPACING.md,
    },
    memberInfoLarge: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    memberNameLarge: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: SPACING.sm,
    },
    memberStatusLarge: {
        fontSize: 28,
    },
    actionDivider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginVertical: SPACING.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    actionDesc: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Name editing styles
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
    },
    greetingPrefix: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    nameWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    editIcon: {
        marginLeft: 1,
        marginTop: -2,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: 2,
    },
    nameInput: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        backgroundColor: COLORS.gray700,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    nameEditButton: {
        padding: SPACING.xs,
    },
});
