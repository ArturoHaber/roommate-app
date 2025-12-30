/**
 * Chore Styling System - Single Source of Truth
 * 
 * The chore.icon field stored in the database is the authoritative source.
 * This utility provides consistent styling based on that icon.
 * 
 * Priority:
 * 1. chore.icon (if set and valid)
 * 2. Name-based fuzzy matching (legacy fallback)
 * 3. Default style
 */

export interface ChoreStyle {
    emoji: string;
    color: string;
    bgColor: string;
    category: 'Kitchen' | 'Bathroom' | 'General' | 'Personal';
}

/**
 * Legacy Feather icon names to emoji mapping.
 * Used for migrating old data that stored Feather icon names.
 */
const FEATHER_TO_EMOJI: Record<string, string> = {
    'coffee': '☕',
    'home': '🏠',
    'layout': '📋',
    'trash': '🗑️',
    'trash-2': '🗑️',
    'droplet': '💧',
    'wind': '🌬️',
    'sun': '☀️',
    'moon': '🌙',
    'star': '⭐',
    'heart': '❤️',
    'check': '✅',
    'x': '❌',
    'settings': '⚙️',
    'user': '👤',
    'users': '👥',
    'mail': '✉️',
    'calendar': '📅',
    'clock': '🕐',
    'bell': '🔔',
    'shopping-cart': '🛒',
    'shopping-bag': '🛍️',
    'package': '📦',
    'tool': '🔧',
    'zap': '⚡',
    'repeat': '🔁',
};

/**
 * Emoji to style mapping.
 * Centralized color/category definitions for each emoji.
 */
const EMOJI_STYLES: Record<string, Omit<ChoreStyle, 'emoji'>> = {
    // Kitchen
    '🍽️': { color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.12)', category: 'Kitchen' },
    '🍳': { color: '#FB923C', bgColor: 'rgba(251, 146, 60, 0.12)', category: 'Kitchen' },
    '✨': { color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.12)', category: 'Kitchen' },
    '🧊': { color: '#38BDF8', bgColor: 'rgba(56, 189, 248, 0.12)', category: 'Kitchen' },
    '☕': { color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'Kitchen' },

    // Bathroom
    '🚿': { color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'Bathroom' },
    '🚽': { color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'Bathroom' },
    '🧴': { color: '#06B6D4', bgColor: 'rgba(6, 182, 212, 0.12)', category: 'Bathroom' },
    '💧': { color: '#38BDF8', bgColor: 'rgba(56, 189, 248, 0.12)', category: 'Bathroom' },

    // General/Cleaning
    '🗑️': { color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.12)', category: 'General' },
    '🧹': { color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.12)', category: 'General' },
    '🧽': { color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.12)', category: 'General' },
    '🛒': { color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.12)', category: 'General' },
    '♻️': { color: '#22D3EE', bgColor: 'rgba(34, 211, 238, 0.12)', category: 'General' },
    '📦': { color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.12)', category: 'General' },
    '🏠': { color: '#818CF8', bgColor: 'rgba(129, 140, 248, 0.12)', category: 'General' },
    '🌬️': { color: '#38BDF8', bgColor: 'rgba(56, 189, 248, 0.12)', category: 'General' },
    '🔧': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.12)', category: 'General' },
    '💡': { color: '#FCD34D', bgColor: 'rgba(252, 211, 77, 0.12)', category: 'General' },
    '🚪': { color: '#A1A1AA', bgColor: 'rgba(161, 161, 170, 0.12)', category: 'General' },
    '🪟': { color: '#67E8F9', bgColor: 'rgba(103, 232, 249, 0.12)', category: 'General' },

    // Living areas
    '🛋️': { color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.12)', category: 'General' },
    '🛏️': { color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.12)', category: 'Personal' },

    // Pets
    '🐕': { color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.12)', category: 'General' },
    '🐈': { color: '#FB923C', bgColor: 'rgba(251, 146, 60, 0.12)', category: 'General' },
    '🌱': { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.12)', category: 'General' },

    // Personal
    '👕': { color: '#818CF8', bgColor: 'rgba(129, 140, 248, 0.12)', category: 'Personal' },
    '🧺': { color: '#818CF8', bgColor: 'rgba(129, 140, 248, 0.12)', category: 'Personal' },

    // Misc
    '📬': { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.12)', category: 'General' },
    '🚗': { color: '#6366F1', bgColor: 'rgba(99, 102, 241, 0.12)', category: 'General' },
    '🧼': { color: '#14B8A6', bgColor: 'rgba(20, 184, 166, 0.12)', category: 'General' },
};

