import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NavigationContainer, DefaultTheme, useIsFocused } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, StatusBar, ActivityIndicator, Linking, Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAB_COLORS, TAB_ORDER } from './src/constants/tabColors';
import { COLORS } from './src/constants/theme';

// Try to import gesture handler, but gracefully handle if native module not available
let GestureHandlerRootView: React.ComponentType<any> | null = null;
try {
  const gh = require('react-native-gesture-handler');
  GestureHandlerRootView = gh.GestureHandlerRootView;
} catch (e) {
  console.warn('[App] react-native-gesture-handler not available, swipe disabled');
}

import {
  DashboardTab,
  ChoresTab,
  FinanceTab,
  SettingsTab,
  ChoresCalendarScreen,
  HousePulseScreen,
  HouseBoardScreen,
  OnboardingCarouselScreen,
  HouseholdChoiceScreen,
  HouseholdSetupScreen,
  SignInScreen,
  HouseholdPreviewScreen,
  NeedsAttentionScreen,
  NudgeScreen,
  ChoreManagementScreen,
} from './src/screens';
import { ActivityHistoryScreen } from './src/screens/ActivityHistoryScreen';
import { ComponentGalleryScreen } from './src/screens/ComponentGalleryScreen';
// New onboarding screens
import {
  WelcomeScreen,
  JoinHouseScreen,
  HouseBasicsScreen,
  InviteRoommatesScreen,
  ChoresStarterScreen,
  ConfirmationPreviewScreen,
  ChoreTemplate,
} from './src/screens/onboarding';
import { useAuthStore } from './src/stores/useAuthStore';
import { useHouseholdStore } from './src/stores/useHouseholdStore';
import { useChoreStore } from './src/stores/useChoreStore';
import { useNativeAppleAuth } from './src/hooks/useNativeAppleAuth';
import { useNotifications } from './src/hooks/useNotifications';


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
      <Stack.Screen name="DashboardMain" component={DashboardTab} />
      <Stack.Screen name="ChoresCalendar" component={ChoresCalendarScreen} />
      <Stack.Screen name="HousePulse" component={HousePulseScreen} />
      <Stack.Screen name="HouseBoard" component={HouseBoardScreen} />
      <Stack.Screen name="NudgeScreen" component={NudgeScreen} />
    </Stack.Navigator>
  );
}



function OldStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OldMain" component={ChoresTab} />
      <Stack.Screen name="ChoresCalendar" component={ChoresCalendarScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
      <Stack.Screen name="NeedsAttention" component={NeedsAttentionScreen} />
      <Stack.Screen name="NudgeScreen" component={NudgeScreen} />
      <Stack.Screen name="ChoreManagement" component={ChoreManagementScreen} />
      <Stack.Screen name="ComponentGallery" component={ComponentGalleryScreen} />
    </Stack.Navigator>
  );
}

// Animated screen wrapper for smooth tab transitions
function AnimatedScreen({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    if (isFocused) {
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.back(1.2)) });
    } else {
      opacity.value = 0;
      scale.value = 0.96;
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

// Tab icon configuration
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Dashboard: 'grid',
  Chores: 'check-square',
  Expenses: 'dollar-sign',
  Settings: 'settings',
};

