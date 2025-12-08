import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';

export const FinanceWidget = () => {
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();

    // Mock Calculation
    const netBalance = -25.50; // Negative means "You owe"
    const isOwe = netBalance < 0;
    const pendingTransactions = 3;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Expenses')}
            style={styles.container}
        >
            <LinearGradient
                colors={[COLORS.gray800, COLORS.gray900] as const}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Main Balance Section */}
                <View style={styles.balanceSection}>
                    <View style={styles.balanceHeader}>
                        <View style={[styles.statusDot, isOwe ? styles.statusOwe : styles.statusSettled]} />
                        <Text style={styles.balanceLabel}>
                            {isOwe ? 'You Owe' : 'All Settled'}
                        </Text>
                    </View>

                    <Text style={[styles.balanceAmount, isOwe && styles.balanceOwe]}>
                        {isOwe ? `$${Math.abs(netBalance).toFixed(2)}` : '✓'}
                    </Text>

                    {pendingTransactions > 0 && (
                        <Text style={styles.pendingText}>
                            {pendingTransactions} pending transaction{pendingTransactions > 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryAction]}
                        onPress={() => navigation.navigate('Expenses')}
                    >
                        <Feather name="plus" size={16} color={COLORS.white} />
                        <Text style={styles.actionTextPrimary}>Add</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Expenses')}
                    >
                        <Feather name="send" size={14} color={COLORS.primary} />
                        <Text style={styles.actionTextSecondary}>Settle</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    card: {
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.gray700,
        ...SHADOWS.md,
    },
    balanceSection: {
        marginBottom: SPACING.lg,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: BORDER_RADIUS.full,
        marginRight: SPACING.xs,
    },
    statusOwe: {
        backgroundColor: COLORS.warning,
    },
    statusSettled: {
        backgroundColor: COLORS.success,
    },
    balanceLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -1,
    },
    balanceOwe: {
        color: COLORS.warning,
    },
    pendingText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray700,
        flex: 1,
    },
    primaryAction: {
        backgroundColor: COLORS.primary,
    },
    actionTextPrimary: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.white,
    },
    actionTextSecondary: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
