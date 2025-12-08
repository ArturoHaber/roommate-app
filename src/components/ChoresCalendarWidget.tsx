import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

// Mock Data (Shared/Mirrored from Screen for now)
const MOCK_CHORES = {
    '2025-12-06': [{ id: '1', title: 'Dishes', user: 'Alex', color: '#818CF8' }],
    '2025-12-07': [{ id: '2', title: 'Vacuum', user: 'Sam', color: '#FB7185' }],
    '2025-12-08': [{ id: '3', title: 'Trash', user: 'Jordan', color: '#34D399' }],
    '2025-12-10': [{ id: '4', title: 'Mop', user: 'Alex', color: '#818CF8' }],
};

export const ChoresCalendarWidget = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
                        ...Object.keys(MOCK_CHORES).reduce((acc, date) => {
                            acc[date] = {
                                customStyles: {
                                    container: {
                                        backgroundColor: MOCK_CHORES[date as keyof typeof MOCK_CHORES][0].color + '20',
                                        borderWidth: 1,
                                        borderColor: MOCK_CHORES[date as keyof typeof MOCK_CHORES][0].color,
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
