import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Modal,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
    onCreateHouse: () => void;
    onJoinHouse: () => void;
}

// Optional "How it works" slides
const HOW_IT_WORKS_SLIDES = [
    {
        emoji: '🏠',
        title: 'Create Your House',
        description: 'Set up your shared space in under 2 minutes. Pick your chores, invite your roommates.',
    },
    {
        emoji: '✅',
        title: 'Fair Chore Rotation',
        description: 'Chores rotate automatically. Everyone does their part, no awkward conversations.',
    },
    {
        emoji: '🔔',
        title: 'Gentle Nudges',
        description: 'Send fun reminders when someone forgets. Keep the peace, keep it clean.',
    },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    onCreateHouse,
    onJoinHouse,
}) => {
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, '#0F172A', COLORS.background]}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Logo & Branding */}
                <View style={styles.brandingSection}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>🏠</Text>
                        <View style={styles.logoGlow} />
                    </View>
                    <Text style={styles.appName}>CribUp</Text>
                    <Text style={styles.tagline}>Roommate life, simplified</Text>
                </View>

                {/* CTAs */}
                <View style={styles.ctaSection}>
                    {/* Primary: Create a House */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onCreateHouse}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#7C3AED']}
                            style={styles.primaryButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Feather name="plus" size={20} color="#FFF" />
                            <Text style={styles.primaryButtonText}>Create a House</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Secondary: Join a House */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onJoinHouse}
                        activeOpacity={0.8}
                    >
                        <Feather name="log-in" size={20} color={COLORS.primary} />
                        <Text style={styles.secondaryButtonText}>Join a House</Text>
                    </TouchableOpacity>

                    {/* How it works link */}
                    <TouchableOpacity
                        style={styles.howItWorksLink}
                        onPress={() => setShowHowItWorks(true)}
                    >
                        <Text style={styles.howItWorksText}>How it works</Text>
                        <Feather name="chevron-right" size={14} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* How It Works Modal */}
            <Modal
                visible={showHowItWorks}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowHowItWorks(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowHowItWorks(false)}
                            style={styles.closeButton}
                        >
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>How it works</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Slides */}
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                            setCurrentSlide(index);
                        }}
                        style={styles.slidesContainer}
                    >
                        {HOW_IT_WORKS_SLIDES.map((slide, index) => (
                            <View key={index} style={styles.slide}>
                                <View style={styles.slideEmojiContainer}>
                                    <Text style={styles.slideEmoji}>{slide.emoji}</Text>
                                </View>
                                <Text style={styles.slideTitle}>{slide.title}</Text>
                                <Text style={styles.slideDescription}>{slide.description}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Dots */}
                    <View style={styles.dotsContainer}>
                        {HOW_IT_WORKS_SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentSlide === index && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Got it button */}
                    <TouchableOpacity
                        style={styles.gotItButton}
                        onPress={() => setShowHowItWorks(false)}
                    >
                        <Text style={styles.gotItButtonText}>Got it</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        paddingTop: height * 0.15,
        paddingBottom: SPACING.xl,
    },
    brandingSection: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        position: 'relative',
    },
    logoEmoji: {
        fontSize: 56,
    },
    logoGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.primary,
        opacity: 0.15,
    },
    appName: {
        fontSize: 42,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
    },
    ctaSection: {
        gap: SPACING.md,
    },
    primaryButton: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    primaryButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 2,
        borderColor: COLORS.primary + '40',
        backgroundColor: COLORS.primary + '10',
    },
    secondaryButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.primary,
    },
    howItWorksLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingTop: SPACING.lg,
    },
    howItWorksText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    slidesContainer: {
        flex: 1,
    },
    slide: {
        width: width - 40,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideEmojiContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    slideEmoji: {
        fontSize: 48,
    },
    slideTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    slideDescription: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray700,
    },
    dotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
    gotItButton: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    gotItButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
