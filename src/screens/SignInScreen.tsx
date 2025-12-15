import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { AuthOptions, EmailAuthForm } from '../components';

const { width, height } = Dimensions.get('window');

type AuthMode = 'options' | 'email-signup' | 'email-signin';

interface SignInScreenProps {
    householdName?: string; // Name of household being created/joined
    householdEmoji?: string;
    isJoining?: boolean; // True if joining existing household
    onSignIn: (method: 'google' | 'apple' | 'email', email?: string, password?: string) => Promise<void>;
    onBack: () => void;
    onGuestSignIn: () => Promise<void>;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
    householdName,
    householdEmoji = '🏠',
    isJoining = false,
    onSignIn,
    onBack,
    onGuestSignIn,
}) => {
    const [authMode, setAuthMode] = useState<AuthMode>('options');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGuestSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onGuestSignIn();
        } catch (e: any) {
            setError(e.message || 'Guest sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = async (method: 'google' | 'apple') => {
        setIsLoading(true);
        setError(null);
        try {
            await onSignIn(method);
        } catch (e: any) {
            setError(e.message || 'Sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await onSignIn('email', email, password);
        } catch (e: any) {
            setError(e.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

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
            <View style={styles.glowOrb3} />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Feather name="arrow-left" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header with Household Info */}
                        <View style={styles.headerContainer}>
                            {/* Household Badge */}
                            {householdName && (
                                <View style={styles.householdBadge}>
                                    <LinearGradient
                                        colors={['rgba(129, 140, 248, 0.2)', 'rgba(99, 102, 241, 0.1)']}
                                        style={styles.householdBadgeGradient}
                                    />
                                    <View style={styles.householdBadgeBorder} />
                                    <Text style={styles.householdEmoji}>{householdEmoji}</Text>
                                    <Text style={styles.householdBadgeName}>{householdName}</Text>
                                </View>
                            )}

                            {/* Title */}
                            <Text style={styles.title}>
                                {isJoining ? 'Join Your Roommates' : 'Almost There!'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {isJoining
                                    ? 'Sign in to join this household'
                                    : 'Sign in to create your household'}
                            </Text>
                        </View>

                        {/* Auth Content */}
                        {authMode === 'options' ? (
                            <View style={styles.authOptionsContainer}>
                                {/* Guest Button (Prominent) */}
                                <TouchableOpacity
                                    style={styles.guestButton}
                                    onPress={handleGuestSignIn}
                                    disabled={isLoading}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                                        style={styles.guestButtonGradient}
                                    >
                                        <Feather name="user" size={20} color={COLORS.white} />
                                        <Text style={styles.guestButtonText}>Continue as Guest</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>or sign in with</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <AuthOptions
                                    onGoogleSignIn={() => handleOAuthSignIn('google')}
                                    onAppleSignIn={() => handleOAuthSignIn('apple')}
                                    onEmailSignIn={() => setAuthMode('email-signup')}
                                    isLoading={isLoading}
                                />
                            </View>
                        ) : (
                            <EmailAuthForm
                                mode={authMode === 'email-signin' ? 'signin' : 'signup'}
                                onSubmit={(email, password, name) => {
                                    if (authMode === 'email-signup' && name) {
                                        // TODO: Pass name to onSignIn if supported, or update profile later
                                        // For now we just pass email/password as per interface
                                    }
                                    handleEmailAuth(email, password); // Modified to take args
                                }}
                                isLoading={isLoading}
                                error={error}
                                onToggleMode={() => setAuthMode(authMode === 'email-signup' ? 'email-signin' : 'email-signup')}
                                onBack={() => setAuthMode('options')}
                            />
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.footerLink}>Terms</Text> and{' '}
                            <Text style={styles.footerLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#818CF8" />
                        <Text style={styles.loadingText}>Signing in...</Text>
                    </View>
                </View>
            )}
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
    },

    // Ambient glows
    glowOrb1: {
        position: 'absolute',
        top: height * 0.1,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(129, 140, 248, 0.12)',
    },
    glowOrb2: {
        position: 'absolute',
        top: height * 0.4,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(45, 212, 191, 0.08)',
    },
    glowOrb3: {
        position: 'absolute',
        bottom: height * 0.15,
        left: width * 0.3,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
        marginBottom: SPACING.md,
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl * 2,
    },
    householdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 2,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.xl,
        overflow: 'hidden',
    },
    householdBadgeGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    householdBadgeBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: 'rgba(129, 140, 248, 0.3)',
    },
    householdEmoji: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    householdBadgeName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
    },

    // Auth Options
    authOptionsContainer: {
        gap: SPACING.md,
    },

    // Google Button - White background
    googleButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    googleButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    googleIconWrapper: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleIconBlue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4285F4',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },

    // Apple Button - Solid black
    appleButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#000000',
        overflow: 'hidden',
    },
    appleButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    appleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: SPACING.md,
    },

    // Email Button
    emailButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emailButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    emailButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Guest Button
    guestButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    guestButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    guestButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },

    // Email Form
    emailFormContainer: {
        gap: SPACING.md,
    },
    inputWrapper: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    inputIconContainer: {
        width: 48,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.white,
        paddingRight: SPACING.md,
    },
    eyeButton: {
        width: 48,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailSubmitButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginTop: SPACING.sm,
    },
    emailSubmitGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailSubmitText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    switchModeButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    switchModeText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    backToOptionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    backToOptionsText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },

    // Error
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    errorText: {
        fontSize: 14,
        color: '#F87171',
    },

    // Footer
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: 'rgba(129, 140, 248, 0.8)',
    },

    // Loading Overlay
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        paddingHorizontal: SPACING.xl * 2,
        paddingVertical: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        gap: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.white,
    },
});


