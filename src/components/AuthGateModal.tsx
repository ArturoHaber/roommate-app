import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthOptions } from './auth/AuthOptions';

type GateAction = 'invite' | 'nudge' | 'expense' | 'settings';

interface AuthGateModalProps {
    visible: boolean;
    onClose: () => void;
    action: GateAction;
}

const ACTION_MESSAGES: Record<GateAction, { title: string; subtitle: string; icon: string }> = {
    invite: {
        title: 'Invite Your Roommates',
        subtitle: 'Create an account to send invite links and build your household together',
        icon: 'users',
    },
    nudge: {
        title: 'Send a Nudge',
        subtitle: 'Sign in so your roommates know who sent the friendly reminder',
        icon: 'bell',
    },
    expense: {
        title: 'Track Expenses',
        subtitle: 'Create an account to split bills and track who owes what',
        icon: 'dollar-sign',
    },
    settings: {
        title: 'Personalize Your Profile',
        subtitle: 'Sign in to save your settings and sync across devices',
        icon: 'settings',
    },
};

export const AuthGateModal = ({ visible, onClose, action }: AuthGateModalProps) => {
    const { linkAccount, signInWithOAuthGoogle, signInWithOAuthApple, isLoading, error, clearError } = useAuthStore();

    const [mode, setMode] = useState<'options' | 'email'>('options');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const actionInfo = ACTION_MESSAGES[action];

    const handleEmailSignUp = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) return;

        // Try to link existing anonymous account first
        const success = await linkAccount(email, password, name);
        if (success) {
            onClose();
        }
    };

    const handleGoogleSignIn = async () => {
        const success = await signInWithOAuthGoogle();
        if (success) onClose();
    };

    const handleAppleSignIn = async () => {
        const success = await signInWithOAuthApple();
        if (success) onClose();
    };

    const handleClose = () => {
        setMode('options');
        setName('');
        setEmail('');
        setPassword('');
        clearError();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Gradient Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Feather name="x" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Feather name={actionInfo.icon as any} size={48} color={COLORS.white} />
                    </View>

                    <Text style={styles.title}>{actionInfo.title}</Text>
                    <Text style={styles.subtitle}>{actionInfo.subtitle}</Text>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {mode === 'options' ? (
                        <>
                            {/* Sign In Benefits */}
                            <View style={styles.benefitsCard}>
                                <Text style={styles.benefitsTitle}>Why create an account?</Text>
                                <View style={styles.benefitRow}>
                                    <Feather name="check-circle" size={18} color={COLORS.success} />
                                    <Text style={styles.benefitText}>Sync across all your devices</Text>
                                </View>
                                <View style={styles.benefitRow}>
                                    <Feather name="check-circle" size={18} color={COLORS.success} />
                                    <Text style={styles.benefitText}>Connect with your roommates</Text>
                                </View>
                                <View style={styles.benefitRow}>
                                    <Feather name="check-circle" size={18} color={COLORS.success} />
                                    <Text style={styles.benefitText}>Never lose your data</Text>
                                </View>
                            </View>

                            {/* Use existing polished AuthOptions component */}
                            <AuthOptions
                                onGoogleSignIn={handleGoogleSignIn}
                                onAppleSignIn={handleAppleSignIn}
                                onEmailSignIn={() => setMode('email')}
                                isLoading={isLoading}
                            />
                        </>
                    ) : (
                        <>
                            {/* Email Form */}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setMode('options')}
                            >
                                <Feather name="arrow-left" size={20} color={COLORS.textSecondary} />
                                <Text style={styles.backButtonText}>Back to options</Text>
                            </TouchableOpacity>

                            <View style={styles.form}>
                                <Text style={styles.inputLabel}>Your Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="What should we call you?"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />

                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                {error && (
                                    <View style={styles.errorContainer}>
                                        <Feather name="alert-circle" size={16} color={COLORS.error} />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (!name.trim() || !email.trim() || !password.trim()) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleEmailSignUp}
                                    disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Create Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Continue browsing link */}
                    <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
                        <Text style={styles.skipText}>Continue browsing</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// Helper hook to check if user is anonymous
export const useIsAnonymous = () => {
    const { user, isAuthenticated } = useAuthStore();
    return isAuthenticated && (!user?.email || user.email === '');
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
    },
    benefitsCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    benefitsTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    benefitText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    oauthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.gray900,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    oauthButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray800,
    },
    dividerText: {
        marginHorizontal: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
    },
    emailButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    backButtonText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    form: {
        gap: SPACING.sm,
    },
    inputLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
        marginBottom: 4,
    },
    input: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.error + '20',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.sm,
    },
    errorText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        flex: 1,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        marginTop: SPACING.md,
    },
    skipText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        textDecorationLine: 'underline',
    },
});
