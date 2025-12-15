import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface AuthOptionsProps {
    onGoogleSignIn: () => void;
    onAppleSignIn: () => void;
    onEmailSignIn: () => void;
    isLoading: boolean;
}

export const AuthOptions: React.FC<AuthOptionsProps> = ({
    onGoogleSignIn,
    onAppleSignIn,
    onEmailSignIn,
    isLoading
}) => {
    return (
        <View style={styles.authOptionsContainer}>
            {/* Google Button - White background with Google colors */}
            <TouchableOpacity
                style={styles.googleButton}
                onPress={onGoogleSignIn}
                disabled={isLoading}
                activeOpacity={0.9}
            >
                <View style={styles.googleButtonInner}>
                    {/* Official Google G icon with multicolor */}
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                        <Path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <Path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <Path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <Path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </Svg>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
            </TouchableOpacity>

            {/* Apple Button - Solid black with white icon */}
            <TouchableOpacity
                style={styles.appleButton}
                onPress={onAppleSignIn}
                disabled={isLoading}
                activeOpacity={0.9}
            >
                <View style={styles.appleButtonInner}>
                    <FontAwesome name="apple" size={22} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* Email Button */}
            <TouchableOpacity
                style={styles.emailButton}
                onPress={onEmailSignIn}
                disabled={isLoading}
                activeOpacity={0.9}
            >
                <View style={styles.emailButtonInner}>
                    <Feather name="mail" size={20} color={COLORS.white} />
                    <Text style={styles.emailButtonText}>Continue with Email</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    authOptionsContainer: {
        gap: SPACING.md,
    },
    // Google Button - White background
    googleButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    googleButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Apple Button - Solid black
    appleButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#000000',
        overflow: 'hidden',
    },
    appleButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    appleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Divider
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: SPACING.md,
    },
    // Email Button
    emailButton: {
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emailButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    emailButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
