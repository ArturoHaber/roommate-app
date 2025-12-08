import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { User, LeaderboardEntry } from '../types';

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  users: User[];
  currentUserId: string;
}

const RANK_COLORS = [
  COLORS.warning, // Gold
  COLORS.gray400, // Silver
  '#CD7F32',      // Bronze
];

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  entries,
  users,
  currentUserId,
}) => {
  const getUserById = (id: string) => users.find((u) => u.id === id);

  if (entries.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Feather name="award" size={20} color={COLORS.primary} />
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <Text style={styles.emptyText}>
          Complete chores to see rankings!
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.container} padding="none">
      <View style={styles.headerPadded}>
        <Feather name="award" size={20} color={COLORS.primary} />
        <Text style={styles.title}>This Week's Leaderboard</Text>
      </View>
      
      {entries.slice(0, 5).map((entry, index) => {
        const user = getUserById(entry.userId);
        if (!user) return null;
        
        const isCurrentUser = entry.userId === currentUserId;
        const isTop3 = index < 3;
        
        return (
          <View 
            key={entry.userId} 
            style={[
              styles.row,
              isCurrentUser && styles.currentUserRow,
              index === entries.length - 1 && styles.lastRow,
            ]}
          >
            <View style={styles.rankContainer}>
              {isTop3 ? (
                <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[index] }]}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
              ) : (
                <Text style={styles.rankNumber}>{index + 1}</Text>
              )}
            </View>
            
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            
            <View style={styles.userInfo}>
              <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                {isCurrentUser ? 'You' : user.name.split(' ')[0]}
              </Text>
              <Text style={styles.stats}>
                {entry.completedChores} chores
                {entry.bonusChores > 0 && ` • ${entry.bonusChores} bonus`}
              </Text>
            </View>
            
            <View style={styles.pointsContainer}>
              <Text style={[styles.points, isTop3 && { color: RANK_COLORS[index] }]}>
                {Math.round(entry.points)}
              </Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerPadded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  currentUserRow: {
    backgroundColor: COLORS.primary + '08',
  },
  lastRow: {
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  rankNumber: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  currentUserName: {
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  stats: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  pointsLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
});
