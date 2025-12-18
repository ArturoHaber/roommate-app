import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { BoardPost, BoardPostType, PollOption, PollVote, PostReaction } from '../types';

// Extended post with author info and computed data
interface EnrichedPost extends BoardPost {
    author: { name: string; color: string };
    pollOptions?: { id: string; text: string; votes: number }[];
    reactions: { emoji: string; count: number }[];
    userVotedOptionId?: string;
}

interface BoardState {
    posts: EnrichedPost[];
    userReactions: { [postId: string]: string[] };
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPosts: (householdId: string) => Promise<void>;
    createPost: (post: {
        householdId: string;
        authorId: string;
        type: BoardPostType;
        content: string;
        pollOptions?: string[];
    }) => Promise<void>;
    togglePin: (postId: string) => Promise<void>;
    vote: (postId: string, optionId: string, userId: string) => Promise<void>;
    toggleReaction: (postId: string, userId: string, emoji: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    posts: [],
    userReactions: {},
    isLoading: false,
    error: null,

    fetchPosts: async (householdId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Fetch posts with author info
            const { data: posts, error: postsError } = await supabase
                .from('board_posts')
                .select(`
                    *,
                    author:profiles!author_id(id, name, avatar_color)
                `)
                .eq('household_id', householdId)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // Fetch poll options for all posts
            const postIds = posts?.map(p => p.id) || [];
            const { data: pollOptions } = await supabase
                .from('poll_options')
                .select('*')
                .in('post_id', postIds);

            // Fetch poll votes
            const { data: pollVotes } = await supabase
                .from('poll_votes')
                .select('*')
                .in('post_id', postIds);

            // Fetch reactions
            const { data: reactions } = await supabase
                .from('post_reactions')
                .select('*')
                .in('post_id', postIds);

            // Get current user's ID
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            // Build enriched posts
            const enrichedPosts: EnrichedPost[] = (posts || []).map(post => {
                // Author info
                const author = post.author ? {
                    name: post.author.name || 'Unknown',
                    color: post.author.avatar_color || '#818CF8'
                } : { name: 'Unknown', color: '#818CF8' };

                // Poll options with vote counts
                const postPollOptions = pollOptions
                    ?.filter(o => o.post_id === post.id)
                    .map(o => ({
                        id: o.id,
                        text: o.text,
                        votes: pollVotes?.filter(v => v.option_id === o.id).length || 0
                    }));

                // User's vote
                const userVote = pollVotes?.find(v => v.post_id === post.id && v.user_id === userId);

                // Aggregated reactions
                const postReactions = reactions?.filter(r => r.post_id === post.id) || [];
                const reactionCounts: { [emoji: string]: number } = {};
                postReactions.forEach(r => {
                    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                });
                const reactionsList = Object.entries(reactionCounts).map(([emoji, count]) => ({ emoji, count }));

                // User's reactions for this post
                const userPostReactions = postReactions
                    .filter(r => r.user_id === userId)
                    .map(r => r.emoji);

                return {
                    id: post.id,
                    householdId: post.household_id,
                    authorId: post.author_id,
                    type: post.type as BoardPostType,
                    content: post.content,
                    isPinned: post.is_pinned,
                    createdAt: new Date(post.created_at),
                    author,
                    pollOptions: post.type === 'poll' ? postPollOptions : undefined,
                    reactions: reactionsList,
                    userVotedOptionId: userVote?.option_id,
                };
            });

            // Build user reactions map
            const userReactionsMap: { [postId: string]: string[] } = {};
            reactions?.filter(r => r.user_id === userId).forEach(r => {
                if (!userReactionsMap[r.post_id]) userReactionsMap[r.post_id] = [];
                userReactionsMap[r.post_id].push(r.emoji);
            });

            set({ posts: enrichedPosts, userReactions: userReactionsMap, isLoading: false });
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    createPost: async ({ householdId, authorId, type, content, pollOptions }) => {
        try {
            // Insert post
            const { data: post, error: postError } = await supabase
                .from('board_posts')
                .insert({
                    household_id: householdId,
                    author_id: authorId,
                    type,
                    content,
                    is_pinned: type === 'announcement',
                })
                .select()
                .single();

            if (postError) throw postError;

            // Insert poll options if it's a poll
            if (type === 'poll' && pollOptions && pollOptions.length > 0) {
                const optionsToInsert = pollOptions.map((text, i) => ({
                    post_id: post.id,
                    text,
                    sort_order: i,
                }));

                const { error: optionsError } = await supabase
                    .from('poll_options')
                    .insert(optionsToInsert);

                if (optionsError) throw optionsError;
            }

            // Refresh posts
            await get().fetchPosts(householdId);
        } catch (error: any) {
            console.error('Error creating post:', error);
            set({ error: error.message });
        }
    },

    togglePin: async (postId: string) => {
        const post = get().posts.find(p => p.id === postId);
        if (!post) return;

        try {
            const { error } = await supabase
                .from('board_posts')
                .update({ is_pinned: !post.isPinned })
                .eq('id', postId);

            if (error) throw error;

            // Update local state
            set(state => ({
                posts: state.posts.map(p =>
                    p.id === postId ? { ...p, isPinned: !p.isPinned } : p
                ).sort((a, b) => {
                    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                    return b.createdAt.getTime() - a.createdAt.getTime();
                })
            }));
        } catch (error: any) {
            console.error('Error toggling pin:', error);
            set({ error: error.message });
        }
    },

    vote: async (postId: string, optionId: string, userId: string) => {
        const post = get().posts.find(p => p.id === postId);
        if (!post) return;

        try {
            // Check if user already voted
            const previousVote = post.userVotedOptionId;

            if (previousVote) {
                // Delete old vote
                await supabase
                    .from('poll_votes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);
            }

            // Insert new vote (if not clicking same option)
            if (previousVote !== optionId) {
                const { error } = await supabase
                    .from('poll_votes')
                    .insert({ post_id: postId, option_id: optionId, user_id: userId });

                if (error) throw error;
            }

            // Update local state
            set(state => ({
                posts: state.posts.map(p => {
                    if (p.id !== postId) return p;
                    return {
                        ...p,
                        userVotedOptionId: previousVote === optionId ? undefined : optionId,
                        pollOptions: p.pollOptions?.map(opt => {
                            let votes = opt.votes;
                            if (opt.id === previousVote) votes--;
                            if (opt.id === optionId && previousVote !== optionId) votes++;
                            return { ...opt, votes };
                        })
                    };
                })
            }));
        } catch (error: any) {
            console.error('Error voting:', error);
            set({ error: error.message });
        }
    },

    toggleReaction: async (postId: string, userId: string, emoji: string) => {
        const userReactions = get().userReactions[postId] || [];
        const hasReacted = userReactions.includes(emoji);

        try {
            if (hasReacted) {
                // Remove reaction
                await supabase
                    .from('post_reactions')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId)
                    .eq('emoji', emoji);
            } else {
                // Add reaction
                await supabase
                    .from('post_reactions')
                    .insert({ post_id: postId, user_id: userId, emoji });
            }

            // Update local state
            set(state => {
                const newUserReactions = { ...state.userReactions };
                if (hasReacted) {
                    newUserReactions[postId] = (newUserReactions[postId] || []).filter(e => e !== emoji);
                } else {
                    newUserReactions[postId] = [...(newUserReactions[postId] || []), emoji];
                }

                return {
                    userReactions: newUserReactions,
                    posts: state.posts.map(p => {
                        if (p.id !== postId) return p;
                        const existingReaction = p.reactions.find(r => r.emoji === emoji);
                        let newReactions;
                        if (hasReacted) {
                            if (existingReaction && existingReaction.count > 1) {
                                newReactions = p.reactions.map(r =>
                                    r.emoji === emoji ? { ...r, count: r.count - 1 } : r
                                );
                            } else {
                                newReactions = p.reactions.filter(r => r.emoji !== emoji);
                            }
                        } else {
                            if (existingReaction) {
                                newReactions = p.reactions.map(r =>
                                    r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                                );
                            } else {
                                newReactions = [...p.reactions, { emoji, count: 1 }];
                            }
                        }
                        return { ...p, reactions: newReactions };
                    })
                };
            });
        } catch (error: any) {
            console.error('Error toggling reaction:', error);
            set({ error: error.message });
        }
    },
}));
