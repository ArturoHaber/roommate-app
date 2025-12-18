// Chore visual styles - emojis and colors per chore type

export interface ChoreVisualStyle {
    emoji: string;
    color: string;
    bgColor: string;
}

export const CHORE_STYLES: Record<string, ChoreVisualStyle> = {
    'dishes': { emoji: '🍽️', color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.12)' },
    'do dishes': { emoji: '🍽️', color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.12)' },
    'trash': { emoji: '🗑️', color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.12)' },
    'take out trash': { emoji: '🗑️', color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.12)' },
    'bathroom': { emoji: '🚿', color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)' },
    'clean bathroom': { emoji: '🚿', color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)' },
    'vacuum': { emoji: '🧹', color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.12)' },
    'vacuum living room': { emoji: '🧹', color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.12)' },
    'mop': { emoji: '🧽', color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.12)' },
    'mop floors': { emoji: '🧽', color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.12)' },
    'counters': { emoji: '✨', color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.12)' },
    'wipe counters': { emoji: '✨', color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.12)' },
    'laundry': { emoji: '👕', color: '#818CF8', bgColor: 'rgba(129, 140, 248, 0.12)' },
    'groceries': { emoji: '🛒', color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.12)' },
    'cooking': { emoji: '🍳', color: '#FB923C', bgColor: 'rgba(251, 146, 60, 0.12)' },
    'recycling': { emoji: '♻️', color: '#22D3EE', bgColor: 'rgba(34, 211, 238, 0.12)' },
    'default': { emoji: '📋', color: '#94A3B8', bgColor: 'rgba(148, 163, 184, 0.10)' },
};

export const getChoreStyle = (choreName: string): ChoreVisualStyle => {
    const lower = (choreName || '').toLowerCase();
    for (const [key, style] of Object.entries(CHORE_STYLES)) {
        if (key !== 'default' && lower.includes(key)) {
            return style;
        }
    }
    return CHORE_STYLES.default;
};
