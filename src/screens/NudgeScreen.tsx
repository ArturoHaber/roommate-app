import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Avatar } from '../components/Avatar';
import { AuthGateModal, useIsAnonymous } from '../components/AuthGateModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useNudgeStore } from '../stores/useNudgeStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useAuthStore } from '../stores/useAuthStore';

// Style configuration
type NudgeStyle = 'friendly' | 'funny' | 'roast' | 'olde_english' | 'robot' | 'pirate' | 'passive_aggressive' | 'custom';
type NudgeIntensity = 'gentle' | 'medium' | 'urgent';

interface StyleOption {
    id: NudgeStyle;
    name: string;
    icon: string;
    emoji: string;
    description: string;
    color: string;
}

const STYLE_OPTIONS: StyleOption[] = [
    { id: 'friendly', name: 'Friendly', icon: 'smile', emoji: '😊', description: 'Warm and encouraging', color: '#34D399' },
    { id: 'funny', name: 'Funny', icon: 'laugh', emoji: '😂', description: 'Light-hearted humor', color: '#FBBF24' },
    { id: 'roast', name: 'Roast', icon: 'flame', emoji: '🔥', description: 'Playful burns', color: '#EF4444' },
    { id: 'olde_english', name: 'Olde English', icon: 'crown', emoji: '🏰', description: 'Shakespearean flair', color: '#A78BFA' },
    { id: 'robot', name: 'Robot', icon: 'cpu', emoji: '🤖', description: 'Formal & technical', color: '#60A5FA' },
    { id: 'pirate', name: 'Pirate', icon: 'anchor', emoji: '🏴‍☠️', description: 'Arrr matey!', color: '#F97316' },
    { id: 'passive_aggressive', name: 'Passive Aggressive', icon: 'meh', emoji: '🙃', description: 'Subtle shade', color: '#EC4899' },
    { id: 'custom', name: 'Custom', icon: 'edit-2', emoji: '✨', description: 'Your own style', color: '#818CF8' },
];

