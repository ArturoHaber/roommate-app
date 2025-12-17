import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { Expense, User } from '../types';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  paidByUser?: User | null;
  currentUserId: string;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  groceries: 'shopping-cart',
  utilities: 'zap',
  rent: 'home',
  supplies: 'package',
  other: 'more-horizontal',
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  paidByUser,
  currentUserId,
  onPress,
}) => {
  const isPaidByMe = expense.paidBy === currentUserId;
  const mySplit = expense.splits?.find((s) => s.userId === currentUserId);
  const myAmount = mySplit?.amount || 0;
  const categoryColor = COLORS.categories[expense.category] || COLORS.gray500;

  return (
    <Card style={styles.container} onPress={onPress} variant="elevated">
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
            <Feather
              name={CATEGORY_ICONS[expense.category] as any}
              size={20}
              color={categoryColor}
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.description} numberOfLines={1}>
              {expense.description}
            </Text>
            <View style={styles.meta}>
              <Avatar
                name={paidByUser?.name || 'Deleted'}
                color={paidByUser?.avatarColor || COLORS.gray500}
                size="sm"
              />
              <Text style={styles.paidBy}>
                {isPaidByMe ? 'You paid' : `${(paidByUser?.name || 'Deleted User').split(' ')[0]} paid`}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.date}>
                {format(new Date(expense.createdAt), 'MMM d')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.totalAmount}>
            ${expense.amount.toFixed(2)}
          </Text>
          {!isPaidByMe && mySplit && !mySplit.paid && (
            <View style={styles.oweBadge}>
              <Text style={styles.oweText}>
                You owe ${myAmount.toFixed(2)}
              </Text>
            </View>
          )}
          {isPaidByMe && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>
                Split ${myAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
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
  description: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  paidBy: {
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
  date: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  totalAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  oweBadge: {
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  oweText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.error,
  },
  paidBadge: {
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  paidText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.secondary,
  },
});
