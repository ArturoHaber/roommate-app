import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

// ============================================================================
// CHORE TEMPLATES
// ============================================================================

export interface ChoreTemplate {
    id: string;
    name: string;
    icon: string;
    room: 'kitchen' | 'bathroom' | 'living' | 'bedroom' | 'general';
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'on_need';
    isPersonal: boolean;
    enabled: boolean;
}

const ROOM_CONFIG = {
    kitchen: { label: 'Kitchen', emoji: '🍳' },
    bathroom: { label: 'Bathroom', emoji: '🚿' },
    living: { label: 'Living Room', emoji: '🛋️' },
    bedroom: { label: 'Bedroom', emoji: '🛏️' },
    general: { label: 'General', emoji: '🏠' },
};

const FREQUENCY_LABELS = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    on_need: 'As needed',
};

const DEFAULT_TEMPLATES: ChoreTemplate[] = [
    // Kitchen
    { id: '1', name: 'Do Dishes', icon: '🍽️', room: 'kitchen', frequency: 'daily', isPersonal: false, enabled: true },
    { id: '2', name: 'Wipe Counters', icon: '✨', room: 'kitchen', frequency: 'weekly', isPersonal: false, enabled: true },
    { id: '3', name: 'Take Out Trash', icon: '🗑️', room: 'kitchen', frequency: 'weekly', isPersonal: false, enabled: true },
    { id: '4', name: 'Clean Stovetop', icon: '🍳', room: 'kitchen', frequency: 'weekly', isPersonal: false, enabled: false },
    { id: '5', name: 'Clean Fridge', icon: '🧊', room: 'kitchen', frequency: 'monthly', isPersonal: false, enabled: false },

    // Bathroom
    { id: '6', name: 'Clean Bathroom', icon: '🚿', room: 'bathroom', frequency: 'weekly', isPersonal: false, enabled: true },
    { id: '7', name: 'Restock Supplies', icon: '🧻', room: 'bathroom', frequency: 'on_need', isPersonal: false, enabled: false },

    // Living Room
    { id: '8', name: 'Vacuum', icon: '🧹', room: 'living', frequency: 'weekly', isPersonal: false, enabled: true },
    { id: '9', name: 'Mop Floors', icon: '🧽', room: 'living', frequency: 'biweekly', isPersonal: false, enabled: true },
    { id: '10', name: 'Dust Surfaces', icon: '✨', room: 'living', frequency: 'weekly', isPersonal: false, enabled: false },

    // Bedroom
    { id: '11', name: 'Clean Own Room', icon: '🛏️', room: 'bedroom', frequency: 'weekly', isPersonal: true, enabled: false },
    { id: '12', name: 'Do Laundry', icon: '👕', room: 'bedroom', frequency: 'weekly', isPersonal: true, enabled: false },

    // General
    { id: '13', name: 'Groceries', icon: '🛒', room: 'general', frequency: 'weekly', isPersonal: false, enabled: false },
    { id: '14', name: 'Water Plants', icon: '🌱', room: 'general', frequency: 'weekly', isPersonal: false, enabled: false },
];

interface ChoresStarterScreenProps {
    onBack: () => void;
    onContinue: (selectedChores: ChoreTemplate[]) => void;
}

