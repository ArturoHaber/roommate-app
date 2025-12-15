import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { QuickActionSheet, ActionButton, SectionLabel } from './QuickActionSheet';
import { SuccessOverlay } from './SuccessOverlay';

interface LogSheetProps {
    visible: boolean;
    onClose: () => void;
}

type Category = 'cooked' | 'cleaned' | 'shopped' | 'fixed' | 'package' | 'other' | null;

interface CategoryOption {
    id: Category;
    emoji: string;
    label: string;
}

const CATEGORIES: CategoryOption[] = [
    { id: 'cooked', emoji: '🍳', label: 'Cooked' },
    { id: 'cleaned', emoji: '🧹', label: 'Cleaned' },
    { id: 'shopped', emoji: '🛒', label: 'Shopped' },
    { id: 'fixed', emoji: '🔧', label: 'Fixed' },
    { id: 'package', emoji: '📦', label: 'Package' },
    { id: 'other', emoji: '⚡', label: 'Other' },
];

const QUICK_PICKS: Record<NonNullable<Category>, string[]> = {
    cooked: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert'],
    cleaned: ['Bathroom', 'Kitchen', 'Living Room', 'My Room', 'Whole House'],
    shopped: ['Groceries', 'Essentials', 'Household', 'Snacks', 'Emergency'],
    fixed: ['Appliance', 'Furniture', 'Tech', 'Plumbing', 'Other'],
    package: ['Mine arrived', 'Picked up for roommate', 'Delivered to neighbor'],
    other: ['Took out trash', 'Watered plants', 'Fed pet', 'Laundry', 'Custom'],
};

import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';

export const LogSheet: React.FC<LogSheetProps> = ({ visible, onClose }) => {
    const { user } = useAuthStore();
    const { logActivity } = useChoreStore();

    const [selectedCategory, setSelectedCategory] = useState<Category>(null);
    const [selectedPicks, setSelectedPicks] = useState<string[]>([]);
    const [customNote, setCustomNote] = useState('');
    const [step, setStep] = useState<'category' | 'details'>('category');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState({ message: '', emoji: '' });

    const handleCategorySelect = (cat: Category) => {
        setSelectedCategory(cat);
        setStep('details');
    };

    const handleBack = () => {
        setStep('category');
        setSelectedPicks([]);
        setCustomNote('');
    };

    const handleLog = () => {
        const category = CATEGORIES.find(c => c.id === selectedCategory);
        const detail = selectedPicks.length > 0 ? selectedPicks.join(', ') : (customNote || 'Activity');

        if (selectedCategory && user) {
            logActivity(selectedCategory, detail, user.id);
        }

        // Show success overlay instead of Alert
        setSuccessData({
            message: `${category?.label}: ${detail}`,
            emoji: category?.emoji || '✨',
        });

        // Reset state
        setSelectedCategory(null);
        setSelectedPicks([]);
        setCustomNote('');
        setStep('category');
        setShowSuccess(true);
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        onClose();
    };

    const handleClose = () => {
        setSelectedCategory(null);
        setSelectedPicks([]);
        setCustomNote('');
        setStep('category');
        onClose();
    };

    const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

    return (
        <>
            <QuickActionSheet
                visible={visible}
                onClose={handleClose}
                title={step === 'category' ? 'Quick Log' : `${currentCategory?.emoji} ${currentCategory?.label}`}
                icon={step === 'category' ? 'plus-circle' : 'edit-3'}
                iconColor={COLORS.secondary}
            >
                {step === 'category' ? (
                    // Step 1: Category Selection
                    <>
                        <SectionLabel>What did you do?</SectionLabel>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.categoryCard}
                                    onPress={() => handleCategorySelect(cat.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
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

                        {/* Quick Picks */}
                        <SectionLabel>Quick Select (pick multiple)</SectionLabel>
                        <View style={styles.quickPicksRow}>
                            {QUICK_PICKS[selectedCategory!]?.map((pick) => {
                                const isSelected = selectedPicks.includes(pick);
                                return (
                                    <TouchableOpacity
                                        key={pick}
                                        style={[
                                            styles.quickPick,
                                            isSelected && styles.quickPickSelected,
                                        ]}
                                        onPress={() => {
                                            if (isSelected) {
                                                setSelectedPicks(selectedPicks.filter(p => p !== pick));
                                            } else {
                                                setSelectedPicks([...selectedPicks, pick]);
                                            }
                                            setCustomNote('');
                                        }}
                                    >
                                        <Text style={[
                                            styles.quickPickText,
                                            isSelected && styles.quickPickTextSelected,
                                        ]}>
                                            {pick}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Or custom */}
                        <SectionLabel>Or describe it</SectionLabel>
                        <TextInput
                            style={styles.input}
                            placeholder="What did you do?"
                            placeholderTextColor={COLORS.textTertiary}
                            value={customNote}
                            onChangeText={(text) => {
                                setCustomNote(text);
                                setSelectedPicks([]);
                            }}
                        />

                        {/* Points preview */}
                        <View style={styles.pointsPreview}>
                            <Feather name="star" size={16} color={COLORS.warning} />
                            <Text style={styles.pointsText}>You'll earn <Text style={styles.pointsValue}>+5 points</Text></Text>
                        </View>

                        {/* Log button */}
                        <ActionButton
                            label="Log It! ✓"
                            onPress={handleLog}
                            icon="check"
                        />
                    </KeyboardAvoidingView>
                )}
            </QuickActionSheet>

            {/* Success Overlay */}
            <SuccessOverlay
                visible={showSuccess}
                message={successData.message}
                subMessage={`${successData.emoji} Logged!`}
                points={5}
                onComplete={handleSuccessComplete}
                variant="log"
            />
        </>
    );
};

const styles = StyleSheet.create({
    // Category grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    categoryCard: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray800,
    },
    categoryEmoji: {
        fontSize: 36,
        marginBottom: SPACING.xs,
    },
    categoryLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
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
    // Quick picks
    quickPicksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    quickPick: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    quickPickSelected: {
        backgroundColor: COLORS.secondary + '20',
        borderColor: COLORS.secondary,
    },
    quickPickText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    quickPickTextSelected: {
        color: COLORS.secondary,
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
    },
    // Points preview
    pointsPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.warning + '15',
        borderRadius: BORDER_RADIUS.md,
    },
    pointsText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    pointsValue: {
        fontWeight: '700',
        color: COLORS.warning,
    },
});
