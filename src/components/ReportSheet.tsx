import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { QuickActionSheet, ActionButton, SectionLabel } from './QuickActionSheet';
import { Avatar } from './Avatar';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';

interface ReportSheetProps {
    visible: boolean;
    onClose: () => void;
}

interface IssueType {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
}

const ISSUE_TYPES: IssueType[] = [
    { id: 'dishes', emoji: '🍽️', title: 'Dirty Dishes Left', subtitle: 'Someone didn\'t clean up' },
    { id: 'noise', emoji: '🔊', title: 'Noise After Hours', subtitle: 'Too loud too late' },
    { id: 'mess', emoji: '🧹', title: 'Mess in Common Area', subtitle: 'Something needs attention' },
    { id: 'food', emoji: '🍕', title: 'Food Issue', subtitle: 'Missing food or expired items' },
    { id: 'bathroom', emoji: '🚿', title: 'Bathroom Issue', subtitle: 'Needs cleaning or restocking' },
    { id: 'other', emoji: '⚡', title: 'Other Issue', subtitle: 'Something else bothering you' },
];

export const ReportSheet: React.FC<ReportSheetProps> = ({ visible, onClose }) => {
    const { members } = useHouseholdStore();
    const { user } = useAuthStore();
    const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
    const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [step, setStep] = useState<'issue' | 'details'>('issue');
    const [isAnonymous, setIsAnonymous] = useState(true);

    const roommates = user ? members.filter(m => m.id !== user.id) : [];
    const currentIssue = ISSUE_TYPES.find(i => i.id === selectedIssue);

    const handleIssueSelect = (issueId: string) => {
        setSelectedIssue(issueId);
        setStep('details');
    };

    const handleBack = () => {
        setStep('issue');
        setSelectedRoommate(null);
        setNote('');
    };

    const handleReport = () => {
        const issue = ISSUE_TYPES.find(i => i.id === selectedIssue);
        const roommate = roommates.find(r => r.id === selectedRoommate);

        Alert.alert(
            '📤 Report Sent!',
            `${issue?.emoji} ${issue?.title}\n${roommate ? `To: ${roommate.name}` : 'General household report'}\n${isAnonymous ? '(Sent anonymously)' : ''}`
        );

        // Reset state
        setSelectedIssue(null);
        setSelectedRoommate(null);
        setNote('');
        setStep('issue');
        setIsAnonymous(true);
        onClose();
    };

    const handleClose = () => {
        setSelectedIssue(null);
        setSelectedRoommate(null);
        setNote('');
        setStep('issue');
        setIsAnonymous(true);
        onClose();
    };

    return (
        <QuickActionSheet
            visible={visible}
            onClose={handleClose}
            title={step === 'issue' ? 'Quick Report' : `${currentIssue?.emoji} Report`}
            icon="eye"
            iconColor="#F472B6"
        >
            {step === 'issue' ? (
                // Step 1: Issue Selection
                <>
                    <SectionLabel>What's the issue?</SectionLabel>
                    <View style={styles.issueList}>
                        {ISSUE_TYPES.map((issue) => (
                            <TouchableOpacity
                                key={issue.id}
                                style={styles.issueRow}
                                onPress={() => handleIssueSelect(issue.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.issueEmoji}>{issue.emoji}</Text>
                                <View style={styles.issueText}>
                                    <Text style={styles.issueTitle}>{issue.title}</Text>
                                    <Text style={styles.issueSubtitle}>{issue.subtitle}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            ) : (
                // Step 2: Details
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Back button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Feather name="arrow-left" size={18} color={COLORS.primary} />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* Issue header */}
                    <View style={styles.issueHeader}>
                        <Text style={styles.issueHeaderEmoji}>{currentIssue?.emoji}</Text>
                        <Text style={styles.issueHeaderTitle}>{currentIssue?.title}</Text>
                    </View>

                    {/* Who? (Optional) */}
                    <SectionLabel>Who? (Optional)</SectionLabel>
                    <View style={styles.roommateRow}>
                        <TouchableOpacity
                            style={[
                                styles.roommateChip,
                                !selectedRoommate && styles.roommateChipSelected,
                            ]}
                            onPress={() => setSelectedRoommate(null)}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        {roommates.map((rm) => (
                            <TouchableOpacity
                                key={rm.id}
                                style={[
                                    styles.roommateChip,
                                    selectedRoommate === rm.id && styles.roommateChipSelected,
                                ]}
                                onPress={() => setSelectedRoommate(rm.id)}
                            >
                                <Avatar name={rm.name} color={rm.avatarColor} size="sm" />
                                <Text style={[
                                    styles.roommateName,
                                    selectedRoommate === rm.id && styles.roommateNameSelected,
                                ]}>
                                    {rm.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Add context */}
                    <SectionLabel>Add context (Optional)</SectionLabel>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Been there 2 days..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={2}
                    />

                    {/* Anonymous toggle */}
                    <TouchableOpacity
                        style={styles.anonymousRow}
                        onPress={() => setIsAnonymous(!isAnonymous)}
                    >
                        <View style={styles.anonymousLeft}>
                            <Feather
                                name={isAnonymous ? 'eye-off' : 'eye'}
                                size={18}
                                color={isAnonymous ? COLORS.success : COLORS.textSecondary}
                            />
                            <View>
                                <Text style={styles.anonymousTitle}>
                                    {isAnonymous ? 'Anonymous Report' : 'Show Your Name'}
                                </Text>
                                <Text style={styles.anonymousSubtitle}>
                                    {isAnonymous
                                        ? 'Your identity stays hidden'
                                        : 'Roommates will see who reported'
                                    }
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.toggle, isAnonymous && styles.toggleOn]}>
                            <View style={[styles.toggleDot, isAnonymous && styles.toggleDotOn]} />
                        </View>
                    </TouchableOpacity>

                    {/* Send button */}
                    <ActionButton
                        label={isAnonymous ? "Send Anonymous Report 📤" : "Send Report 📤"}
                        onPress={handleReport}
                        icon="send"
                    />
                </KeyboardAvoidingView>
            )}
        </QuickActionSheet>
    );
};

const styles = StyleSheet.create({
    // Issue list
    issueList: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    issueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
        gap: SPACING.md,
    },
    issueEmoji: {
        fontSize: 28,
    },
    issueText: {
        flex: 1,
    },
    issueTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    issueSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Back button
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
    },
    backText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // Issue header
    issueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
    },
    issueHeaderEmoji: {
        fontSize: 32,
    },
    issueHeaderTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    // Roommate row
    roommateRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    roommateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    roommateChipSelected: {
        borderColor: '#F472B6',
        backgroundColor: '#F472B6' + '20',
    },
    skipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    roommateName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    roommateNameSelected: {
        color: '#F472B6',
        fontWeight: '600',
    },
    // Input
    input: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    // Anonymous toggle
    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.lg,
    },
    anonymousLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    anonymousTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    anonymousSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray700,
        padding: 2,
        justifyContent: 'center',
    },
    toggleOn: {
        backgroundColor: COLORS.success,
    },
    toggleDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    toggleDotOn: {
        alignSelf: 'flex-end',
    },
});
