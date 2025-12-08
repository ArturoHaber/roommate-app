import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import * as Clipboard from 'expo-clipboard';

// Mock Data
const MEMBERS = [
    { id: 'u1', name: 'Alex', color: '#818CF8', role: 'Admin' },
    { id: 'u2', name: 'Sam', color: '#34D399', role: 'Member' },
    { id: 'u3', name: 'Jordan', color: '#F472B6', role: 'Member' },
    { id: 'u4', name: 'Casey', color: '#FBBF24', role: 'Member' },
];

const WIFI_INFO = {
    ssid: 'TheLoft_5G',
    password: 'pizza-planet-408',
};

export const HouseholdSettings = () => {
    const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
    const [isMemberMenuVisible, setIsMemberMenuVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState<typeof MEMBERS[0] | null>(null);
    const [houseName, setHouseName] = useState('The Loft 408');
    const [houseEmoji, setHouseEmoji] = useState('🏠');
    const [isVacationMode, setIsVacationMode] = useState(false);
    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState('LOFT-408-X');

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // In a real app, show a toast here
    };

    const handleSaveProfile = () => {
        setIsEditProfileVisible(false);
        // In a real app, save to backend
    };

    const handleMemberAction = (action: string) => {
        console.log(`Action ${action} on ${selectedMember?.name}`);
        setIsMemberMenuVisible(false);
        setSelectedMember(null);
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
                    <Text style={styles.houseAddress}>123 Main St, Apt 408</Text>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditProfileVisible(true)}
                    >
                        <Feather name="edit-2" size={16} color={COLORS.white} />
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* Members Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <TouchableOpacity onPress={() => setIsInviteModalVisible(true)}>
                        <Text style={styles.linkText}>+ Invite</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    {MEMBERS.map((member, index) => (
                        <View key={member.id} style={[styles.memberRow, index !== MEMBERS.length - 1 && styles.borderBottom]}>
                            <View style={styles.memberInfo}>
                                <Avatar name={member.name} color={member.color} size="sm" />
                                <View>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberRole}>{member.role}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedMember(member);
                                    setIsMemberMenuVisible(true);
                                }}
                            >
                                <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
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
                            <Text style={styles.wifiValue}>{WIFI_INFO.ssid}</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard(WIFI_INFO.ssid)} style={styles.copyButton}>
                            <Feather name="copy" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.wifiRow}>
                        <View style={styles.wifiIcon}>
                            <Feather name="lock" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.wifiContent}>
                            <Text style={styles.wifiLabel}>Password</Text>
                            <Text style={styles.wifiValue}>{WIFI_INFO.password}</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard(WIFI_INFO.password)} style={styles.copyButton}>
                            <Feather name="copy" size={18} color={COLORS.textSecondary} />
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
                            <Text style={styles.wifiValue}>Mr. Roper: 555-0123</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard('555-0123')} style={styles.copyButton}>
                            <Feather name="copy" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Invite Roommate</Text>
                            <TouchableOpacity onPress={() => setIsInviteModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Share this code with your roommate to let them join "The Loft 408".
                        </Text>

                        <TouchableOpacity
                            style={styles.codeContainer}
                            onPress={() => copyToClipboard(inviteCode)}
                        >
                            <Text style={styles.inviteCode}>{inviteCode}</Text>
                            <Feather name="copy" size={20} color={COLORS.primary} />
                        </TouchableOpacity>

                        <Text style={styles.codeExpiry}>Expires in 48 hours</Text>

                        <TouchableOpacity style={styles.shareButton}>
                            <Text style={styles.shareButtonText}>Share Code</Text>
                        </TouchableOpacity>
                    </View>
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit House Profile</Text>
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
                            <Text style={styles.inputLabel}>House Emoji</Text>
                            <TextInput
                                style={styles.input}
                                value={houseEmoji}
                                onChangeText={setHouseEmoji}
                                placeholder="e.g. 🏠"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>

                        <TouchableOpacity style={styles.shareButton} onPress={handleSaveProfile}>
                            <Text style={styles.shareButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
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
                    <View style={styles.modalContent}>
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
                    </View>
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
        marginBottom: SPACING.lg,
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
        ...SHADOWS.xl,
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
});
