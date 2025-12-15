import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { useChoreStore } from '../stores/useChoreStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { format } from 'date-fns';

export const ChoresCalendarWidget = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { assignments, chores } = useChoreStore();
    const { members } = useHouseholdStore();

    // Build chores per date from real assignments
    const choresByDate = useMemo(() => {
        const map: Record<string, { id: string; title: string; user: string; color: string }[]> = {};

        assignments.forEach(assignment => {
            const chore = chores.find(c => c.id === assignment.choreId);
            const member = members.find(m => m.id === assignment.assignedTo);
            if (!chore) return;

            const dateStr = format(new Date(assignment.dueDate), 'yyyy-MM-dd');
            if (!map[dateStr]) map[dateStr] = [];

            map[dateStr].push({
                id: assignment.id,
                title: chore.name,
                user: member?.name || 'Unknown',
                color: member?.avatarColor || '#818CF8',
            });
        });

        return map;
    }, [assignments, chores, members]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Feather name="calendar" size={16} color={COLORS.textSecondary} />
                <Text style={styles.title}>Chore History</Text>
            </View>

            <View style={styles.calendarContainer}>
                <Calendar
                    current={selectedDate}
                    onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                    theme={{
                        backgroundColor: COLORS.gray900,
                        calendarBackground: COLORS.gray900,
                        textSectionTitleColor: COLORS.textSecondary,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: COLORS.white,
                        todayTextColor: COLORS.primary,
                        dayTextColor: COLORS.textPrimary,
                        textDisabledColor: COLORS.gray700,
                        monthTextColor: COLORS.textPrimary,
                        arrowColor: COLORS.primary,
                        textDayFontWeight: '600',
                        textMonthFontWeight: '700',
                        textDayHeaderFontWeight: '600',
                        textDayFontSize: 12,
                        textMonthFontSize: 14,
                        textDayHeaderFontSize: 12,
                    }}
                    markingType={'custom'}
                    markedDates={{
                        [selectedDate]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' },
                        ...Object.keys(choresByDate).reduce((acc, date) => {
                            const firstChore = choresByDate[date][0];
                            acc[date] = {
                                customStyles: {
                                    container: {
                                        backgroundColor: firstChore.color + '20',
                                        borderWidth: 1,
                                        borderColor: firstChore.color,
                                    },
                                    text: {
                                        color: COLORS.textPrimary,
                                    }
                                }
                            };
                            return acc;
                        }, {} as any)
                    }}
                    style={styles.calendar}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        gap: SPACING.xs,
    },
    title: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    calendarContainer: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        overflow: 'hidden',
        // Minimal shadow
        ...SHADOWS.sm,
    },
    calendar: {
        borderRadius: BORDER_RADIUS.lg,
    },
});
