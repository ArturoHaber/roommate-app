import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { Chore, RoomType } from '../types';

// Room configuration
const ROOMS: { id: RoomType; name: string; icon: string; color: string }[] = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: '#F97316' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: '#06B6D4' },
    { id: 'living_room', name: 'Living Room', icon: '🛋️', color: '#8B5CF6' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', color: '#EC4899' },
    { id: 'dining', name: 'Dining', icon: '🍽️', color: '#EAB308' },
    { id: 'other', name: 'Other', icon: '📦', color: '#6B7280' },
];

// Chore icons (emoji grid)
const CHORE_ICONS = [
    '🧹', '🧽', '🧴', '🧺', '🚿', '🚽', '🗑️', '📦',
    '🍳', '🍽️', '🧊', '🌱', '🐕', '🐈', '📬', '🚗',
    '🛋️', '🛏️', '🪟', '🚪', '💡', '🔧', '🧹', '✨',
];

// Days of week
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type FrequencyType = 'daily' | 'weekly' | 'interval';

interface ChoreFormData {
    name: string;
    description: string;
    icon: string;
    room: RoomType;
    frequency: FrequencyType;
    assignedDays: number[];
    interval: number;
    pointValue: number;
}

const defaultFormData: ChoreFormData = {
    name: '',
    description: '',
    icon: '🧹',
    room: 'kitchen',
    frequency: 'weekly',
    assignedDays: [1, 3, 5], // Mon, Wed, Fri
    interval: 3,
    pointValue: 5,
};

