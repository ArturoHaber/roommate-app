import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithApple: (idToken: string, nonce?: string) => Promise<boolean>;
  signInWithGoogle: (idToken: string, accessToken?: string) => Promise<boolean>;
  // Simple OAuth methods using Supabase's browser redirect
  signInWithOAuthGoogle: () => Promise<boolean>;
  signInWithOAuthApple: () => Promise<boolean>;
  signInAnonymously: () => Promise<boolean>;
  linkAccount: (email: string, password: string, name: string) => Promise<boolean>; // NEW
  deleteAccount: () => Promise<void>; // NEW
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  completeOnboarding: () => void;
  updateProfile: (updates: { name?: string; avatarColor?: string; statusEmoji?: string }) => Promise<void>;
  clearError: () => void;
}

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      error: null,

      // Sign up with email/password
      signUp: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // 1. Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name }, // Passed to the trigger
            },
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Signup failed');

          // 2. Update profile with name and avatar color
          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ name, avatar_color: randomColor })
            .eq('id', authData.user.id);

          if (profileError) console.warn('Profile update failed:', profileError);

          // 3. Fetch the profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: profile?.name || name,
            avatarColor: profile?.avatar_color || randomColor,
            statusEmoji: profile?.status_emoji,
            statusText: profile?.status_text,
            isVacationMode: profile?.is_vacation_mode || false,
            createdAt: new Date(profile?.created_at || Date.now()),
            updatedAt: new Date(profile?.updated_at || Date.now()),
          };

          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Sign in with email/password
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Login failed');

          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: profile.name,
            avatarColor: profile.avatar_color,
            statusEmoji: profile.status_emoji,
            statusText: profile.status_text,
            isVacationMode: profile.is_vacation_mode,
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at),
          };

          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Sign in with Apple (native or web-based)
      signInWithApple: async (idToken: string, nonce?: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: idToken,
            nonce, // Required for native Apple Sign-In
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Apple sign in failed');

          // Fetch or create profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
          const userName = authData.user.user_metadata?.full_name ||
            authData.user.email?.split('@')[0] || 'User';

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || '',
            name: profile?.name || userName,
            avatarColor: profile?.avatar_color || randomColor,
            statusEmoji: profile?.status_emoji,
            statusText: profile?.status_text,
            isVacationMode: profile?.is_vacation_mode || false,
            createdAt: new Date(profile?.created_at || Date.now()),
            updatedAt: new Date(profile?.updated_at || Date.now()),
          };

          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Sign in with Google
      signInWithGoogle: async (idToken: string, accessToken?: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
            access_token: accessToken,
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Google sign in failed');

          // Fetch or create profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
          const userName = authData.user.user_metadata?.full_name ||
            authData.user.email?.split('@')[0] || 'User';

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || '',
            name: profile?.name || userName,
            avatarColor: profile?.avatar_color || randomColor,
            statusEmoji: profile?.status_emoji,
            statusText: profile?.status_text,
            isVacationMode: profile?.is_vacation_mode || false,
            createdAt: new Date(profile?.created_at || Date.now()),
            updatedAt: new Date(profile?.updated_at || Date.now()),
          };

          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // ========================================================================
      // SIMPLE OAUTH METHODS (using Supabase's browser redirect)
      // ========================================================================

      // Sign in with Google using browser OAuth flow
      signInWithOAuthGoogle: async () => {
        set({ isLoading: true, error: null });

        try {
          const redirectUrl = Platform.OS === 'web'
            ? window.location.origin
            : 'cribup://auth-callback';

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: Platform.OS !== 'web',
            },
          });

          if (error) throw error;

          // For mobile, open the OAuth URL in browser
          if (Platform.OS !== 'web' && data.url) {
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUrl
            );

            if (result.type === 'success' && result.url) {
              // Supabase returns tokens as hash fragments, not query parameters
              // URL format: cribup://auth-callback#access_token=...&refresh_token=...
              const url = new URL(result.url);

              // Parse hash fragment (tokens come after #)
              const hashParams = new URLSearchParams(url.hash.substring(1));
              let accessToken = hashParams.get('access_token');
              let refreshToken = hashParams.get('refresh_token');

              // Fallback: try query parameters (just in case)
              if (!accessToken || !refreshToken) {
                accessToken = url.searchParams.get('access_token');
                refreshToken = url.searchParams.get('refresh_token');
              }

              if (accessToken && refreshToken) {
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
              } else {
                console.warn('[GoogleOAuth] No tokens in callback URL:', result.url);
              }
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
              // User cancelled - don't treat as error, just stop loading
              console.log('[GoogleOAuth] User cancelled auth flow');
              set({ isLoading: false });
              return false;
            }
          }

          // For web, the page will redirect and the auth listener will handle it
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Google OAuth error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Sign in with Apple using browser OAuth flow
      signInWithOAuthApple: async () => {
        set({ isLoading: true, error: null });

        try {
          const redirectUrl = Platform.OS === 'web'
            ? window.location.origin
            : 'cribup://auth-callback';

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: Platform.OS !== 'web',
            },
          });

          if (error) throw error;

          // For mobile, open the OAuth URL in browser
          if (Platform.OS !== 'web' && data.url) {
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUrl
            );

            if (result.type === 'success' && result.url) {
              // Supabase returns tokens as hash fragments, not query parameters
              const url = new URL(result.url);

              // Parse hash fragment (tokens come after #)
              const hashParams = new URLSearchParams(url.hash.substring(1));
              let accessToken = hashParams.get('access_token');
              let refreshToken = hashParams.get('refresh_token');

              // Fallback: try query parameters (just in case)
              if (!accessToken || !refreshToken) {
                accessToken = url.searchParams.get('access_token');
                refreshToken = url.searchParams.get('refresh_token');
              }

              if (accessToken && refreshToken) {
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
              } else {
                console.warn('[AppleOAuth] No tokens in callback URL:', result.url);
              }
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
              // User cancelled - don't treat as error, just stop loading
              console.log('[AppleOAuth] User cancelled auth flow');
              set({ isLoading: false });
              return false;
            }
          }

          // For web, the page will redirect and the auth listener will handle it
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Apple OAuth error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Sign in anonymously
      signInAnonymously: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

          if (authError) throw authError;
          if (!authData.user) throw new Error('Anonymous login failed');

          // Create a basic profile for the anonymous user
          // Note: Supabase might not automatically trigger profile creation for anonymous users
          // depending on the triggers. We'll ensure one exists locally or create it.
          const AVATAR_COLORS = [
            '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316',
            '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
          ];
          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

          const user: User = {
            id: authData.user.id,
            email: '',
            name: 'User', // Default for anonymous
            avatarColor: randomColor,
            statusEmoji: undefined,
            statusText: undefined,
            isVacationMode: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Try to create profile in DB to ensure consistency
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: null,
              name: 'User',
              avatar_color: randomColor,
            });

          if (profileError) {
            console.log('Profile creation warning (might already exist):', profileError.message);
          }

          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Anonymous auth error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },



      // Link anonymous account to email/password
      linkAccount: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.updateUser({
            email,
            password,
            data: { name },
          });

          if (error) throw error;
          if (!data.user) throw new Error('Account linking failed');

          // Update profile with new name/email
          await supabase
            .from('profiles')
            .update({ email, name })
            .eq('id', data.user.id);

          set({
            user: { ...get().user!, email, name },
            isLoading: false
          });
          return true;
        } catch (error: any) {
          console.error('Link account error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Delete account (Destructive)
      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          // Call the secure RPC
          const { error } = await supabase.rpc('delete_own_account');

          if (error) throw error;

          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, isOnboarded: false, isLoading: false });
        } catch (error: any) {
          console.error('Delete account error:', error);
          set({ error: error.message, isLoading: false });
          throw error; // Re-throw so UI can show alert
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isOnboarded: false, isLoading: false });
      },

      // Initialize auth on app start (check for existing session)
      initializeAuth: async () => {
        set({ isLoading: true });

        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile.name,
                avatarColor: profile.avatar_color,
                statusEmoji: profile.status_emoji,
                statusText: profile.status_text,
                isVacationMode: profile.is_vacation_mode,
                createdAt: new Date(profile.created_at),
                updatedAt: new Date(profile.updated_at),
              };
              set({ user, isAuthenticated: true, isLoading: false });
              return;
            }
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Auth init error:', error);
          set({ isLoading: false });
        }
      },

      completeOnboarding: () => {
        set({ isOnboarded: true });
      },

      // Update profile
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return;

        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.avatarColor) dbUpdates.avatar_color = updates.avatarColor;
        if (updates.statusEmoji !== undefined) dbUpdates.status_emoji = updates.statusEmoji;

        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (!error) {
          set({ user: { ...user, ...updates } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isOnboarded: state.isOnboarded }), // Only persist onboarding status
    }
  )
);

