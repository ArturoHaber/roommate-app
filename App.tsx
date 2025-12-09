import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, StatusBar } from 'react-native';

import {
  HomeScreen,
  HouseholdScreen,
  ExpensesScreen,
  ProfileScreen,
  OnboardingScreen,
  ChoresCalendarScreen,
  HousePulseScreen,
  HouseBoardScreen,

} from './src/screens';
import { ActivityHistoryScreen } from './src/screens/ActivityHistoryScreen';
import { useAuthStore } from './src/stores/useAuthStore';
import { useHouseholdStore } from './src/stores/useHouseholdStore';
import { COLORS } from './src/constants/theme';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dark Theme Navigation Theme
const MyDarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.gray900,
    text: COLORS.textPrimary,
    border: COLORS.border,
  },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={HomeScreen} />
      <Stack.Screen name="ChoresCalendar" component={ChoresCalendarScreen} />
      <Stack.Screen name="HousePulse" component={HousePulseScreen} />
      <Stack.Screen name="HouseBoard" component={HouseBoardScreen} />
    </Stack.Navigator>
  );
}

function ChoresStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChoresMain" component={HouseholdScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = 'grid';
          } else if (route.name === 'Chores') {
            iconName = 'check-square';

          } else if (route.name === 'Expenses') {
            iconName = 'dollar-sign';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return (
            <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
              <Feather name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Chores" component={ChoresStack} />

      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Settings" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  const { household } = useHouseholdStore();

  // Show onboarding if not authenticated or no household
  const showOnboarding = !isAuthenticated || !isOnboarded || !household;

  return (
    <NavigationContainer theme={MyDarkTheme}>
      <StatusBar barStyle="light-content" />
      {showOnboarding ? <OnboardingScreen /> : <MainTabs />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.gray900,
    borderTopWidth: 0,
    elevation: 0,
    height: 85,
    paddingTop: 12,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '15',
  },
});
