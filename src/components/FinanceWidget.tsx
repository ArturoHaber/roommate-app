import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';

export const FinanceWidget = () => {
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();

    // Mock Calculation
    const netBalance = -5.50; // Negative means "You owe"
    const isOwe = netBalance < 0;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Expenses')}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.leftContent}>
                    <View style={[styles.iconContainer, isOwe ? styles.iconOwe : styles.iconSettled]}>
                        <Feather
                            name={isOwe ? 'arrow-up-right' : 'check'}
                            size={20}
                            color={isOwe ? COLORS.warning : COLORS.success}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Your Share</Text>
                        <Text style={[styles.amount, isOwe ? { color: COLORS.warning } : { color: COLORS.textPrimary }]}>
                            {isOwe ? `-$${Math.abs(netBalance).toFixed(2)}` : 'Settled'}
                        </Text>
                    </View>
                </View>

                <View style={styles.rightContent}>
                    <Text style={styles.actionText}>Details</Text>
                    <Feather name="chevron-right" size={16} color={COLORS.textSecondary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        ...SHADOWS.sm,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconOwe: {
        backgroundColor: COLORS.warning + '20',
    },
    iconSettled: {
        backgroundColor: COLORS.success + '20',
    },
    label: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    amount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});
