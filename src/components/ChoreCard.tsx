import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { Chore, ChoreAssignment, User } from '../types';
import { format, isToday, isTomorrow } from 'date-fns';

interface ChoreCardProps {
  chore: Chore;
  assignment: ChoreAssignment;
  assignedUser: User;
  onComplete: () => void;
  onPress?: () => void;
  isMyChore?: boolean;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  assignment,
  assignedUser,
  onComplete,
  onPress,
  isMyChore = false,
}) => {
  const isCompleted = !!assignment.completedAt;
  
  const getDueDateText = () => {
    const dueDate = new Date(assignment.dueDate);
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    return format(dueDate, 'EEE, MMM d');
  };

  const getPointColor = () => {
    if (chore.pointValue <= 2) return COLORS.chorePoints.easy;
    if (chore.pointValue <= 4) return COLORS.chorePoints.medium;
    return COLORS.chorePoints.hard;
  };

  return (
    <Card 
      style={[styles.container, isCompleted && styles.completed]}
      onPress={onPress}
      variant="elevated"
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: isCompleted ? COLORS.gray200 : COLORS.primaryLight + '20' }]}>
            <Feather 
              name={chore.icon as any} 
              size={20} 
              color={isCompleted ? COLORS.gray400 : COLORS.primary} 
            />
          </View>
          
          <View style={styles.info}>
            <Text style={[styles.title, isCompleted && styles.completedText]}>
              {chore.name}
            </Text>
            <View style={styles.meta}>
              <Avatar name={assignedUser.name} color={assignedUser.avatarColor} size="sm" />
              <Text style={styles.assignee}>
                {isMyChore ? 'You' : assignedUser.name.split(' ')[0]}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.dueDate}>{getDueDateText()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.pointsBadge, { backgroundColor: getPointColor() + '20' }]}>
            <Text style={[styles.pointsText, { color: getPointColor() }]}>
              +{chore.pointValue} pts
            </Text>
          </View>
          
          {!isCompleted && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={onComplete}
              activeOpacity={0.7}
            >
              <Feather name="check-circle" size={28} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
          
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Feather name="check" size={16} color={COLORS.white} />
            </View>
          )}
        </View>
      </View>
      
      {assignment.isBonus && (
        <View style={styles.bonusBanner}>
          <Feather name="star" size={12} color={COLORS.accent} />
          <Text style={styles.bonusText}>Bonus! +50% points</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  completed: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  assignee: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  dueDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  pointsBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  pointsText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  completeButton: {
    padding: SPACING.xs,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bonusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHT.medium,
  },
});
