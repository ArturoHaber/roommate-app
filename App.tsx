import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, StatusBar, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  HomeScreen,
  HouseholdScreen,
  ExpensesScreen,
  ProfileScreen,
  OnboardingScreen,
  ChoresCalendarScreen,
  HousePulseScreen,
  HouseBoardScreen,
  OnboardingCarouselScreen,
  HouseholdChoiceScreen,
  HouseholdSetupScreen,
  SignInScreen,
  HouseholdPreviewScreen,
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

// Onboarding flow steps
type OnboardingStep = 'carousel' | 'choice' | 'setup' | 'join-preview' | 'signin' | 'complete';

// Pending household data (stored until sign-in completes)
interface PendingHousehold {
  name: string;
  emoji: string;
  isJoining: boolean;
  inviteCode?: string;
}

// Keys for persisting onboarding state
const ONBOARDING_STEP_KEY = 'onboarding_step';
const PENDING_HOUSEHOLD_KEY = 'pending_household';

export default function App() {
  const { isAuthenticated, isLoading, user, initializeAuth, signIn, signUp, signInWithOAuthGoogle, signInWithOAuthApple, signInAnonymously } = useAuthStore();
  const { household, fetchHousehold, createHousehold, joinHousehold, validateInvite } = useHouseholdStore();

  // Onboarding flow state (persisted to survive OAuth redirects)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('carousel');
  const [pendingHousehold, setPendingHousehold] = useState<PendingHousehold | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);

  // Load persisted pending household on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const savedPending = await AsyncStorage.getItem(PENDING_HOUSEHOLD_KEY);
        if (savedPending) {
          setPendingHousehold(JSON.parse(savedPending));
          // If we have a pending household, we should probably start at the signin screen
          // so they don't lose context, OR we could start at carousel but that might be confusing.
          // Let's start at 'signin' ONLY if there is pending data, otherwise 'carousel'.
          setOnboardingStep('signin');
        }
      } catch (e) {
        console.error('Failed to load state:', e);
      }
      setStateLoaded(true);
    };
    loadPersistedState();
  }, []);

  // Persist pending household when it changes
  useEffect(() => {
    if (stateLoaded) {
      if (pendingHousehold) {
        AsyncStorage.setItem(PENDING_HOUSEHOLD_KEY, JSON.stringify(pendingHousehold));
      } else {
        AsyncStorage.removeItem(PENDING_HOUSEHOLD_KEY);
      }
    }
  }, [pendingHousehold, stateLoaded]);

  // Initialize auth on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[App] State:', {
      isAuthenticated,
      userId: user?.id,
      household: household?.id,
      onboardingStep,
      pendingHousehold: pendingHousehold ? 'set' : 'null',
      stateLoaded,
    });
  }, [isAuthenticated, user?.id, household, onboardingStep, pendingHousehold, stateLoaded]);

  // When user authenticates, create/join the pending household
  useEffect(() => {
    if (isAuthenticated && user?.id && pendingHousehold && stateLoaded) {
      console.log('[App] User authenticated with pending household, completing onboarding...');
      const completeOnboarding = async () => {
        try {
          if (pendingHousehold.isJoining && pendingHousehold.inviteCode) {
            // Join existing household
            console.log('[App] Joining household with code:', pendingHousehold.inviteCode);
            await joinHousehold(pendingHousehold.inviteCode, user.id);
          } else {
            // Create new household
            console.log('[App] Creating household:', pendingHousehold.name);
            const result = await createHousehold(pendingHousehold.name, user.id);
            console.log('[App] Create household result:', result);
          }
          // Clear persisted state
          console.log('[App] Clearing persisted state and completing onboarding');
          setPendingHousehold(null);
          setOnboardingStep('complete');
          await AsyncStorage.multiRemove([ONBOARDING_STEP_KEY, PENDING_HOUSEHOLD_KEY]);
        } catch (error) {
          console.error('[App] Failed to complete onboarding:', error);
        }
      };
      completeOnboarding();
    }
  }, [isAuthenticated, user?.id, pendingHousehold, stateLoaded]);

  // Fetch household when user authenticates (for returning users)
  useEffect(() => {
    if (isAuthenticated && user?.id && !pendingHousehold && stateLoaded) {
      console.log('[App] Authenticated user without pending household, fetching existing household...');
      fetchHousehold(user.id);
    }
  }, [isAuthenticated, user?.id, pendingHousehold, stateLoaded]);

  // ===========================================
  // DEEP LINKING (Invite Codes)
  // ===========================================
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('[App] Deep link received:', url);

      // Parse URL: roommate-app://invite/CODE or https://.../invite/CODE
      // Simple regex for code at the end
      const match = url.match(/invite\/([A-Z0-9]+)/i);
      if (match && match[1]) {
        const code = match[1].toUpperCase();
        console.log('[App] Detected invite code:', code);

        try {
          // Validate code
          const householdData = await validateInvite(code); // Used destructured validateInvite

          if (householdData) {
            setPendingHousehold({
              name: householdData.name,
              emoji: householdData.emoji,
              isJoining: true,
              inviteCode: code,
            });
            setOnboardingStep('join-preview');
          }
        } catch (e) {
          console.error('[App] Invalid invite code from link:', e);
          // Optional: Show alert
        }
      }
    };

    // 1. Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // 2. Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [validateInvite]); // Added validateInvite to dependency array

  // Reset to carousel on logout
  useEffect(() => {
    if (!isAuthenticated && stateLoaded && !isLoading) {
      // If user logs out, go back to initial screen
      setOnboardingStep('carousel');
    }
  }, [isAuthenticated, stateLoaded, isLoading]);

  // Skip to complete if already has household
  useEffect(() => {
    if (household && isAuthenticated) {
      console.log('[App] User has household, skipping to complete');
      setOnboardingStep('complete');
    }
  }, [household, isAuthenticated]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Onboarding Flow
  if (onboardingStep === 'carousel') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <OnboardingCarouselScreen
          onComplete={() => setOnboardingStep('choice')}
          onLogin={() => setOnboardingStep('signin')}
        />
      </>
    );
  }

  if (onboardingStep === 'choice') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HouseholdChoiceScreen
          onCreateHousehold={() => setOnboardingStep('setup')}
          onJoinHousehold={async (code) => {
            // Validate code
            const householdData = await validateInvite(code);

            if (householdData) {
              setPendingHousehold({
                name: householdData.name,
                emoji: householdData.emoji,
                isJoining: true,
                inviteCode: code,
              });
              setOnboardingStep('join-preview');
            } else {
              throw new Error('Invalid invite code');
            }
          }}
        />
      </>
    );
  }

  if (onboardingStep === 'setup') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HouseholdSetupScreen
          onBack={() => setOnboardingStep('choice')}
          onComplete={async (name, emoji) => {
            // Store pending data
            setPendingHousehold({
              name,
              emoji,
              isJoining: false,
            });
            // Navigate to Sign In / Continue screen
            setOnboardingStep('signin');
          }}
        />
      </>
    );
  }

  if (onboardingStep === 'join-preview') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HouseholdPreviewScreen
          householdName={pendingHousehold?.name || 'A Household'}
          householdEmoji={pendingHousehold?.emoji || '🏠'}
          memberCount={2} // TODO: Fetch from invite code
          memberNames={['Alex', 'Sam']} // TODO: Fetch from invite code
          onBack={() => {
            setPendingHousehold(null);
            setOnboardingStep('choice');
          }}
          onContinue={async () => {
            // Navigate to Sign In / Continue screen
            setOnboardingStep('signin');
          }}
        />
      </>
    );
  }

  if (onboardingStep === 'signin') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <SignInScreen
          householdName={pendingHousehold?.name}
          householdEmoji={pendingHousehold?.emoji}
          isJoining={pendingHousehold?.isJoining}
          onBack={() => {
            if (pendingHousehold?.isJoining) {
              setOnboardingStep('join-preview');
            } else {
              setOnboardingStep('setup');
            }
          }}
          onGuestSignIn={async () => {
            // ANONYMOUS AUTH: Sign in immediately
            await signInAnonymously();
          }}
          onSignIn={async (method, email, password) => {
            // Handle authentication
            if (method === 'google') {
              await signInWithOAuthGoogle();
            } else if (method === 'apple') {
              await signInWithOAuthApple();
            } else if (method === 'email' && email && password) {
              // Try sign in first, then sign up if fails
              const signedIn = await signIn(email, password);
              if (!signedIn) {
                // Sign up with a default name (can be changed later)
                await signUp('User', email, password);
              }
            }
          }}
        />
      </>
    );
  }

  // Main app
  return (
    <NavigationContainer theme={MyDarkTheme}>
      <StatusBar barStyle="light-content" />
      <MainTabs />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