// Prompt templates for mock LLM generation
const STYLE_TEMPLATES: Record<NudgeStyle, Record<NudgeIntensity, string[]>> = {
    friendly: {
        gentle: [
            "Hey {name}! Just a friendly reminder about {chore} when you get a chance 💪",
            "Hi {name}! No rush, but {chore} could use some love when you're free ✨",
            "Heya {name}! Quick heads up about {chore} - whenever works for you! 😊",
        ],
        medium: [
            "Hey {name}! Would be great if you could knock out {chore} today! 🙌",
            "Hi {name}! {chore} is waiting for you - you've got this! 💪",
            "Hey {name}! Just checking in about {chore} - appreciate you! 🌟",
        ],
        urgent: [
            "Hey {name}! {chore} really needs attention soon! Thank you so much! 🙏",
            "{name}! Quick favor - {chore} is getting urgent. You're the best! 💫",
            "Hi {name}! Could you please help with {chore} ASAP? Really appreciate it! ❤️",
        ],
    },
    funny: {
        gentle: [
            "Knock knock... who's there? {chore}. {chore} who? {chore} that needs doing, {name}! 😄",
            "Hey {name}! {chore} called... it misses you 📞😂",
            "Breaking news: {chore} spotted looking lonely. Sources say {name} is the hero we need 🦸",
        ],
        medium: [
            "{name}! The {chore} fairy called in sick. Tag, you're it! 🏃‍♂️💨",
            "Plot twist: {chore} won't do itself. Who knew? Looking at you, {name}! 👀",
            "Alexa, remind {name} about {chore}... wait, I'm not Alexa. But still! 🤣",
        ],
        urgent: [
            "ALERT: {chore} has achieved sentience and is asking for {name} by name! 🚨😂",
            "{name}! If {chore} were a movie, we'd be in the third act climax right now! 🎬",
            "This is your captain speaking: {chore} at DEFCON 1. {name}, you're our only hope! 🛸",
        ],
    },
    roast: {
        gentle: [
            "Hey {name}, remember when you said you'd handle {chore}? Neither does {chore} apparently 😏",
            "{name}, {chore} is starting to wonder if you two are in a relationship or just situationship 💀",
            "Not to be dramatic, but {chore} has been waiting longer than most streaming release dates, {name} 📺",
        ],
        medium: [
            "{name}, {chore} is giving 'I'll text you back' energy right now 📱😂",
            "Legend has it {name} will eventually do {chore}. Legends are often wrong though 🏆",
            "{name}'s commitment to {chore}: as real as low-fat cheese being good 🧀",
        ],
        urgent: [
            "{name}, {chore} has been waiting so long it's considering writing a memoir 📖💀",
            "Breaking: {chore} files missing persons report on {name}'s motivation 🚔",
            "{name} + {chore} = the slowest burn romance in history. When's the sequel? 🎭",
        ],
    },
    olde_english: {
        gentle: [
            "Hear ye, hear ye! Good {name}, the time doth approach to attend to {chore}, if it please thee 📜",
            "Prithee, {name}, when convenience permits, {chore} awaits thy noble attention ⚔️",
            "Hark! {name}, a gentle reminder that {chore} doth require thy skilled hand 🏰",
        ],
        medium: [
            "By the crown! {name}, {chore} summons thee to fulfill thy sacred duty 👑",
            "Forsooth, {name}! The realm of {chore} grows restless and seeks its champion ⚔️",
            "Good {name}, thy liege requests thou attendeth to {chore} with haste! 📜",
        ],
        urgent: [
            "OYEZ! {name}! {chore} threatens the peace of our kingdom! Make haste! 🏰⚔️",
            "By decree of the household: {name} must vanquish {chore} ere sundown! 👑",
            "The hour grows dark, {name}! {chore} shall wait no longer! To arms! ⚔️🛡️",
        ],
    },
    robot: {
        gentle: [
            "NOTIFICATION: {name}, task '{chore}' detected in queue. Priority: Low. Execute when optimal. 🤖",
            "ALERT [LOW]: {name}, '{chore}' subroutine pending. Awaiting user input. ⚙️",
            "SYSTEM: Gentle reminder to unit {name}. Task '{chore}' status: incomplete. No rush. Beep boop. 🔧",
        ],
        medium: [
            "PRIORITY [MEDIUM]: {name}, '{chore}' task requires execution. Efficiency protocols engaged. 🤖",
            "PROCESSING: {name}, task queue indicates '{chore}' awaits completion. Please confirm action. ⚙️",
            "ALERT: {name}, household efficiency at 78%. Task '{chore}' will optimize metrics. Execute? 📊",
        ],
        urgent: [
            "CRITICAL ALERT: {name}, '{chore}' priority elevated to URGENT. Immediate action required! 🚨🤖",
            "WARNING: System stability compromised. {name} must complete '{chore}' to restore order. ⚠️",
            "EMERGENCY: {name}, '{chore}' status: CRITICAL. Household harmony at risk. ACT NOW. 🔴",
        ],
    },
    pirate: {
        gentle: [
            "Ahoy {name}! When ye get a moment, there be {chore} needin' some attention, savvy? 🏴‍☠️",
            "Aye {name}, no rush but {chore} be waitin' in port. Chart yer course when ready! ⚓",
            "Avast {name}! A gentle word about {chore} - handle it when the winds favor ye! 🦜",
        ],
        medium: [
            "Shiver me timbers, {name}! {chore} be needin' a captain to take the helm! ⚓🏴‍☠️",
            "Arrr {name}! The crew be muttering about {chore}. Best get to it before they walk the plank! 🦜",
            "Blimey {name}! {chore} be looking at ye with scurvy intentions! Man yer station! ⚔️",
        ],
        urgent: [
            "ALL HANDS ON DECK! {name}, {chore} be threatening to sink the ship! ARRR! 🏴‍☠️🌊",
            "ABANDON DELAY! {name}, {chore} or ye'll be swabbin' the poop deck forever! ⚓💀",
            "BY DAVY JONES! {name}! Complete {chore} or face the kraken's wrath! 🐙🏴‍☠️",
        ],
    },
    passive_aggressive: {
        gentle: [
            "Oh {name}, no worries about {chore}! I'm sure you'll get to it... eventually 🙃",
            "Hey {name}! Just wondering if {chore} is on your radar? No pressure though! 😊",
            "Not that I'm counting but {chore} has been waiting a bit, {name}. Just saying! 💅",
        ],
        medium: [
            "Hi {name}! It's fine about {chore}, really. Some of us just have different standards 🙃",
            "Oh don't worry about {chore}, {name}! I wasn't expecting much anyway 💅",
            "{name}, I guess {chore} can wait... like it's been waiting... for a while now 😊",
        ],
        urgent: [
            "Oh {name}! Still haven't done {chore}? That's so interesting! 🙃 Love that for you!",
            "No no {name}, take your time with {chore}! The rest of us will just... cope 💅",
            "Fun fact {name}: {chore} has been waiting longer than my last relationship lasted 🙃",
        ],
    },
    custom: {
        gentle: ["Hey {name}! Quick note about {chore} 📝"],
        medium: ["Hi {name}, reminder about {chore}!"],
        urgent: ["{name}! {chore} needs attention now!"],
    },
};