export const ChoresStarterScreen: React.FC<ChoresStarterScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const [chores, setChores] = useState<ChoreTemplate[]>(DEFAULT_TEMPLATES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChoreName, setNewChoreName] = useState('');
    const [newChoreFrequency, setNewChoreFrequency] = useState<ChoreTemplate['frequency']>('weekly');
    const [newChoreIsPersonal, setNewChoreIsPersonal] = useState(false);

    const enabledChores = chores.filter(c => c.enabled);
    const groupedChores = Object.keys(ROOM_CONFIG).map(room => ({
        room: room as keyof typeof ROOM_CONFIG,
        config: ROOM_CONFIG[room as keyof typeof ROOM_CONFIG],
        chores: chores.filter(c => c.room === room),
    })).filter(g => g.chores.length > 0);

    const toggleChore = (id: string) => {
        setChores(prev => prev.map(c =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
        ));
    };

    const handleAddChore = () => {
        if (!newChoreName.trim()) return;

        const newChore: ChoreTemplate = {
            id: `custom-${Date.now()}`,
            name: newChoreName.trim(),
            icon: '📌',
            room: 'general',
            frequency: newChoreFrequency,
            isPersonal: newChoreIsPersonal,
            enabled: true,
        };

        setChores(prev => [...prev, newChore]);
        setNewChoreName('');
        setNewChoreFrequency('weekly');
        setNewChoreIsPersonal(false);
        setShowAddModal(false);
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
                    <View style={[styles.progressDot, styles.progressDotComplete]} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>🧹 Pick Your Chores</Text>
                <Text style={styles.subtitle}>
                    Toggle off what doesn't apply to your place
                </Text>
            </View>

            {/* Add Custom Button */}
            <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => setShowAddModal(true)}
            >
                <Feather name="plus" size={20} color={COLORS.primary} />
                <Text style={styles.addCustomText}>Add Custom Chore</Text>
            </TouchableOpacity>

            {/* Chore List */}
            <ScrollView style={styles.choreList} showsVerticalScrollIndicator={false}>
                {groupedChores.map((group) => (
                    <View key={group.room} style={styles.roomGroup}>
                        <View style={styles.roomHeader}>
                            <Text style={styles.roomEmoji}>{group.config.emoji}</Text>
                            <Text style={styles.roomLabel}>{group.config.label}</Text>
                        </View>

                        <View style={styles.choreCards}>
                            {group.chores.map((chore) => (
                                <TouchableOpacity
                                    key={chore.id}
                                    style={[
                                        styles.choreCard,
                                        chore.enabled && styles.choreCardEnabled,
                                    ]}
                                    onPress={() => toggleChore(chore.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.choreCardLeft}>
                                        <Text style={styles.choreIcon}>{chore.icon}</Text>
                                        <View>
                                            <Text style={[
                                                styles.choreName,
                                                !chore.enabled && styles.choreNameDisabled,
                                            ]}>
                                                {chore.name}
                                            </Text>
                                            <View style={styles.choreMetaRow}>
                                                <Text style={styles.choreFrequency}>
                                                    {FREQUENCY_LABELS[chore.frequency]}
                                                </Text>
                                                {chore.isPersonal && (
                                                    <View style={styles.personalBadge}>
                                                        <Feather name="user" size={10} color={COLORS.warning} />
                                                        <Text style={styles.personalBadgeText}>Personal</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.toggleCircle,
                                        chore.enabled && styles.toggleCircleEnabled,
                                    ]}>
                                        {chore.enabled && (
                                            <Feather name="check" size={14} color="#FFF" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        enabledChores.length === 0 && styles.continueButtonWarning,
                    ]}
                    onPress={() => onContinue(enabledChores)}
                >
                    <Text style={styles.continueButtonText}>
                        Continue with {enabledChores.length} chore{enabledChores.length !== 1 ? 's' : ''}
                    </Text>
                    <Feather name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Add Chore Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Add Custom Chore</Text>
                            <TouchableOpacity
                                onPress={handleAddChore}
                                disabled={!newChoreName.trim()}
                            >
                                <Text style={[
                                    styles.saveText,
                                    !newChoreName.trim() && styles.saveTextDisabled,
                                ]}>
                                    Add
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Name */}
                            <Text style={styles.fieldLabel}>Chore Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newChoreName}
                                onChangeText={setNewChoreName}
                                placeholder="e.g., Clean shed, Feed pet"
                                placeholderTextColor={COLORS.gray600}
                                autoFocus
                            />

                            {/* Frequency */}
                            <Text style={styles.fieldLabel}>How often?</Text>
                            <View style={styles.frequencyOptions}>
                                {(['daily', 'weekly', 'on_need'] as const).map((freq) => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[
                                            styles.frequencyOption,
                                            newChoreFrequency === freq && styles.frequencyOptionActive,
                                        ]}
                                        onPress={() => setNewChoreFrequency(freq)}
                                    >
                                        <Text style={[
                                            styles.frequencyOptionText,
                                            newChoreFrequency === freq && styles.frequencyOptionTextActive,
                                        ]}>
                                            {FREQUENCY_LABELS[freq]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Personal Toggle */}
                            <View style={styles.personalToggle}>
                                <View style={styles.personalToggleLeft}>
                                    <Feather name="user" size={20} color={COLORS.textSecondary} />
                                    <View>
                                        <Text style={styles.personalToggleLabel}>Personal Chore</Text>
                                        <Text style={styles.personalToggleHint}>
                                            Only assigned to you, not rotated
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={newChoreIsPersonal}
                                    onValueChange={setNewChoreIsPersonal}
                                    trackColor={{ false: COLORS.gray700, true: COLORS.primary + '60' }}
                                    thumbColor={newChoreIsPersonal ? COLORS.primary : COLORS.gray500}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
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
    titleSection: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    addCustomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.primary + '15',
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
        borderStyle: 'dashed',
    },
    addCustomText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    choreList: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    roomGroup: {
        marginBottom: SPACING.xl,
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    roomEmoji: {
        fontSize: 20,
    },
    roomLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    choreCards: {
        gap: SPACING.sm,
    },
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    choreCardEnabled: {
        borderColor: COLORS.primary + '40',
        backgroundColor: COLORS.primary + '08',
    },
    choreCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    choreIcon: {
        fontSize: 24,
    },
    choreName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    choreNameDisabled: {
        color: COLORS.textSecondary,
    },
    choreMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: 2,
    },
    choreFrequency: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
    },
    personalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    personalBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.warning,
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.gray600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleCircleEnabled: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    footer: {
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
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
    continueButtonWarning: {
        backgroundColor: COLORS.warning,
    },
    continueButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    saveText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.primary,
    },
    saveTextDisabled: {
        color: COLORS.gray600,
    },
    modalContent: {
        flex: 1,
        padding: SPACING.lg,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.lg,
    },
    textInput: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    frequencyOptions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    frequencyOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    frequencyOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
    },
    frequencyOptionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    frequencyOptionTextActive: {
        color: COLORS.primary,
    },
    personalToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginTop: SPACING.xl,
    },
    personalToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    personalToggleLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    personalToggleHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
});
