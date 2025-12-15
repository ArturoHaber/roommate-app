import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, GRADIENTS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

const { width, height } = Dimensions.get('window');

type Step = 'auth' | 'household';

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState<Step>('auth');
  const [isSignIn, setIsSignIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [householdChoice, setHouseholdChoice] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { signUp, signIn, signInWithApple, user, isAuthenticated, completeOnboarding, isLoading, error, clearError } = useAuthStore();
  const { createHousehold, joinHousehold } = useHouseholdStore();

  // If user is already authenticated, skip to household step
  useEffect(() => {
    if (isAuthenticated && user) {
      setStep('household');
    }
  }, [isAuthenticated, user]);

  const handleEmailAuth = async () => {
    if (email.trim() && password.trim()) {
      clearError();
      let success: boolean;

      if (isSignIn) {
        success = await signIn(email.trim(), password);
      } else {
        if (!name.trim()) return;
        success = await signUp(name.trim(), email.trim(), password);
      }

      if (success) {
        setStep('household');
      }
    }
  };

  const handleAppleSignIn = async () => {
    // Apple Sign In only works on iOS native
    // For web/Android, this button is hidden
    if (Platform.OS === 'ios') {
      try {
        // Dynamic import for iOS only
        const AppleAuth = await import('expo-apple-authentication');
        const credential = await AppleAuth.signInAsync({
          requestedScopes: [
            AppleAuth.AppleAuthenticationScope.FULL_NAME,
            AppleAuth.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (credential.identityToken) {
          const success = await signInWithApple(credential.identityToken);
          if (success) {
            setStep('household');
          }
        }
      } catch (e: any) {
        if (e.code !== 'ERR_REQUEST_CANCELED') {
          console.error('Apple sign in error:', e);
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google Sign In
    // Requires Google Cloud Console setup
    console.log('Google sign in - not yet configured');
  };

  const handleCreateHousehold = async () => {
    if (householdName.trim() && user) {
      const code = await createHousehold(householdName.trim(), user.id);
      if (code) {
        completeOnboarding();
      }
    }
  };

  const handleJoinHousehold = async () => {
    if (inviteCode.trim() && user) {
      const success = await joinHousehold(inviteCode.trim().toUpperCase(), user.id);
      if (success) {
        completeOnboarding();
      }
    }
  };

  // ============================================================================
  // AUTH SCREEN
  // ============================================================================
  if (step === 'auth') {
    return (
      <View style={styles.container}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#0F0F23', '#1a1a3e', '#0F0F23'] as const}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Decorative Gradient Orbs */}
        <View style={styles.orbContainer}>
          <LinearGradient
            colors={['#818CF8', '#6366F1'] as const}
            style={[styles.orb, styles.orbTopRight]}
          />
          <LinearGradient
            colors={['#2DD4BF', '#14B8A6'] as const}
            style={[styles.orb, styles.orbBottomLeft]}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={GRADIENTS.primary as readonly [string, string]}
                  style={styles.logoGradient}
                >
                  <Feather name="home" size={32} color={COLORS.white} />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>CribUp</Text>
              <Text style={styles.tagline}>
                {isSignIn ? 'Welcome back!' : 'Your home, organized.'}
              </Text>
            </View>

            {/* Auth Card */}
            <View style={styles.authCard}>
              {/* Social Login Buttons */}
              <View style={styles.socialButtons}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleAppleSignIn}
                    activeOpacity={0.8}
                  >
                    <View style={styles.socialIconContainer}>
                      <Feather name="command" size={20} color={COLORS.white} />
                    </View>
                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.8}
                >
                  <View style={[styles.socialIconContainer, styles.googleIcon]}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email Form */}
              {!isSignIn && (
                <View style={styles.inputContainer}>
                  <Feather name="user" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={COLORS.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Feather name="mail" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={COLORS.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleEmailAuth}
                disabled={isLoading || !email.trim() || !password.trim() || (!isSignIn && !name.trim())}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GRADIENTS.primary as readonly [string, string]}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {isSignIn ? 'Sign In' : 'Create Account'}
                      </Text>
                      <Feather name="arrow-right" size={20} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Toggle Sign In/Up */}
              <TouchableOpacity
                style={styles.toggleAuth}
                onPress={() => {
                  setIsSignIn(!isSignIn);
                  clearError();
                }}
              >
                <Text style={styles.toggleAuthText}>
                  {isSignIn ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.toggleAuthLink}>
                    {isSignIn ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' and '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ============================================================================
  // HOUSEHOLD STEP
  // ============================================================================
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a3e', '#0F0F23'] as const}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['#818CF8', '#6366F1'] as const}
          style={[styles.orb, styles.orbTopRight]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.stepTitle}>Set up your household</Text>
            <Text style={styles.stepSubtitle}>
              Create a new household or join an existing one
            </Text>
          </View>

          {!householdChoice ? (
            <View style={styles.choiceCards}>
              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => setHouseholdChoice('create')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={GRADIENTS.primary as readonly [string, string]}
                  style={styles.choiceIconBg}
                >
                  <Feather name="plus" size={28} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.choiceTitle}>Create New</Text>
                <Text style={styles.choiceSubtitle}>Start fresh and invite roommates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => setHouseholdChoice('join')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2DD4BF', '#14B8A6'] as const}
                  style={styles.choiceIconBg}
                >
                  <Feather name="users" size={28} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.choiceTitle}>Join Existing</Text>
                <Text style={styles.choiceSubtitle}>Enter an invite code</Text>
              </TouchableOpacity>
            </View>
          ) : householdChoice === 'create' ? (
            <View style={styles.authCard}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setHouseholdChoice(null)}
              >
                <Feather name="arrow-left" size={20} color={COLORS.primary} />
                <Text style={styles.backLinkText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Feather name="home" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Household name (e.g. The Loft)"
                  placeholderTextColor={COLORS.textTertiary}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateHousehold}
                disabled={!householdName.trim()}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GRADIENTS.primary as readonly [string, string]}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Create Household</Text>
                  <Feather name="arrow-right" size={20} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authCard}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setHouseholdChoice(null)}
              >
                <Feather name="arrow-left" size={20} color={COLORS.primary} />
                <Text style={styles.backLinkText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Feather name="hash" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="INVITE CODE"
                  placeholderTextColor={COLORS.textTertiary}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleJoinHousehold}
                disabled={inviteCode.length < 6}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2DD4BF', '#14B8A6'] as const}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Join Household</Text>
                  <Feather name="arrow-right" size={20} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: height * 0.1,
    paddingBottom: SPACING.xxl,
  },

  // Decorative Orbs
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  orbTopRight: {
    top: -100,
    right: -100,
  },
  orbBottomLeft: {
    bottom: -100,
    left: -100,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Auth Card
  authCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },

  // Social Buttons
  socialButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.md,
  },
  googleButton: {
    backgroundColor: COLORS.white,
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    backgroundColor: COLORS.white,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.md,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginLeft: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  codeInput: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  eyeButton: {
    padding: SPACING.md,
  },

  // Submit Button
  submitButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 4,
    gap: SPACING.sm,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Toggle
  toggleAuth: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
  },
  toggleAuthText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  toggleAuthLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Terms
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
  },

  // Household Step
  stepTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  choiceCards: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  choiceCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  choiceIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  choiceTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  choiceSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
});
