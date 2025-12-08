import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { Avatar } from '../components/Avatar';
import { ExpandableFAB } from '../components/ExpandableFAB';

export const ExpensesScreen = () => {
  const { user } = useAuthStore();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Add Expense State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('groceries');

  // Calculate Net Balance (Mock Logic)
  const netBalance = -5.50;
  const isOwe = netBalance < 0;

  const handleSettle = (name: string, amount: number) => {
    Alert.alert(
      "Settle Up?",
      `Mark payment of $${amount} to ${name} as complete?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => Alert.alert("Paid!", "Balance updated.") }
      ]
    );
  };

  const handleRemind = (name: string) => {
    Alert.alert(
      "Send Reminder",
      `Nudge ${name} about the $10.00?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send Nudge", onPress: () => Alert.alert("Sent!", `${name} has been verified.`) }
      ]
    );
  };

  const FABActions = [
    {
      icon: 'plus' as const,
      label: 'Add Expense',
      onPress: () => setIsAddModalVisible(true),
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
      {/* Header Removed as requested - Just padding */}
      <View style={{ height: SPACING.xl }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Status Card */}
        {/* User requested "Minimalist / Premium" - Moving away from the static orange/green blocks 
                    to a more sophisticated dark card with subtle gradients/accents */}
        <LinearGradient
          colors={[COLORS.gray900, COLORS.gray800]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Net Balance</Text>
            <View style={[styles.statusBadge, isOwe ? styles.badgeOwe : styles.badgeSettled]}>
              <Text style={[styles.statusText, isOwe ? { color: COLORS.warning } : { color: COLORS.success }]}>
                {isOwe ? 'Payment Due' : 'All Settled'}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroAmount, isOwe ? { color: COLORS.warning } : { color: COLORS.textPrimary }]}>
            {isOwe ? `-$${Math.abs(netBalance).toFixed(2)}` : '$0.00'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {isOwe ? 'You owe this amount to the house.' : 'You are all caught up!'}
          </Text>
        </LinearGradient>

        {/* The Ledger */}
        <Text style={styles.sectionTitle}>Breakdown</Text>

        <View style={styles.ledgerList}>
          {/* Mock Item 1 */}
          <View style={styles.ledgerRow}>
            <View style={styles.userRow}>
              <Avatar name="Sam" color="#34D399" size="md" />
              <View>
                <Text style={styles.ledgerName}>Sam</Text>
                <Text style={styles.ledgerContext}>Paid for Pizza Night</Text>
              </View>
            </View>
            <View style={styles.amountActions}>
              <Text style={[styles.ledgerAmount, { color: COLORS.error }]}>-$15.00</Text>
              <TouchableOpacity style={styles.settleButton} onPress={() => handleSettle('Sam', 15)}>
                <Text style={styles.settleButtonText}>Settle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mock Item 2 */}
          <View style={styles.ledgerRow}>
            <View style={styles.userRow}>
              <Avatar name="Casey" color="#FBBF24" size="md" />
              <View>
                <Text style={styles.ledgerName}>Casey</Text>
                <Text style={styles.ledgerContext}>Owes for Internet</Text>
              </View>
            </View>
            <View style={styles.amountActions}>
              <Text style={[styles.ledgerAmount, { color: COLORS.success }]}>+$10.00</Text>
              <TouchableOpacity
                style={[styles.settleButton, styles.remindButton]}
                onPress={() => handleRemind('Casey')}
              >
                <Text style={[styles.settleButtonText, { color: COLORS.textSecondary }]}>Remind</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Expandable FAB */}
      <ExpandableFAB actions={FABActions} />

      {/* Add Expense Modal - "The Nice One" Recreated/improved */}
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
                {['Groceries', 'Utilities', 'Rent', 'Fun', 'Other'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat.toLowerCase() && styles.categoryChipActive
                    ]}
                    onPress={() => setCategory(cat.toLowerCase())}
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
                <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>Everyone</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                setIsAddModalVisible(false);
                Alert.alert("Added", "Expense added to the ledger.");
              }}
            >
              <Text style={styles.saveButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  // Hero Card - Premium Dark
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

  // Ledger
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
    backgroundColor: COLORS.gray900, // Slightly darker
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

  // Modal Styles
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
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
});
