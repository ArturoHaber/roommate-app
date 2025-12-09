import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { Avatar } from './Avatar';
import { useNavigation } from '@react-navigation/native';

// All posts combined for scrollable view
const ALL_POSTS = [
    // Pinned first
    {
        id: '1',
        type: 'pinned',
        content: 'WiFi Password: "superfast_408"',
        author: { name: 'Admin', color: COLORS.primary },
        time: '2h ago',
        isPinned: true,
    },
    // Then recent posts
    {
        id: '2',
        type: 'poll',
        content: 'Dinner tonight? 🌮',
        author: { name: 'Sam', color: '#34D399' },
        time: '1h ago',
        votes: 3,
        isPinned: false,
    },
    {
        id: '3',
        type: 'note',
        content: 'Package arriving tomorrow - can someone grab it?',
        author: { name: 'Jordan', color: '#F472B6' },
        time: '3h ago',
        isPinned: false,
    },
    {
        id: '4',
        type: 'note',
        content: 'Maintenance coming Monday 10am for AC check',
        author: { name: 'Alex', color: '#818CF8' },
        time: '5h ago',
        isPinned: false,
    },
];

export const MessageBoardWidget = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {ALL_POSTS.map((post) => (
                    <TouchableOpacity
                        key={post.id}
                        style={[
                            styles.card,
                            post.isPinned && styles.pinnedCard,
                        ]}
                        onPress={() => navigation.navigate('HouseBoard' as never)}
                        activeOpacity={0.9}
                    >
                        {/* Simple pinned label */}
                        {post.isPinned && (
                            <View style={styles.pinnedLabel}>
                                <MaterialCommunityIcons name="pin" size={14} color="#A5B4FC" />
                                <Text style={styles.pinnedLabelText}>Pinned</Text>
                            </View>
                        )}

                        {/* Poll badge */}
                        {!post.isPinned && post.type === 'poll' && (
                            <View style={styles.pollBadge}>
                                <Feather name="bar-chart-2" size={10} color={COLORS.white} />
                                <Text style={styles.badgeText}>Poll</Text>
                            </View>
                        )}

                        {/* Content */}
                        <Text style={[styles.cardContent, post.isPinned && styles.pinnedContent]} numberOfLines={2}>
                            {post.content}
                        </Text>

                        {/* Footer with smaller colored avatar */}
                        <View style={styles.cardFooter}>
                            <View style={[styles.smallAvatar, { backgroundColor: post.author.color }]}>
                                <Text style={styles.smallAvatarText}>{post.author.name.charAt(0)}</Text>
                            </View>
                            <Text style={[styles.footerText, post.isPinned && styles.pinnedFooterText]}>
                                {post.time}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.lg,
    },
    scrollContent: {
        gap: SPACING.md,
        paddingRight: SPACING.lg,
    },
    // Cards
    card: {
        width: 160,
        minHeight: 110,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        justifyContent: 'space-between',
    },
    pinnedCard: {
        backgroundColor: '#312E81',
        borderColor: '#4338CA',
    },
    // Simple pinned label (like reference image)
    pinnedLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: SPACING.xs,
    },
    pinnedLabelText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A5B4FC',
    },
    // Poll badge
    pollBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        gap: 4,
        alignSelf: 'flex-start',
        marginBottom: SPACING.xs,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.white,
        textTransform: 'uppercase',
    },
    // Content
    cardContent: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        fontWeight: '600',
        lineHeight: 18,
        flex: 1,
    },
    pinnedContent: {
        color: '#E0E7FF',
    },
    // Footer with smaller avatar
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SPACING.sm,
    },
    smallAvatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.gray700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallAvatarText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    footerText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    pinnedFooterText: {
        color: '#A5B4FC',
    },
});
