import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthOptions, EmailAuthForm } from './';
import { useNativeAppleAuth } from '../hooks/useNativeAppleAuth';

interface LinkAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onDelete: () => void;
}

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({ visible, onClose, onSuccess, onDelete }) => {
    const { linkAccount, signInWithOAuthGoogle, signInWithOAuthApple, isLoading, error, clearError } = useAuthStore();
    const nativeAppleAuth = useNativeAppleAuth();
    const [step, setStep] = useState<'prompt' | 'options' | 'email-form' | 'delete-confirm'>('prompt');

    const handleLink = async (email: string, password: string, name: string) => {
        const success = await linkAccount(email, password, name);
        if (success) {
            onSuccess();
            handleClose();
        }
    };

    const handleOAuthLink = async (method: 'google' | 'apple') => {
        // NOTE: For linking, we ideally use linkIdentity, but for now we might re-use sign in which 
        // might merge accounts if handled by Supabase correctly, or error if conflict.
        // Given current scope, we will try standard OAuth flow. Supabase usually handles linking if email matches.
        try {
            if (method === 'google') {
                await signInWithOAuthGoogle();
            } else if (method === 'apple') {
                // Use native Apple Sign In on iOS, fallback to browser OAuth on web
                if (Platform.OS === 'ios') {
                    await nativeAppleAuth.signIn();
                } else {
                    await signInWithOAuthApple();
                }
            }
            // If successful, we assume linked or signed in
            onSuccess();
            handleClose();
        } catch (e) {
            console.error(e);
        }
    };

    const handleClose = () => {
        setStep('prompt');
        clearError();
        onClose();
    };

    const renderContent = () => {
        if (step === 'prompt') {
            return (
                <>
                    <View style={styles.iconContainer}>
                        <Feather name="save" size={32} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Save Your Progress?</Text>
                    <Text style={styles.message}>
                        You are currently a guest. If you log out now, you will lose access to this household permanently.
                    </Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('options')}>
                        <Text style={styles.primaryButtonText}>Create Account to Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.destructiveGhostButton} onPress={() => setStep('delete-confirm')}>
                        <Text style={styles.destructiveGhostText}>Delete Data & Log Out</Text>
                    </TouchableOpacity>
                </>
            );
        }

        if (step === 'options') {
            return (
                <View>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => setStep('prompt')} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Choose Method</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <AuthOptions
                        onGoogleSignIn={() => handleOAuthLink('google')}
                        onAppleSignIn={() => handleOAuthLink('apple')}
                        onEmailSignIn={() => setStep('email-form')}
                        isLoading={isLoading}
                    />
                </View>
            );
        }

        if (step === 'email-form') {
            return (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Create Account</Text>
                    </View>
                    <EmailAuthForm
                        mode="signup"
                        onSubmit={(email, password, name) => handleLink(email, password, name || 'User')}
                        isLoading={isLoading}
                        error={error}
                        onBack={() => setStep('options')}
                        showNameInput={true}
                    />
                </ScrollView>
            );
        }

        if (step === 'delete-confirm') {
            return (
                <>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.error + '20' }]}>
                        <Feather name="alert-triangle" size={32} color={COLORS.error} />
                    </View>
                    <Text style={styles.title}>Are you sure?</Text>
                    <Text style={styles.message}>
                        This action cannot be undone. All your chores, history, and household data will be permanently deleted.
                    </Text>

                    <TouchableOpacity
                        style={styles.destructiveButton}
                        onPress={onDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? <Text style={styles.destructiveButtonText}>Deleting...</Text> : <Text style={styles.destructiveButtonText}>Yes, Delete Everything</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('prompt')}>
                        <Text style={styles.secondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </>
            );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
                    {renderContent()}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    content: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.lg,
        maxHeight: '90%',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    message: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 22,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
    secondaryButton: {
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        marginBottom: SPACING.sm,
    },
    secondaryButtonText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
    destructiveGhostButton: {
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    destructiveGhostText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        opacity: 0.8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    backButton: {
        padding: SPACING.xs,
    },
    destructiveButton: {
        backgroundColor: COLORS.error,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
        marginTop: SPACING.lg,
    },
    destructiveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FONT_SIZE.md,
    },
});
