import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { Avatar } from './Avatar';
import { SuccessOverlay } from './SuccessOverlay';
import { useAuthStore } from '../stores/useAuthStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Categories
const CATEGORIES = [
    { id: 'cooked', emoji: '🍳', label: 'Cooked' },
    { id: 'other', emoji: '✨', label: 'Other' },
];

interface LogActivityButtonProps {
    style?: object;
}

type Step = 'category' | 'who-cooked' | 'who-ate' | 'other-details';

export const LogActivityButton: React.FC<LogActivityButtonProps> = ({ style }) => {
    const { user } = useAuthStore();
    const { household, members } = useHouseholdStore();
    const { logActivity } = useChoreStore();

    const [isExpanded, setIsExpanded] = useState(false);
    const [step, setStep] = useState<Step>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cook, setCook] = useState<string | null>(null);
    const [eaters, setEaters] = useState<string[]>([]);
    const [otherDescription, setOtherDescription] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Animation
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    // All household members including self
    const allMembers = [
        { id: user?.id || '', name: 'You', avatarColor: user?.avatarColor || COLORS.primary, isMe: true },
        ...members.filter(m => m.id !== user?.id).map(m => ({ ...m, isMe: false })),
    ];

    // Reset state
    const resetState = () => {
        setStep('category');
        setSelectedCategory(null);
        setCook(null);
        setEaters([]);
        setOtherDescription('');
    };

    // Toggle expand/collapse
    const toggleExpand = () => {
        Animated.sequence([
            Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
            Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (isExpanded) {
            setIsExpanded(false);
            resetState();
        } else {
            setIsExpanded(true);
        }
    };

    // Handle category select
    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (categoryId === 'cooked') {
            setStep('who-cooked');
        } else {
            setStep('other-details');
        }
    };

    // Handle cook selection
    const handleCookSelect = (cookId: string) => {
        setCook(cookId);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep('who-ate');
        // Pre-select all others as eaters
        const othersIds = allMembers.filter(m => m.id !== cookId).map(m => m.id);
        setEaters(othersIds);
    };

    // Toggle eater selection
    const toggleEater = (eaterId: string) => {
        setEaters(prev =>
            prev.includes(eaterId)
                ? prev.filter(id => id !== eaterId)
                : [...prev, eaterId]
        );
    };

    // Confirm and assign dishes
    const handleConfirmDishes = async () => {
        if (!household || !cook || eaters.length === 0) return;

        try {
            // Assign dishes to each eater
            for (const eaterId of eaters) {
                await logActivity('cooked', 'Dishes from meal', eaterId, household.id);
            }

            // Build success message
            const cookName = cook === user?.id ? 'You' : (members.find(m => m.id === cook)?.name || 'Someone');
            const eaterCount = eaters.length;

            setSuccessMessage(`${cookName} cooked! Dishes assigned to ${eaterCount} ${eaterCount === 1 ? 'person' : 'people'}.`);
            setShowSuccess(true);

            // Reset and collapse
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsExpanded(false);
            resetState();
        } catch (error) {
            console.error('[LogActivityButton] Error assigning dishes:', error);
        }
    };

    // Handle other activity submit
    const handleOtherSubmit = async () => {
        if (!household || !user || !otherDescription.trim()) return;

        try {
            // For "other" we just log it but don't create assignments
            // This is more of a note/acknowledgment
            console.log(`[LogActivityButton] Logged other activity: ${otherDescription}`);

            setSuccessMessage(`Logged: ${otherDescription}`);
            setShowSuccess(true);

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsExpanded(false);
            resetState();
        } catch (error) {
            console.error('[LogActivityButton] Error logging activity:', error);
        }
    };

    // Go back one step
    const goBack = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (step === 'who-ate') {
            setStep('who-cooked');
            setCook(null);
            setEaters([]);
        } else if (step === 'who-cooked' || step === 'other-details') {
            setStep('category');
            setSelectedCategory(null);
            setOtherDescription('');
        }
    };

    if (!user) return null;

    return (
        <>
            <View style={[styles.container, style]}>
                {/* Main Button */}
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                    <TouchableOpacity onPress={toggleExpand} activeOpacity={0.9} style={styles.buttonWrapper}>
                        <LinearGradient
                            colors={isExpanded
                                ? ['rgba(129, 140, 248, 0.15)', 'rgba(99, 102, 241, 0.1)']
                                : ['rgba(129, 140, 248, 0.12)', 'rgba(99, 102, 241, 0.08)']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mainButton}
                        >
                            <View style={styles.buttonContent}>
                                <View style={styles.iconCircle}>
                                    <Feather
                                        name={isExpanded ? 'x' : 'plus'}
                                        size={18}
                                        color={COLORS.primary}
                                    />
                                </View>
                                <Text style={styles.buttonText}>
                                    {isExpanded ? 'Cancel' : 'Log Activity'}
                                </Text>
                                <Feather
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={COLORS.textTertiary}
                                />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Expanded Content */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {/* STEP: Category Selection */}
                        {step === 'category' && (
                            <>
                                <Text style={styles.sectionTitle}>What happened?</Text>
                                <View style={styles.categoryRow}>
                                    {CATEGORIES.map((category) => (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={styles.categoryCard}
                                            onPress={() => handleCategorySelect(category.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                                            <Text style={styles.categoryLabel}>{category.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* STEP: Who Cooked? */}
                        {step === 'who-cooked' && (
                            <>
                                <TouchableOpacity style={styles.backRow} onPress={goBack}>
                                    <Feather name="arrow-left" size={16} color={COLORS.primary} />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>Who cooked?</Text>
                                <View style={styles.personGrid}>
                                    {allMembers.map((member) => (
                                        <TouchableOpacity
                                            key={member.id}
                                            style={styles.personCard}
                                            onPress={() => handleCookSelect(member.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Avatar name={member.name} color={member.avatarColor} size="md" />
                                            <Text style={styles.personName} numberOfLines={1}>
                                                {member.isMe ? 'I did' : member.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* STEP: Who Ate? */}
                        {step === 'who-ate' && (
                            <>
                                <TouchableOpacity style={styles.backRow} onPress={goBack}>
                                    <Feather name="arrow-left" size={16} color={COLORS.primary} />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>
                                    Who ate? <Text style={styles.sectionSubtitle}>(they get dishes)</Text>
                                </Text>

                                <View style={styles.personGrid}>
                                    {allMembers.map((member) => {
                                        const isSelected = eaters.includes(member.id);
                                        const isCook = member.id === cook;
                                        return (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={[
                                                    styles.personCard,
                                                    isSelected && styles.personCardSelected,
                                                    isCook && styles.personCardCook,
                                                ]}
                                                onPress={() => toggleEater(member.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.avatarWrapper}>
                                                    <Avatar name={member.name} color={member.avatarColor} size="md" />
                                                    {isSelected && (
                                                        <View style={styles.checkBadge}>
                                                            <Feather name="check" size={10} color="#fff" />
                                                        </View>
                                                    )}
                                                    {isCook && (
                                                        <View style={styles.cookBadge}>
                                                            <Text style={styles.cookBadgeText}>👨‍🍳</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[
                                                    styles.personName,
                                                    isSelected && styles.personNameSelected,
                                                ]} numberOfLines={1}>
                                                    {member.isMe ? 'Me' : member.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Info text */}
                                <View style={styles.infoBox}>
                                    <Feather name="info" size={14} color={COLORS.textTertiary} />
                                    <Text style={styles.infoText}>
                                        {eaters.length === 0
                                            ? 'Select who ate the food'
                                            : `${eaters.length} ${eaters.length === 1 ? 'person' : 'people'} will get dish duty`
                                        }
                                    </Text>
                                </View>

                                {/* Confirm button */}
                                <TouchableOpacity
                                    style={[
                                        styles.confirmButton,
                                        eaters.length === 0 && styles.confirmButtonDisabled,
                                    ]}
                                    onPress={handleConfirmDishes}
                                    disabled={eaters.length === 0}
                                >
                                    <Text style={styles.confirmButtonText}>Assign Dishes 🍽️</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* STEP: Other Details */}
                        {step === 'other-details' && (
                            <>
                                <TouchableOpacity style={styles.backRow} onPress={goBack}>
                                    <Feather name="arrow-left" size={16} color={COLORS.primary} />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>What did you do?</Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Describe what happened..."
                                    placeholderTextColor={COLORS.textTertiary}
                                    value={otherDescription}
                                    onChangeText={setOtherDescription}
                                    multiline
                                />

                                <TouchableOpacity
                                    style={[
                                        styles.confirmButton,
                                        !otherDescription.trim() && styles.confirmButtonDisabled,
                                    ]}
                                    onPress={handleOtherSubmit}
                                    disabled={!otherDescription.trim()}
                                >
                                    <Text style={styles.confirmButtonText}>Log It ✓</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* Success Overlay */}
            <SuccessOverlay
                visible={showSuccess}
                message={successMessage}
                subMessage="Done!"
                onComplete={() => setShowSuccess(false)}
                variant="complete"
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.md,
    },

    buttonWrapper: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    mainButton: {
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(129, 140, 248, 0.2)',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    // Expanded content
    expandedContent: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },

    // Back row
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
    },
    backText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '500',
    },

    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    sectionSubtitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: COLORS.textTertiary,
    },

    // Category row
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    categoryCard: {
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        minWidth: 100,
    },
    categoryEmoji: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    categoryLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },

    // Person grid
    personGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    personCard: {
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 80,
    },
    personCardSelected: {
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        borderColor: COLORS.success,
    },
    personCardCook: {
        opacity: 0.6,
    },
    avatarWrapper: {
        position: 'relative',
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray900,
    },
    cookBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.warning,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray900,
    },
    cookBadgeText: {
        fontSize: 10,
    },
    personName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    personNameSelected: {
        color: COLORS.success,
        fontWeight: '600',
    },

    // Info box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.lg,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BORDER_RADIUS.md,
    },
    infoText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },

    // Text input
    textInput: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: SPACING.md,
    },

    // Confirm button
    confirmButton: {
        marginTop: SPACING.md,
        backgroundColor: COLORS.success,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray700,
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#fff',
    },
});

export default LogActivityButton;
