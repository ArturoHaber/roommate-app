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
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

const HOUSE_EMOJIS = ['🏠', '🏡', '🏢', '🏘️', '🏰', '🛖', '🌆', '🌃', '🌇', '🏗️', '🪵', '⛺'];

interface HouseBasicsScreenProps {
    onBack: () => void;
    onContinue: (houseName: string, emoji: string) => void;
}

export const HouseBasicsScreen: React.FC<HouseBasicsScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const [houseName, setHouseName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🏠');

    const canContinue = houseName.trim().length >= 2;

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
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressDot, styles.progressDotActive]} />
                        <View style={styles.progressDot} />
                        <View style={styles.progressDot} />
                        <View style={styles.progressDot} />
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Emoji Preview */}
                    <View style={styles.emojiPreview}>
                        <Text style={styles.emojiPreviewText}>{selectedEmoji}</Text>
                    </View>

                    <Text style={styles.title}>Name Your House</Text>
                    <Text style={styles.subtitle}>
                        Give your place a name your roommates will recognize
                    </Text>

                    {/* Name Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.nameInput}
                            value={houseName}
                            onChangeText={setHouseName}
                            placeholder="e.g., The Crib, Casa de Sol"
                            placeholderTextColor={COLORS.gray600}
                            maxLength={30}
                        />
                        <Text style={styles.charCount}>{houseName.length}/30</Text>
                    </View>

                    {/* Emoji Picker */}
                    <Text style={styles.sectionLabel}>Pick an icon</Text>
                    <View style={styles.emojiGrid}>
                        {HOUSE_EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[
                                    styles.emojiButton,
                                    selectedEmoji === emoji && styles.emojiButtonSelected,
                                ]}
                                onPress={() => setSelectedEmoji(emoji)}
                            >
                                <Text style={styles.emojiButtonText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !canContinue && styles.continueButtonDisabled,
                        ]}
                        onPress={() => onContinue(houseName.trim(), selectedEmoji)}
                        disabled={!canContinue}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                        <Feather name="arrow-right" size={20} color="#FFF" />
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        paddingTop: SPACING.lg,
    },
    emojiPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 3,
        borderColor: COLORS.primary + '40',
    },
    emojiPreviewText: {
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
    inputContainer: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    nameInput: {
        backgroundColor: COLORS.gray900,
        borderWidth: 2,
        borderColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    charCount: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        textAlign: 'right',
        marginTop: SPACING.xs,
        paddingRight: SPACING.sm,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        alignSelf: 'flex-start',
        marginBottom: SPACING.md,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    emojiButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiButtonSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
    },
    emojiButtonText: {
        fontSize: 24,
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
    continueButtonDisabled: {
        backgroundColor: COLORS.gray700,
    },
    continueButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
});
