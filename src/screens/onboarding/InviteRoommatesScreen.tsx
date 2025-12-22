import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Share,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface InviteRoommatesScreenProps {
    inviteCode: string;
    houseName: string;
    onBack: () => void;
    onContinue: () => void;
    onSkip: () => void;
}

export const InviteRoommatesScreen: React.FC<InviteRoommatesScreenProps> = ({
    inviteCode,
    houseName,
    onBack,
    onContinue,
    onSkip,
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join "${houseName}" on CribUp! Use code: ${inviteCode}\n\nDownload the app: https://cribup.app`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, styles.progressDotComplete]} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
                <TouchableOpacity onPress={onSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.illustration}>
                    <Text style={styles.illustrationEmoji}>👋</Text>
                </View>

                <Text style={styles.title}>Invite Your Roommates</Text>
                <Text style={styles.subtitle}>
                    Share this code so they can join {houseName}
                </Text>

                {/* Code Display */}
                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Invite Code</Text>
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{inviteCode}</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopyCode}
                        >
                            <Feather
                                name={copied ? 'check' : 'copy'}
                                size={20}
                                color={copied ? COLORS.success : COLORS.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                    {copied && (
                        <Text style={styles.copiedText}>Copied!</Text>
                    )}
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Feather name="share" size={20} color={COLORS.primary} />
                    <Text style={styles.shareButtonText}>Share Invite</Text>
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Feather name="info" size={16} color={COLORS.textTertiary} />
                    <Text style={styles.infoText}>
                        Don't worry, you can always invite more people later from Settings
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
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
    progressContainer: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray700,
    },
    progressDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
    progressDotComplete: {
        backgroundColor: COLORS.success,
    },
    skipText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        paddingTop: SPACING.lg,
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
    codeContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    codeLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        marginBottom: SPACING.sm,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderWidth: 2,
        borderColor: COLORS.primary + '40',
    },
    codeText: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: 6,
        marginRight: SPACING.md,
    },
    copyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    copiedText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        marginTop: SPACING.sm,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.primary + '15',
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
        marginBottom: SPACING.xl,
    },
    shareButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        lineHeight: 20,
    },
    footer: {
        padding: SPACING.lg,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
    },
    continueButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
});
