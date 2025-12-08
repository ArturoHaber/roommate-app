import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Avatar, HouseholdSettings } from '../components';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';

type SettingsTab = 'personal' | 'household';

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
  const { user, logout } = useAuthStore();
  const { household, leaveHousehold } = useHouseholdStore();
  const { assignments, getLeaderboard } = useChoreStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');

  if (!user) return null;

  const leaderboard = getLeaderboard();
  const myStats = leaderboard.find(e => e.userId === user.id);
  const myCompletedChores = myStats?.completedChores || 0;
  const myPoints = myStats?.points || 0;
  const myBonusChores = myStats?.bonusChores || 0;

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            leaveHousehold();
            logout();
          }
        },
      ]
    );
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? You can rejoin with the invite code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveHousehold()
        },
      ]
    );
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
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Avatar name={user.name} color={user.avatarColor} size="xl" />
              <Text style={styles.userName}>{user.name}</Text>
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
                  icon="bell"
                  label="Notifications"
                  onPress={() => { }}
                />
                <View style={styles.divider} />
                <SettingsItem
                  icon="moon"
                  label="Dark Mode"
                  value="Coming soon"
                />
                <View style={styles.divider} />
                <SettingsItem
                  icon="help-circle"
                  label="Help & Support"
                  onPress={() => { }}
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
                      danger
                    />
                    <View style={styles.divider} />
                  </>
                )}
                <SettingsItem
                  icon="log-out"
                  label="Log Out"
                  onPress={handleLogout}
                  danger
                />
              </Card>
            </View>

            <Text style={styles.version}>Roommate App v1.0.0</Text>

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
});
