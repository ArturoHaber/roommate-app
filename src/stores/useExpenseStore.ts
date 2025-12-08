import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Balance } from '../types';
import { generateId } from '../utils/generateId';

interface ExpenseState {
  expenses: Expense[];
  
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  removeExpense: (expenseId: string) => void;
  markSplitPaid: (expenseId: string, userId: string) => void;
  getBalances: (memberIds: string[]) => Balance[];
  getMyExpenses: (userId: string) => Expense[];
  getTotalOwed: (userId: string) => number;
  getTotalOwedToMe: (userId: string) => number;
  initializeSampleExpenses: (householdId: string, memberIds: string[]) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      initializeSampleExpenses: (householdId: string, memberIds: string[]) => {
        const existingExpenses = get().expenses;
        if (existingExpenses.length > 0) return;

        const sampleExpenses: Expense[] = [
          {
            id: generateId(),
            householdId,
            paidBy: memberIds[0],
            amount: 156.78,
            description: 'Costco grocery run',
            category: 'groceries',
            splitType: 'equal',
            splits: memberIds.map((id) => ({
              userId: id,
              amount: 156.78 / memberIds.length,
              paid: id === memberIds[0],
            })),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: generateId(),
            householdId,
            paidBy: memberIds[1],
            amount: 89.50,
            description: 'Electric bill - November',
            category: 'utilities',
            splitType: 'equal',
            splits: memberIds.map((id) => ({
              userId: id,
              amount: 89.50 / memberIds.length,
              paid: id === memberIds[1],
            })),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: generateId(),
            householdId,
            paidBy: memberIds[2] || memberIds[0],
            amount: 45.00,
            description: 'Cleaning supplies',
            category: 'supplies',
            splitType: 'equal',
            splits: memberIds.map((id) => ({
              userId: id,
              amount: 45.00 / memberIds.length,
              paid: id === (memberIds[2] || memberIds[0]),
            })),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ];

        set({ expenses: sampleExpenses });
      },

      addExpense: (expenseData) => {
        const expense: Expense = {
          ...expenseData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({ expenses: [expense, ...state.expenses] }));
      },

      removeExpense: (expenseId: string) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== expenseId),
        }));
      },

      markSplitPaid: (expenseId: string, userId: string) => {
        set((state) => ({
          expenses: state.expenses.map((e) => {
            if (e.id === expenseId) {
              return {
                ...e,
                splits: e.splits.map((s) =>
                  s.userId === userId ? { ...s, paid: true } : s
                ),
              };
            }
            return e;
          }),
        }));
      },

      getBalances: (memberIds: string[]) => {
        const { expenses } = get();
        const balances: Map<string, number> = new Map();

        // Initialize balances
        memberIds.forEach((id) => balances.set(id, 0));

        // Calculate net balance for each person
        expenses.forEach((expense) => {
          expense.splits.forEach((split) => {
            if (!split.paid && split.userId !== expense.paidBy) {
              // This person owes money to the payer
              const currentBalance = balances.get(split.userId) || 0;
              balances.set(split.userId, currentBalance - split.amount);

              const payerBalance = balances.get(expense.paidBy) || 0;
              balances.set(expense.paidBy, payerBalance + split.amount);
            }
          });
        });

        // Convert to Balance array (simplified - who owes who)
        const result: Balance[] = [];
        const sortedMembers = Array.from(balances.entries()).sort((a, b) => a[1] - b[1]);

        let i = 0;
        let j = sortedMembers.length - 1;

        while (i < j) {
          const debtor = sortedMembers[i];
          const creditor = sortedMembers[j];

          if (Math.abs(debtor[1]) < 0.01 || Math.abs(creditor[1]) < 0.01) break;

          const amount = Math.min(Math.abs(debtor[1]), creditor[1]);
          if (amount > 0.01) {
            result.push({
              fromUserId: debtor[0],
              toUserId: creditor[0],
              amount: Math.round(amount * 100) / 100,
            });
          }

          sortedMembers[i][1] += amount;
          sortedMembers[j][1] -= amount;

          if (Math.abs(sortedMembers[i][1]) < 0.01) i++;
          if (Math.abs(sortedMembers[j][1]) < 0.01) j--;
        }

        return result;
      },

      getMyExpenses: (userId: string) => {
        const { expenses } = get();
        return expenses.filter(
          (e) => e.paidBy === userId || e.splits.some((s) => s.userId === userId)
        );
      },

      getTotalOwed: (userId: string) => {
        const { expenses } = get();
        let total = 0;
        expenses.forEach((expense) => {
          if (expense.paidBy !== userId) {
            const mySplit = expense.splits.find((s) => s.userId === userId);
            if (mySplit && !mySplit.paid) {
              total += mySplit.amount;
            }
          }
        });
        return Math.round(total * 100) / 100;
      },

      getTotalOwedToMe: (userId: string) => {
        const { expenses } = get();
        let total = 0;
        expenses.forEach((expense) => {
          if (expense.paidBy === userId) {
            expense.splits.forEach((split) => {
              if (split.userId !== userId && !split.paid) {
                total += split.amount;
              }
            });
          }
        });
        return Math.round(total * 100) / 100;
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
