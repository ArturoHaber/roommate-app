import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { Avatar } from '../components/Avatar';
import { useNavigation } from '@react-navigation/native';

// --- Types ---
type PostType = 'note' | 'announcement' | 'poll';

interface Post {
    id: string;
    type: PostType;
    author: { name: string; color: string };
    content: string;
    createdAt: string;
    reactions: { emoji: string; count: number }[];
    pollOptions?: { id: string; text: string; votes: number }[];
    isPinned?: boolean;
}

// --- Mock Data ---
const MOCK_POSTS: Post[] = [
    {
        id: '1',
        type: 'announcement',
        author: { name: 'Admin', color: COLORS.primary },
        content: 'WiFi Password: "superfast_408" 📶',
        createdAt: '2h ago',
        reactions: [],
        isPinned: true,
    },
    {
        id: '2',
        type: 'announcement',
        author: { name: 'Landlord', color: COLORS.error },
        content: 'Inspection on Tuesday at 10AM. Please clear the hallway.',
        createdAt: '1d ago',
        reactions: [{ emoji: '👀', count: 3 }],
        isPinned: true,
    },
    {
        id: '3',
        type: 'poll',
        author: { name: 'Sam', color: '#34D399' },
        content: 'Dinner tonight? 🌮',
        createdAt: '15m ago',
        reactions: [],
        pollOptions: [
            { id: 'opt1', text: 'Tacos', votes: 2 },
            { id: 'opt2', text: 'Pizza', votes: 1 },
            { id: 'opt3', text: 'Cook @ Home', votes: 0 },
        ]
    },
    {
        id: '4',
        type: 'note',
        author: { name: 'Casey', color: '#FBBF24' },
        content: 'Left some lasagna in the fridge. Help yourselves! 🍝',
        createdAt: '5m ago',
        reactions: [{ emoji: '🔥', count: 1 }, { emoji: '😋', count: 2 }],
    },
    {
        id: '5',
        type: 'note',
        author: { name: 'You', color: '#818CF8' },
        content: 'Has anyone seen my blue hoodie?',
        createdAt: 'Just now',
        reactions: [],
    },
];

export const HouseBoardScreen = () => {
    const navigation = useNavigation();
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newPostType, setNewPostType] = useState<PostType>('note');
    const [newPostContent, setNewPostContent] = useState('');

    const pinnedPosts = posts.filter(p => p.isPinned);
    const feedPosts = posts.filter(p => !p.isPinned);

    const handleVote = (postId: string, optionId: string) => {
        // Logic to update votes would go here
        console.log(`Voted for ${optionId} on post ${postId}`);
    };

    const handleCreatePost = () => {
        // Logic to create post
        const newPost: Post = {
            id: Math.random().toString(),
            type: newPostType,
            author: { name: 'You', color: '#818CF8' },
            content: newPostContent,
            createdAt: 'Just now',
            reactions: [],
            isPinned: newPostType === 'announcement',
        };
        setPosts([newPost, ...posts]);
        setIsCreateModalVisible(false);
        setNewPostContent('');
        setNewPostType('note');
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

                {/* Pinned Section (The "Corkboard" Top) */}
                {pinnedPosts.length > 0 && (
                    <View style={styles.pinnedSection}>
                        <Text style={styles.sectionTitle}>Pinned</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedScroll}>
                            {pinnedPosts.map(post => (
                                <View key={post.id} style={styles.pinnedCard}>
                                    {/* Simple pinned label */}
                                    <View style={styles.pinnedLabel}>
                                        <MaterialCommunityIcons name="pin" size={16} color="#A5B4FC" />
                                        <Text style={styles.pinnedLabelText}>Pinned</Text>
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
                <Text style={styles.sectionTitle}>Latest</Text>
                <View style={styles.feed}>
                    {feedPosts.map(post => (
                        <View key={post.id} style={styles.feedCard}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.authorRow}>
                                    <Avatar name={post.author.name} color={post.author.color} size="sm" />
                                    <View>
                                        <Text style={styles.authorName}>{post.author.name}</Text>
                                        <Text style={styles.timestamp}>{post.createdAt}</Text>
                                    </View>
                                </View>
                                {post.type === 'poll' && (
                                    <View style={styles.pollBadge}>
                                        <Feather name="bar-chart-2" size={12} color={COLORS.white} />
                                        <Text style={styles.pollBadgeText}>Poll</Text>
                                    </View>
                                )}
                            </View>

                            {/* Content */}
                            <Text style={styles.postContent}>{post.content}</Text>

                            {/* Poll Options */}
                            {post.type === 'poll' && post.pollOptions && (
                                <View style={styles.pollContainer}>
                                    {post.pollOptions.map(opt => (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={styles.pollOption}
                                            onPress={() => handleVote(post.id, opt.id)}
                                        >
                                            <Text style={styles.pollText}>{opt.text}</Text>
                                            <Text style={styles.pollVotes}>{opt.votes} votes</Text>
                                            <View style={[styles.pollProgress, { width: `${(opt.votes / 3) * 100}%` }]} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Reactions */}
                            <View style={styles.reactionsRow}>
                                {post.reactions.map((r, i) => (
                                    <View key={i} style={styles.reactionPill}>
                                        <Text style={styles.reactionEmoji}>{r.emoji} {r.count}</Text>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addReactionButton}>
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

                    <View style={styles.modalContent}>
                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            {(['note', 'poll', 'announcement'] as PostType[]).map(type => (
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
                            placeholder="What's on your mind?"
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                            autoFocus
                        />

                        {newPostType === 'poll' && (
                            <Text style={styles.hintText}>* Poll options will be added in the next step (Mock)</Text>
                        )}
                        {newPostType === 'announcement' && (
                            <Text style={styles.hintText}>* Announcements will be pinned to the top</Text>
                        )}

                        <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
                            <Text style={styles.postButtonText}>Post to Board</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    pinnedLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
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
    feed: {
        gap: SPACING.lg,
    },
    feedCard: {
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
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
        height: 40,
        justifyContent: 'center',
        marginBottom: 4,
    },
    pollProgress: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.md,
        opacity: 0.5,
    },
    pollText: {
        position: 'absolute',
        left: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        fontWeight: '500',
        zIndex: 1,
    },
    pollVotes: {
        position: 'absolute',
        right: SPACING.md,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        zIndex: 1,
    },

    // Reactions
    reactionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    reactionPill: {
        backgroundColor: COLORS.gray800,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    reactionEmoji: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    addReactionButton: {
        backgroundColor: COLORS.gray800,
        width: 24,
        height: 24,
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
        minHeight: 150,
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
});
