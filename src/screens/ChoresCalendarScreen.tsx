import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

type ViewType = 'Month' | 'Week' | 'Day';

// Mock Data
const MOCK_CHORES = {
    '2025-12-06': [{ id: '1', title: 'Dishes', user: 'Alex', color: '#818CF8' }],
    '2025-12-07': [{ id: '2', title: 'Vacuum', user: 'Sam', color: '#FB7185' }],
    '2025-12-08': [{ id: '3', title: 'Trash', user: 'Jordan', color: '#34D399' }],
    '2025-12-10': [{ id: '4', title: 'Mop', user: 'Alex', color: '#818CF8' }],
};

export const ChoresCalendarScreen = () => {
    const navigation = useNavigation();
    const [viewType, setViewType] = useState<ViewType>('Month');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedChore, setSelectedChore] = useState<any>(null);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chores Calendar</Text>
            <View style={styles.viewToggle}>
                {(['Month', 'Week', 'Day'] as ViewType[]).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.toggleButton, viewType === type && styles.toggleButtonActive]}
                        onPress={() => setViewType(type)}
                    >
                        <Text style={[styles.toggleText, viewType === type && styles.toggleTextActive]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderMonthView = () => (
        <Calendar
            current={selectedDate}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            theme={{
                backgroundColor: COLORS.background,
                calendarBackground: COLORS.background,
                textSectionTitleColor: COLORS.textSecondary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.textPrimary,
                textDisabledColor: COLORS.gray700,
                monthTextColor: COLORS.textPrimary,
                arrowColor: COLORS.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
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
        />
    );

    const renderDayView = () => {
        const chores = MOCK_CHORES[selectedDate as keyof typeof MOCK_CHORES] || [];

        return (
            <ScrollView style={styles.dayViewContainer}>
                <Text style={styles.dateTitle}>{format(new Date(selectedDate), 'EEEE, MMMM do')}</Text>
                {chores.length > 0 ? (
                    chores.map((chore, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.choreCard, { borderColor: chore.color }]}
                            onPress={() => setSelectedChore(chore)}
                        >
                            <View style={[styles.choreIcon, { backgroundColor: chore.color + '20' }]}>
                                <Feather name="check-circle" size={24} color={chore.color} />
                            </View>
                            <View style={styles.choreInfo}>
                                <Text style={styles.choreTitle}>{chore.title}</Text>
                                <Text style={styles.choreAssignee}>Assigned to {chore.user}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No chores for this day</Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    // Simplified Week View (Horizontal Scroll of 7 days starting from selected)
    const renderWeekView = () => {
        const start = startOfWeek(new Date(selectedDate));
        const weekDays = Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(start, i);
            const dateStr = date.toISOString().split('T')[0];
            const chores = MOCK_CHORES[dateStr as keyof typeof MOCK_CHORES] || [];

            return { date, dateStr, chores };
        });

        return (
            <ScrollView style={styles.weekViewContainer}>
                {weekDays.map((day, index) => (
                    <View key={index} style={styles.weekDayRow}>
                        <View style={styles.weekDayHeader}>
                            <Text style={styles.weekDayName}>{format(day.date, 'EEE')}</Text>
                            <Text style={styles.weekDayNum}>{format(day.date, 'd')}</Text>
                        </View>
                        <View style={styles.weekDayContent}>
                            {day.chores.length > 0 ? (
                                day.chores.map((chore, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.miniChoreCard, { backgroundColor: chore.color + '20', borderColor: chore.color }]}
                                        onPress={() => setSelectedChore(chore)}
                                    >
                                        <Text style={[styles.miniChoreText, { color: chore.color }]}>{chore.title}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptySlot} />
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <View style={styles.content}>
                {viewType === 'Month' && (
                    <>
                        {renderMonthView()}
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>Chores for {selectedDate}</Text>
                        {renderDayView()}
                    </>
                )}
                {viewType === 'Week' && renderWeekView()}
                {viewType === 'Day' && renderDayView()}
            </View>

            {/* Chore Detail Modal */}
            <Modal
                visible={!!selectedChore}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedChore(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedChore(null)}
                >
                    <View style={styles.modalContent}>
                        {selectedChore && (
                            <>
                                <Text style={styles.modalTitle}>{selectedChore.title}</Text>
                                <Text style={styles.modalSubtitle}>Assigned to {selectedChore.user}</Text>
                                <TouchableOpacity style={styles.nudgeButton}>
                                    <Text style={styles.nudgeButtonText}>👋 Nudge {selectedChore.user}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    backButton: {
        marginBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray800,
        borderRadius: BORDER_RADIUS.lg,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    toggleButtonActive: {
        backgroundColor: COLORS.gray700,
    },
    toggleText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: COLORS.white,
    },
    content: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray800,
        marginVertical: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textPrimary,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },

    // Day View Styles
    dayViewContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    dateTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    choreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
    },
    choreIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    choreInfo: {
        flex: 1,
    },
    choreTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    choreAssignee: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.md,
    },

    // Week View Styles
    weekViewContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    weekDayRow: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        minHeight: 60,
    },
    weekDayHeader: {
        width: 50,
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    weekDayName: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    weekDayNum: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    weekDayContent: {
        flex: 1,
        gap: SPACING.sm,
    },
    miniChoreCard: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
    },
    miniChoreText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    emptySlot: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.gray900,
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        width: '80%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    nudgeButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.full,
    },
    nudgeButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});
