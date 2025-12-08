import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';

// Mock Data
const MEMBERS = [
    { id: 'u1', name: 'Alex', color: '#818CF8', emoji: '😴', status: 'Sleeping' },
    { id: 'u2', name: 'Sam', color: '#34D399', emoji: '👨‍💻', status: 'Working' },
    { id: 'u3', name: 'Jordan', color: '#F472B6', emoji: '🎮', status: 'Gaming' },
    { id: 'u4', name: 'Casey', color: '#FBBF24', emoji: '🏃', status: 'Gym' },
];

const STATUS_EMOJIS = ['😴', '👨‍💻', '🎮', '🏃', '🤔', '👀', '🏠', '🍕', '🎉', '🧘', '🎧', '📚'];

const DAILY_BRIEFING = "The kitchen is spotless, but the recycling is piling up. Trash day is tomorrow!";

import { useNavigation } from '@react-navigation/native';

export const HouseStatus = () => {
    const navigation = useNavigation();
    const [currentUser, setCurrentUser] = useState(MEMBERS[0]);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

    const handleStatusSelect = (emoji: string) => {
        setCurrentUser({ ...currentUser, emoji });
        setIsStatusModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {/* Main Card */}
            <LinearGradient
                colors={[COLORS.gray800, COLORS.gray900]}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Morning, {currentUser.name}</Text>
                        <Text style={styles.houseName}>The Loft 408</Text>
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

                {/* House Health Entry Point - Clearly Clickable */}
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

            {/* Expanded Status Modal */}
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
                            {MEMBERS.filter(m => m.id !== currentUser.id).map((member) => (
                                <View key={member.id} style={styles.roommateRow}>
                                    <View style={styles.roommateInfo}>
                                        <Avatar name={member.name} color={member.color} size="sm" />
                                        <Text style={styles.roommateName}>{member.name}</Text>
                                    </View>
                                    <Text style={styles.roommateEmoji}>{member.emoji}</Text>
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