// Main Tabs with per-tab colors and swipe gesture
function MainTabs() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [navigation, setNavigation] = useState<any>(null);
  const [SwipeGestureOverlay, setSwipeGestureOverlay] = useState<React.ComponentType<any> | null>(null);
  const [isSwipeLocked, setIsSwipeLocked] = useState(false);

  // Listen for swipe lock events (e.g. from Notification Settings)
  useEffect(() => {
    const lockSub = DeviceEventEmitter.addListener('LOCK_SWIPE', () => setIsSwipeLocked(true));
    const unlockSub = DeviceEventEmitter.addListener('UNLOCK_SWIPE', () => setIsSwipeLocked(false));
    return () => {
      lockSub.remove();
      unlockSub.remove();
    };
  }, []);

  // Load swipe overlay component
  useEffect(() => {
    if (!GestureHandlerRootView) {
      console.log('[MainTabs] Gesture handler not available, swipe disabled');
      return;
    }

    import('./src/components/SwipeableTabView').then((module) => {
      console.log('[MainTabs] Swipe overlay loaded');
      setSwipeGestureOverlay(() => module.SwipeGestureOverlay);
    }).catch((err) => {
      console.warn('[MainTabs] Could not load swipe overlay:', err);
    });
  }, []);

  // Navigation handler that swipe overlay will call
  const handleNavigate = useCallback((tabName: string) => {
    console.log('[MainTabs] Navigating to:', tabName);
    if (navigation) {
      navigation.navigate(tabName);
    }
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            const newIndex = e.data?.state?.index ?? 0;
            setCurrentTabIndex(newIndex);
          },
        }}
        screenOptions={({ route, navigation: nav }) => {
          // Store nav in ref first (refs don't cause re-render issues)
          // Then trigger state update via effect below
          if (!navigation && nav) {
            // Use setTimeout to defer state update outside of render
            setTimeout(() => setNavigation(nav), 0);
          }
          return {
            headerShown: false,
            // No animation - instant transitions (animations cause white flash on dark theme)
            animation: 'none',
            sceneStyle: { backgroundColor: COLORS.background },
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = TAB_ICONS[route.name] || 'circle';
              const tabColor = TAB_COLORS[route.name as keyof typeof TAB_COLORS];
              const activeColor = tabColor?.primary || COLORS.primary;

              return (
                <View style={[styles.tabIconContainer, focused && { backgroundColor: activeColor + '15' }]}>
                  <Feather name={iconName} size={size} color={focused ? activeColor : color} />
                </View>
              );
            },
            tabBarActiveTintColor: TAB_COLORS[route.name as keyof typeof TAB_COLORS]?.primary || COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray400,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarBackground: () => (
              <View style={styles.tabBarBackground} />
            ),
          };
        }}
      >
        <Tab.Screen name="Dashboard">
          {() => <AnimatedScreen><DashboardStack /></AnimatedScreen>}
        </Tab.Screen>
        <Tab.Screen name="Chores">
          {() => <AnimatedScreen><OldStack /></AnimatedScreen>}
        </Tab.Screen>
        <Tab.Screen name="Expenses">
          {() => <AnimatedScreen><FinanceTab /></AnimatedScreen>}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => <AnimatedScreen><SettingsTab /></AnimatedScreen>}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Swipe overlay - only render when both component and navigation are ready, and not locked */}
      {SwipeGestureOverlay && navigation && !isSwipeLocked && (
        <SwipeGestureOverlay
          currentIndex={currentTabIndex}
          onNavigate={handleNavigate}
        />
      )}
    </View>
  );
}

// Onboarding flow steps - NEW FLOW
type OnboardingStep =
  | 'welcome'           // New: Welcome screen with Create/Join
  | 'join'              // New: Join house with code
  | 'house-basics'      // New: House name + emoji
  | 'invite'            // New: Invite roommates
  | 'chores-starter'    // New: Pick chores
  | 'confirmation'      // New: Preview before sign-in
  | 'signin'            // Existing: Sign in screen
  | 'complete';         // Done, show main app

// Pending household data (stored until sign-in completes)
interface PendingHousehold {
  name: string;
  emoji: string;
  isJoining: boolean;
  inviteCode?: string;
  memberCount?: number;
  memberPreviews?: any[];
  selectedChores?: ChoreTemplate[];
}

// Keys for persisting onboarding state
const ONBOARDING_STEP_KEY = 'onboarding_step';
const PENDING_HOUSEHOLD_KEY = 'pending_household';

