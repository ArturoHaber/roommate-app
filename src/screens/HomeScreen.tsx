import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HouseStatus } from '../components/HouseStatus';
import {
  ChoreTimeline,
  DashboardSection,
  FinanceWidget,
  MessageBoardWidget,
  ExpandableFAB
} from '../components';
import { COLORS, SPACING } from '../constants/theme';

export const HomeScreen = () => {
  const navigation = useNavigation();

  const fabActions = [
    {
      icon: 'dollar-sign',
      label: 'Add Expense',
      onPress: () => navigation.navigate('Expenses' as never),
      color: COLORS.categories.rent,
    },
    {
      icon: 'check-square',
      label: 'Add Chore',
      onPress: () => navigation.navigate('Household' as never), // Redirect to Household for now
      color: COLORS.primary,
    },
    {
      icon: 'users',
      label: 'Settle Up',
      onPress: () => console.log('Settle Up'), // Placeholder
      color: COLORS.success,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HouseStatus />

        <DashboardSection
          title="House Chores"
          onExpand={() => navigation.navigate('ChoresCalendar' as never)}
        >
          <ChoreTimeline />
        </DashboardSection>

        <DashboardSection
          title="Finance"
          onExpand={() => navigation.navigate('Expenses' as never)}
        >
          <FinanceWidget />
        </DashboardSection>

        <DashboardSection
          title="House Board"
          onExpand={() => navigation.navigate('HouseBoard' as never)}
        >
          <MessageBoardWidget />
        </DashboardSection>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
});
