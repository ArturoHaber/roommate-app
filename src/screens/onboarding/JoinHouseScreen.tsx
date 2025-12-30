import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { useHouseholdStore } from '../../stores/useHouseholdStore';

interface JoinHouseScreenProps {
    onBack: () => void;
    onJoinSuccess: (householdData: { name: string; emoji: string; memberCount?: number; memberPreviews?: any[] }, inviteCode: string) => void;
}

export const JoinHouseScreen: React.FC<JoinHouseScreenProps> = ({
    onBack,
    onJoinSuccess,
}) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { validateInvite, joinHousehold } = useHouseholdStore();

    const handleCodeChange = (text: string) => {
        // Auto-uppercase and limit to 6 characters
        const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        setCode(formatted);
        setError(null);
    };

    const handleJoin = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-character code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Validate the code first
            const household = await validateInvite(code);

            if (!household) {
                setError('Invalid or expired invite code');
                setIsLoading(false);
                return;
            }

            // Pass household data back so App.tsx can store it as pendingHousehold
            onJoinSuccess({
                name: household.name,
                emoji: household.emoji,
                memberCount: household.member_count,
                memberPreviews: household.member_previews,
            }, code);
        } catch (err: any) {
            console.error('Join error:', err);
            setError(err.message || 'Failed to join. Check your code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteLink = async () => {
        // In a real app, we'd handle deep links and clipboard
        Alert.alert('Coming Soon', 'Paste from link will be supported soon!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Join a House</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.illustration}>
                        <Text style={styles.illustrationEmoji}>🔑</Text>
                    </View>

                    <Text style={styles.title}>Enter Invite Code</Text>
                    <Text style={styles.subtitle}>
                        Ask your roommate for the 6-character code
                    </Text>

                    {/* Code Input */}
                    <View style={styles.codeInputContainer}>
                        <TextInput
                            style={[styles.codeInput, error && styles.codeInputError]}
                            value={code}
                            onChangeText={handleCodeChange}
                            placeholder="XXXXXX"
                            placeholderTextColor={COLORS.gray600}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={6}
                            autoFocus
                        />
                        {error && (
                            <View style={styles.errorContainer}>
                                <Feather name="alert-circle" size={14} color={COLORS.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>

                    {/* Or paste link */}
                    <TouchableOpacity style={styles.pasteLink} onPress={handlePasteLink}>
                        <Feather name="link" size={16} color={COLORS.textTertiary} />
                        <Text style={styles.pasteLinkText}>Or paste an invite link</Text>
                    </TouchableOpacity>
                </View>

                {/* Join Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            code.length < 6 && styles.joinButtonDisabled,
                        ]}
                        onPress={handleJoin}
                        disabled={code.length < 6 || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.joinButtonText}>Join House</Text>
                                <Feather name="arrow-right" size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        paddingTop: SPACING.xl,
    },
    illustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    illustrationEmoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    codeInputContainer: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    codeInput: {
        backgroundColor: COLORS.gray900,
        borderWidth: 2,
        borderColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary,
        textAlign: 'center',
        letterSpacing: 8,
    },
    codeInputError: {
        borderColor: COLORS.error,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    errorText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
    },
    pasteLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.md,
    },
    pasteLinkText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },
    footer: {
        padding: SPACING.lg,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
    },
    joinButtonDisabled: {
        backgroundColor: COLORS.gray700,
    },
    joinButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
});
