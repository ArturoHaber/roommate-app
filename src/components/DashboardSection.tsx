import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

interface DashboardSectionProps {
    title: string;
    onExpand?: () => void;
    children: React.ReactNode;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
    title,
    onExpand,
    children,
}) => {
    return (
        <View style={styles.container}>
            {/* Divider & Header */}
            <View style={styles.headerContainer}>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={styles.headerContent}
                    onPress={onExpand}
                    activeOpacity={onExpand ? 0.7 : 1}
                >
                    <Text style={styles.title}>{title}</Text>
                    {onExpand && (
                        <Feather name="maximize-2" size={16} color={COLORS.textSecondary} />
                    )}
                </TouchableOpacity>
                <View style={styles.divider} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xl,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray800,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        // Content layout is handled by the child
    },
});