export default function App() {
  const { isAuthenticated, isLoading, user, initializeAuth, signIn, signUp, signInWithOAuthGoogle, signInWithOAuthApple, signInAnonymously } = useAuthStore();
  const { household, fetchHousehold, createHousehold, joinHousehold, validateInvite } = useHouseholdStore();
  const nativeAppleAuth = useNativeAppleAuth();

  // Initialize push notifications
  const notifications = useNotifications();

  // Onboarding flow state (persisted to survive OAuth redirects)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [pendingHousehold, setPendingHousehold] = useState<PendingHousehold | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);

  // Preview invite code - must be at top level before any early returns (Rules of Hooks)
  const previewCode = React.useMemo(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

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

  // Redirect to welcome screen if authenticated but no household
  useEffect(() => {
    if (isAuthenticated && stateLoaded && !isLoading && !household && !pendingHousehold && onboardingStep === 'welcome') {
      console.log('[App] Authenticated but no household found, staying on welcome');
      // User will choose Create or Join from welcome screen
    }
  }, [isAuthenticated, stateLoaded, isLoading, household, pendingHousehold, onboardingStep]);

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
              memberCount: householdData.member_count,
              memberPreviews: householdData.member_previews,
            });
            setOnboardingStep('signin');
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

  // Reset to welcome on logout (only if no pending household AND not already in app)
  useEffect(() => {
    if (!isAuthenticated && stateLoaded && !isLoading && !pendingHousehold) {
      // Only reset to welcome if there's no pending household data
      // AND we're not already in the main app (to avoid resetting during account linking)
      if (onboardingStep !== 'complete') {
        setOnboardingStep('welcome');
      }
    }
  }, [isAuthenticated, stateLoaded, isLoading, pendingHousehold, onboardingStep]);

  // Skip to complete if already has household
  useEffect(() => {
    if (household && isAuthenticated) {
      console.log('[App] User has household, skipping to complete');
      setOnboardingStep('complete');
    }
  }, [household, isAuthenticated]);

  // Redirect to welcome if authenticated but NO household (e.g., after delete)
  useEffect(() => {
    if (isAuthenticated && stateLoaded && !isLoading && !household && !pendingHousehold && onboardingStep === 'complete') {
      console.log('[App] Authenticated but no household, redirecting to welcome');
      // Small delay to ensure we've had time to fetch household
      const timer = setTimeout(() => {
        // Re-check in case household was fetched
        if (!household) {
          setOnboardingStep('welcome');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, stateLoaded, isLoading, household, pendingHousehold, onboardingStep]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  // ========================================
  // NEW ONBOARDING FLOW
  // ========================================

  // Screen 1: Welcome - Create or Join
  if (onboardingStep === 'welcome') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <WelcomeScreen
          onCreateHouse={() => setOnboardingStep('house-basics')}
          onJoinHouse={() => setOnboardingStep('join')}
        />
      </>
    );
  }

  // Screen 2: Join House (paste code)
  if (onboardingStep === 'join') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <JoinHouseScreen
          onBack={() => setOnboardingStep('welcome')}
          onJoinSuccess={(householdData, inviteCode) => {
            // Store the validated household data so we can join after sign-in
            setPendingHousehold({
              name: householdData.name,
              emoji: householdData.emoji,
              isJoining: true,
              inviteCode: inviteCode,
              memberCount: householdData.memberCount,
              memberPreviews: householdData.memberPreviews,
            });
            // Then go to sign-in
            setOnboardingStep('signin');
          }}
        />
      </>
    );
  }

  // Screen 3: House Basics (name + emoji)
  if (onboardingStep === 'house-basics') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HouseBasicsScreen
          onBack={() => setOnboardingStep('welcome')}
          onContinue={(name, emoji) => {
            setPendingHousehold({
              name,
              emoji,
              isJoining: false,
            });
            setOnboardingStep('invite');
          }}
        />
      </>
    );
  }



  // Screen 4: Invite Roommates (skippable)
  if (onboardingStep === 'invite') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <InviteRoommatesScreen
          inviteCode={previewCode}
          houseName={pendingHousehold?.name || 'Your House'}
          onBack={() => setOnboardingStep('house-basics')}
          onContinue={() => setOnboardingStep('chores-starter')}
          onSkip={() => setOnboardingStep('chores-starter')}
          isPreview={true}
        />
      </>
    );
  }

  // Screen 5: Chores Starter Pack
  if (onboardingStep === 'chores-starter') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <ChoresStarterScreen
          onBack={() => setOnboardingStep('invite')}
          onContinue={(selectedChores) => {
            setPendingHousehold(prev => prev ? { ...prev, selectedChores } : null);
            setOnboardingStep('confirmation');
          }}
        />
      </>
    );
  }

  // Screen 6: Confirmation Preview
  if (onboardingStep === 'confirmation') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <ConfirmationPreviewScreen
          houseName={pendingHousehold?.name || 'Your House'}
          houseEmoji={pendingHousehold?.emoji || '🏠'}
          selectedChores={pendingHousehold?.selectedChores || []}
          onBack={() => setOnboardingStep('chores-starter')}
          onGetStarted={() => setOnboardingStep('signin')}
        />
      </>
    );
  }

  // Screen 7: Sign In
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
              setOnboardingStep('join');
            } else {
              setOnboardingStep('confirmation');
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
              // Use native Apple Sign In on iOS, fallback to browser OAuth on web
              if (Platform.OS === 'ios') {
                await nativeAppleAuth.signIn();
              } else {
                await signInWithOAuthApple();
              }
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

  // Main app - Use GestureHandlerRootView if available, otherwise fallback to View
  const Wrapper = GestureHandlerRootView || View;

  return (
    <Wrapper style={{ flex: 1 }}>
      <NavigationContainer theme={MyDarkTheme}>
        <StatusBar barStyle="light-content" />
        <MainTabs />
      </NavigationContainer>
    </Wrapper>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gray900,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