/**
 * Name-based keyword matching for legacy/fallback support.
 */
const NAME_TO_EMOJI: Record<string, string> = {
    'dishes': '🍽️',
    'do dishes': '🍽️',
    'counters': '✨',
    'wipe counters': '✨',
    'cooking': '🍳',
    'bathroom': '🚿',
    'clean bathroom': '🚿',
    'toilet': '🚽',
    'trash': '🗑️',
    'take out trash': '🗑️',
    'garbage': '🗑️',
    'vacuum': '🧹',
    'vacuum living room': '🧹',
    'mop': '🧽',
    'mop floors': '🧽',
    'groceries': '🛒',
    'shopping': '🛒',
    'recycling': '♻️',
    'laundry': '👕',
    'clothes': '👕',
};

const DEFAULT_STYLE: ChoreStyle = {
    emoji: '📋',
    color: '#94A3B8',
    bgColor: 'rgba(148, 163, 184, 0.10)',
    category: 'General'
};

/**
 * Check if a string is an emoji (starts with high Unicode or passes emoji regex).
 */
function isEmoji(str: string): boolean {
    if (!str) return false;
    return str.charCodeAt(0) > 127 || /\p{Emoji}/u.test(str);
}

/**
 * Convert a stored icon value to an emoji.
 * Handles: emoji passthrough, Feather icon names, null/undefined.
 */
export function normalizeIcon(icon: string | null | undefined): string | null {
    if (!icon) return null;
    if (isEmoji(icon)) return icon;
    return FEATHER_TO_EMOJI[icon] || null;
}

/**
 * Get style properties for an emoji.
 */
function getStyleForEmoji(emoji: string): ChoreStyle {
    const style = EMOJI_STYLES[emoji];
    if (style) {
        return { emoji, ...style };
    }
    return { ...DEFAULT_STYLE, emoji };
}

/**
 * Get the complete style for a chore.
 * 
 * Priority:
 * 1. chore.icon (if valid emoji or convertible Feather name)
 * 2. Name-based fuzzy matching (legacy support)
 * 3. Default style
 * 
 * @param chore - Object with name and optional icon
 * @returns Complete ChoreStyle with emoji, color, bgColor, category
 * 
 * @example
 * // Icon takes priority
 * getChoreStyle({ name: 'Do dishes', icon: '🧹' }) // Returns 🧹 style
 * 
 * // Falls back to name matching if no icon
 * getChoreStyle({ name: 'Do dishes' }) // Returns 🍽️ style
 * 
 * // Legacy Feather icons are converted
 * getChoreStyle({ name: 'X', icon: 'coffee' }) // Returns ☕ style
 */
export function getChoreStyle(chore: { name: string; icon?: string | null }): ChoreStyle {
    // 1. Try to use the stored icon
    const normalizedIcon = normalizeIcon(chore.icon);
    if (normalizedIcon) {
        return getStyleForEmoji(normalizedIcon);
    }

    // 2. Fall back to name-based matching
    const lower = (chore.name || '').toLowerCase();
    for (const [keyword, emoji] of Object.entries(NAME_TO_EMOJI)) {
        if (lower.includes(keyword)) {
            return getStyleForEmoji(emoji);
        }
    }

    // 3. Default
    return DEFAULT_STYLE;
}

/**
 * Get just the emoji for a chore.
 * Convenience function when you only need the emoji.
 */
export function getChoreEmoji(chore: { name: string; icon?: string | null }): string {
    return getChoreStyle(chore).emoji;
}

/**
 * Legacy function signature for backward compatibility.
 * Prefer passing the full chore object when available.
 * 
 * @deprecated Use getChoreStyle({ name, icon }) instead
 */
export function getChoreStyleByName(choreName: string): ChoreStyle {
    return getChoreStyle({ name: choreName });
}
