import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
    Animated,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Chore, RoomType } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Room configuration
const ROOMS: { id: RoomType; name: string; icon: string; color: string; gradient: [string, string] }[] = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: '#F97316', gradient: ['#F97316', '#EA580C'] },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
    { id: 'living_room', name: 'Living Room', icon: '🛋️', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
    { id: 'dining', name: 'Dining', icon: '🍽️', color: '#EAB308', gradient: ['#EAB308', '#CA8A04'] },
    { id: 'other', name: 'Other', icon: '📦', color: '#6B7280', gradient: ['#6B7280', '#4B5563'] },
];

// Legacy Feather icon name to emoji mapping
const FEATHER_TO_EMOJI: Record<string, string> = {
    'coffee': '☕', 'home': '🏠', 'layout': '📋', 'trash': '🗑️', 'trash-2': '🗑️',
    'droplet': '💧', 'wind': '🌬️', 'sun': '☀️', 'moon': '🌙', 'star': '⭐',
    'heart': '❤️', 'check': '✅', 'x': '❌', 'settings': '⚙️', 'user': '👤',
    'mail': '✉️', 'calendar': '📅', 'clock': '🕐', 'bell': '🔔', 'tool': '🔧',
    'package': '📦', 'repeat': '🔁',
};

// Chore icons (emoji grid)
const CHORE_ICONS = [
    '🧹', '🧽', '🧴', '🧺', '🚿', '🚽', '🗑️', '📦',
    '🍳', '🍽️', '🧊', '🌱', '🐕', '🐈', '📬', '🚗',
    '🛋️', '🛏️', '🪟', '🚪', '💡', '🔧', '✨', '🧼',
];

