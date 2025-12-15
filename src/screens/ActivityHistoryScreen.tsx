import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Avatar, ActivityDetailModal, ActivityItem } from '../components';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface ActivityHistoryScreenProps {
    navigation: any;
}

// Mock activity data with dates
const MOCK_ACTIVITIES: (ActivityItem & { date: Date })[] = [
    { id: '1', user: 'Sam', userColor: '#34D399', type: 'complete', chore: 'Dishes', date: new Date(), time: '2h ago' },
    { id: '2', user: 'Alex', userColor: '#818CF8', type: 'nudge', chore: 'Sent a reminder', date: new Date(), time: '3h ago' },
    { id: '3', user: 'Jordan', userColor: '#F472B6', type: 'complete', chore: 'Vacuum Living Room', date: new Date(), time: '5h ago' },
    { id: '4', user: 'Casey', userColor: '#FBBF24', type: 'complete', chore: 'Take out trash', date: new Date(Date.now() - 86400000), time: 'Yesterday' },
    { id: '5', user: 'Sam', userColor: '#34D399', type: 'complete', chore: 'Clean bathroom', date: new Date(Date.now() - 86400000), time: 'Yesterday' },
    { id: '6', user: 'Alex', userColor: '#818CF8', type: 'complete', chore: 'Mop kitchen', date: new Date(Date.now() - 2 * 86400000), time: '2 days ago' },
    { id: '7', user: 'Jordan', userColor: '#F472B6', type: 'nudge', chore: 'Dishes reminder', date: new Date(Date.now() - 3 * 86400000), time: '3 days ago' },
    { id: '8', user: 'Casey', userColor: '#FBBF24', type: 'complete', chore: 'Wipe counters', date: new Date(Date.now() - 4 * 86400000), time: '4 days ago' },
    { id: '9', user: 'Sam', userColor: '#34D399', type: 'complete', chore: 'Dishes', date: new Date(Date.now() - 5 * 86400000), time: '5 days ago' },
    { id: '10', user: 'Alex', userColor: '#818CF8', type: 'complete', chore: 'Vacuum', date: new Date(Date.now() - 7 * 86400000), time: 'Last week' },
];

export const ActivityHistoryScreen: React.FC<ActivityHistoryScreenProps> = ({ navigation }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const startDay = start.getDay();
        const paddedDays: (Date | null)[] = Array(startDay).fill(null);
        return [...paddedDays, ...days];
    }, [currentMonth]);

    const displayActivities = useMemo(() => {
        if (selectedDate) {
            return MOCK_ACTIVITIES.filter(a => isSameDay(a.date, selectedDate));
        }
        return MOCK_ACTIVITIES;
    }, [selectedDate]);

    const dayHasActivity = (date: Date) => MOCK_ACTIVITIES.some(a => isSameDay(a.date, date));

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        setSelectedDate(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                            <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
                        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                            <Feather name="chevron-right" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekdayRow}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <Text key={day} style={styles.weekdayLabel}>{day}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {calendarDays.map((day, index) => {
                            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                            const hasActivity = dayHasActivity(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isDayToday = isToday(day);

                            return (
                                <TouchableOpacity
                                    key={day.toISOString()}
                                    style={[styles.dayCell, isSelected && styles.dayCellSelected, isDayToday && !isSelected && styles.dayCellToday]}
                                    onPress={() => setSelectedDate(isSelected ? null : day)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isDayToday && !isSelected && styles.dayTextToday]}>
                                        {format(day, 'd')}
                                    </Text>
                                    {hasActivity && <View style={[styles.activityDot, isSelected && styles.activityDotSelected]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Activity List */}
                <View style={styles.activitySection}>
                    <View style={styles.activityHeader}>
                        <Text style={styles.activityTitle}>
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'All Activity'}
                        </Text>
                        {selectedDate && (
                            <TouchableOpacity onPress={() => setSelectedDate(null)}>
                                <Text style={styles.clearFilter}>Clear Filter</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {displayActivities.length > 0 ? (
                        <View style={styles.activityList}>
                            {displayActivities.map((activity) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={styles.activityItem}
                                    onPress={() => setSelectedActivity(activity)}
                                    activeOpacity={0.7}
                                >
                                    <Avatar name={activity.user} color={activity.userColor} size="sm" />
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityText}>
                                            {activity.type === 'complete' ? (
                                                <><Text style={styles.activityUser}>{activity.user}</Text>{' completed '}<Text style={styles.activityChore}>{activity.chore}</Text></>
                                            ) : (
                                                <><Text style={styles.activityUser}>{activity.user}</Text>{' sent a nudge'}</>
                                            )}
                                        </Text>
                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                    </View>
                                    <View style={[styles.activityIcon, activity.type === 'complete' ? styles.activityIconComplete : styles.activityIconNudge]}>
                                        <Feather name={activity.type === 'complete' ? 'check' : 'send'} size={12} color={activity.type === 'complete' ? COLORS.success : COLORS.primary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="calendar" size={48} color={COLORS.gray700} />
                            <Text style={styles.emptyText}>No activity on this day</Text>
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Shared Activity Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                onClose={() => setSelectedActivity(null)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray800 },
    backButton: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray800, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
    calendarContainer: { margin: SPACING.lg, backgroundColor: COLORS.gray900, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.gray800, ...SHADOWS.md },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
    navButton: { width: 40, height: 40, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray800, justifyContent: 'center', alignItems: 'center' },
    monthTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
    weekdayRow: { flexDirection: 'row', marginBottom: SPACING.sm },
    weekdayLabel: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textTertiary, textTransform: 'uppercase' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: BORDER_RADIUS.md },
    dayCellSelected: { backgroundColor: COLORS.primary },
    dayCellToday: { backgroundColor: COLORS.gray800 },
    dayText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary },
    dayTextSelected: { color: COLORS.white, fontWeight: '700' },
    dayTextToday: { color: COLORS.primary, fontWeight: '700' },
    activityDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.success },
    activityDotSelected: { backgroundColor: COLORS.white },
    activitySection: { paddingHorizontal: SPACING.lg },
    activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    activityTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
    clearFilter: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary },
    activityList: { backgroundColor: COLORS.gray900, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gray800 },
    activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray800, gap: SPACING.md },
    activityContent: { flex: 1 },
    activityText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
    activityUser: { fontWeight: '700', color: COLORS.textPrimary },
    activityChore: { fontWeight: '600', color: COLORS.primary },
    activityTime: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },
    activityIcon: { width: 28, height: 28, borderRadius: BORDER_RADIUS.full, justifyContent: 'center', alignItems: 'center' },
    activityIconComplete: { backgroundColor: COLORS.success + '20' },
    activityIconNudge: { backgroundColor: COLORS.primary + '20' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl, backgroundColor: COLORS.gray900, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.gray800 },
    emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, marginTop: SPACING.md },
});
