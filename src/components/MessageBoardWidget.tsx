import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Avatar } from './Avatar';
import { useNavigation } from '@react-navigation/native';

export const MessageBoardWidget = () => {
    const navigation = useNavigation();

    // Mock Data to match HouseBoardScreen
    // In a real app, this would come from a store
    const latestAnnouncement = {
        id: '1',
        content: 'WiFi Password: "superfast_408"',
        author: { name: 'Admin', color: COLORS.primary },
        time: '2h ago'
    };

    const latestPoll = {
        id: '3',
        question: 'Dinner tonight? 🌮',
        votes: 3,
        options: 3
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate('HouseBoard' as never)}
            activeOpacity={0.9}
        >
            {/* Pinned Note Preview */}
            <View style={styles.pinnedCard}>
                <View style={styles.pinIcon}>
                    <Feather name="map-pin" size={10} color={COLORS.primary} />
                </View>
                <Text style={styles.pinnedTitle}>Pinned</Text>
                <Text style={styles.pinnedContent} numberOfLines={2}>
                    {latestAnnouncement.content}
                </Text>
                <View style={styles.footerRow}>
                    <Avatar name={latestAnnouncement.author.name} color={latestAnnouncement.author.color} size="xs" />
                    <Text style={styles.footerText}>{latestAnnouncement.time}</Text>
                </View>
            </View>

            {/* Active Poll Preview */}
            <View style={styles.pollCard}>
                <View style={styles.pollHeader}>
                    <View style={styles.pollBadge}>
                        <Feather name="bar-chart-2" size={10} color={COLORS.white} />
                        <Text style={styles.pollBadgeText}>Active Poll</Text>
                    </View>
                </View>
                <Text style={styles.pollQuestion}>{latestPoll.question}</Text>
                <Text style={styles.pollStats}>{latestPoll.votes} votes • {latestPoll.options} options</Text>

                <View style={styles.votePreview}>
                    <View style={styles.voteAvatarRow}>
                        <Avatar name="Sam" color="#34D399" size="xs" />
                        <Avatar name="You" color="#818CF8" size="xs" />
                    </View>
                    <Text style={styles.actionText}>Tap to vote</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    // Mini Pinned Card
    pinnedCard: {
        flex: 1,
        backgroundColor: '#312E81', // Deep Indigo to match screen
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: '#4338CA',
        minHeight: 120,
        justifyContent: 'space-between',
    },
    pinIcon: {
        position: 'absolute',
        top: -6,
        left: '50%',
        marginLeft: -8, // center roughly
        backgroundColor: COLORS.background,
        padding: 2,
        borderRadius: BORDER_RADIUS.full,
        zIndex: 1,
    },
    pinnedTitle: {
        fontSize: 10,
        color: '#A5B4FC',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: SPACING.xs,
        marginTop: SPACING.xs,
    },
    pinnedContent: {
        fontSize: FONT_SIZE.sm,
        color: '#E0E7FF',
        fontWeight: '600',
        lineHeight: 18,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    footerText: {
        fontSize: 10,
        color: '#A5B4FC',
    },

    // Mini Poll Card
    pollCard: {
        flex: 1.2, // Give slightly more space to poll
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    pollHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: SPACING.xs,
    },
    pollBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        gap: 4,
    },
    pollBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.white,
        textTransform: 'uppercase',
    },
    pollQuestion: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    pollStats: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    votePreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voteAvatarRow: {
        flexDirection: 'row',
        gap: -8, // Overlap
    },
    actionText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '600',
    },
});
