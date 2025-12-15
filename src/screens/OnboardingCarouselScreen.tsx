import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    FlatList,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Onboarding slide data
interface OnboardingSlide {
    id: string;
    headline: string;
    subheadline: string;
    image?: any; // Optional: will be added later
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        headline: 'No More "Can You\nDo the Dishes?"',
        subheadline: 'Stop keeping mental score of who did what.\nLet the system handle reminders, not you.',
        image: null, // Placeholder for now
    },
    {
        id: '2',
        headline: 'No More Nagging.\nNo More Guessing.',
        subheadline: 'Chores and reminders are assigned automatically.\nEveryone knows what they owe, and when.',
        image: null,
    },
    {
        id: '3',
        headline: 'One Dashboard for\nYour Entire Home',
        subheadline: 'Track chores, expenses, and house health\nin one place.',
        image: null,
    },
];

interface OnboardingCarouselScreenProps {
    onComplete: () => void;
    onLogin: () => void;
}

export const OnboardingCarouselScreen: React.FC<OnboardingCarouselScreenProps> = ({ onComplete, onLogin }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            onComplete();
        }
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
        <View style={styles.slide}>
            {/* Headline */}
            <Text style={styles.headline}>{item.headline}</Text>

            {/* Subheadline */}
            <Text style={styles.subheadline}>{item.subheadline}</Text>

            {/* Illustration Container (Glassmorphic Card) */}
            <View style={styles.illustrationWrapper}>
                <View style={styles.illustrationCard}>
                    <LinearGradient
                        colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    />
                    {/* Subtle glow overlay */}
                    <LinearGradient
                        colors={['rgba(129, 140, 248, 0.1)', 'transparent', 'rgba(45, 212, 191, 0.08)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGlow}
                    />
                    {/* Glass border */}
                    <View style={styles.cardBorder} />

                    {/* Image placeholder or actual image */}
                    {item.image ? (
                        <Image
                            source={item.image}
                            style={styles.illustrationImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>Illustration {index + 1}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={['#020617', '#0F172A', '#020617']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                bounces={false}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Bottom Section */}
            <SafeAreaView style={styles.bottomSection}>
                {/* Page Indicator Dots */}
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Primary Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.9}
                    style={styles.buttonWrapper}
                >
                    <LinearGradient
                        colors={['#818CF8', '#6366F1', '#2DD4BF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.buttonText}>
                            {isLastSlide ? 'Get Started' : 'Next'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Log In Link */}
                <TouchableOpacity
                    onPress={onLogin}
                    style={styles.loginLink}
                    activeOpacity={0.7}
                >
                    <Text style={styles.loginText}>
                        Already have an account? <Text style={styles.loginTextHighlight}>Log in</Text>
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    slide: {
        width: width,
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: height * 0.1,
    },
    headline: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: SPACING.lg,
    },
    subheadline: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl * 1.5,
    },
    illustrationWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxHeight: height * 0.4,
    },
    illustrationCard: {
        width: width - 48,
        aspectRatio: 1,
        maxHeight: height * 0.38,
        borderRadius: BORDER_RADIUS.xl + 4,
        overflow: 'hidden',
        position: 'relative',
        // Soft glow shadow
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
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
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    imagePlaceholder: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: '500',
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    dotActive: {
        backgroundColor: COLORS.white,
        width: 24,
    },
    buttonWrapper: {
        width: '100%',
        maxWidth: 340,
    },
    primaryButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        // Button glow
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.white,
        letterSpacing: 0.3,
    },
    loginLink: {
        marginTop: SPACING.lg,
        padding: SPACING.sm,
    },
    loginText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    loginTextHighlight: {
        color: COLORS.primaryLight,
        fontWeight: '600',
    },
});

export default OnboardingCarouselScreen;
