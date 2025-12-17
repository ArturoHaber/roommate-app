import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Alert,
  Platform,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Avatar, HouseholdSettings, LinkAccountModal } from '../components';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';

type SettingsTab = 'personal' | 'household';

// Avatar color options
const AVATAR_COLORS = ['#818CF8', '#34D399', '#F472B6', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA', '#2DD4BF'];

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  label,
  value,
  onPress,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
      <Feather
        name={icon as any}
        size={18}
        color={danger ? COLORS.error : COLORS.primary}
      />
    </View>
    <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>
      {label}
    </Text>
    {value && <Text style={styles.settingsValue}>{value}</Text>}
    {onPress && (
      <Feather name="chevron-right" size={20} color={COLORS.gray400} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const { user, signOut, updateProfile, deleteAccount } = useAuthStore();
  const { household, leaveHousehold } = useHouseholdStore();
  const { getLeaderboard } = useChoreStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatarColor, setEditAvatarColor] = useState('');

  if (!user) return null;

  const leaderboard = getLeaderboard();
  const myStats = leaderboard.find(e => e.userId === user.id);
  const myCompletedChores = myStats?.completedChores || 0;
  const myPoints = myStats?.points || 0;
  const myBonusChores = myStats?.bonusChores || 0;

  const handleLogout = () => {
    // Check if anonymous (no email implies anonymous in our system logic so far)
    if (!user.email) {
      setIsLinkModalVisible(true);
      return;
    }

    // Standard logout
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: () => signOut() // ONLY signOut, do not leave household
          },
        ]
      );
    }
  };

  const handleLeaveHousehold = () => {
    // Use window.confirm on web, Alert.alert on native
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to leave this household? You can rejoin with the invite code.')) {
        leaveHousehold(user.id);
      }
    } else {
      Alert.alert(
        'Leave Household',
        'Are you sure you want to leave this household? You can rejoin with the invite code.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => leaveHousehold(user.id)
          },
        ]
      );
    }
  };

  const openEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditAvatarColor(user.avatarColor || AVATAR_COLORS[0]);
    setIsEditProfileVisible(true);
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      updateProfile({
        name: editName.trim(),
        avatarColor: editAvatarColor,
      });
    }
    setIsEditProfileVisible(false);
  };

  const handleDeleteAccount = () => {
    const confirmationMessage = 'Are you sure you want to delete your account? This cannot be undone. All your data will be permanently removed.';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmationMessage)) {
        deleteAccount().catch(err => window.alert('Failed to delete account: ' + err.message));
      }
    } else {
      Alert.alert(
        'Delete Account',
        confirmationMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAccount();
              } catch (err: any) {
                Alert.alert('Error', 'Failed to delete account: ' + err.message);
              }
            }
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Tab Navigation */}
      <View style={styles.navContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'personal' && styles.navItemActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.navText, activeTab === 'personal' && styles.navTextActive]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'household' && styles.navItemActive]}
            onPress={() => setActiveTab('household')}
          >
            <Text style={[styles.navText, activeTab === 'household' && styles.navTextActive]}>Household</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>

        {/* PERSONAL TAB */}
        {activeTab === 'personal' && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header with Edit Button */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Avatar name={user.name} color={user.avatarColor} size="xl" />
                <TouchableOpacity style={styles.editAvatarButton} onPress={openEditProfile}>
                  <Feather name="edit-2" size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <TouchableOpacity style={styles.editNameButton} onPress={openEditProfile}>
                  <Feather name="edit-2" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* Stats */}
            <Card style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{myCompletedChores}</Text>
                  <Text style={styles.statLabel}>Chores Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.round(myPoints)}</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{myBonusChores}</Text>
                  <Text style={styles.statLabel}>Bonus Tasks</Text>
                </View>
              </View>
            </Card>

            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              <Card padding="none">
                <SettingsItem
                  icon="user"
                  label="Edit Profile"
                  onPress={openEditProfile}
                />
                <View style={styles.divider} />
                {household && (
                  <>
                    <SettingsItem
                      icon="home"
                      label="Household Settings"
                      onPress={() => setActiveTab('household')}
                    />
                    <View style={styles.divider} />
                  </>
                )}
                <SettingsItem
                  icon="bell"
                  label="Notifications"
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.alert('Push notification settings will be available soon!');
                    } else {
                      Alert.alert('Notifications', 'Push notification settings will be available soon!', [{ text: 'OK' }]);
                    }
                  }}
                />
                <View style={styles.divider} />
                <SettingsItem
                  icon="moon"
                  label="Dark Mode"
                  value="Always On"
                />
                <View style={styles.divider} />
                <SettingsItem
                  icon="help-circle"
                  label="Help & Support"
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      if (window.confirm('Need help with CribUp?\\n\\nContact: support@cribup.app\\n\\nClick OK to send an email.')) {
                        window.open('mailto:support@cribup.app?subject=CribUp%20Support', '_blank');
                      }
                    } else {
                      Alert.alert(
                        'Help & Support',
                        'Need help with CribUp?\n\n📧 Contact: support@cribup.app\n\n💡 Found a bug? Use the in-app feedback option.',
                        [
                          { text: 'Close' },
                          { text: 'Send Email', onPress: () => Linking.openURL('mailto:support@cribup.app?subject=CribUp%20Support') }
                        ]
                      );
                    }
                  }}
                />
              </Card>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
              <Card padding="none">
                {household && (
                  <>
                    <SettingsItem
                      icon="log-out"
                      label="Leave Household"
                      onPress={handleLeaveHousehold}
                    />
                    <View style={styles.divider} />
                  </>
                )}
                <SettingsItem
                  icon="log-out"
                  label="Log Out"
                  onPress={handleLogout}
                />
              </Card>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleDanger}>Danger Zone</Text>
              <Card padding="none" style={styles.dangerCard}>
                <SettingsItem
                  icon="trash-2"
                  label="Delete Account"
                  onPress={handleDeleteAccount}
                  danger
                />
                <View style={styles.dangerWarning}>
                  <Text style={styles.dangerWarningText}>
                    Permanently delete your account and all associated data.
                  </Text>
                </View>
              </Card>
            </View>

            {/* Developer Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Developer</Text>
              <Card padding="none">
                <SettingsItem
                  icon="play"
                  label="Replay Onboarding"
                  onPress={() => {
                    // Clear household to trigger onboarding
                    useHouseholdStore.getState().clearHousehold();
                  }}
                />
              </Card>
            </View>

            <Text style={styles.version}>CribUp v1.0.0 (Dev)</Text>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {/* HOUSEHOLD TAB */}
        {activeTab === 'household' && (
          <View style={styles.householdContainer}>
            {household ? (
              <HouseholdSettings />
            ) : (
              <View style={styles.emptyState}>
                <Feather name="home" size={48} color={COLORS.gray600} />
                <Text style={styles.emptyStateText}>No household joined</Text>
                <Text style={styles.emptyStateSubtext}>Join or create a household to see settings.</Text>
              </View>
            )}
          </View>
        )}

      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsEditProfileVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <Feather name="x" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Avatar Preview */}
            <View style={styles.avatarPreview}>
              <Avatar name={editName || 'U'} color={editAvatarColor} size="xl" />
            </View>

            {/* Avatar Color Picker */}
            <Text style={styles.inputLabel}>Avatar Color</Text>
            <View style={styles.colorPicker}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editAvatarColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setEditAvatarColor(color)}
                >
                  {editAvatarColor === color && (
                    <Feather name="check" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Email Display (read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{user.email}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <LinkAccountModal
        visible={isLinkModalVisible}
        onClose={() => setIsLinkModalVisible(false)}
        onSuccess={() => {
          // User linked account successfully. 
          // We can show a toast or just close.
          // They are now permanent, so next logout will be standard.
          setIsLinkModalVisible(false);
        }}
        onDelete={async () => {
          await deleteAccount();
          setIsLinkModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Navigation Bar (Same as HouseholdScreen)
  navContainer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  navItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  navItemActive: {
    backgroundColor: COLORS.gray800,
    ...SHADOWS.sm,
  },
  navText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  navTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  // Content
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  userEmail: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsCard: {
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingsIconDanger: {
    backgroundColor: COLORS.error + '15',
  },
  settingsLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  settingsLabelDanger: {
    color: COLORS.error,
  },
  settingsValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md + 36 + SPACING.md,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
  },
  bottomSpacer: {
    height: 100,
  },
  // Household Tab
  householdContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  // Avatar & Name Edit
  avatarContainer: {
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  editNameButton: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: 360,
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
  avatarPreview: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  inputGroup: {
    marginBottom: SPACING.md,
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
  inputDisabled: {
    opacity: 0.6,
  },
  inputDisabledText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  sectionTitleDanger: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.error,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: COLORS.error,
    overflow: 'hidden',
  },
  dangerWarning: {
    padding: SPACING.md,
    backgroundColor: COLORS.error + '10', // Light red background
    borderTopWidth: 1,
    borderTopColor: COLORS.error + '20',
  },
  dangerWarningText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    textAlign: 'center',
  },
});
