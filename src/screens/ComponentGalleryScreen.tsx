import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

// Import safe components for preview
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { HouseOverview } from '../components/HouseOverview';
import { MessageBoardWidget } from '../components/MessageBoardWidget';

const { width, height } = Dimensions.get('window');

// ============================================================================
// COMPONENT DATA
// ============================================================================

interface ComponentInfo {
    name: string;
    status: 'USED' | 'UNUSED' | 'CHECK';
    description: string;
    size: string;
    preview?: React.ReactNode;
}

const COMPONENTS: ComponentInfo[] = [
    {
        name: 'Avatar',
        status: 'USED',
        description: 'User avatar circle with initials',
        size: '1KB',
        preview: (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <Avatar name="Alex" color="#6366F1" size="md" />
                <Avatar name="Jordan" color="#10B981" size="lg" />
                <Avatar name="Sam" color="#F59E0B" size="xl" />
            </View>
        )
    },
    {
        name: 'Button',
        status: 'CHECK',
        description: 'Reusable button component',
        size: '4KB',
        preview: (
            <View style={{ gap: 12, width: '100%' }}>
                <Button title="Primary Button" onPress={() => { }} />
                <Button title="Secondary" onPress={() => { }} variant="secondary" />
            </View>
        )
    },
    {
        name: 'Card',
        status: 'USED',
        description: 'Container card component',
        size: '2KB',
        preview: (
            <Card>
                <Text style={{ color: COLORS.textPrimary, fontSize: 16 }}>This is a Card component with content inside</Text>
            </Card>
        )
    },
    {
        name: 'HouseOverview',
        status: 'USED',
        description: 'House status header with emoji and stats',
        size: '5KB',
        preview: <HouseOverview />
    },
    {
        name: 'MessageBoardWidget',
        status: 'USED',
        description: 'Message board widget for dashboard',
        size: '8KB',
        preview: <MessageBoardWidget />
    },
    // Components without preview (complex props)
    { name: 'ChoreCard', status: 'CHECK', description: 'Older chore card style', size: '5KB' },
    { name: 'ChoreTimeline', status: 'CHECK', description: 'Timeline view of chores', size: '13KB' },
    { name: 'ChoresCalendarWidget', status: 'CHECK', description: 'Calendar widget', size: '5KB' },
    { name: 'ChoresComp', status: 'USED', description: 'Main chores component', size: '23KB' },
    { name: 'CompleteSheet', status: 'USED', description: 'Complete chore modal', size: '10KB' },
    { name: 'CookingModal', status: 'CHECK', description: 'Cooking status modal', size: '10KB' },
    { name: 'DashboardSection', status: 'CHECK', description: 'Layout helper', size: '2KB' },
    { name: 'ExpandableFAB', status: 'USED', description: 'Floating action button', size: '5KB' },
    { name: 'ExpenseCard', status: 'USED', description: 'Expense list item', size: '5KB' },
    { name: 'FinanceWidget', status: 'CHECK', description: 'Finance widget', size: '6KB' },
    { name: 'HouseStatus', status: 'CHECK', description: 'House status large', size: '19KB' },
    { name: 'HouseStatusHeader', status: 'CHECK', description: 'Header component', size: '6KB' },
    { name: 'HouseholdSettings', status: 'USED', description: 'Settings panel (see Settings tab)', size: '43KB' },
    { name: 'LeaderboardCard', status: 'USED', description: 'Leaderboard widget', size: '5KB' },
    { name: 'LinkAccountModal', status: 'USED', description: 'Link account flow', size: '9KB' },
    { name: 'LiquidGlassIcon', status: 'CHECK', description: 'Visual effect', size: '4KB' },
    { name: 'LogSheet', status: 'CHECK', description: 'Quick log modal (has TS error)', size: '11KB' },
    { name: 'NeedsAttentionCard', status: 'USED', description: 'Attention card', size: '10KB' },
    { name: 'NeedsAttentionSection', status: 'CHECK', description: 'Attention section', size: '16KB' },
    { name: 'ProgressRing', status: 'CHECK', description: 'Circle progress', size: '2KB' },
    { name: 'QuickActionSheet', status: 'CHECK', description: 'Action sheet', size: '9KB' },
    { name: 'QuickLogFAB', status: 'CHECK', description: 'Quick log button', size: '6KB' },
    { name: 'ReportSheet', status: 'USED', description: 'Report modal', size: '13KB' },
    { name: 'RoomCard', status: 'CHECK', description: 'Room display', size: '7KB' },
    { name: 'SuccessOverlay', status: 'USED', description: 'Success animation', size: '11KB' },
    { name: 'SwipeableHouseCard', status: 'CHECK', description: 'Swipeable card', size: '9KB' },
    { name: 'TaskDetailModal', status: 'USED', description: 'Task detail popup', size: '25KB' },
    { name: 'UnifiedTaskCard', status: 'USED', description: 'Task card', size: '8KB' },
    { name: 'ActivityDetailModal', status: 'CHECK', description: 'Activity popup', size: '12KB' },
    { name: 'AddTaskModal', status: 'CHECK', description: 'Add task popup', size: '17KB' },
    { name: 'AuthGateModal', status: 'USED', description: 'Auth gate for anon users', size: '15KB' },
    { name: 'AuthOptions', status: 'USED', description: 'OAuth buttons', size: '6KB' },
    { name: 'EmailAuthForm', status: 'USED', description: 'Email sign-up form', size: '9KB' },
];

