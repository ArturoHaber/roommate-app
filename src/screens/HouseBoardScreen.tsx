import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useBoardStore } from '../stores/useBoardStore';
import { Avatar } from '../components/Avatar';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { BoardPostType } from '../types';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😍', '🔥', '🎉', '👀', '😋', '😢', '👏'];

export const HouseBoardScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { household } = useHouseholdStore();
    const {
        posts,
        userReactions,
        isLoading,
        fetchPosts,
        createPost,
        togglePin,
        vote,
        toggleReaction
    } = useBoardStore();

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newPostType, setNewPostType] = useState<BoardPostType>('note');
    const [newPostContent, setNewPostContent] = useState('');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    const [emojiPickerPostId, setEmojiPickerPostId] = useState<string | null>(null);

    // Fetch posts on mount
    useEffect(() => {
        if (household?.id) {
            fetchPosts(household.id);
        }
    }, [household?.id]);

    const pinnedPosts = posts.filter(p => p.isPinned);
    const feedPosts = posts.filter(p => !p.isPinned);

    const handleToggleReaction = (postId: string, emoji: string) => {
        if (!user) return;
        toggleReaction(postId, user.id, emoji);
    };

    const handleAddReaction = (emoji: string) => {
        if (emojiPickerPostId && user) {
            toggleReaction(emojiPickerPostId, user.id, emoji);
            setEmojiPickerPostId(null);
        }
    };

    const handleTogglePin = (postId: string) => {
        togglePin(postId);
    };

    const handleVote = (postId: string, optionId: string) => {
        if (!user) return;
        vote(postId, optionId, user.id);
    };

    const handleCreatePost = async () => {
        if (!household || !user || !newPostContent.trim()) {
            Alert.alert('Error', 'Please enter some content');
            return;
        }

        // Validate poll options if creating a poll
        if (newPostType === 'poll') {
            const validOptions = pollOptions.filter(o => o.trim());
            if (validOptions.length < 2) {
                Alert.alert('Error', 'Please add at least 2 poll options');
                return;
            }
        }

        await createPost({
            householdId: household.id,
            authorId: user.id,
            type: newPostType,
            content: newPostContent,
            pollOptions: newPostType === 'poll' ? pollOptions.filter(o => o.trim()) : undefined,
        });

        setIsCreateModalVisible(false);
        setNewPostContent('');
        setNewPostType('note');
        setPollOptions(['', '']);
    };

    const addPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index: number, text: string) => {
        const updated = [...pollOptions];
        updated[index] = text;
        setPollOptions(updated);
    };

    const formatTime = (date: Date) => {
        try {
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Board</Text>
                <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.createButton}>
                    <Feather name="edit-3" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Pinned Section */}
                {pinnedPosts.length > 0 && (
                    <View style={styles.pinnedSection}>
                        <Text style={styles.sectionTitle}>Pinned</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedScroll}>
                            {pinnedPosts.map(post => (
                                <View key={post.id} style={styles.pinnedCard}>
                                    <View style={styles.pinnedCardHeader}>
                                        <View style={styles.pinnedLabel}>
                                            <MaterialCommunityIcons name="pin" size={16} color="#A5B4FC" />
                                            <Text style={styles.pinnedLabelText}>Pinned</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.unpinButton}
                                            onPress={() => handleTogglePin(post.id)}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="pin-off" size={16} color="#A5B4FC" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.pinnedContent}>{post.content}</Text>
                                    <View style={styles.pinnedFooter}>
                                        <Avatar name={post.author.name} color={post.author.color} size="sm" />
                                        <Text style={styles.pinnedAuthor}>{post.author.name}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* The Feed */}
                <Text style={styles.sectionTitle}>Feed</Text>

                {feedPosts.length === 0 && pinnedPosts.length === 0 && !isLoading && (
                    <View style={styles.emptyContainer}>
                        <Feather name="message-square" size={48} color={COLORS.gray700} />
                        <Text style={styles.emptyText}>No posts yet</Text>
                        <Text style={styles.emptySubtext}>Be the first to post something on the board!</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => setIsCreateModalVisible(true)}>
                            <Text style={styles.emptyButtonText}>Create Post</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.feedScroll}>
                    {feedPosts.map(post => (
                        <View key={post.id} style={styles.feedCard}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.authorRow}>
                                    <Avatar name={post.author.name} color={post.author.color} size="sm" />
                                    <View>
                                        <Text style={styles.authorName}>{post.author.name}</Text>
                                        <Text style={styles.timestamp}>{formatTime(post.createdAt)}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardHeaderActions}>
                                    {post.type === 'poll' && (
                                        <View style={styles.pollBadge}>
                                            <Feather name="bar-chart-2" size={12} color={COLORS.white} />
                                            <Text style={styles.pollBadgeText}>Poll</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.pinButton}
                                        onPress={() => handleTogglePin(post.id)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="pin-outline" size={18} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Content */}
                            <Text style={styles.postContent}>{post.content}</Text>

                            {/* Poll Options */}
                            {post.type === 'poll' && post.pollOptions && (
                                <View style={styles.pollContainer}>
                                    {post.pollOptions.map(opt => {
                                        const totalVotes = post.pollOptions?.reduce((sum, o) => sum + o.votes, 0) || 0;
                                        const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                                        const isVoted = post.userVotedOptionId === opt.id;

                                        return (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
                                                onPress={() => handleVote(post.id, opt.id)}
                                            >
                                                <View style={[styles.pollProgress, { width: `${percentage}%` }]} />
                                                <View style={styles.pollOptionContent}>
                                                    <Text style={[styles.pollText, isVoted && styles.pollTextVoted]}>
                                                        {opt.text}
                                                    </Text>
                                                    <Text style={styles.pollVotes}>
                                                        {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                                                    </Text>
                                                </View>
                                                {isVoted && (
                                                    <Feather name="check" size={16} color={COLORS.primary} style={styles.pollCheck} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Reactions */}
                            <View style={styles.reactionsRow}>
                                {post.reactions.map((r, i) => {
                                    const isUserReacted = (userReactions[post.id] || []).includes(r.emoji);
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[
                                                styles.reactionPill,
                                                isUserReacted && styles.reactionPillActive,
                                            ]}
                                            onPress={() => handleToggleReaction(post.id, r.emoji)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.reactionEmoji,
                                                isUserReacted && styles.reactionEmojiActive,
                                            ]}>
                                                {r.emoji} {r.count}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                <TouchableOpacity
                                    style={styles.addReactionButton}
                                    onPress={() => setEmojiPickerPostId(post.id)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="smile" size={16} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Create Post Modal */}
            <Modal
                visible={isCreateModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsCreateModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Post</Text>
                        <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                            <Feather name="x" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            {(['note', 'poll', 'announcement'] as BoardPostType[]).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeOption, newPostType === type && styles.typeOptionActive]}
                                    onPress={() => setNewPostType(type)}
                                >
                                    <Text style={[styles.typeText, newPostType === type && styles.typeTextActive]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={newPostType === 'poll' ? "What's your question?" : "What's on your mind?"}
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                        />

                        {/* Poll Options */}
                        {newPostType === 'poll' && (
                            <View style={styles.pollOptionsContainer}>
                                <Text style={styles.pollOptionsLabel}>Poll Options</Text>
                                {pollOptions.map((option, index) => (
                                    <View key={index} style={styles.pollOptionInput}>
                                        <TextInput
                                            style={styles.pollOptionTextInput}
                                            placeholder={`Option ${index + 1}`}
                                            placeholderTextColor={COLORS.textTertiary}
                                            value={option}
                                            onChangeText={(text) => updatePollOption(index, text)}
                                        />
                                        {pollOptions.length > 2 && (
                                            <TouchableOpacity
                                                onPress={() => removePollOption(index)}
                                                style={styles.removeOptionButton}
                                            >
                                                <Feather name="x" size={18} color={COLORS.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                {pollOptions.length < 6 && (
                                    <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
                                        <Feather name="plus" size={16} color={COLORS.primary} />
                                        <Text style={styles.addOptionText}>Add Option</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {newPostType === 'announcement' && (
                            <Text style={styles.hintText}>* Announcements will be pinned to the top</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.postButton, !newPostContent.trim() && styles.postButtonDisabled]}
                            onPress={handleCreatePost}
                            disabled={!newPostContent.trim()}
                        >
                            <Text style={styles.postButtonText}>Post to Board</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Emoji Picker Modal */}
            <Modal
                visible={emojiPickerPostId !== null}
                animationType="fade"
                transparent
                onRequestClose={() => setEmojiPickerPostId(null)}
            >
                <TouchableOpacity
                    style={styles.emojiPickerOverlay}
                    activeOpacity={1}
                    onPress={() => setEmojiPickerPostId(null)}
                >
                    <View style={styles.emojiPickerContainer}>
                        <Text style={styles.emojiPickerTitle}>Add Reaction</Text>
                        <View style={styles.emojiGrid}>
                            {AVAILABLE_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.emojiButton}
                                    onPress={() => handleAddReaction(emoji)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },

    // Pinned Section
    pinnedSection: {
        marginBottom: SPACING.xl,
    },
    pinnedScroll: {
        gap: SPACING.md,
        paddingRight: SPACING.lg,
    },
    pinnedCard: {
        width: 200,
        backgroundColor: '#312E81',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: '#4338CA',
    },
    pinnedCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    pinnedLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    unpinButton: {
        width: 28,
        height: 28,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(165, 180, 252, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinnedLabelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A5B4FC',
    },
    pinnedContent: {
        fontSize: FONT_SIZE.md,
        color: '#E0E7FF',
        fontWeight: '500',
        marginBottom: SPACING.lg,
        lineHeight: 22,
    },
    pinnedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pinnedAuthor: {
        fontSize: FONT_SIZE.xs,
        color: '#A5B4FC',
        fontWeight: '600',
    },

    // Feed Section
    feedScroll: {
        gap: SPACING.lg,
    },
    feedCard: {
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        marginBottom: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    authorRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    cardHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pinButton: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    timestamp: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    pollBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        gap: 4,
    },
    pollBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
        textTransform: 'uppercase',
    },
    postContent: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        lineHeight: 24,
        marginBottom: SPACING.md,
    },

    // Poll Styles
    pollContainer: {
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    pollOption: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    pollOptionVoted: {
        borderColor: COLORS.primary,
    },
    pollProgress: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: COLORS.primary + '30',
    },
    pollOptionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    pollText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    pollTextVoted: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    pollVotes: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    pollCheck: {
        position: 'absolute',
        right: SPACING.md,
    },

    // Reactions
    reactionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
        flexWrap: 'wrap',
    },
    reactionPill: {
        backgroundColor: COLORS.gray800,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    reactionPillActive: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    reactionEmoji: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    reactionEmojiActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    addReactionButton: {
        backgroundColor: COLORS.gray800,
        width: 28,
        height: 28,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    modalContent: {
        padding: SPACING.lg,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray800,
        padding: 4,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
    },
    typeOption: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    typeOptionActive: {
        backgroundColor: COLORS.primary,
    },
    typeText: {
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    typeTextActive: {
        color: COLORS.white,
    },
    input: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    postButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT_SIZE.md,
    },
    hintText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.xs,
        marginBottom: SPACING.lg,
        fontStyle: 'italic',
    },

    // Poll Options Input
    pollOptionsContainer: {
        marginBottom: SPACING.lg,
    },
    pollOptionsLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    pollOptionInput: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    pollOptionTextInput: {
        flex: 1,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    removeOptionButton: {
        padding: SPACING.sm,
        marginLeft: SPACING.sm,
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.primary + '50',
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.xs,
    },
    addOptionText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: FONT_SIZE.sm,
    },

    // Emoji Picker Modal
    emojiPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiPickerContainer: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        width: '80%',
        maxWidth: 300,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    emojiPickerTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    emojiButton: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiButtonText: {
        fontSize: 24,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        marginTop: SPACING.lg,
        gap: SPACING.sm,
    },
    emptyText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: SPACING.sm,
    },
    emptySubtext: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    emptyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
    },
    emptyButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
});
