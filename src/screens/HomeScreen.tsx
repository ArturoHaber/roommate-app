import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HouseStatus } from '../components/HouseStatus';
import {
  ChoreTimeline,
  DashboardSection,
  FinanceWidget,
  MessageBoardWidget,
} from '../components';
import { COLORS } from '../constants/theme';

export const HomeScreen = () => {
  const navigation = useNavigation();

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
          onExpand={() => navigation.getParent()?.navigate('Chores')}
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
