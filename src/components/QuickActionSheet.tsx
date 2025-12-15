import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    icon: keyof typeof Feather.glyphMap;
    iconColor?: string;
    children: React.ReactNode;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
    visible,
    onClose,
    title,
    icon,
    iconColor = COLORS.primary,
    children,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop - tap to dismiss */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Sheet container */}
                <View style={styles.container}>
                    {/* Drag Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
                                <Feather name={icon} size={20} color={iconColor} />
                            </View>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Reusable components for action sheet content

interface ActionOptionProps {
    emoji: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    isSelected?: boolean;
}

export const ActionOption: React.FC<ActionOptionProps> = ({
    emoji,
    title,
    subtitle,
    onPress,
    isSelected,
}) => (
    <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.optionEmoji}>{emoji}</Text>
        <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{title}</Text>
            {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
);

interface QuickGridItemProps {
    emoji: string;
    label: string;
    onPress: () => void;
    isSelected?: boolean;
    color?: string;
}

export const QuickGridItem: React.FC<QuickGridItemProps> = ({
    emoji,
    label,
    onPress,
    isSelected,
    color,
}) => (
    <TouchableOpacity
        style={[
            styles.gridItem,
            isSelected && styles.gridItemSelected,
            color && { borderColor: color },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.gridEmoji}>{emoji}</Text>
        <Text style={[styles.gridLabel, isSelected && styles.gridLabelSelected]}>{label}</Text>
    </TouchableOpacity>
);

interface ActionButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    icon?: keyof typeof Feather.glyphMap;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    icon,
}) => (
    <TouchableOpacity
        style={[
            styles.actionButton,
            variant === 'secondary' && styles.actionButtonSecondary,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        {icon && (
            <Feather
                name={icon}
                size={18}
                color={variant === 'primary' ? COLORS.white : COLORS.primary}
            />
        )}
        <Text style={[
            styles.actionButtonText,
            variant === 'secondary' && styles.actionButtonTextSecondary,
        ]}>
            {label}
        </Text>
    </TouchableOpacity>
);

export const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
    <Text style={styles.sectionLabel}>{children}</Text>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        maxHeight: SCREEN_HEIGHT * 0.7,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: COLORS.gray600,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginHorizontal: SPACING.lg,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    // Option styles
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        gap: SPACING.md,
    },
    optionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    optionEmoji: {
        fontSize: 28,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    optionSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Grid styles
    gridItem: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray800,
        marginBottom: SPACING.sm,
    },
    gridItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
    },
    gridEmoji: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    gridLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    gridLabelSelected: {
        color: COLORS.primary,
    },
    // Button styles
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md + 2,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    actionButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    actionButtonTextSecondary: {
        color: COLORS.primary,
    },
    // Section label
    sectionLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
        marginTop: SPACING.md,
    },
});
