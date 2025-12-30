import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, StatusBar, RefreshControl, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native'
import { HouseStatus } from '../components/HouseStatus';
import {
  ChoreTimeline,
  DashboardSection,
  FinanceWidget,
  MessageBoardWidget,
} from '../components';
import { COLORS } from '../constants/theme';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';
import { useAuthStore } from '../stores/useAuthStore';

export const DashboardTab = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  // Workaround for iOS tintColor bug - delay color application
  const [spinnerColor, setSpinnerColor] = useState(Platform.OS === 'ios' ? undefined : '#FFFFFF');

  const { user } = useAuthStore();
  const { household, fetchHousehold } = useHouseholdStore();
  const { fetchChores, fetchAssignments } = useChoreStore();

  // iOS workaround: Set tintColor after mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const timer = setTimeout(() => {
        setSpinnerColor('#FFFFFF');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (!user?.id || !household?.id) return;

    setRefreshing(true);
    try {
      await Promise.all([
        fetchHousehold(user.id),
        fetchChores(household.id),
        fetchAssignments(household.id),
      ]);
    } catch (error) {
      console.error('[DashboardTab] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, household?.id, fetchHousehold, fetchChores, fetchAssignments]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={spinnerColor}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.gray800}
            progressViewOffset={Platform.OS === 'android' ? 0 : 10}
          />
        }
      >
        <HouseStatus />

        <DashboardSection
          title="House Chores"
        >
          <ChoreTimeline />
        </DashboardSection>

        <DashboardSection
          title="Finance"
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
    paddingBottom: 100,
  },
});
