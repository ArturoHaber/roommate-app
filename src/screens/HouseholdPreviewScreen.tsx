import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface HouseholdPreviewScreenProps {
    householdName: string;
    householdEmoji: string;
    memberCount?: number;
    memberNames?: string[];
    onContinue: () => void;
    onBack: () => void;
}

export const HouseholdPreviewScreen: React.FC<HouseholdPreviewScreenProps> = ({
    householdName,
    householdEmoji = '🏠',
    memberCount = 0,
    memberNames = [],
    onContinue,
    onBack,
}) => {
    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#020617', '#0F172A', '#020617']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Ambient glows */}
            <View style={styles.glowOrb1} />
            <View style={styles.glowOrb2} />

            <SafeAreaView style={styles.safeArea}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Feather name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerLabel}>You're invited to join</Text>
                    </View>

                    {/* Household Card */}
                    <View style={styles.householdCard}>
                        <LinearGradient
                            colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        />
                        {/* Glow overlay */}
                        <LinearGradient
                            colors={['rgba(129, 140, 248, 0.15)', 'transparent', 'rgba(45, 212, 191, 0.1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGlow}
                        />
                        <View style={styles.cardBorder} />

                        {/* Emoji */}
                        <View style={styles.emojiContainer}>
                            <LinearGradient
                                colors={['rgba(129, 140, 248, 0.2)', 'rgba(99, 102, 241, 0.1)']}
                                style={styles.emojiGradient}
                            />
                            <Text style={styles.emoji}>{householdEmoji}</Text>
                        </View>

                        {/* Name */}
                        <Text style={styles.householdName}>{householdName}</Text>

                        {/* Member Info */}
                        {memberCount > 0 && (
                            <View style={styles.membersContainer}>
                                <View style={styles.memberAvatars}>
                                    {[...Array(Math.min(memberCount, 4))].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.memberAvatar,
                                                { marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={
                                                    i === 0 ? ['#818CF8', '#6366F1'] :
                                                        i === 1 ? ['#2DD4BF', '#14B8A6'] :
                                                            i === 2 ? ['#F472B6', '#EC4899'] : ['#FBBF24', '#F59E0B']
                                                }
                                                style={styles.avatarGradient}
                                            >
                                                <Text style={styles.avatarText}>
                                                    {memberNames[i]?.[0]?.toUpperCase() || '?'}
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    ))}
                                    {memberCount > 4 && (
                                        <View style={[styles.memberAvatar, { marginLeft: -8 }]}>
                                            <View style={styles.moreAvatarBg}>
                                                <Text style={styles.moreAvatarText}>+{memberCount - 4}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.membersText}>
                                    {memberCount} {memberCount === 1 ? 'roommate' : 'roommates'} waiting
                                </Text>
                            </View>
                        )}

                        {/* Features preview */}
                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <Feather name="check-square" size={16} color="#2DD4BF" />
                                <Text style={styles.featureText}>Shared chores</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="dollar-sign" size={16} color="#2DD4BF" />
                                <Text style={styles.featureText}>Split expenses</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="message-circle" size={16} color="#2DD4BF" />
                                <Text style={styles.featureText}>House board</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={onContinue}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#818CF8', '#6366F1', '#2DD4BF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButtonGradient}
                        >
                            <Text style={styles.continueButtonText}>Join Household</Text>
                            <Feather name="arrow-right" size={20} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    safeArea: {
        flex: 1,
    },

    // Ambient glows
    glowOrb1: {
        position: 'absolute',
        top: height * 0.2,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
    },
    glowOrb2: {
        position: 'absolute',
        bottom: height * 0.25,
        left: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(129, 140, 248, 0.08)',
    },

    // Back Button
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        marginLeft: SPACING.lg,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    headerLabel: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
    },

    // Household Card
    householdCard: {
        borderRadius: BORDER_RADIUS.xl + 4,
        overflow: 'hidden',
        padding: SPACING.xl * 1.5,
        alignItems: 'center',
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 8,
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardGlow: {
        ...StyleSheet.absoluteFillObject,
    },
    cardBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.xl + 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiContainer: {
        width: 88,
        height: 88,
        borderRadius: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emojiGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    emoji: {
        fontSize: 48,
    },
    householdName: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },

    // Members
    membersContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    memberAvatars: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    avatarGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
    moreAvatarBg: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreAvatarText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.white,
    },
    membersText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
    },

    // Features
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    featureText: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.7)',
    },

    // Bottom Section
    bottomSection: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl * 1.5,
    },
    continueButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    continueButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.white,
    },
});

export default HouseholdPreviewScreen;