// Helper to get display icon
const getDisplayIcon = (icon: string | undefined | null): string => {
    if (!icon) return '🧹';
    if (icon.charCodeAt(0) > 127 || /\p{Emoji}/u.test(icon)) return icon;
    return FEATHER_TO_EMOJI[icon] || '📋';
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type FrequencyType = 'daily' | 'weekly' | 'interval' | 'as_needed';

interface ChoreFormData {
    name: string;
    description: string;
    icon: string;
    room: RoomType;
    frequency: FrequencyType;
    assignedDays: number[];
    interval: number;
    pointValue: number;
    isPersonal: boolean;
}

const defaultFormData: ChoreFormData = {
    name: '', description: '', icon: '🧹', room: 'kitchen',
    frequency: 'weekly', assignedDays: [1, 3, 5], interval: 3, pointValue: 3,
    isPersonal: false,
};

// Deduplicated chore template type
interface ChoreTemplate {
    name: string;
    icon: string;
    room: RoomType;
    frequency: FrequencyType;
    description: string;
    pointValue: number;
    assignedDays?: number[];
    interval?: number;
    instances: Chore[]; // All chore rows with this name
    activeCount: number;
}

// =============================================================================
// COLLAPSIBLE ROOM SECTION
// =============================================================================

interface CollapsibleRoomProps {
    room: typeof ROOMS[0];
    templates: ChoreTemplate[];
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: (template: ChoreTemplate) => void;
    onDelete: (template: ChoreTemplate) => void;
}

const CollapsibleRoom: React.FC<CollapsibleRoomProps> = ({
    room, templates, isExpanded, onToggle, onEdit, onDelete
}) => {
    const getFrequencyLabel = (template: ChoreTemplate) => {
        if (template.frequency === 'daily') return 'Daily';
        if (template.frequency === 'weekly') {
            const days = template.assignedDays?.map(d => WEEKDAYS[d].charAt(0)).join(', ');
            return days || 'Weekly';
        }
        if (template.frequency === 'interval') return `Every ${template.interval || 3}d`;
        if (template.frequency === 'as_needed') return 'As Needed';
        return '';
    };

    return (
        <View style={styles.roomSection}>
            {/* Room Header - Tappable */}
            <TouchableOpacity
                style={styles.roomHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.roomHeaderLeft}>
                    <View style={[styles.roomIconWrap, { backgroundColor: room.color + '20' }]}>
                        <Text style={styles.roomIcon}>{room.icon}</Text>
                    </View>
                    <View>
                        <Text style={styles.roomName}>{room.name}</Text>
                        <Text style={styles.roomCount}>
                            {templates.length} {templates.length === 1 ? 'chore' : 'chores'}
                        </Text>
                    </View>
                </View>
                <View style={styles.roomHeaderRight}>
                    <View style={[styles.choreCountBadge, { backgroundColor: room.color + '20' }]}>
                        <Text style={[styles.choreCountText, { color: room.color }]}>
                            {templates.length}
                        </Text>
                    </View>
                    <Animated.View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                        <Feather name="chevron-down" size={20} color={COLORS.textSecondary} />
                    </Animated.View>
                </View>
            </TouchableOpacity>

            {/* Expandable Content */}
            {isExpanded && (
                <View style={styles.choreList}>
                    {templates.map(template => (
                        <TouchableOpacity
                            key={template.name}
                            style={styles.choreCard}
                            onPress={() => onEdit(template)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.choreIconContainer, { backgroundColor: room.color + '12' }]}>
                                <Text style={styles.choreIcon}>{getDisplayIcon(template.icon)}</Text>
                            </View>
                            <View style={styles.choreInfo}>
                                <Text style={styles.choreName}>{template.name}</Text>
                                <View style={styles.choreMetaRow}>
                                    <View style={styles.frequencyBadge}>
                                        <Feather name="repeat" size={10} color={COLORS.primary} />
                                        <Text style={styles.frequencyText}>
                                            {getFrequencyLabel(template)}
                                        </Text>
                                    </View>
                                    {template.activeCount > 0 && (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeText}>
                                                {template.activeCount} active
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDelete(template)}
                            >
                                <Feather name="trash-2" size={16} color={COLORS.error} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

export const ChoreManagementScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { chores, assignments, addChore, updateChore, removeChore, generateAssignments } = useChoreStore();
    const { household } = useHouseholdStore();
    const { user } = useAuthStore();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChoreTemplate | null>(null);
    const [formData, setFormData] = useState<ChoreFormData>(defaultFormData);
    const [expandedRooms, setExpandedRooms] = useState<Record<RoomType, boolean>>({
        kitchen: true, bathroom: true, living_room: false,
        bedroom: false, dining: false, other: false,
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Deduplicate chores by name and group by room
    const templatesByRoom = useMemo(() => {
        const grouped: Record<RoomType, ChoreTemplate[]> = {
            kitchen: [], bathroom: [], living_room: [],
            bedroom: [], dining: [], other: [],
        };

        // Group chores by name to deduplicate
        const byName: Record<string, Chore[]> = {};
        chores.filter(c => c.isActive).forEach(chore => {
            const key = chore.name.toLowerCase().trim();
            if (!byName[key]) byName[key] = [];
            byName[key].push(chore);
        });

        // Convert to templates
        Object.entries(byName).forEach(([_, instances]) => {
            const first = instances[0];
            const room = first.room || 'other';

            // Count active assignments for these chore instances
            const choreIds = new Set(instances.map(c => c.id));
            const activeCount = assignments.filter(
                a => choreIds.has(a.choreId) && !a.completedAt
            ).length;

            const template: ChoreTemplate = {
                name: first.name,
                icon: first.icon,
                room: room,
                frequency: first.frequency,
                description: first.description || '',
                pointValue: first.pointValue,
                assignedDays: first.assignedDays,
                interval: first.interval,
                instances,
                activeCount,
            };

            if (grouped[room]) {
                grouped[room].push(template);
            }
        });

        // Sort each room's templates alphabetically
        Object.keys(grouped).forEach(room => {
            grouped[room as RoomType].sort((a, b) => a.name.localeCompare(b.name));
        });

        return grouped;
    }, [chores, assignments]);

    // Filter by search
    const filteredTemplatesByRoom = useMemo(() => {
        if (!searchQuery.trim()) return templatesByRoom;

        const query = searchQuery.toLowerCase();
        const filtered: Record<RoomType, ChoreTemplate[]> = {
            kitchen: [], bathroom: [], living_room: [],
            bedroom: [], dining: [], other: [],
        };

        Object.entries(templatesByRoom).forEach(([room, templates]) => {
            filtered[room as RoomType] = templates.filter(t =>
                t.name.toLowerCase().includes(query)
            );
        });

        return filtered;
    }, [templatesByRoom, searchQuery]);

    // Total counts
    const totalTemplates = Object.values(templatesByRoom).flat().length;
    const totalActive = Object.values(templatesByRoom).flat()
        .reduce((sum, t) => sum + t.activeCount, 0);

    // Handle opening edit modal when navigating with editChoreId
    useEffect(() => {
        const editChoreId = route.params?.editChoreId;
        if (editChoreId && chores.length > 0) {
            // Find the chore to edit
            const choreToEdit = chores.find(c => c.id === editChoreId);
            if (choreToEdit) {
                // Find or create the template for this chore
                const allTemplates = Object.values(templatesByRoom).flat();
                const template = allTemplates.find(t =>
                    t.instances.some(inst => inst.id === editChoreId)
                );
                if (template) {
                    // Expand the room section
                    setExpandedRooms(prev => ({ ...prev, [choreToEdit.room]: true }));
                    // Open edit modal after a brief delay for UI to settle
                    setTimeout(() => {
                        setEditingTemplate(template);
                        setFormData({
                            name: template.name,
                            description: template.description || '',
                            icon: getDisplayIcon(template.icon),
                            room: template.room,
                            frequency: template.frequency,
                            assignedDays: template.assignedDays || [1, 3, 5],
                            interval: template.interval || 3,
                            pointValue: template.pointValue,
                            isPersonal: template.instances[0]?.isPersonal || false,
                        });
                        setIsModalVisible(true);
                    }, 300);
                }
            }
        }
    }, [route.params?.editChoreId, chores, templatesByRoom]);

    const toggleRoom = useCallback((room: RoomType) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRooms(prev => ({ ...prev, [room]: !prev[room] }));
    }, []);

    const openAddModal = () => {
        setEditingTemplate(null);
        setFormData(defaultFormData);
        setIsModalVisible(true);
    };

    const openEditModal = (template: ChoreTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            icon: getDisplayIcon(template.icon),
            room: template.room,
            frequency: template.frequency,
            assignedDays: template.assignedDays || [1, 3, 5],
            interval: template.interval || 3,
            pointValue: template.pointValue,
            isPersonal: template.instances[0]?.isPersonal || false,
        });
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !household?.id) {
            Alert.alert('Error', 'Please enter a chore name');
            return;
        }

        if (editingTemplate && editingTemplate.instances.length > 0) {
            // Update all instances with the same name
            const updates = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                icon: formData.icon,
                room: formData.room,
                frequency: formData.frequency,
                assignedDays: formData.frequency === 'weekly' ? formData.assignedDays : undefined,
                interval: formData.frequency === 'interval' ? formData.interval : undefined,
                pointValue: formData.pointValue,
            };
            // Update the first instance (or all if desired)
            for (const instance of editingTemplate.instances) {
                await updateChore(instance.id, updates);
            }
        } else {
            // Create new chore
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
                isPersonal: formData.isPersonal,
                personalOwnerId: formData.isPersonal ? user?.id : undefined,
            });

            // Generate assignments for the new chore for the next 7 days
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            await generateAssignments(household.id, today, nextWeek);
        }

        setIsModalVisible(false);
        setFormData(defaultFormData);
        setEditingTemplate(null);
    };

    const handleDelete = (template: ChoreTemplate) => {
        const confirmDelete = () => {
            // Delete all instances with this name
            template.instances.forEach(chore => {
                removeChore(chore.id);
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete "${template.name}"? This will remove all ${template.instances.length} instance(s).`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                'Delete Chore Template',
                `This will delete "${template.name}" and all ${template.instances.length} instance(s). Continue?`,
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

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Chore Library</Text>
                    <Text style={styles.headerSubtitle}>
                        {totalTemplates} templates · {totalActive} active
                    </Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Feather name="plus" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color={COLORS.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search chores..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={18} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Room Sections */}
                {ROOMS.map(room => {
                    const templates = filteredTemplatesByRoom[room.id];
                    if (templates.length === 0 && !searchQuery) return null;

                    return (
                        <CollapsibleRoom
                            key={room.id}
                            room={room}
                            templates={templates}
                            isExpanded={expandedRooms[room.id]}
                            onToggle={() => toggleRoom(room.id)}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    );
                })}

                {/* Empty state */}
                {totalTemplates === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📋</Text>
                        <Text style={styles.emptyTitle}>No Chores Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first chore template to get started
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
                            {editingTemplate ? 'Edit Template' : 'New Chore Template'}
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
                            placeholder="e.g., Do Dishes"
                            placeholderTextColor={COLORS.textTertiary}
                            value={formData.name}
                            onChangeText={name => setFormData(prev => ({ ...prev, name }))}
                        />

                        {/* Description */}
                        <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add details..."
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
                            {(['daily', 'weekly', 'interval', 'as_needed'] as FrequencyType[]).map(freq => (
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
                                        {freq === 'daily' ? 'Daily' : freq === 'weekly' ? 'Weekly' : freq === 'interval' ? 'Every X days' : 'As Needed'}
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



                        {/* Personal Chore Toggle */}
                        <View style={styles.personalToggleContainer}>
                            <View style={styles.personalToggleInfo}>
                                <Text style={styles.inputLabel}>PERSONAL CHORE</Text>
                                <Text style={styles.personalToggleHint}>
                                    Personal chores don't rotate - always assigned to you
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    formData.isPersonal && styles.toggleButtonActive
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, isPersonal: !prev.isPersonal }))}
                            >
                                <View style={[
                                    styles.toggleKnob,
                                    formData.isPersonal && styles.toggleKnobActive
                                ]} />
                            </TouchableOpacity>
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
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    // Room section is the outer container
    roomSection: {
        marginBottom: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray700,
        backgroundColor: COLORS.gray900,
    },
    // Room header is prominent - acts as the container title
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.gray800, // Darker to stand out
    },
    roomHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roomIconWrap: {
        width: 52, // Larger icon
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roomIcon: {
        fontSize: 26, // Bigger emoji
    },
    roomName: {
        fontSize: FONT_SIZE.lg, // Larger text
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    roomCount: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    roomHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    choreCountBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        minWidth: 28,
        alignItems: 'center',
    },
    choreCountText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    // Chore list is the nested content area
    choreList: {
        backgroundColor: COLORS.gray900, // Lighter than header
        paddingTop: SPACING.xs,
    },
    // Chore cards are smaller, indented items
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.sm,
        marginBottom: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
    },
    choreIconContainer: {
        width: 36, // Smaller than room icon
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    choreIcon: {
        fontSize: 18, // Smaller than room emoji
    },
    choreInfo: {
        flex: 1,
    },
    choreName: {
        fontSize: FONT_SIZE.sm, // Smaller than room name
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    choreMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        flexWrap: 'wrap',
    },
    frequencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    frequencyText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '500',
    },
    pointsBadge: {
        backgroundColor: COLORS.warning + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    pointsText: {
        fontSize: 10,
        color: COLORS.warning,
        fontWeight: '600',
    },
    activeBadge: {
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    activeText: {
        fontSize: 10,
        color: COLORS.success,
        fontWeight: '600',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl * 2,
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
        fontWeight: '600',
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
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    pointOptionTextSelected: {
        color: COLORS.warning,
    },
    // Personal Chore Toggle
    personalToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    personalToggleInfo: {
        flex: 1,
    },
    personalToggleHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    toggleButton: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray700,
        padding: 2,
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: COLORS.primary,
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    toggleKnobActive: {
        alignSelf: 'flex-end',
    },
});
