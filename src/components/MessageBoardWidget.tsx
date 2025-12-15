import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { Avatar } from './Avatar';
import { useNavigation } from '@react-navigation/native';

// TODO: Connect to real message board store once migrated to Supabase
// For now, show empty state
const ALL_POSTS: any[] = [];

export const MessageBoardWidget = () => {
    const navigation = useNavigation();

    // Empty state when no posts
    if (ALL_POSTS.length === 0) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.emptyCard}
                    onPress={() => navigation.navigate('HouseBoard' as never)}
                    activeOpacity={0.9}
                >
                    <Feather name="message-square" size={24} color={COLORS.gray500} />
                    <Text style={styles.emptyTitle}>House Board</Text>
                    <Text style={styles.emptySubtext}>Tap to view & post messages</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
    emptyCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.lg,
        gap: SPACING.xs,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: SPACING.sm,
    },
    emptySubtext: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
});
