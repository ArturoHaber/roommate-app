import { differenceInDays, isToday, startOfDay } from 'date-fns';
import { Chore, ChoreAssignment, RoomType } from '../types';
import { COLORS } from '../constants/theme';

// ============================================================================
// HEALTH SCORE TYPES
// ============================================================================

export interface HealthResult {
    score: number;          // 0-100
    label: string;          // "Sparkling", "Great", etc.
    emoji: string;          // ✨, 👌, etc.
    color: string;          // Color for the UI
    overdueCount: number;   // Number of overdue chores
    dueTodayCount: number;  // Number due today (not done)
    completedTodayCount: number; // Completed today
}

export interface RoomHealth {
    room: RoomType;
    roomLabel: string;      // Human readable
    score: number;
    label: string;
    emoji: string;
    color: string;
    overdueCount: number;
    totalChores: number;
}

// ============================================================================
// HEALTH TIER DEFINITIONS
// ============================================================================

interface HealthTier {
    min: number;
    label: string;
    emoji: string;
    color: string;
}

const HEALTH_TIERS: HealthTier[] = [
    { min: 90, label: 'Sparkling', emoji: '✨', color: COLORS.success },
    { min: 75, label: 'Great', emoji: '👌', color: '#84CC16' },      // Lime green
    { min: 60, label: 'Good', emoji: '👍', color: COLORS.warning },
    { min: 40, label: 'Needs Work', emoji: '😐', color: '#F97316' }, // Orange
    { min: 20, label: 'Messy', emoji: '😬', color: COLORS.error },
    { min: 0, label: 'Critical', emoji: '🚨', color: '#DC2626' },    // Deep red
];

const ROOM_LABELS: Record<RoomType, string> = {
    kitchen: 'Kitchen',
    living_room: 'Living Room',
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    dining: 'Dining Room',
    other: 'Other',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the health tier for a given score
 */
export function getHealthTier(score: number): HealthTier {
    const clamped = Math.max(0, Math.min(100, score));
    for (const tier of HEALTH_TIERS) {
        if (clamped >= tier.min) {
            return tier;
        }
    }
    return HEALTH_TIERS[HEALTH_TIERS.length - 1]; // Fallback to lowest tier
}

/**
 * Calculate penalty points for an assignment
 */
function calculatePenalty(assignment: ChoreAssignment): number {
    // Already completed - no penalty
    if (assignment.completedAt) {
        return 0;
    }

    const dueDate = new Date(assignment.dueDate);
    const today = startOfDay(new Date());
    const daysOverdue = differenceInDays(today, startOfDay(dueDate));

    if (daysOverdue >= 3) {
        return 15; // Severely overdue
    } else if (daysOverdue >= 1) {
        return 10; // Overdue by 1-2 days
    } else if (isToday(dueDate)) {
        return 3; // Due today, not yet done
    }

    return 0; // Future due date
}

/**
 * Calculate bonus points for completed assignments
 */
function calculateBonus(assignment: ChoreAssignment): number {
    if (!assignment.completedAt) {
        return 0;
    }

    const completedDate = new Date(assignment.completedAt);
    const today = startOfDay(new Date());
    const daysAgo = differenceInDays(today, startOfDay(completedDate));

    if (daysAgo === 0) {
        return 2; // Completed today
    } else if (daysAgo <= 3) {
        return 1; // Completed recently
    }

    return 0;
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate overall house health score
 */
export function calculateHouseHealth(
    assignments: ChoreAssignment[],
    chores: Chore[]
): HealthResult {
    // If no chores exist, house is "perfect"
    if (chores.length === 0 || assignments.length === 0) {
        const tier = getHealthTier(100);
        return {
            score: 100,
            label: tier.label,
            emoji: tier.emoji,
            color: tier.color,
            overdueCount: 0,
            dueTodayCount: 0,
            completedTodayCount: 0,
        };
    }

    // Calculate penalties and bonuses
    let totalPenalty = 0;
    let totalBonus = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;
    let completedTodayCount = 0;

    const today = startOfDay(new Date());

    for (const assignment of assignments) {
        const penalty = calculatePenalty(assignment);
        const bonus = calculateBonus(assignment);

        totalPenalty += penalty;
        totalBonus += bonus;

        // Count stats
        if (assignment.completedAt) {
            const completedDate = startOfDay(new Date(assignment.completedAt));
            if (differenceInDays(today, completedDate) === 0) {
                completedTodayCount++;
            }
        } else {
            const dueDate = new Date(assignment.dueDate);
            if (isToday(dueDate)) {
                dueTodayCount++;
            } else if (dueDate < today) {
                overdueCount++;
            }
        }
    }

    // Calculate final score: 100 - penalties + bonuses (capped)
    const bonusCap = totalPenalty; // Bonus can only recover penalty points
    const effectiveBonus = Math.min(totalBonus, bonusCap);
    const score = Math.max(0, Math.min(100, 100 - totalPenalty + effectiveBonus));

    const tier = getHealthTier(score);

    return {
        score: Math.round(score),
        label: tier.label,
        emoji: tier.emoji,
        color: tier.color,
        overdueCount,
        dueTodayCount,
        completedTodayCount,
    };
}

/**
 * Calculate health score per room
 */
export function calculateRoomHealth(
    assignments: ChoreAssignment[],
    chores: Chore[]
): RoomHealth[] {
    // Group chores by room
    const roomChores: Record<RoomType, Chore[]> = {
        kitchen: [],
        living_room: [],
        bedroom: [],
        bathroom: [],
        dining: [],
        other: [],
    };

    for (const chore of chores) {
        const room = chore.room || 'other';
        roomChores[room].push(chore);
    }

    // Calculate health for each room that has chores
    const roomHealths: RoomHealth[] = [];

    for (const [room, roomChoreList] of Object.entries(roomChores)) {
        if (roomChoreList.length === 0) continue;

        const choreIds = new Set(roomChoreList.map(c => c.id));
        const roomAssignments = assignments.filter(a => choreIds.has(a.choreId));

        // Calculate room-specific score
        let roomPenalty = 0;
        let roomBonus = 0;
        let overdueCount = 0;

        const today = startOfDay(new Date());

        for (const assignment of roomAssignments) {
            roomPenalty += calculatePenalty(assignment);
            roomBonus += calculateBonus(assignment);

            if (!assignment.completedAt) {
                const dueDate = new Date(assignment.dueDate);
                if (dueDate < today) {
                    overdueCount++;
                }
            }
        }

        const bonusCap = roomPenalty;
        const effectiveBonus = Math.min(roomBonus, bonusCap);
        const score = Math.max(0, Math.min(100, 100 - roomPenalty + effectiveBonus));
        const tier = getHealthTier(score);

        roomHealths.push({
            room: room as RoomType,
            roomLabel: ROOM_LABELS[room as RoomType],
            score: Math.round(score),
            label: tier.label,
            emoji: tier.emoji,
            color: tier.color,
            overdueCount,
            totalChores: roomChoreList.length,
        });
    }

    // Sort by score (lowest first - needs most attention)
    return roomHealths.sort((a, b) => a.score - b.score);
}
