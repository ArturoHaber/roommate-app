import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { ChoreTemplate } from './ChoresStarterScreen';

interface ConfirmationPreviewScreenProps {
    houseName: string;
    houseEmoji: string;
    selectedChores: ChoreTemplate[];
    onBack: () => void;
    onGetStarted: () => void;
}

export const ConfirmationPreviewScreen: React.FC<ConfirmationPreviewScreenProps> = ({
    houseName,
    houseEmoji,
    selectedChores,
    onBack,
    onGetStarted,
}) => {
    const sharedChores = selectedChores.filter(c => !c.isPersonal);
    const personalChores = selectedChores.filter(c => c.isPersonal);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, styles.progressDotComplete]} />
                    <View style={[styles.progressDot, styles.progressDotComplete]} />
                    <View style={[styles.progressDot, styles.progressDotComplete]} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Success Icon */}
                <View style={styles.successIcon}>
                    <LinearGradient
                        colors={[COLORS.success + '30', COLORS.success + '10']}
                        style={styles.successGradient}
                    >
                        <Feather name="check" size={40} color={COLORS.success} />
                    </LinearGradient>
                </View>

                <Text style={styles.title}>You're All Set! 🎉</Text>
                <Text style={styles.subtitle}>
                    Here's your house at a glance
                </Text>

                {/* House Card */}
                <View style={styles.houseCard}>
                    <View style={styles.houseCardHeader}>
                        <View style={styles.houseEmojiContainer}>
                            <Text style={styles.houseEmoji}>{houseEmoji}</Text>
                        </View>
                        <View style={styles.houseInfo}>
                            <Text style={styles.houseName}>{houseName}</Text>
                            <Text style={styles.houseStatus}>Ready to go</Text>
                        </View>
                        <View style={styles.houseBadge}>
                            <Feather name="home" size={14} color={COLORS.success} />
                        </View>
                    </View>
                </View>

                {/* Chores Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>This Week's Setup</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Feather name="users" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.summaryNumber}>{sharedChores.length}</Text>
                            <Text style={styles.summaryLabel}>Shared Chores</Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning + '20' }]}>
                                <Feather name="user" size={18} color={COLORS.warning} />
                            </View>
                            <Text style={styles.summaryNumber}>{personalChores.length}</Text>
                            <Text style={styles.summaryLabel}>Personal Chores</Text>
                        </View>
                    </View>
                </View>

                {/* Chores List Preview */}
                <View style={styles.choresPreview}>
                    <Text style={styles.choresPreviewTitle}>Your Chores</Text>
                    <View style={styles.choresList}>
                        {selectedChores.slice(0, 5).map((chore) => (
                            <View key={chore.id} style={styles.choreItem}>
                                <Text style={styles.choreItemIcon}>{chore.icon}</Text>
                                <Text style={styles.choreItemName}>{chore.name}</Text>
                                {chore.isPersonal && (
                                    <View style={styles.personalTag}>
                                        <Text style={styles.personalTagText}>Personal</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {selectedChores.length > 5 && (
                            <Text style={styles.moreChores}>
                                +{selectedChores.length - 5} more
                            </Text>
                        )}
                    </View>
                </View>

                {/* What's Next Info */}
                <View style={styles.infoBox}>
                    <Feather name="info" size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                        Chores will rotate automatically as roommates join. Invite them anytime from Settings!
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.getStartedButton} onPress={onGetStarted}>
                    <LinearGradient
                        colors={[COLORS.primary, '#7C3AED']}
                        style={styles.getStartedGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.getStartedText}>Get Started</Text>
                        <Feather name="arrow-right" size={20} color="#FFF" />
                    </LinearGradient>
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        paddingBottom: SPACING.xl,
    },
    successIcon: {
        marginBottom: SPACING.lg,
    },
    successGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
    houseCard: {
        width: '100%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
        marginBottom: SPACING.lg,
    },
    houseCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    houseEmojiContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    houseEmoji: {
        fontSize: 28,
    },
    houseInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    houseName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    houseStatus: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        marginTop: 2,
    },
    houseBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        width: '100%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    summaryTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    summaryNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    summaryLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 50,
        backgroundColor: COLORS.gray700,
    },
    choresPreview: {
        width: '100%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    choresPreviewTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    choresList: {
        gap: SPACING.sm,
    },
    choreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    choreItemIcon: {
        fontSize: 18,
    },
    choreItemName: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
    },
    personalTag: {
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    personalTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.warning,
    },
    moreChores: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary + '10',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    footer: {
        padding: SPACING.lg,
    },
    getStartedButton: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    getStartedGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    getStartedText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
});
