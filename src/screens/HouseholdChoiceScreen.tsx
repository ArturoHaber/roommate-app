import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface HouseholdChoiceScreenProps {
    onCreateHousehold: () => void;
    onJoinHousehold: (code: string) => Promise<void>;
}

type ScreenState = 'choice' | 'join';

export const HouseholdChoiceScreen: React.FC<HouseholdChoiceScreenProps> = ({
    onCreateHousehold,
    onJoinHousehold,
}) => {
    const [screenState, setScreenState] = useState<ScreenState>('choice');
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoinSubmit = async () => {
        if (inviteCode.trim().length > 0) {
            setIsLoading(true);
            setError(null);
            try {
                await onJoinHousehold(inviteCode.trim().toUpperCase());
            } catch (err: any) {
                setError(err.message || 'Invalid invite code');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (screenState === 'join') {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#020617', '#0F172A', '#020617']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFillObject}
                />

                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setScreenState('choice')}
                        >
                            <Feather name="arrow-left" size={24} color={COLORS.white} />
                        </TouchableOpacity>

                        <View style={styles.joinContent}>
                            {/* Icon */}
                            <View style={styles.joinIconWrapper}>
                                <LinearGradient
                                    colors={['rgba(45, 212, 191, 0.2)', 'rgba(129, 140, 248, 0.2)']}
                                    style={styles.joinIconGradient}
                                >
                                    <Feather name="link" size={32} color="#2DD4BF" />
                                </LinearGradient>
                            </View>

                            {/* Title */}
                            <Text style={styles.joinTitle}>Join a Household</Text>
                            <Text style={styles.joinSubtitle}>
                                Enter the invite code your roommate shared with you
                            </Text>

                            {/* Code Input */}
                            <View style={[styles.codeInputWrapper, error ? { marginBottom: SPACING.sm } : {}]}>
                                <LinearGradient
                                    colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']}
                                    style={styles.codeInputGradient}
                                />
                                <View style={[styles.codeInputBorder, error ? { borderColor: '#F87171' } : {}]} />
                                <TextInput
                                    style={styles.codeInput}
                                    placeholder="XXXX-XXXX"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    value={inviteCode}
                                    onChangeText={(text) => {
                                        setInviteCode(text);
                                        if (error) setError(null);
                                    }}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    maxLength={12}
                                />
                            </View>

                            {/* Error Message */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Feather name="alert-circle" size={14} color="#F87171" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Join Button */}
                            <TouchableOpacity
                                style={[
                                    styles.joinButton,
                                    (inviteCode.length < 4 || isLoading) && styles.joinButtonDisabled
                                ]}
                                onPress={handleJoinSubmit}
                                disabled={inviteCode.length < 4 || isLoading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={inviteCode.length >= 4 && !isLoading
                                        ? ['#2DD4BF', '#14B8A6']
                                        : ['rgba(45, 212, 191, 0.3)', 'rgba(20, 184, 166, 0.3)']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.joinButtonGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={[
                                            styles.joinButtonText,
                                            inviteCode.length < 4 && styles.joinButtonTextDisabled
                                        ]}>
                                            Join Household
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#020617', '#0F172A', '#020617']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Ambient glow effects */}
            <View style={styles.glowOrb1} />
            <View style={styles.glowOrb2} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.welcomeText}>Welcome to</Text>
                        <Text style={styles.appName}>CribUp</Text>
                        <Text style={styles.subtitle}>
                            Let's get your household set up
                        </Text>
                    </View>

                    {/* Choice Cards */}
                    <View style={styles.cardsContainer}>

                        {/* Create New Household Card */}
                        <TouchableOpacity
                            style={styles.choiceCard}
                            onPress={onCreateHousehold}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.85)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            />
                            {/* Top glow */}
                            <LinearGradient
                                colors={['rgba(129, 140, 248, 0.15)', 'transparent']}
                                style={styles.cardTopGlow}
                            />
                            <View style={styles.cardBorder} />

                            <View style={styles.cardContent}>
                                {/* Icon */}
                                <View style={styles.iconWrapper}>
                                    <LinearGradient
                                        colors={['#818CF8', '#6366F1']}
                                        style={styles.iconGradient}
                                    >
                                        <Feather name="home" size={28} color={COLORS.white} />
                                    </LinearGradient>
                                </View>

                                {/* Text */}
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Create New Household</Text>
                                    <Text style={styles.cardDescription}>
                                        Start fresh and invite your roommates to join
                                    </Text>
                                </View>

                                {/* Arrow */}
                                <View style={styles.arrowWrapper}>
                                    <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.5)" />
                                </View>
                            </View>

                            {/* Recommended badge */}
                            <View style={styles.recommendedBadge}>
                                <LinearGradient
                                    colors={['#818CF8', '#6366F1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.badgeGradient}
                                >
                                    <Text style={styles.badgeText}>Recommended</Text>
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Join Existing Household Card */}
                        <TouchableOpacity
                            style={styles.choiceCard}
                            onPress={() => setScreenState('join')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.75)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            />
                            <View style={styles.cardBorder} />

                            <View style={styles.cardContent}>
                                {/* Icon */}
                                <View style={styles.iconWrapper}>
                                    <View style={styles.iconOutline}>
                                        <Feather name="link" size={24} color="#2DD4BF" />
                                    </View>
                                </View>

                                {/* Text */}
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Join Existing Household</Text>
                                    <Text style={styles.cardDescription}>
                                        Have an invite code? Enter it here
                                    </Text>
                                </View>

                                {/* Arrow */}
                                <View style={styles.arrowWrapper}>
                                    <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.4)" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            You can always change this later in settings
                        </Text>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: height * 0.08,
        paddingBottom: SPACING.xl * 2,
    },
    keyboardView: {
        flex: 1,
    },

    // Ambient glows
    glowOrb1: {
        position: 'absolute',
        top: height * 0.15,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(129, 140, 248, 0.08)',
    },
    glowOrb2: {
        position: 'absolute',
        bottom: height * 0.2,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(45, 212, 191, 0.06)',
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl * 2,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 4,
    },
    appName: {
        fontSize: 42,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: -1,
        marginBottom: SPACING.md,
    },
    subtitle: {
        fontSize: 17,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
    },

    // Cards Container
    cardsContainer: {
        flex: 1,
        justifyContent: 'center',
    },

    // Choice Card
    choiceCard: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        position: 'relative',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardTopGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    cardBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg + 4,
        gap: SPACING.md,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    iconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconOutline: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(45, 212, 191, 0.4)',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: 20,
    },
    arrowWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Recommended Badge
    recommendedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    badgeGradient: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.white,
        letterSpacing: 0.3,
    },

    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: SPACING.md,
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: SPACING.xl * 2,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.35)',
    },

    // Join Screen
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginLeft: SPACING.lg,
    },
    joinContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl * 3,
    },
    joinIconWrapper: {
        marginBottom: SPACING.xl,
    },
    joinIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    joinSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginBottom: SPACING.xl * 1.5,
        lineHeight: 24,
    },
    codeInputWrapper: {
        width: '100%',
        height: 64,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
        position: 'relative',
        zIndex: 10, // Ensure input receives touches
    },
    codeInputGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    codeInputBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    codeInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: 4,
        zIndex: 10,
        elevation: 10,
    },
    joinButton: {
        width: '100%',
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
    },
    joinButtonDisabled: {
        opacity: 0.6,
    },
    joinButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.white,
    },
    joinButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    errorText: {
        fontSize: 14,
        color: '#F87171',
    },
});

export default HouseholdChoiceScreen;
