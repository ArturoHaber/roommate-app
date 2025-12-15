import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { QuickActionSheet, ActionButton, SectionLabel } from './QuickActionSheet';
import { SuccessOverlay } from './SuccessOverlay';
import { useChoreStore } from '../stores/useChoreStore';
import { useAuthStore } from '../stores/useAuthStore';

interface CompleteSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const CompleteSheet: React.FC<CompleteSheetProps> = ({ visible, onClose }) => {
    const { chores, assignments, completeChore } = useChoreStore();
    const { user } = useAuthStore();
    const [selectedChoreIds, setSelectedChoreIds] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState({ message: '', points: 0 });

    // Get user's assigned tasks
    const myTasks = user
        ? assignments
            .filter(a => a.assignedTo === user.id && !a.completedAt)
            .map(a => {
                const chore = chores.find(c => c.id === a.choreId);
                return { ...a, chore };
            })
            .filter(a => a.chore)
        : [];

    // All chores for browse list
    const allChores = chores.slice(0, 8);

    const toggleChore = (choreId: string) => {
        if (selectedChoreIds.includes(choreId)) {
            setSelectedChoreIds(selectedChoreIds.filter(id => id !== choreId));
        } else {
            setSelectedChoreIds([...selectedChoreIds, choreId]);
        }
    };

    const handleComplete = () => {
        if (selectedChoreIds.length === 0 || !user) return;

        let totalPoints = 0;
        const completedNames: string[] = [];

        selectedChoreIds.forEach(choreId => {
            // Find assignment for this chore
            const assignment = assignments.find(a => a.choreId === choreId && !a.completedAt);
            if (assignment) {
                completeChore(assignment.id, user.id);
            }
            const chore = chores.find(c => c.id === choreId);
            if (chore) {
                totalPoints += chore.pointValue;
                completedNames.push(chore.name);
            }
        });

        // Show success overlay instead of Alert
        setSuccessData({
            message: completedNames.length > 1 ? `${completedNames.length} Tasks Done!` : `${completedNames[0]} Done!`,
            points: totalPoints,
        });
        setSelectedChoreIds([]);
        setShowSuccess(true);
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        onClose();
    };

    return (
        <>
            <QuickActionSheet
                visible={visible}
                onClose={onClose}
                title="Mark Complete"
                icon="check-circle"
                iconColor={COLORS.success}
            >
                {/* My Assigned Tasks */}
                {myTasks.length > 0 && (
                    <>
                        <SectionLabel>Your Turn (select multiple)</SectionLabel>
                        <View style={styles.assignedGrid}>
                            {myTasks.slice(0, 4).map((task) => {
                                const isSelected = selectedChoreIds.includes(task.choreId);
                                return (
                                    <TouchableOpacity
                                        key={task.id}
                                        style={[
                                            styles.assignedCard,
                                            isSelected && styles.assignedCardSelected,
                                        ]}
                                        onPress={() => toggleChore(task.choreId)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.assignedEmoji}>
                                            {task.chore?.icon === 'droplet' ? '💧' :
                                                task.chore?.icon === 'trash-2' ? '🗑️' :
                                                    task.chore?.icon === 'home' ? '🏠' : '✨'}
                                        </Text>
                                        <Text style={styles.assignedName} numberOfLines={1}>
                                            {task.chore?.name}
                                        </Text>
                                        <Text style={styles.assignedPoints}>
                                            +{task.chore?.pointValue || 3} pts
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.selectedCheck}>
                                                <Feather name="check" size={14} color={COLORS.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Browse All */}
                <SectionLabel>Browse All Chores</SectionLabel>
                <View style={styles.choreList}>
                    {allChores.map((chore) => {
                        const isSelected = selectedChoreIds.includes(chore.id);
                        return (
                            <TouchableOpacity
                                key={chore.id}
                                style={[
                                    styles.choreRow,
                                    isSelected && styles.choreRowSelected,
                                ]}
                                onPress={() => toggleChore(chore.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.choreIconWrap}>
                                    <Feather name={chore.icon as any} size={18} color={COLORS.primary} />
                                </View>
                                <Text style={styles.choreName}>{chore.name}</Text>
                                <Text style={styles.chorePoints}>+{chore.pointValue}</Text>
                                {isSelected ? (
                                    <View style={styles.radioSelected}>
                                        <View style={styles.radioDot} />
                                    </View>
                                ) : (
                                    <View style={styles.radio} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Complete Button */}
                <ActionButton
                    label={selectedChoreIds.length > 0 ? `Complete ${selectedChoreIds.length} Task${selectedChoreIds.length > 1 ? 's' : ''} ✓` : "Select tasks"}
                    onPress={handleComplete}
                    icon="check"
                />
            </QuickActionSheet>

            {/* Success Overlay */}
            <SuccessOverlay
                visible={showSuccess}
                message={successData.message}
                points={successData.points}
                onComplete={handleSuccessComplete}
                variant="complete"
            />
        </>
    );
};

const styles = StyleSheet.create({
    // Assigned tasks grid
    assignedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    assignedCard: {
        width: '48%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.gray800,
        alignItems: 'center',
        position: 'relative',
    },
    assignedCardSelected: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.success + '15',
    },
    assignedEmoji: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    assignedName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    assignedPoints: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.success,
        fontWeight: '700',
    },
    selectedCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Chore list
    choreList: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    choreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
        gap: SPACING.md,
    },
    choreRowSelected: {
        backgroundColor: COLORS.success + '10',
    },
    choreIconWrap: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    choreName: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    chorePoints: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        fontWeight: '600',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.gray600,
    },
    radioSelected: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.success,
    },
});
