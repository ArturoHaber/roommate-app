import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '../constants/theme';
import { CookingModal } from '../components/CookingModal';

interface ActionCard {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    gradient: [string, string];
    iconBg: string;
}

/**
 * OPTION C: Dedicated Log Tab/Screen
 * 
 * A full screen dedicated to quick logging actions.
 * This is a self-contained screen for use in navigation.
 */
export const LogScreen: React.FC = () => {
    const [isCookingModalVisible, setIsCookingModalVisible] = useState(false);

    const actions: ActionCard[] = [
        {
            id: 'cook',
            emoji: '🍳',
            title: 'I Cooked',
            subtitle: 'Log a meal & assign dishes',
            gradient: ['#F97316', '#EA580C'],
            iconBg: '#FED7AA',
        },
        {
            id: 'chore',
            emoji: '✅',
            title: 'Log Chore',
            subtitle: 'Mark a task as done',
            gradient: ['#22C55E', '#16A34A'],
            iconBg: '#BBF7D0',
        },
        {
            id: 'groceries',
            emoji: '🛒',
            title: 'Bought Groceries',
            subtitle: 'Split a shopping trip',
            gradient: ['#3B82F6', '#2563EB'],
            iconBg: '#BFDBFE',
        },
        {
            id: 'snitch',
            emoji: '👀',
            title: 'Report Issue',
            subtitle: 'Something not right?',
            gradient: ['#EF4444', '#DC2626'],
            iconBg: '#FECACA',
        },
    ];

    const handlePress = (id: string) => {
        switch (id) {
            case 'cook':
                setIsCookingModalVisible(true);
                break;
            case 'chore':
                Alert.alert('Log Chore', 'Chore logging coming soon!');
                break;
            case 'groceries':
                Alert.alert('Groceries', 'Grocery logging coming soon!');
                break;
            case 'snitch':
                Alert.alert('Report Issue', 'Snitch feature coming soon! 👀');
                break;
        }
    };

    const handleCookingSubmit = (eaterIds: string[]) => {
        Alert.alert(
            'Dishes Assigned!',
            `Dishes have been assigned to ${eaterIds.length} people.`,
            [{ text: 'OK' }]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quick Log</Text>
                <Text style={styles.headerSubtitle}>What did you just do?</Text>
            </View>

            {/* Action Cards Grid */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {actions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.cardWrapper}
                            onPress={() => handlePress(action.id)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={action.gradient}
                                style={styles.card}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* Decorative circles */}
                                <View style={[styles.decorCircle, styles.decorCircle1]} />
                                <View style={[styles.decorCircle, styles.decorCircle2]} />

                                <View style={styles.cardContent}>
                                    <View style={[styles.emojiContainer, { backgroundColor: action.iconBg }]}>
                                        <Text style={styles.emoji}>{action.emoji}</Text>
                                    </View>
                                    <Text style={styles.cardTitle}>{action.title}</Text>
                                    <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
                                </View>

                                <View style={styles.cardArrow}>
                                    <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.8)" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Activity Preview */}
                <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent Activity</Text>
                    <View style={styles.recentCard}>
                        <View style={styles.recentItem}>
                            <View style={[styles.recentDot, { backgroundColor: COLORS.success }]} />
                            <Text style={styles.recentText}>Sam logged "Dishes" — 5 min ago</Text>
                        </View>
                        <View style={styles.recentItem}>
                            <View style={[styles.recentDot, { backgroundColor: '#F97316' }]} />
                            <Text style={styles.recentText}>Alex cooked dinner — 1 hr ago</Text>
                        </View>
                        <View style={styles.recentItem}>
                            <View style={[styles.recentDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={styles.recentText}>You completed "Trash" — 2 hr ago</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Cooking Modal */}
            <CookingModal
                visible={isCookingModalVisible}
                onClose={() => setIsCookingModalVisible(false)}
                onSubmit={handleCookingSubmit}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 120,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    cardWrapper: {
        width: '48%',
        aspectRatio: 1,
    },
    card: {
        flex: 1,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        justifyContent: 'space-between',
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorCircle1: {
        width: 100,
        height: 100,
        top: -30,
        right: -30,
    },
    decorCircle2: {
        width: 60,
        height: 60,
        bottom: -20,
        left: -20,
    },
    cardContent: {
        flex: 1,
    },
    emojiContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    emoji: {
        fontSize: 24,
    },
    cardTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: 'rgba(255,255,255,0.8)',
    },
    cardArrow: {
        alignSelf: 'flex-end',
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentSection: {
        marginTop: SPACING.xl,
    },
    recentTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
    },
    recentCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    recentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.md,
    },
    recentText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
});

export default LogScreen;
