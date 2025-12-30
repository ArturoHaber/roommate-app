import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useExpenseStore } from '../stores/useExpenseStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { Avatar } from '../components/Avatar';
import { ExpandableFAB } from '../components/ExpandableFAB';
import { AuthGateModal, useIsAnonymous } from '../components/AuthGateModal';

export const FinanceTab = () => {
  const { user } = useAuthStore();
  const { expenses, addExpense, getTotalOwed, getTotalOwedToMe, markSplitPaid, getBalances, initializeSampleExpenses } = useExpenseStore();
  const { members, household } = useHouseholdStore();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'groceries' | 'utilities' | 'rent' | 'supplies' | 'other'>('groceries');
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // iOS workaround for tintColor bug
  const [spinnerColor, setSpinnerColor] = useState(Platform.OS === 'ios' ? undefined : '#FFFFFF');

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-initialize expenses to fetch latest data
      if (household && members.length > 0) {
        const memberIds = members.map(m => m.id);
        // Simulate refresh delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('[ExpensesScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [household, members]);

  // Check if user is anonymous
  const isUserAnonymous = useIsAnonymous();

  // Initialize sample expenses if needed
  useEffect(() => {
    if (household && members.length > 0 && expenses.length === 0) {
      const memberIds = members.map(m => m.id);
      initializeSampleExpenses(household.id, memberIds);
    }
  }, [household, members.length, expenses.length]);

  // iOS workaround: Set tintColor after mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const timer = setTimeout(() => {
        setSpinnerColor('#FFFFFF');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!user) return null;

  // Calculate real balances
  const totalOwed = getTotalOwed(user.id);
  const totalOwedToMe = getTotalOwedToMe(user.id);
  const netBalance = totalOwedToMe - totalOwed;
  const isOwe = netBalance < 0;

  // Get balances for the ledger
  const memberIds = members.map(m => m.id);
  const balances = getBalances(memberIds);

  // Build ledger items from expenses
  const ledgerItems = expenses.slice(0, 5).map(expense => {
    // If paidBy is present but not in members, it's a deleted user
    // However, if paidBy is NULL (from new migration), we also treat as deleted
    const isMe = expense.paidBy === user.id;
    const isDeleted = !isMe && !members.find(m => m.id === expense.paidBy);

    const payer = isMe
      ? { id: user.id, name: 'You', avatarColor: user.avatarColor }
      : (members.find(m => m.id === expense.paidBy) || {
        id: 'deleted',
        name: 'Deleted User',
        avatarColor: COLORS.gray500
      });

    const mySplit = expense.splits?.find(s => s.userId === user.id);
    const iOwe = expense.paidBy !== user.id && mySplit && !mySplit.paid;
    const theyOwe = expense.paidBy === user.id && expense.splits?.some(s => s.userId !== user.id && !s.paid);

    // Find who owes for display
    const owingUsers = expense.splits?.filter(s => s.userId !== expense.paidBy && !s.paid) || [];

    return {
      id: expense.id,
      payer,
      description: expense.description,
      amount: iOwe && mySplit ? mySplit.amount : (theyOwe ? (expense.splits?.filter(s => !s.paid && s.userId !== expense.paidBy).reduce((sum, s) => sum + s.amount, 0) || 0) : 0),
      iOwe,
      theyOwe,
      category: expense.category,
      date: format(new Date(expense.createdAt), 'MMM d'),
    };
  }).filter(item => item.iOwe || item.theyOwe);

  const handleSettle = (expenseId: string, payerName: string, amount: number) => {
    Alert.alert(
      "Settle Up?",
      `Mark payment of $${amount.toFixed(2)} to ${payerName} as complete?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            markSplitPaid(expenseId, user.id);
            Alert.alert("✓ Paid!", "Balance updated.");
          }
        }
      ]
    );
  };

  const handleRemind = (userName: string) => {
    Alert.alert("👋 Reminder Sent!", `${userName} has been nudged about the payment.`);
  };

  const handleAddExpense = () => {
    if (!amount || !title || !household) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    const memberIds = members.map(m => m.id);
    const splitAmount = amountNum / memberIds.length;

    addExpense({
      householdId: household.id,
      paidBy: user.id,
      amount: amountNum,
      description: title,
      category,
      splitType: 'equal',
      splits: memberIds.map(id => ({
        userId: id,
        amount: splitAmount,
        paid: id === user.id,
      })),
    });

    setIsAddModalVisible(false);
    setTitle('');
    setAmount('');
    setCategory('groceries');
    Alert.alert("✓ Added!", `$${amountNum.toFixed(2)} expense added and split with everyone.`);
  };

  const handleOpenAddExpense = () => {
    if (isUserAnonymous) {
      setShowAuthGate(true);
      return;
    }
    setIsAddModalVisible(true);
  };

  const FABActions = [
    {
      icon: 'plus' as const,
      label: 'Add Expense',
      onPress: handleOpenAddExpense,
    },
    {
      icon: 'camera' as const,
      label: 'Scan Receipt',
      onPress: () => Alert.alert("Coming Soon", "Receipt scanning is next!"),
      color: COLORS.secondary
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ height: SPACING.xl }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={spinnerColor}
            colors={['#818CF8']}
            progressBackgroundColor={COLORS.gray800}
            progressViewOffset={Platform.OS === 'android' ? 0 : 10}
          />
        }
      >
        {/* Hero Status Card */}
        <LinearGradient
          colors={[COLORS.gray900, COLORS.gray800] as const}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Net Balance</Text>
            <View style={[styles.statusBadge, isOwe ? styles.badgeOwe : styles.badgeSettled]}>
              <Text style={[styles.statusText, isOwe ? { color: COLORS.warning } : { color: COLORS.success }]}>
                {netBalance === 0 ? 'All Settled' : isOwe ? 'You Owe' : 'Owed to You'}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroAmount, isOwe ? { color: COLORS.warning } : netBalance > 0 ? { color: COLORS.success } : { color: COLORS.textPrimary }]}>
            {netBalance === 0 ? '$0.00' : `${isOwe ? '-' : '+'}$${Math.abs(netBalance).toFixed(2)}`}
          </Text>

          <Text style={styles.heroSubtitle}>
            {netBalance === 0 ? 'You are all caught up!' :
              isOwe ? `You owe $${totalOwed.toFixed(2)} to roommates` :
                `Roommates owe you $${totalOwedToMe.toFixed(2)}`}
          </Text>
        </LinearGradient>

        {/* Recent Expenses / Ledger */}
        <Text style={styles.sectionTitle}>Outstanding Balances</Text>

        {ledgerItems.length > 0 ? (
          <View style={styles.ledgerList}>
            {ledgerItems.map((item) => {
              const displayMember = item.iOwe ? item.payer :
                members.find(m => expenses.find(e => e.id === item.id)?.splits?.find(s => s.userId === m.id && !s.paid));

              return (
                <View key={item.id} style={styles.ledgerRow}>
                  <View style={styles.userRow}>
                    <Avatar
                      name={displayMember?.name || 'User'}
                      color={displayMember?.avatarColor || COLORS.gray600}
                      size="md"
                    />
                    <View>
                      <Text style={styles.ledgerName}>
                        {item.iOwe ? (item.payer?.name === 'You' ? 'You' : item.payer?.name) : 'Roommates'}
                      </Text>
                      <Text style={styles.ledgerContext}>{item.description}</Text>
                    </View>
                  </View>
                  <View style={styles.amountActions}>
                    <Text style={[styles.ledgerAmount, { color: item.iOwe ? COLORS.error : COLORS.success }]}>
                      {item.iOwe ? `-$${item.amount.toFixed(2)}` : `+$${item.amount.toFixed(2)}`}
                    </Text>
                    {item.iOwe ? (
                      <TouchableOpacity
                        style={styles.settleButton}
                        onPress={() => handleSettle(item.id, item.payer?.name || 'Roommate', item.amount)}
                      >
                        <Text style={styles.settleButtonText}>Settle</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.settleButton, styles.remindButton]}
                        onPress={() => handleRemind('Roommates')}
                      >
                        <Text style={[styles.settleButtonText, { color: COLORS.textSecondary }]}>Remind</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💰</Text>
            <Text style={styles.emptyText}>No outstanding balances</Text>
            <Text style={styles.emptySubtext}>Add an expense to split with roommates</Text>
          </View>
        )}

        {/* Recent Transactions */}
        {expenses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Recent Transactions</Text>
            <View style={styles.transactionList}>
              {expenses.slice(0, 5).map(expense => {
                const payer = members.find(m => m.id === expense.paidBy) ||
                  (expense.paidBy === user.id
                    ? { name: 'You', avatarColor: user.avatarColor }
                    : { name: 'Deleted User', avatarColor: COLORS.gray500 });
                return (
                  <View key={expense.id} style={styles.transactionRow}>
                    <View style={styles.transactionIcon}>
                      <Feather
                        name={expense.category === 'groceries' ? 'shopping-cart' :
                          expense.category === 'utilities' ? 'zap' :
                            expense.category === 'rent' ? 'home' : 'tag'}
                        size={16}
                        color={COLORS.textSecondary}
                      />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionTitle}>{expense.description}</Text>
                      <Text style={styles.transactionMeta}>
                        {payer?.name} paid • {format(new Date(expense.createdAt), 'MMM d')}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmount}>${expense.amount.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <ExpandableFAB actions={FABActions} />

      {/* Add Expense Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Expense</Text>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <Feather name="x" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.gray700}
                keyboardType="numeric"
                autoFocus
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>For what?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Costco Run"
                placeholderTextColor={COLORS.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(['Groceries', 'Utilities', 'Rent', 'Supplies', 'Other'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat.toLowerCase() && styles.categoryChipActive
                    ]}
                    onPress={() => setCategory(cat.toLowerCase() as typeof category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      category === cat.toLowerCase() && styles.categoryTextActive
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.splitSection}>
              <Text style={styles.inputLabel}>Split with</Text>
              <View style={styles.splitAvatars}>
                <Avatar name="All" color={COLORS.primary} size="md" />
                <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>
                  Everyone ({members.length} people)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (!amount || !title) && styles.saveButtonDisabled]}
              onPress={handleAddExpense}
              disabled={!amount || !title}
            >
              <Text style={styles.saveButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Auth Gate Modal */}
      <AuthGateModal
        visible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        action="expense"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  heroCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray800,
    ...SHADOWS.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeOwe: {
    backgroundColor: COLORS.warning + '15',
  },
  badgeSettled: {
    backgroundColor: COLORS.success + '15',
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  ledgerList: {
    gap: SPACING.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ledgerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ledgerContext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  amountActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  ledgerAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  settleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  remindButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  settleButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  transactionList: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray800,
    overflow: 'hidden',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  transactionMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalContent: {
    padding: SPACING.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    minWidth: 100,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray800,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  splitSection: {
    marginBottom: SPACING.xl,
  },
  splitAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray800,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
});
