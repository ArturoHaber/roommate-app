import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, GRADIENTS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';

type Step = 'welcome' | 'name' | 'household';

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [householdChoice, setHouseholdChoice] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { login, user, setHousehold, completeOnboarding } = useAuthStore();
  const { createHousehold, joinHousehold } = useHouseholdStore();

  const handleNameSubmit = () => {
    if (name.trim() && email.trim()) {
      login(name.trim(), email.trim());
      setStep('household');
    }
  };

  const handleCreateHousehold = () => {
    if (householdName.trim() && user) {
      const code = createHousehold(householdName.trim(), user.id);
      setHousehold(code);
      completeOnboarding();
    }
  };

  const handleJoinHousehold = () => {
    if (inviteCode.trim() && user) {
      const success = joinHousehold(inviteCode.trim().toUpperCase(), user);
      if (success) {
        setHousehold('demo-household');
        completeOnboarding();
      }
    }
  };

  if (step === 'welcome') {
    return (
      <LinearGradient colors={GRADIENTS.primary} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.logoContainer}>
              <Feather name="home" size={64} color={COLORS.white} />
            </View>
            <Text style={styles.welcomeTitle}>Roommate</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage chores, split expenses, and live in harmony
            </Text>
          </View>

          <View style={styles.welcomeFooter}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => setStep('name')}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (step === 'name') {
    return (
      <SafeAreaView style={styles.containerLight}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('welcome')}
          >
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.formContent}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              Let your roommates know who you are
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Continue"
              onPress={handleNameSubmit}
              fullWidth
              disabled={!name.trim() || !email.trim()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (step === 'household') {
    return (
      <SafeAreaView style={styles.containerLight}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('name')}
          >
            <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.formContent}>
            <Text style={styles.stepTitle}>Join or create a household</Text>
            <Text style={styles.stepSubtitle}>
              Connect with your roommates
            </Text>

            {!householdChoice && (
              <View style={styles.choiceContainer}>
                <TouchableOpacity
                  style={styles.choiceCard}
                  onPress={() => setHouseholdChoice('create')}
                >
                  <View style={styles.choiceIcon}>
                    <Feather name="plus-circle" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.choiceTitle}>Create New</Text>
                  <Text style={styles.choiceSubtitle}>
                    Start a new household and invite roommates
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.choiceCard}
                  onPress={() => setHouseholdChoice('join')}
                >
                  <View style={styles.choiceIcon}>
                    <Feather name="users" size={32} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.choiceTitle}>Join Existing</Text>
                  <Text style={styles.choiceSubtitle}>
                    Enter an invite code from your roommate
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {householdChoice === 'create' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Household Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="The Apartment"
                  placeholderTextColor={COLORS.textTertiary}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  autoFocus
                />
              </View>
            )}

            {householdChoice === 'join' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Invite Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="ABC123"
                  placeholderTextColor={COLORS.textTertiary}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />
                <Text style={styles.inputHint}>
                  Enter any code to join a demo household
                </Text>
              </View>
            )}
          </View>

          {householdChoice && (
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={() => setHouseholdChoice(null)}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title={householdChoice === 'create' ? 'Create Household' : 'Join Household'}
                onPress={householdChoice === 'create' ? handleCreateHousehold : handleJoinHousehold}
                fullWidth
                disabled={
                  householdChoice === 'create'
                    ? !householdName.trim()
                    : !inviteCode.trim()
                }
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  welcomeFooter: {
    padding: SPACING.xl,
  },
  getStartedButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  getStartedText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  backButton: {
    padding: SPACING.lg,
  },
  formContent: {
    flex: 1,
    padding: SPACING.xl,
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  codeInput: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  inputHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  choiceContainer: {
    gap: SPACING.md,
  },
  choiceCard: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  choiceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gray700,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  choiceTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  choiceSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.xl,
    paddingTop: 0,
  },
  cancelButton: {
    marginBottom: SPACING.sm,
  },
});
