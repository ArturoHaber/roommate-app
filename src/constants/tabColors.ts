// Tab color configuration for per-tab styling
// Each tab has a unique color for active state

export const TAB_COLORS = {
    Dashboard: {
        primary: '#818CF8',  // Indigo
        glow: 'rgba(129,140,248,0.4)',
    },
    Chores: {
        primary: '#22D3EE',  // Cyan - organized, productive
        glow: 'rgba(34,211,238,0.4)',
    },
    Expenses: {
        primary: '#34D399',  // Emerald/Green - money
        glow: 'rgba(52,211,153,0.4)',
    },
    Settings: {
        primary: '#A78BFA',  // Violet
        glow: 'rgba(167,139,250,0.4)',
    },
} as const;

export type TabName = keyof typeof TAB_COLORS;

export const TAB_ORDER: TabName[] = ['Dashboard', 'Chores', 'Expenses', 'Settings'];

// Helper to get color by index
export const getTabColorByIndex = (index: number) => {
    const tabName = TAB_ORDER[index];
    return TAB_COLORS[tabName] || TAB_COLORS.Dashboard;
};