// Listen for auth state changes (including OAuth redirects!)
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('[Auth] onAuthStateChange:', event, session?.user?.email);

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      console.log('[Auth] Processing SIGNED_IN for user:', session.user.id);

      const AVATAR_COLORS = [
        '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316',
        '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
      ];
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const userName = session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] || 'User';

      // Set authenticated IMMEDIATELY with basic info (prevents loading hang)
      const basicUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: userName,
        avatarColor: randomColor,
        statusEmoji: undefined,
        statusText: undefined,
        isVacationMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('[Auth] Setting authenticated immediately:', basicUser.email);
      useAuthStore.setState({ user: basicUser, isAuthenticated: true, isLoading: false });

      // Fetch profile in background (non-blocking)
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile, error }) => {
          console.log('[Auth] Background profile fetch:', { found: !!profile, error: error?.code });
          if (profile) {
            useAuthStore.setState({
              user: {
                ...basicUser,
                name: profile.name || basicUser.name,
                avatarColor: profile.avatar_color || basicUser.avatarColor,
                statusEmoji: profile.status_emoji,
                statusText: profile.status_text,
                isVacationMode: profile.is_vacation_mode || false,
                createdAt: new Date(profile.created_at),
                updatedAt: new Date(profile.updated_at),
              }
            });
          } else if (error) {
            // Create profile for new OAuth user
            console.log('[Auth] Creating profile for new user');
            supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email,
              name: userName,
              avatar_color: randomColor,
            }).then(() => console.log('[Auth] Profile created'));
          }
        });
    } else {
      console.log('[Auth] SIGNED_IN but no session.user');
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('[Auth] User signed out');
    useAuthStore.setState({ user: null, isAuthenticated: false });
  } else if (event === 'INITIAL_SESSION') {
    // Initial session loaded (or no session)
    if (!session) {
      console.log('[Auth] No initial session');
      useAuthStore.setState({ isLoading: false });
    }
  }
});
