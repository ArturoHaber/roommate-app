import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../constants/theme';
import { Avatar } from './Avatar';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';

interface CookingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (eaterIds: string[]) => void;
}

/**
 * "I Cooked" Modal
 * 
 * When user taps "I cooked", this modal lets them select who ate.
 * Selected eaters get dishes assigned to them.
 */
export const CookingModal: React.FC<CookingModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const { members } = useHouseholdStore();
    const { user } = useAuthStore();
    const [selectedEaters, setSelectedEaters] = useState<string[]>([]);

    // Initialize with current user selected
    React.useEffect(() => {
        if (visible && user) {
            setSelectedEaters([user.id]);
        }
    }, [visible, user]);

    const toggleEater = (userId: string) => {
        setSelectedEaters(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = () => {
        if (selectedEaters.length > 0) {
            onSubmit(selectedEaters);
            onClose();
            setSelectedEaters([]);
        }
    };

    const allMembers = user ? [user, ...members.filter(m => m.id !== user.id)] : members;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Text style={styles.headerEmoji}>🍳</Text>
                        </View>
                        <Text style={styles.title}>I Cooked!</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        Who's eating? They'll share dish duty.
                    </Text>

                    {/* Member Selection */}
                    <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
                        {allMembers.map((member) => {
                            const isSelected = selectedEaters.includes(member.id);
                            const isCurrentUser = member.id === user?.id;

                            return (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[
                                        styles.memberRow,
                                        isSelected && styles.memberRowSelected,
                                    ]}
                                    onPress={() => toggleEater(member.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.memberInfo}>
                                        <Avatar name={member.name} color={member.avatarColor} size="md" />
                                        <View>
                                            <Text style={styles.memberName}>
                                                {isCurrentUser ? 'You' : member.name}
                                            </Text>
                                            {isCurrentUser && (
                                                <Text style={styles.memberHint}>The chef 👨‍🍳</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected,
                                    ]}>
                                        {isSelected && (
                                            <Feather name="check" size={16} color={COLORS.white} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Feather name="info" size={16} color={COLORS.primary} />
                        <Text style={styles.infoText}>
                            Each selected person will be assigned dish duty for their share.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            selectedEaters.length === 0 && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={selectedEaters.length === 0}
                    >
                        <LinearGradient
                            colors={selectedEaters.length > 0
                                ? [COLORS.primary, '#4F46E5']
                                : [COLORS.gray700, COLORS.gray700]
                            }
                            style={styles.submitGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.submitText}>
                                {selectedEaters.length === 0
                                    ? 'Select who ate'
                                    : selectedEaters.length === 1
                                        ? 'Assign dishes to 1 person'
                                        : `Assign dishes to ${selectedEaters.length} people`
                                }
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.gray900,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xl + 20,
        paddingHorizontal: SPACING.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#F9731620',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    headerEmoji: {
        fontSize: 24,
    },
    title: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    memberList: {
        maxHeight: 300,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    memberRowSelected: {
        backgroundColor: COLORS.primary + '10',
        borderColor: COLORS.primary + '40',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    memberName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    memberHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 2,
        borderColor: COLORS.gray600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primary + '10',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    submitButton: {
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitGradient: {
        paddingVertical: SPACING.md + 4,
        alignItems: 'center',
    },
    submitText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
});

export default CookingModal;