export const ChoreManagementScreen = () => {
    const navigation = useNavigation();
    const { chores, addChore, removeChore } = useChoreStore();
    const { household } = useHouseholdStore();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingChore, setEditingChore] = useState<Chore | null>(null);
    const [formData, setFormData] = useState<ChoreFormData>(defaultFormData);

    // Group chores by room
    const choresByRoom = useMemo(() => {
        const grouped: Record<RoomType, Chore[]> = {
            kitchen: [],
            bathroom: [],
            living_room: [],
            bedroom: [],
            dining: [],
            other: [],
        };

        chores
            .filter(c => c.isActive)
            .forEach(chore => {
                const room = chore.room || 'other';
                if (grouped[room]) {
                    grouped[room].push(chore);
                }
            });

        return grouped;
    }, [chores]);

    const openAddModal = () => {
        setEditingChore(null);
        setFormData(defaultFormData);
        setIsModalVisible(true);
    };

    const openEditModal = (chore: Chore) => {
        setEditingChore(chore);
        setFormData({
            name: chore.name,
            description: chore.description || '',
            icon: chore.icon || '🧹',
            room: chore.room,
            frequency: chore.frequency,
            assignedDays: chore.assignedDays || [1, 3, 5],
            interval: chore.interval || 3,
            pointValue: chore.pointValue,
        });
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !household?.id) {
            Alert.alert('Error', 'Please enter a chore name');
            return;
        }

        // Add or update chore
        await addChore({
            householdId: household.id,
            name: formData.name.trim(),
            description: formData.description.trim(),
            icon: formData.icon,
            room: formData.room,
            frequency: formData.frequency,
            assignedDays: formData.frequency === 'weekly' ? formData.assignedDays : undefined,
            interval: formData.frequency === 'interval' ? formData.interval : undefined,
            pointValue: formData.pointValue,
            isActive: true,
        });

        setIsModalVisible(false);
        setFormData(defaultFormData);
    };

    const handleDelete = (chore: Chore) => {
        const confirmDelete = () => {
            removeChore(chore.id);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete "${chore.name}"? This action cannot be undone.`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                'Delete Chore',
                `Are you sure you want to delete "${chore.name}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: confirmDelete },
                ]
            );
        }
    };

    const toggleDay = (day: number) => {
        setFormData(prev => {
            const days = prev.assignedDays.includes(day)
                ? prev.assignedDays.filter(d => d !== day)
                : [...prev.assignedDays, day].sort();
            return { ...prev, assignedDays: days };
        });
    };

    const getFrequencyLabel = (chore: Chore) => {
        if (chore.frequency === 'daily') return 'Daily';
        if (chore.frequency === 'weekly') {
            const days = chore.assignedDays?.map(d => WEEKDAYS[d].charAt(0)).join(', ');
            return days || 'Weekly';
        }
        if (chore.frequency === 'interval') return `Every ${chore.interval || 3} days`;
        return '';
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Chores</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Feather name="plus" size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Chores grouped by room */}
                {ROOMS.map(room => {
                    const roomChores = choresByRoom[room.id];
                    if (roomChores.length === 0) return null;

                    return (
                        <View key={room.id} style={styles.roomSection}>
                            <View style={styles.roomHeader}>
                                <Text style={styles.roomIcon}>{room.icon}</Text>
                                <Text style={styles.roomName}>{room.name}</Text>
                                <View style={[styles.choreBadge, { backgroundColor: room.color + '20' }]}>
                                    <Text style={[styles.choreBadgeText, { color: room.color }]}>
                                        {roomChores.length}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.choreList}>
                                {roomChores.map(chore => (
                                    <TouchableOpacity
                                        key={chore.id}
                                        style={styles.choreCard}
                                        onPress={() => openEditModal(chore)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.choreIconContainer}>
                                            <Text style={styles.choreIcon}>{chore.icon || '🧹'}</Text>
                                        </View>
                                        <View style={styles.choreInfo}>
                                            <Text style={styles.choreName}>{chore.name}</Text>
                                            <View style={styles.choreMetaRow}>
                                                <View style={styles.frequencyBadge}>
                                                    <Feather name="repeat" size={10} color={COLORS.primary} />
                                                    <Text style={styles.frequencyText}>
                                                        {getFrequencyLabel(chore)}
                                                    </Text>
                                                </View>
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsText}>⭐ {chore.pointValue}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(chore)}
                                        >
                                            <Feather name="trash-2" size={18} color={COLORS.error} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}

                {/* Empty state */}
                {chores.filter(c => c.isActive).length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📋</Text>
                        <Text style={styles.emptyTitle}>No Chores Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your first chore to get started with task management
                        </Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                            <Feather name="plus" size={18} color={COLORS.white} />
                            <Text style={styles.emptyButtonText}>Add First Chore</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingChore ? 'Edit Chore' : 'New Chore'}
                        </Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Icon Picker */}
                        <Text style={styles.inputLabel}>ICON</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.iconPicker}
                        >
                            {CHORE_ICONS.map(icon => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconOption,
                                        formData.icon === icon && styles.iconOptionSelected
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, icon }))}
                                >
                                    <Text style={styles.iconText}>{icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Name */}
                        <Text style={styles.inputLabel}>NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Clean the Kitchen"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.name}
                            onChangeText={name => setFormData(prev => ({ ...prev, name }))}
                        />

                        {/* Description */}
                        <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add details or instructions..."
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.description}
                            onChangeText={description => setFormData(prev => ({ ...prev, description }))}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Room Selector */}
                        <Text style={styles.inputLabel}>ROOM</Text>
                        <View style={styles.roomPicker}>
                            {ROOMS.map(room => (
                                <TouchableOpacity
                                    key={room.id}
                                    style={[
                                        styles.roomOption,
                                        formData.room === room.id && {
                                            backgroundColor: room.color + '20',
                                            borderColor: room.color
                                        }
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, room: room.id }))}
                                >
                                    <Text style={styles.roomOptionIcon}>{room.icon}</Text>
                                    <Text style={[
                                        styles.roomOptionText,
                                        formData.room === room.id && { color: room.color }
                                    ]}>
                                        {room.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Frequency */}
                        <Text style={styles.inputLabel}>FREQUENCY</Text>
                        <View style={styles.frequencyPicker}>
                            {(['daily', 'weekly', 'interval'] as FrequencyType[]).map(freq => (
                                <TouchableOpacity
                                    key={freq}
                                    style={[
                                        styles.frequencyOption,
                                        formData.frequency === freq && styles.frequencyOptionSelected
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                                >
                                    <Text style={[
                                        styles.frequencyOptionText,
                                        formData.frequency === freq && styles.frequencyOptionTextSelected
                                    ]}>
                                        {freq === 'daily' ? 'Daily' : freq === 'weekly' ? 'Weekly' : 'Every X days'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Weekly day picker */}
                        {formData.frequency === 'weekly' && (
                            <>
                                <Text style={styles.inputLabel}>WHICH DAYS?</Text>
                                <View style={styles.dayPicker}>
                                    {WEEKDAYS.map((day, index) => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.dayOption,
                                                formData.assignedDays.includes(index) && styles.dayOptionSelected
                                            ]}
                                            onPress={() => toggleDay(index)}
                                        >
                                            <Text style={[
                                                styles.dayOptionText,
                                                formData.assignedDays.includes(index) && styles.dayOptionTextSelected
                                            ]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Interval picker */}
                        {formData.frequency === 'interval' && (
                            <>
                                <Text style={styles.inputLabel}>EVERY HOW MANY DAYS?</Text>
                                <View style={styles.intervalPicker}>
                                    {[2, 3, 5, 7, 14, 30].map(days => (
                                        <TouchableOpacity
                                            key={days}
                                            style={[
                                                styles.intervalOption,
                                                formData.interval === days && styles.intervalOptionSelected
                                            ]}
                                            onPress={() => setFormData(prev => ({ ...prev, interval: days }))}
                                        >
                                            <Text style={[
                                                styles.intervalOptionText,
                                                formData.interval === days && styles.intervalOptionTextSelected
                                            ]}>
                                                {days}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Points */}
                        <Text style={styles.inputLabel}>POINTS</Text>
                        <View style={styles.pointsPicker}>
                            {[1, 2, 3, 5, 8, 10].map(pts => (
                                <TouchableOpacity
                                    key={pts}
                                    style={[
                                        styles.pointOption,
                                        formData.pointValue === pts && styles.pointOptionSelected
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, pointValue: pts }))}
                                >
                                    <Text style={styles.pointOptionEmoji}>⭐</Text>
                                    <Text style={[
                                        styles.pointOptionText,
                                        formData.pointValue === pts && styles.pointOptionTextSelected
                                    ]}>
                                        {pts}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
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
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    addButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.white,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    roomSection: {
        marginBottom: SPACING.xl,
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    roomIcon: {
        fontSize: 20,
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
        flex: 1,
    },
    choreBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    choreBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
    },
    choreList: {
        gap: SPACING.sm,
    },
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        gap: SPACING.md,
    },
    choreIconContainer: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    choreIcon: {
        fontSize: 22,
    },
    choreInfo: {
        flex: 1,
    },
    choreName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    choreMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    frequencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    frequencyText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: '500',
    },
    pointsBadge: {
        backgroundColor: COLORS.warning + '15',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.warning,
        fontWeight: '600',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        maxWidth: 280,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
    },
    emptyButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    saveButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.primary,
    },
    modalContent: {
        flex: 1,
        padding: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: SPACING.sm,
        marginTop: SPACING.lg,
    },
    input: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    iconPicker: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
    },
    iconText: {
        fontSize: 24,
    },
    roomPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    roomOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    roomOptionIcon: {
        fontSize: 16,
    },
    roomOptionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    frequencyPicker: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    frequencyOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    frequencyOptionSelected: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    frequencyOptionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    frequencyOptionTextSelected: {
        color: COLORS.primary,
    },
    dayPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayOption: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    dayOptionSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayOptionText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dayOptionTextSelected: {
        color: COLORS.white,
    },
    intervalPicker: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    intervalOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    intervalOptionSelected: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    intervalOptionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    intervalOptionTextSelected: {
        color: COLORS.primary,
    },
    pointsPicker: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    pointOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    pointOptionSelected: {
        backgroundColor: COLORS.warning + '20',
        borderColor: COLORS.warning,
    },
    pointOptionEmoji: {
        fontSize: 16,
        marginBottom: 2,
    },
    pointOptionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    pointOptionTextSelected: {
        color: COLORS.warning,
    },
});