type RouteParams = {
    NudgeScreen: {
        targetUserId?: string;
        choreName?: string;
    };
};

export const NudgeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'NudgeScreen'>>();
    const { sendNudge } = useNudgeStore();
    const { members, household } = useHouseholdStore();
    const { user } = useAuthStore();

    // Get target from route params or default to first member
    const targetUserId = route.params?.targetUserId;
    const choreName = route.params?.choreName || 'the chore';
    const targetMember = members.find(m => m.id === targetUserId) || members[0];

    // State
    const [selectedStyle, setSelectedStyle] = useState<NudgeStyle>('friendly');
    const [intensity, setIntensity] = useState<NudgeIntensity>('gentle');
    const [customPrompt, setCustomPrompt] = useState('');
    const [customFlair, setCustomFlair] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [showAuthGate, setShowAuthGate] = useState(false);

    // Check if user is anonymous
    const isUserAnonymous = useIsAnonymous();

    // Generate message (mock LLM - replace with real API later)
    const generateMessage = useCallback(() => {
        setIsGenerating(true);
        setIsEditing(false);

        // Simulate API delay
        setTimeout(() => {
            const templates = STYLE_TEMPLATES[selectedStyle][intensity];
            const template = templates[Math.floor(Math.random() * templates.length)];

            let message = template
                .replace(/{name}/g, targetMember?.name || 'Roommate')
                .replace(/{chore}/g, choreName);

            // Add custom flair if provided
            if (customFlair.trim()) {
                message += ` (${customFlair})`;
            }

            setGeneratedMessage(message);
            setEditedMessage(message);
            setIsGenerating(false);
        }, 800);
    }, [selectedStyle, intensity, targetMember?.name, choreName, customFlair]);

    // Auto-generate on style/intensity change
    React.useEffect(() => {
        if (targetMember) {
            generateMessage();
        }
    }, [selectedStyle, intensity]);

    const handleSend = () => {
        // Block anonymous users
        if (isUserAnonymous) {
            setShowAuthGate(true);
            return;
        }

        if (!household || !user) return;

        const finalMessage = isEditing ? editedMessage : generatedMessage;

        sendNudge({
            householdId: household.id,
            createdBy: isAnonymous ? 'anonymous' : user.id,
            targetUserId: targetMember?.id || null,
            message: finalMessage,
            tone: selectedStyle as any,
        });

        navigation.goBack();
    };

    const intensityLabels: NudgeIntensity[] = ['gentle', 'medium', 'urgent'];
    const intensityColors = {
        gentle: COLORS.success,
        medium: COLORS.warning,
        urgent: COLORS.error,
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="x" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Nudge</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Target Section */}
                <View style={styles.targetSection}>
                    <Text style={styles.sectionLabel}>SENDING TO</Text>
                    <View style={styles.targetCard}>
                        <Avatar
                            name={targetMember?.name || 'Roommate'}
                            color={targetMember?.avatarColor || COLORS.gray500}
                            size="md"
                        />
                        <View style={styles.targetInfo}>
                            <Text style={styles.targetName}>{targetMember?.name || 'Select Roommate'}</Text>
                            <View style={styles.choreTag}>
                                <Feather name="check-square" size={12} color={COLORS.primary} />
                                <Text style={styles.choreText}>{choreName}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Style Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>CHOOSE YOUR VIBE</Text>
                    <View style={styles.styleGrid}>
                        {STYLE_OPTIONS.map((style) => (
                            <TouchableOpacity
                                key={style.id}
                                style={[
                                    styles.styleCard,
                                    selectedStyle === style.id && styles.styleCardSelected,
                                    selectedStyle === style.id && { borderColor: style.color },
                                ]}
                                onPress={() => setSelectedStyle(style.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                                <Text style={[
                                    styles.styleName,
                                    selectedStyle === style.id && { color: style.color }
                                ]}>
                                    {style.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Intensity Slider */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>INTENSITY</Text>
                    <View style={styles.intensityContainer}>
                        {intensityLabels.map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.intensityOption,
                                    intensity === level && styles.intensityOptionSelected,
                                    intensity === level && { backgroundColor: intensityColors[level] + '20', borderColor: intensityColors[level] },
                                ]}
                                onPress={() => setIntensity(level)}
                            >
                                <Text style={[
                                    styles.intensityText,
                                    intensity === level && { color: intensityColors[level] }
                                ]}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Custom Flair */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ADD FLAIR (OPTIONAL)</Text>
                    <TextInput
                        style={styles.flairInput}
                        placeholder="E.g., mention they owe me pizza 🍕"
                        placeholderTextColor={COLORS.textTertiary}
                        value={customFlair}
                        onChangeText={setCustomFlair}
                        onBlur={generateMessage}
                    />
                </View>

                {/* Anonymous Toggle */}
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Feather name="eye-off" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.toggleLabel}>Send Anonymously</Text>
                    </View>
                    <Switch
                        value={isAnonymous}
                        onValueChange={setIsAnonymous}
                        trackColor={{ false: COLORS.gray700, true: COLORS.primary + '60' }}
                        thumbColor={isAnonymous ? COLORS.primary : COLORS.gray400}
                    />
                </View>

                {/* Preview Section */}
                <View style={styles.previewSection}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.sectionLabel}>PREVIEW</Text>
                        <View style={styles.previewActions}>
                            <TouchableOpacity
                                style={styles.previewAction}
                                onPress={() => setIsEditing(!isEditing)}
                            >
                                <Feather name={isEditing ? "check" : "edit-2"} size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.previewAction}
                                onPress={generateMessage}
                            >
                                <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.previewCard}>
                        {isGenerating ? (
                            <View style={styles.generatingContainer}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={styles.generatingText}>Crafting your nudge...</Text>
                            </View>
                        ) : isEditing ? (
                            <TextInput
                                style={styles.editInput}
                                value={editedMessage}
                                onChangeText={setEditedMessage}
                                multiline
                                autoFocus
                            />
                        ) : (
                            <Text style={styles.previewText}>{generatedMessage}</Text>
                        )}
                    </View>
                </View>

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendButton, (!generatedMessage || isGenerating) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!generatedMessage || isGenerating}
                >
                    <Feather name="send" size={20} color={COLORS.white} />
                    <Text style={styles.sendButtonText}>Send Nudge</Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Auth Gate Modal */}
            <AuthGateModal
                visible={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                action="nudge"
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: SPACING.md,
    },

    // Target Section
    targetSection: {
        marginBottom: SPACING.xl,
    },
    targetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        gap: SPACING.md,
    },
    targetInfo: {
        flex: 1,
    },
    targetName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    choreTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    choreText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '500',
    },

    // Style Grid
    styleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    styleCard: {
        width: '23%',
        aspectRatio: 1,
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray800,
        gap: 4,
    },
    styleCardSelected: {
        backgroundColor: COLORS.gray800,
    },
    styleEmoji: {
        fontSize: 24,
    },
    styleName: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },

    // Intensity
    intensityContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    intensityOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray900,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    intensityOptionSelected: {
        borderWidth: 2,
    },
    intensityText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },

    // Custom Flair
    flairInput: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray900,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        marginBottom: SPACING.xl,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    toggleLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },

    // Preview
    previewSection: {
        marginBottom: SPACING.xl,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    previewActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    previewAction: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        minHeight: 100,
    },
    generatingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    generatingText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
    },
    previewText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    editInput: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        lineHeight: 24,
        minHeight: 80,
    },

    // Footer
    footer: {
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
        backgroundColor: COLORS.background,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.white,
    },
});
