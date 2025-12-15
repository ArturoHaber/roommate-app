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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const HOUSE_EMOJIS = ['🏠', '🏡', '🏢', '🏘️', '🏰', '🛖', '🏗️', '🌆', '🌃', '🌇'];

interface HouseholdSetupScreenProps {
    onComplete: (householdName: string, emoji: string) => void;
    onBack: () => void;
}

export const HouseholdSetupScreen: React.FC<HouseholdSetupScreenProps> = ({
    onComplete,
    onBack,
}) => {
    const [householdName, setHouseholdName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🏠');
    const [isFocused, setIsFocused] = useState(false);

    const isValid = householdName.trim().length >= 2;

    const handleContinue = () => {
        if (isValid) {
            onComplete(householdName.trim(), selectedEmoji);
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
                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <LinearGradient
                                    colors={['#818CF8', '#6366F1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.progressFill}
                                />
                            </View>
                            <Text style={styles.progressText}>Step 1 of 1</Text>
                        </View>

                        {/* Emoji Preview */}
                        <View style={styles.emojiPreviewContainer}>
                            <View style={styles.emojiPreviewWrapper}>
                                <LinearGradient
                                    colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']}
                                    style={styles.emojiPreviewGradient}
                                />
                                <View style={styles.emojiPreviewBorder} />
                                <Text style={styles.emojiPreview}>{selectedEmoji}</Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Name Your Household</Text>
                        <Text style={styles.subtitle}>
                            Give your place a name your roommates will recognize
                        </Text>

                        {/* Name Input */}
                        <View style={[
                            styles.inputContainer,
                            isFocused && styles.inputContainerFocused
                        ]}>
                            <LinearGradient
                                colors={['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.85)']}
                                style={styles.inputGradient}
                            />
                            <View style={[
                                styles.inputBorder,
                                isFocused && styles.inputBorderFocused
                            ]} />
                            <TextInput
                                style={styles.input}
                                placeholder="The Loft, Apt 4B, Casa de Chaos..."
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                value={householdName}
                                onChangeText={setHouseholdName}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                autoCorrect={false}
                                maxLength={30}
                            />
                        </View>

                        {/* Emoji Picker */}
                        <Text style={styles.emojiLabel}>Choose an Icon</Text>
                        <View style={styles.emojiGrid}>
                            {HOUSE_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[
                                        styles.emojiButton,
                                        selectedEmoji === emoji && styles.emojiButtonSelected
                                    ]}
                                    onPress={() => setSelectedEmoji(emoji)}
                                    activeOpacity={0.7}
                                >
                                    {selectedEmoji === emoji && (
                                        <LinearGradient
                                            colors={['rgba(129, 140, 248, 0.3)', 'rgba(99, 102, 241, 0.2)']}
                                            style={styles.emojiButtonGradient}
                                        />
                                    )}
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
                            onPress={handleContinue}
                            disabled={!isValid}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={isValid
                                    ? ['#818CF8', '#6366F1', '#2DD4BF']
                                    : ['rgba(129, 140, 248, 0.3)', 'rgba(99, 102, 241, 0.2)']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.continueButtonGradient}
                            >
                                <Text style={[
                                    styles.continueButtonText,
                                    !isValid && styles.continueButtonTextDisabled
                                ]}>
                                    Continue
                                </Text>
                                {isValid && (
                                    <View style={styles.arrowIcon}>
                                        <Feather name="arrow-right" size={20} color={COLORS.white} />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },

    // Ambient glows
    glowOrb1: {
        position: 'absolute',
        top: height * 0.2,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(129, 140, 248, 0.08)',
    },
    glowOrb2: {
        position: 'absolute',
        bottom: height * 0.3,
        left: -60,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(45, 212, 191, 0.06)',
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
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl * 1.5,
        gap: SPACING.md,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        width: '100%',
        height: '100%',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
    },

    // Emoji Preview
    emojiPreviewContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    emojiPreviewWrapper: {
        width: 100,
        height: 100,
        borderRadius: 28,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    emojiPreviewGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    emojiPreviewBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiPreview: {
        fontSize: 48,
    },

    // Title
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginBottom: SPACING.xl * 1.5,
        lineHeight: 24,
    },

    // Input
    inputContainer: {
        height: 60,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.xl * 1.5,
    },
    inputContainerFocused: {
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    inputGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    inputBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputBorderFocused: {
        borderColor: 'rgba(129, 140, 248, 0.5)',
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: COLORS.white,
        paddingHorizontal: SPACING.lg,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    // Emoji Picker
    emojiLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: SPACING.md,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    emojiButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    emojiButtonSelected: {
        borderColor: 'rgba(129, 140, 248, 0.5)',
    },
    emojiButtonGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    emojiText: {
        fontSize: 28,
    },

    // Bottom Section
    bottomSection: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.md,
    },
    continueButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    continueButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.white,
    },
    continueButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
    arrowIcon: {
        marginLeft: 4,
    },
});

export default HouseholdSetupScreen;
