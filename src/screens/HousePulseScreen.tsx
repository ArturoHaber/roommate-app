import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../constants/theme';
import { ProgressRing } from '../components';

// Mock Data
const ROOM_STATS = [
    { id: 'kitchen', name: 'Kitchen', score: 45, status: 'Critical', color: '#EF4444' },
    { id: 'living', name: 'Living Room', score: 92, status: 'Sparkling', color: '#34D399' },
    { id: 'bath', name: 'Bathroom', score: 78, status: 'Good', color: '#FBBF24' },
];

const THE_ROT = [
    { id: '1', item: 'Trash', level: 90, label: 'Overflowing', color: '#EF4444' },
    { id: '2', item: 'Dishes', level: 60, label: 'Piling Up', color: '#FBBF24' },
    { id: '3', item: 'Floors', level: 20, label: 'Clean', color: '#34D399' },
];

export const HousePulseScreen = () => {
    const navigation = useNavigation();
    const [isBlitzActive, setIsBlitzActive] = useState(false);

    const overallScore = 72; // Calculated from rooms

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>House Pulse</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Feather name="more-horizontal" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.scoreContainer}>
                        <ProgressRing
                            progress={overallScore / 100}
                            size={180}
                            strokeWidth={15}
                            color={overallScore > 80 ? COLORS.success : overallScore > 50 ? COLORS.warning : COLORS.error}
                        />
                        <View style={styles.scoreTextContainer}>
                            <Text style={styles.scoreValue}>{overallScore}</Text>
                            <Text style={styles.scoreLabel}>HEALTH</Text>
                        </View>
                    </View>
                    <Text style={styles.heroStatus}>
                        {overallScore > 80 ? "Sparkling Clean ✨" : overallScore > 50 ? "Needs Attention 🧹" : "Disaster Zone 🚨"}
                    </Text>
                </View>

                {/* Blitz Mode Button */}
                <TouchableOpacity
                    style={styles.blitzButton}
                    onPress={() => setIsBlitzActive(!isBlitzActive)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isBlitzActive ? ['#EF4444', '#DC2626'] : [COLORS.primary, '#4F46E5']}
                        style={styles.blitzGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Feather name={isBlitzActive ? "x-circle" : "zap"} size={24} color={COLORS.white} />
                        <View>
                            <Text style={styles.blitzTitle}>{isBlitzActive ? "CANCEL BLITZ" : "BLITZ MODE"}</Text>
                            <Text style={styles.blitzSubtitle}>{isBlitzActive ? "Timer Running..." : "Trigger 15m Clean Timer"}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Room Radar */}
                <Text style={styles.sectionTitle}>Room Radar</Text>
                <View style={styles.gridContainer}>
                    {ROOM_STATS.map((room) => (
                        <View key={room.id} style={styles.roomCard}>
                            <View style={styles.roomHeader}>
                                <Text style={styles.roomName}>{room.name}</Text>
                                <Text style={[styles.roomScore, { color: room.color }]}>{room.score}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${room.score}%`, backgroundColor: room.color }]} />
                            </View>
                            <Text style={styles.roomStatus}>{room.status}</Text>
                        </View>
                    ))}
                </View>

                {/* The Rot (Issues) */}
                <Text style={styles.sectionTitle}>The Rot Tracker</Text>
                <View style={styles.rotContainer}>
                    {THE_ROT.map((item) => (
                        <View key={item.id} style={styles.rotItem}>
                            <View style={styles.rotIcon}>
                                <Feather name={item.item === 'Trash' ? 'trash-2' : item.item === 'Dishes' ? 'coffee' : 'layers'} size={20} color={COLORS.textSecondary} />
                            </View>
                            <View style={styles.rotContent}>
                                <View style={styles.rotHeader}>
                                    <Text style={styles.rotName}>{item.item}</Text>
                                    <Text style={[styles.rotLabel, { color: item.color }]}>{item.label}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${item.level}%`, backgroundColor: item.color }]} />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.snitchButton}>
                                <Feather name="alert-circle" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.xs,
    },
    menuButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    scoreContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    scoreTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    scoreLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 2,
    },
    heroStatus: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    blitzButton: {
        marginBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    blitzGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        gap: SPACING.md,
    },
    blitzTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: 1,
    },
    blitzSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gridContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    roomCard: {
        backgroundColor: COLORS.gray800,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    roomName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roomScore: {
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
    },
    roomStatus: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    rotContainer: {
        gap: SPACING.md,
    },
    rotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray800,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.md,
    },
    rotIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray900,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rotContent: {
        flex: 1,
    },
    rotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    rotName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    rotLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    snitchButton: {
        padding: SPACING.xs,
    },
});
