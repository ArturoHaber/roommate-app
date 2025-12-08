import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Chore } from '../types';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (task: Partial<Chore>) => void;
    initialRoom?: string;
    initialTask?: Chore | null;
}

const FREQUENCY_TABS = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'interval', label: 'Interval' },
];

const DAYS_OF_WEEK = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
];

const ROOMS = [
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'living_room', label: 'Living Room' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'dining', label: 'Dining' },
    { id: 'other', label: 'Other' },
];

const ICONS = ['check-circle', 'trash-2', 'droplet', 'wind', 'sun', 'shopping-cart', 'monitor', 'home'];

export const AddTaskModal = ({ visible, onClose, onSave, initialRoom, initialTask }: AddTaskModalProps) => {
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'interval'>('daily');
    const [selectedIcon, setSelectedIcon] = useState('check-circle');
    const [points, setPoints] = useState('5');
    const [selectedRoom, setSelectedRoom] = useState(initialRoom || 'kitchen');

    // Weekly specific
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    // Interval specific
    const [intervalDays, setIntervalDays] = useState(2);

    useEffect(() => {
        if (visible) {
            if (initialTask) {
                // Edit Mode
                setName(initialTask.name);
                setFrequency(initialTask.frequency as any);
                setSelectedIcon(initialTask.icon);
                setPoints(initialTask.pointValue.toString());
                setSelectedRoom(initialTask.room);
                setSelectedDays(initialTask.assignedDays || []);
                setIntervalDays(initialTask.interval || 2);
            } else {
                // Create Mode
                setName('');
                setFrequency('daily');
                setSelectedIcon('check-circle');
                setPoints('5');
                setSelectedRoom(initialRoom || 'kitchen');
                setSelectedDays([]);
                setIntervalDays(2);
            }
        }
    }, [visible, initialTask, initialRoom]);

    const handleSave = () => {
        if (!name.trim()) return;

        onSave({
            ...(initialTask ? { id: initialTask.id } : {}),
            name,
            frequency,
            icon: selectedIcon,
            pointValue: parseInt(points) || 5,
            room: selectedRoom as any,
            assignedDays: frequency === 'weekly' ? selectedDays : undefined,
            interval: frequency === 'interval' ? intervalDays : undefined,
        });

        onClose();
    };

    const toggleDay = (dayId: number) => {
        if (selectedDays.includes(dayId)) {
            setSelectedDays(selectedDays.filter(d => d !== dayId));
        } else {
            setSelectedDays([...selectedDays, dayId]);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>{initialTask ? 'Edit Habit' : 'New Habit'}</Text>
                        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                            <Feather name="check" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Name & Icon */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Name & Icon</Text>
                            <View style={styles.nameInputContainer}>
                                <TouchableOpacity style={styles.iconTrigger}>
                                    <Feather name={selectedIcon as any} size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.nameInput}
                                    placeholder="e.g. Run"
                                    placeholderTextColor={COLORS.gray500}
                                    value={name}
                                    onChangeText={setName}
                                />
                                {name.length > 0 && (
                                    <TouchableOpacity onPress={() => setName('')}>
                                        <Feather name="x-circle" size={18} color={COLORS.gray500} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Frequency */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.tabs}>
                                {FREQUENCY_TABS.map(tab => (
                                    <TouchableOpacity
                                        key={tab.id}
                                        style={[styles.tab, frequency === tab.id && styles.tabActive]}
                                        onPress={() => setFrequency(tab.id as any)}
                                    >
                                        <Text style={[styles.tabText, frequency === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Weekly View */}
                            {frequency === 'weekly' && (
                                <View style={styles.daysContainer}>
                                    {DAYS_OF_WEEK.map(day => (
                                        <TouchableOpacity
                                            key={day.id}
                                            style={[styles.dayBubble, selectedDays.includes(day.id) && styles.dayBubbleActive]}
                                            onPress={() => toggleDay(day.id)}
                                        >
                                            <Text style={[styles.dayText, selectedDays.includes(day.id) && styles.dayTextActive]}>
                                                {day.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Interval View */}
                            {frequency === 'interval' && (
                                <View style={styles.intervalContainer}>
                                    <Text style={styles.intervalText}>Every</Text>
                                    <View style={styles.intervalPicker}>
                                        <TouchableOpacity onPress={() => setIntervalDays(Math.max(1, intervalDays - 1))}>
                                            <Feather name="minus" size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                        <Text style={styles.intervalValue}>{intervalDays}</Text>
                                        <TouchableOpacity onPress={() => setIntervalDays(intervalDays + 1)}>
                                            <Feather name="plus" size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.intervalText}>days</Text>
                                </View>
                            )}
                        </View>

                        {/* Section (Room) */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Section</Text>
                                <Feather name="plus" size={18} color={COLORS.textSecondary} />
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomScroll}>
                                {ROOMS.map(room => (
                                    <TouchableOpacity
                                        key={room.id}
                                        style={[styles.roomChip, selectedRoom === room.id && styles.roomChipActive]}
                                        onPress={() => setSelectedRoom(room.id)}
                                    >
                                        <Text style={[styles.roomChipText, selectedRoom === room.id && styles.roomChipTextActive]}>
                                            {room.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Points */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Points</Text>
                            <View style={styles.pointsContainer}>
                                {['1', '3', '5', '10', '20'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.pointOption,
                                            points === p && styles.pointOptionActive
                                        ]}
                                        onPress={() => setPoints(p)}
                                    >
                                        <Text style={[
                                            styles.pointText,
                                            points === p && styles.pointTextActive
                                        ]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: COLORS.gray900, // Using dark theme background
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        height: '90%',
        ...SHADOWS.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    closeButton: {
        padding: SPACING.sm,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
    },
    saveButton: {
        padding: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    content: {
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    nameInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
    },
    iconTrigger: {
        padding: SPACING.sm,
        backgroundColor: COLORS.primary + '20',
        borderRadius: BORDER_RADIUS.full,
        marginRight: SPACING.md,
    },
    nameInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        paddingVertical: SPACING.sm,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
        padding: 4,
        marginBottom: SPACING.lg,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.full,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: COLORS.white,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'space-between',
    },
    dayBubble: {
        width: '23%', // 4 items per row approx
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.sm,
    },
    dayBubbleActive: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    dayTextActive: {
        color: COLORS.white,
        fontWeight: '700',
    },
    intervalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.lg,
        paddingVertical: SPACING.xl,
    },
    intervalText: {
        fontSize: FONT_SIZE.xl,
        color: COLORS.textSecondary,
    },
    intervalPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    intervalValue: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
        width: 40,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    roomScroll: {
        gap: SPACING.sm,
    },
    roomChip: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.full,
    },
    roomChipActive: {
        backgroundColor: COLORS.primary,
    },
    roomChipText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    roomChipTextActive: {
        color: COLORS.white,
        fontWeight: '700',
    },
    pointsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    pointOption: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    pointOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    pointText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    pointTextActive: {
        color: COLORS.white,
    },
});