interface ScreenInfo {
    name: string;
    status: 'USED' | 'UNUSED' | 'CHECK';
    description: string;
    size: string;
    route?: string;
}

const SCREENS: ScreenInfo[] = [
    { name: 'HouseholdScreen', status: 'USED', description: 'Main Chores tab', size: '51KB', route: 'OldMain' },
    { name: 'ExpensesScreen', status: 'USED', description: 'Expenses tab (use tab bar)', size: '21KB' },
    { name: 'ProfileScreen', status: 'USED', description: 'Settings tab (use tab bar)', size: '24KB' },
    { name: 'HomeScreen', status: 'USED', description: 'Dashboard tab (use tab bar)', size: '1KB' },
    { name: 'ChoresCalendarScreen', status: 'USED', description: 'Calendar view', size: '14KB', route: 'ChoresCalendar' },
    { name: 'HousePulseScreen', status: 'USED', description: 'House health dashboard', size: '30KB', route: 'HousePulse' },
    { name: 'HouseBoardScreen', status: 'USED', description: 'Message board', size: '31KB', route: 'HouseBoard' },
    { name: 'NudgeScreen', status: 'USED', description: 'Send nudges', size: '27KB', route: 'NudgeScreen' },
    { name: 'NeedsAttentionScreen', status: 'USED', description: 'Overdue chores', size: '15KB', route: 'NeedsAttention' },
    { name: 'ActivityHistoryScreen', status: 'USED', description: 'Activity feed', size: '14KB', route: 'ActivityHistory' },
    { name: 'ChoreManagementScreen', status: 'USED', description: 'Add/edit chores', size: '31KB', route: 'ChoreManagement' },
    { name: 'OnboardingCarouselScreen', status: 'USED', description: 'App intro (restart app)', size: '10KB' },
    { name: 'HouseholdChoiceScreen', status: 'USED', description: 'Create/join (restart app)', size: '21KB' },
    { name: 'HouseholdSetupScreen', status: 'USED', description: 'Create household (restart app)', size: '14KB' },
    { name: 'HouseholdPreviewScreen', status: 'USED', description: 'Preview join (restart app)', size: '12KB' },
    { name: 'SignInScreen', status: 'USED', description: 'Auth flow (restart app)', size: '17KB' },
    { name: 'ChoresCalmScreen', status: 'CHECK', description: 'Alternate chores view with CribUp header', size: '26KB', route: 'ChoresOld' },
    { name: 'ChoresScreen', status: 'UNUSED', description: 'Legacy chores screen - DELETE', size: '11KB' },
    { name: 'OnboardingScreen', status: 'UNUSED', description: 'Old onboarding - DELETE', size: '23KB' },
    { name: 'LogScreen', status: 'UNUSED', description: 'Has TS error - DELETE', size: '9KB' },
];

type TabType = 'components' | 'screens';

