import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';

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
            {/* Premium Section Header */}
            <View style={styles.headerContainer}>
                <View style={styles.accentBar} />
                <Text style={styles.title}>{title}</Text>
                {onExpand && (
                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={onExpand}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.expandText}>See All</Text>
                        <Feather name="arrow-right" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
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
    accentBar: {
        width: 3,
        height: 16,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        marginRight: SPACING.sm,
    },
    title: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
        letterSpacing: 0.3,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primary + '15',
        borderRadius: BORDER_RADIUS.full,
    },
    expandText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    content: {
        // Content layout is handled by the child
    },
});
