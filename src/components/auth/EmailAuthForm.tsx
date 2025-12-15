import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface EmailAuthFormProps {
    mode: 'signin' | 'signup';
    onSubmit: (email: string, password: string, name?: string) => void;
    isLoading: boolean;
    error?: string | null;
    onToggleMode?: () => void;
    onBack: () => void;
    showNameInput?: boolean;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
    mode,
    onSubmit,
    isLoading,
    error,
    onToggleMode,
    onBack,
    showNameInput = false
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = () => {
        setValidationError(null);

        if (!email.trim() || !password.trim()) {
            setValidationError('Please fill in all fields');
            return;
        }

        if (showNameInput && !name.trim()) {
            setValidationError('Please enter your name');
            return;
        }

        if (mode === 'signup' && password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        onSubmit(email.trim(), password, name.trim());
    };

    const activeError = validationError || error;

    return (
        <View style={styles.emailFormContainer}>
            {/* Name Input (Optional) */}
            {showNameInput && (
                <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                        <Feather name="user" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Your Name"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={name}
                        onChangeText={setName}
                        autoCorrect={false}
                    />
                </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                    <Feather name="mail" size={20} color="rgba(255,255,255,0.5)" />
                </View>
                <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                    <Feather name="lock" size={20} color="rgba(255,255,255,0.5)" />
                </View>
                <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(255,255,255,0.5)"
                    />
                </TouchableOpacity>
            </View>

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
                <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                        <Feather name="shield" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Confirm password"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                    />
                </View>
            )}

            {/* Error Message */}
            {activeError && (
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={16} color="#F87171" />
                    <Text style={styles.errorText}>{activeError}</Text>
                </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
                style={styles.emailSubmitButton}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#818CF8', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emailSubmitGradient}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.emailSubmitText}>
                            {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Switch between Sign In / Sign Up */}
            {onToggleMode && (
                <TouchableOpacity
                    style={styles.switchModeButton}
                    onPress={onToggleMode}
                >
                    <Text style={styles.switchModeText}>
                        {mode === 'signup'
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Sign up"}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Back to options */}
            <TouchableOpacity
                style={styles.backToOptionsButton}
                onPress={onBack}
            >
                <Feather name="arrow-left" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.backToOptionsText}>Other sign in options</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    emailFormContainer: {
        gap: SPACING.md,
    },
    inputWrapper: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    inputIconContainer: {
        width: 48,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.white,
        paddingRight: SPACING.md,
    },
    eyeButton: {
        width: 48,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    errorText: {
        fontSize: 14,
        color: '#F87171',
    },
    emailSubmitButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginTop: SPACING.sm,
    },
    emailSubmitGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailSubmitText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    switchModeButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    switchModeText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    backToOptionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    backToOptionsText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});