export const ComponentGalleryScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<TabType>('screens');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'USED': return COLORS.success;
            case 'UNUSED': return COLORS.error;
            case 'CHECK': return COLORS.warning;
            default: return COLORS.textSecondary;
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'USED': return COLORS.success + '20';
            case 'UNUSED': return COLORS.error + '20';
            case 'CHECK': return COLORS.warning + '20';
            default: return COLORS.gray800;
        }
    };

    const handleComponentPress = (item: ComponentInfo) => {
        if (item.preview) {
            setSelectedComponent(item);
            setPreviewVisible(true);
        }
    };

    const handleScreenPress = (item: ScreenInfo) => {
        if (item.route) {
            navigation.navigate(item.route as never);
        }
    };

    const renderComponentItem = (item: ComponentInfo) => (
        <TouchableOpacity
            key={item.name}
            style={[styles.itemCard, item.preview ? styles.itemCardClickable : null]}
            onPress={() => handleComponentPress(item)}
            disabled={!item.preview}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.sizeText}>{item.size}</Text>
                    {item.preview && (
                        <View style={styles.previewBadge}>
                            <Feather name="eye" size={12} color={COLORS.primary} />
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.preview && (
                <Text style={styles.tapHint}>Tap to preview →</Text>
            )}
        </TouchableOpacity>
    );

    const renderScreenItem = (item: ScreenInfo) => (
        <TouchableOpacity
            key={item.name}
            style={[styles.itemCard, item.route ? styles.itemCardClickable : null]}
            onPress={() => handleScreenPress(item)}
            disabled={!item.route}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.sizeText}>{item.size}</Text>
                    {item.route && (
                        <View style={styles.previewBadge}>
                            <Feather name="external-link" size={12} color={COLORS.primary} />
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.route && (
                <Text style={styles.tapHint}>Tap to navigate →</Text>
            )}
        </TouchableOpacity>
    );

    const usedCount = (activeTab === 'components' ? COMPONENTS : SCREENS).filter(i => i.status === 'USED').length;
    const checkCount = (activeTab === 'components' ? COMPONENTS : SCREENS).filter(i => i.status === 'CHECK').length;
    const unusedCount = (activeTab === 'components' ? COMPONENTS : SCREENS).filter(i => i.status === 'UNUSED').length;
    const totalCount = activeTab === 'components' ? COMPONENTS.length : SCREENS.length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>🔍 Code Audit</Text>
                    <Text style={styles.headerSubtitle}>Tap to preview/navigate</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: COLORS.success + '20' }]}>
                    <Text style={[styles.statNumber, { color: COLORS.success }]}>{usedCount}</Text>
                    <Text style={styles.statLabel}>Used</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: COLORS.warning + '20' }]}>
                    <Text style={[styles.statNumber, { color: COLORS.warning }]}>{checkCount}</Text>
                    <Text style={styles.statLabel}>Check</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: COLORS.error + '20' }]}>
                    <Text style={[styles.statNumber, { color: COLORS.error }]}>{unusedCount}</Text>
                    <Text style={styles.statLabel}>Unused</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: COLORS.primary + '20' }]}>
                    <Text style={[styles.statNumber, { color: COLORS.primary }]}>{totalCount}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'screens' && styles.tabActive]}
                    onPress={() => setActiveTab('screens')}
                >
                    <Feather name="smartphone" size={18} color={activeTab === 'screens' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'screens' && styles.tabTextActive]}>
                        Screens ({SCREENS.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'components' && styles.tabActive]}
                    onPress={() => setActiveTab('components')}
                >
                    <Feather name="box" size={18} color={activeTab === 'components' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'components' && styles.tabTextActive]}>
                        Components ({COMPONENTS.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {activeTab === 'screens' && (
                    <>
                        <Text style={styles.sectionTitle}>🔗 Navigable - Tap to View ({SCREENS.filter(s => s.route).length})</Text>
                        {SCREENS.filter(s => s.route).map(item => renderScreenItem(item))}

                        <Text style={styles.sectionTitle}>🚫 Not Navigable from here ({SCREENS.filter(s => !s.route).length})</Text>
                        {SCREENS.filter(s => !s.route).map(item => renderScreenItem(item))}
                    </>
                )}

                {activeTab === 'components' && (
                    <>
                        <Text style={styles.sectionTitle}>👁️ With Preview ({COMPONENTS.filter(c => c.preview).length})</Text>
                        {COMPONENTS.filter(c => c.preview).map(item => renderComponentItem(item))}

                        <Text style={styles.sectionTitle}>📦 No Preview ({COMPONENTS.filter(c => !c.preview).length})</Text>
                        {COMPONENTS.filter(c => !c.preview).map(item => renderComponentItem(item))}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Component Preview Modal */}
            <Modal
                visible={previewVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setPreviewVisible(false)}
            >
                <SafeAreaView style={styles.previewContainer}>
                    <View style={styles.previewHeader}>
                        <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                            <Feather name="x" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.previewTitle}>{selectedComponent?.name}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedComponent?.status || 'CHECK'), alignSelf: 'center', marginBottom: 16 }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedComponent?.status || 'CHECK') }]}>
                            {selectedComponent?.status}
                        </Text>
                    </View>

                    <ScrollView style={styles.previewContent} contentContainerStyle={styles.previewContentInner}>
                        <Text style={styles.previewLabel}>Live Preview:</Text>
                        <View style={styles.previewBox}>
                            {selectedComponent?.preview}
                        </View>

                        <Text style={styles.previewDescription}>{selectedComponent?.description}</Text>
                        <Text style={styles.previewSize}>File size: {selectedComponent?.size}</Text>
                    </ScrollView>
                </SafeAreaView>
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray800,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    statBox: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    tabRow: {
        flexDirection: 'row',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.gray900,
    },
    tabActive: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    list: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    itemCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray800,
    },
    itemCardClickable: {
        borderColor: COLORS.primary + '40',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    statusText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
    },
    sizeText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textTertiary,
    },
    previewBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    tapHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        marginTop: 8,
        fontWeight: '500',
    },
    // Preview Modal
    previewContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    previewTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    previewContent: {
        flex: 1,
        padding: SPACING.lg,
    },
    previewContentInner: {
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        marginBottom: SPACING.md,
        alignSelf: 'flex-start',
    },
    previewBox: {
        width: '100%',
        backgroundColor: COLORS.gray900,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.gray800,
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewDescription: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.xl,
        textAlign: 'center',
    },
    previewSize: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        marginTop: SPACING.sm,
    },
});
