import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Platform, Share, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons'
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import * as Clipboard from 'expo-clipboard';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';

const HOUSE_EMOJIS = ['🏠', '🏡', '🏢', '🏘️', '🏰', '🛖', '🏗️', '🌆', '🌃', '🌇'];

export const HouseholdSettings = () => {
    // Real data from stores
    const { household, members, memberships, essentials, updateHousehold, upsertEssential } = useHouseholdStore();
    const { user } = useAuthStore();

    const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
    const [isMemberMenuVisible, setIsMemberMenuVisible] = useState(false);
    const [isEssentialsModalVisible, setIsEssentialsModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(null);

    // Editing Essentials
    const [editingType, setEditingType] = useState<'wifi' | 'landlord'>('wifi');
    const [editingLabel, setEditingLabel] = useState('');
    const [editingValue, setEditingValue] = useState('');

    // Local UI state
    const [isWifiPassVisible, setIsWifiPassVisible] = useState(false);
    const [isLandlordVisible, setIsLandlordVisible] = useState(false); // Hidden until revealed

    // Initialize state from real household data
    const [houseName, setHouseName] = useState(household?.name || 'My Household');
    const [houseEmoji, setHouseEmoji] = useState(household?.emoji || '🏠');
    const [houseAddress, setHouseAddress] = useState(household?.address || 'No address set');
    const [isVacationMode, setIsVacationMode] = useState(user?.isVacationMode || false);
    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

    // Sync state when household data changes
    useEffect(() => {
        if (household) {
            setHouseName(household.name);
            setHouseEmoji(household.emoji);
            setHouseAddress(household.address || 'No address set');
        }
    }, [household]);

    // Get the real invite code from household
    const inviteCode = household?.inviteCode || '------';

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // Show feedback
        if (Platform.OS === 'web') {
            window.alert('Copied to clipboard!');
        }
    };

    const handleShareInvite = async () => {
        if (!household?.inviteCode) return;
        try {
            await Share.share({
                message: `Join my household "${household.name}" on Roommate App!\n\nUse code: ${household.inviteCode}\n\nOr click here: roommate-app://invite/${household.inviteCode}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveHousehold = async () => {
        if (houseName.trim()) {
            await updateHousehold({
                name: houseName.trim(),
                emoji: houseEmoji,
                address: houseAddress,
            });
        }
        setIsEditProfileVisible(false);
    };

    const handleSaveEssential = async () => {
        if (!editingValue.trim()) return; // Don't save empty? Or maybe allow deleting?

        await upsertEssential(
            editingType === 'wifi' ? 'wifi' : 'landlord',
            editingLabel,
            editingValue.trim()
        );
        setIsEssentialsModalVisible(false);
    };

    const openEditEssential = (type: 'wifi' | 'landlord', label: string, currentValue: string) => {
        setEditingType(type);
        setEditingLabel(label);
        setEditingValue(currentValue);
        setIsEssentialsModalVisible(true);
    };

    const handleMemberAction = (action: string) => {
        console.log(`Action ${action} on ${selectedMember?.name}`);
        setIsMemberMenuVisible(false);
        setSelectedMember(null);
    };

    // Get member role from memberships
    const getMemberRole = (userId: string): string => {
        const membership = memberships.find(m => m.userId === userId);
        return membership?.role === 'admin' ? 'Admin' : 'Member';
    };

    // Helper to get essential value
    const getEssentialValue = (type: string, label: string, fallback: string) => {
        const item = essentials?.find(e => e.type === type && e.label === label);
        return item ? item.value : fallback;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.hero}>
                <LinearGradient
                    colors={[COLORS.primary, '#4F46E5']}
                    style={styles.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.houseIcon}>
                        <Text style={styles.houseEmoji}>{houseEmoji}</Text>
                    </View>
                    <Text style={styles.houseName}>{houseName}</Text>

                    {/* Address with Copy Button */}
                    <TouchableOpacity
                        style={styles.addressRow}
                        onPress={() => copyToClipboard(houseAddress)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.houseAddress}>{houseAddress}</Text>
                        <View style={styles.addressCopyButton}>
                            <Feather name="copy" size={12} color="rgba(255,255,255,0.9)" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditProfileVisible(true)}
                    >
                        <Feather name="edit-2" size={16} color={COLORS.white} />
                        <Text style={styles.editButtonText}>Edit House</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* Members Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                </View>
                <View style={styles.card}>
                    {members.map((member, index: number) => (
                        <View key={member.id} style={[styles.memberRow, index !== members.length - 1 && styles.borderBottom]}>
                            <View style={styles.memberInfo}>
                                <Avatar name={member.name} color={member.avatarColor || COLORS.primary} size="sm" />
                                <View>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberRole}>{getMemberRole(member.id)}</Text>
                                </View>
                            </View>
                            {/* Only show menu for non-self members */}
                            {member.id !== user?.id && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedMember(member);
                                        setIsMemberMenuVisible(true);
                                    }}
                                >
                                    <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {/* Add Member Row */}
                    <TouchableOpacity
                        style={[styles.memberRow, styles.addMemberRow]}
                        onPress={() => setIsInviteModalVisible(true)}
                    >
                        <View style={styles.memberInfo}>
                            <View style={[styles.wifiIcon, styles.addMemberIcon]}>
                                <Feather name="plus" size={20} color={COLORS.textSecondary} />
                            </View>
                            <Text style={styles.addMemberText}>Add Member</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={COLORS.gray600} />
                    </TouchableOpacity>

                    {members.length === 0 && (
                        <Text style={styles.emptyText}>No members yet. Invite someone!</Text>
                    )}
                </View>
            </View>

            {/* Essentials Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Essentials</Text>

                {/* WiFi Card */}
                <View style={styles.card}>
                    <View style={styles.wifiRow}>
                        <View style={styles.wifiIcon}>
                            <Feather name="wifi" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.wifiContent}>
                            <Text style={styles.wifiLabel}>WiFi Network</Text>
                            <Text style={styles.wifiValue}>
                                {getEssentialValue('wifi', 'WiFi Name', 'Tap edit to add')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => openEditEssential('wifi', 'WiFi Name', getEssentialValue('wifi', 'WiFi Name', ''))}
                            style={styles.copyButton}
                        >
                            <Feather name="edit-2" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.wifiRow}>
                        <View style={styles.wifiIcon}>
                            <Feather name="lock" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.wifiContent}>
                            <Text style={styles.wifiLabel}>Password</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.wifiValue}>
                                    {isWifiPassVisible
                                        ? getEssentialValue('wifi', 'Password', 'Not set')
                                        : '••••••••'}
                                </Text>
                                <TouchableOpacity onPress={() => setIsWifiPassVisible(!isWifiPassVisible)}>
                                    <Feather name={isWifiPassVisible ? "eye-off" : "eye"} size={14} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={() => {
                            if (isWifiPassVisible) {
                                copyToClipboard(getEssentialValue('wifi', 'Password', ''));
                            } else {
                                openEditEssential('wifi', 'Password', getEssentialValue('wifi', 'Password', ''));
                            }
                        }}>
                            {/* If visible, show copy, else show edit? Or standard just edit? User asked for edit. Let's keep edit always accessible via button, but maybe copy if long press on text. Let's make this button always Edit for consistency unless we want a specific copy button. Existing UI had copy button on address. Let's keep it as Edit. */}
                            <Feather name="edit-2" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Landlord / Emergency Card */}
                <View style={[styles.card, { marginTop: SPACING.md }]}>
                    <View style={styles.wifiRow}>
                        <View style={[styles.wifiIcon, { backgroundColor: COLORS.error + '20' }]}>
                            <Feather name="phone-call" size={24} color={COLORS.error} />
                        </View>
                        <View style={styles.wifiContent}>
                            <Text style={styles.wifiLabel}>Emergency / Landlord</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.wifiValue}>
                                    {isLandlordVisible
                                        ? getEssentialValue('landlord', 'Number', 'Not set')
                                        : 'Tap Reveal to view'}
                                </Text>
                                {!isLandlordVisible && (
                                    <TouchableOpacity onPress={() => setIsLandlordVisible(true)}>
                                        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Reveal</Text>
                                    </TouchableOpacity>
                                )}
                                {isLandlordVisible && (
                                    <TouchableOpacity onPress={() => setIsLandlordVisible(false)}>
                                        <Feather name="eye-off" size={14} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row' }}>
                            {isLandlordVisible && (
                                <TouchableOpacity
                                    onPress={() => copyToClipboard(getEssentialValue('landlord', 'Number', ''))}
                                    style={[styles.copyButton, { marginRight: 4 }]}
                                >
                                    <Feather name="copy" size={18} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => openEditEssential('landlord', 'Number', getEssentialValue('landlord', 'Number', ''))}
                                style={styles.copyButton}
                            >
                                <Feather name="edit-2" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* My Preferences */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Preferences</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={styles.settingHeader}>
                                <Feather name="sun" size={18} color={COLORS.textPrimary} />
                                <Text style={styles.settingLabel}>Vacation Mode</Text>
                            </View>
                            <Text style={styles.settingDescription}>Pause chore assignments while you're away.</Text>
                        </View>
                        <Switch
                            value={isVacationMode}
                            onValueChange={setIsVacationMode}
                            trackColor={{ false: COLORS.gray700, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                        />
                    </View>
                </View>
            </View>

            <View style={{ height: 100 }} />

            {/* Invite Modal */}
            <Modal
                visible={isInviteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsInviteModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsInviteModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Invite Roommate</Text>
                            <TouchableOpacity onPress={() => setIsInviteModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Share this code with your roommate to let them join "{household?.name}".
                        </Text>

                        <TouchableOpacity
                            style={styles.codeContainer}
                            onPress={() => copyToClipboard(inviteCode)}
                        >
                            <Text style={styles.inviteCode}>{inviteCode}</Text>
                            <Feather name="copy" size={20} color={COLORS.primary} />
                        </TouchableOpacity>

                        <Text style={styles.codeExpiry}>
                            Expires {household?.inviteExpiresAt ? new Date(household.inviteExpiresAt).toLocaleDateString() : 'in 30 days'}
                        </Text>

                        <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
                            <Text style={styles.shareButtonText}>Share Code</Text>
                        </TouchableOpacity>
                    </Pressable>
                </TouchableOpacity>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditProfileVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsEditProfileVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsEditProfileVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit House</Text>
                            <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>House Name</Text>
                            <TextInput
                                style={styles.input}
                                value={houseName}
                                onChangeText={setHouseName}
                                placeholder="e.g. The Loft"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>House Icon</Text>
                            <View style={styles.emojiPickerGrid}>
                                {HOUSE_EMOJIS.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[
                                            styles.emojiPickerButton,
                                            houseEmoji === emoji && styles.emojiPickerButtonSelected
                                        ]}
                                        onPress={() => setHouseEmoji(emoji)}
                                    >
                                        <Text style={styles.emojiPickerText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>House Address</Text>
                            <TextInput
                                style={styles.input}
                                value={houseAddress}
                                onChangeText={setHouseAddress}
                                placeholder="e.g. 123 Main St, Apt 408"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>

                        <TouchableOpacity style={styles.shareButton} onPress={handleSaveHousehold}>
                            <Text style={styles.shareButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </Pressable>
                </TouchableOpacity>
            </Modal>

            {/* Member Menu Modal */}
            <Modal
                visible={isMemberMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMemberMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsMemberMenuVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage {selectedMember?.name}</Text>
                            <TouchableOpacity onPress={() => setIsMemberMenuVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleMemberAction('promote')}>
                            <Feather name="shield" size={20} color={COLORS.textPrimary} />
                            <Text style={styles.menuItemText}>Promote to Admin</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleMemberAction('nudge')}>
                            <Feather name="bell" size={20} color={COLORS.textPrimary} />
                            <Text style={styles.menuItemText}>Send Nudge</Text>
                        </TouchableOpacity>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleMemberAction('remove')}>
                            <Feather name="user-x" size={20} color={COLORS.error} />
                            <Text style={[styles.menuItemText, { color: COLORS.error }]}>Remove from House</Text>
                        </TouchableOpacity>
                    </Pressable>
                </TouchableOpacity>
            </Modal>

            {/* Edit Essentials Modal */}
            <Modal
                visible={isEssentialsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsEssentialsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsEssentialsModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Edit {editingLabel}
                            </Text>
                            <TouchableOpacity onPress={() => setIsEssentialsModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{editingLabel}</Text>
                            <TextInput
                                style={styles.input}
                                value={editingValue}
                                onChangeText={setEditingValue}
                                placeholder={`Enter ${editingLabel}`}
                                placeholderTextColor={COLORS.textSecondary}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity style={styles.shareButton} onPress={handleSaveEssential}>
                            <Text style={styles.shareButtonText}>Save</Text>
                        </TouchableOpacity>
                    </Pressable>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.lg,
    },
    hero: {
        marginBottom: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    heroGradient: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    houseIcon: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    houseEmoji: {
        fontSize: 32,
    },
    houseName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 4,
    },
    houseAddress: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.lg,
    },
    addressCopyButton: {
        width: 22,
        height: 22,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        gap: 8,
    },
    editButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: FONT_SIZE.sm,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: FONT_SIZE.sm,
    },
    card: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray700,
        overflow: 'hidden',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray700,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    memberName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    memberRole: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
    },
    wifiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.md,
    },
    wifiIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wifiContent: {
        flex: 1,
    },
    wifiLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    wifiValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    copyButton: {
        padding: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray700,
        marginLeft: 68, // Align with content
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    settingInfo: {
        flex: 1,
        marginRight: SPACING.md,
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: 4,
    },
    settingLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    settingDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    modalDescription: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gray800,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray700,
        borderStyle: 'dashed',
    },
    inviteCode: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    codeExpiry: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    shareButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    shareButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT_SIZE.md,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.md,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.md,
    },
    menuItemText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    modalDivider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginVertical: SPACING.sm,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
        padding: SPACING.lg,
    },
    addMemberRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray700,
        borderStyle: 'dashed', // dashed border top to separate from list
    },
    addMemberIcon: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.gray700,
        borderStyle: 'dashed',
    },
    addMemberText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    emojiPickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
        marginTop: SPACING.xs,
    },
    emojiPickerButton: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    emojiPickerButtonSelected: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    emojiPickerText: {
        fontSize: 24,
    },
});
