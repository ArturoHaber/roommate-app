import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Hook for native Apple Sign In
 * 
 * This uses expo-apple-authentication to get a native Apple Sign In prompt
 * instead of redirecting to a browser. The flow is:
 * 
 * 1. User taps "Sign in with Apple" button
 * 2. Native iOS prompt appears (FaceID/TouchID)
 * 3. Apple returns an identity token (JWT)
 * 4. We pass that token to Supabase to create/login the user
 */
export function useNativeAppleAuth() {
    const { signInWithApple } = useAuthStore();

    const signIn = async (): Promise<boolean> => {
        // Native Apple Sign In only works on iOS
        if (Platform.OS !== 'ios') {
            console.warn('Native Apple Sign In is only available on iOS');
            return false;
        }

        try {
            // Check if Apple Sign In is available on this device
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('Apple Sign In is not available on this device');
            }

            // Generate a random nonce for security
            // This prevents replay attacks
            const nonce = Math.random().toString(36).substring(2, 15);
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                nonce
            );

            // Request Apple Sign In
            // This shows the native iOS prompt
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            // The identityToken is what Supabase needs
            if (!credential.identityToken) {
                throw new Error('No identity token received from Apple');
            }

            // Pass the token AND raw nonce to your existing signInWithApple function
            // Supabase needs the raw nonce to verify the Apple identity token
            const success = await signInWithApple(credential.identityToken, nonce);

            return success;
        } catch (error: any) {
            // User cancelled is not really an error
            if (error.code === 'ERR_REQUEST_CANCELED') {
                console.log('User cancelled Apple Sign In');
                return false;
            }

            console.error('Apple Sign In error:', error);
            throw error;
        }
    };

    return { signIn };
}
