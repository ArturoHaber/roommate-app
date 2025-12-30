// Core Types for Roommate App
// Updated to match Supabase schema

// ============================================================================
// USERS & AUTH
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  statusEmoji?: string;        // Current status (😴, 👨‍💻, etc.)
  statusText?: string;         // Optional status text
  isVacationMode: boolean;     // Pauses chore assignments
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HOUSEHOLDS
// ============================================================================

export interface Household {
  id: string;
  name: string;
  emoji: string;               // 🏠
  address?: string;            // "123 Main St, Apt 408"
  inviteCode: string;
  inviteExpiresAt: Date;       // 48hr expiry
  subscriptionTier: 'free' | 'premium';
  subscriptionExpiresAt?: Date;
  createdBy: string;           // User ID
  createdAt: Date;
}

// Junction table for many-to-many relationship
export interface HouseholdMember {
  householdId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

// Stored info like WiFi, landlord contact, etc.
export interface HouseholdEssential {
  id: string;
  householdId: string;
  type: 'wifi' | 'landlord' | 'emergency' | 'custom';
  label: string;               // "WiFi Password", "Landlord"
  value: string;               // The actual info
  icon: string;                // Feather icon name
  createdAt: Date;
}

// ============================================================================
// ROOMS & CHORES
// ============================================================================

export type RoomType = 'kitchen' | 'living_room' | 'bedroom' | 'bathroom' | 'dining' | 'other';

export interface Room {
  id: string;
  householdId: string;
  name: string;                // "Kitchen", "Bathroom"
  icon: string;                // Feather icon name
  sortOrder: number;           // Display order
  createdAt: Date;
}

export interface Chore {
  id: string;
  householdId: string;
  roomId?: string;             // FK to rooms (optional)
  name: string;
  description: string;
  icon: string;
  room: RoomType;              // Keep for backward compat, use roomId in new code
  frequency: 'daily' | 'weekly' | 'interval' | 'as_needed';
  interval?: number;           // For "Every X days"
  assignedDays?: number[];     // 0-6 for Sunday-Saturday (Weekly)
  pointValue: number;
  isActive: boolean;
  isPersonal: boolean;         // If true, always assigned to personalOwnerId
  personalOwnerId?: string;    // Owner of personal chores (doesn't rotate)
  createdAt: Date;
}

export interface ChoreCompletionCount {
  id: string;
  choreId: string;
  userId: string;
  completionCount: number;
  lastCompletedAt: Date | null;
  createdAt: Date;
}

export interface ChoreAssignment {
  id: string;
  choreId: string;
  assignedTo: string;          // User ID
  dueDate: Date;
  completedAt: Date | null;
  completedBy: string | null;  // User ID (can differ for bonus)
  isBonus: boolean;
  createdAt: Date;
}

// Track when rooms were cleaned (for House Health feature)
export interface RoomCleanHistory {
  id: string;
  roomId: string;
  cleanedBy: string;           // User ID
  cleanedAt: Date;
  choreAssignmentId?: string;  // Optional link to assignment
}

// ============================================================================
// EXPENSES
// ============================================================================

export type ExpenseCategory = 'groceries' | 'utilities' | 'rent' | 'supplies' | 'other';

export interface Expense {
  id: string;
  householdId: string;
  paidBy: string;              // User ID
  amount: number;
  description: string;
  category: ExpenseCategory;
  splitType?: 'equal' | 'custom';
  splits?: LocalExpenseSplit[];  // For local store (embedded)
  receiptUrl?: string;         // Optional image
  createdAt: Date;
}

// Local store embedded split (for backward compat)
export interface LocalExpenseSplit {
  userId: string;
  amount: number;
  paid: boolean;
}

// Now references expense_id (for proper relational DB)
export interface ExpenseSplit {
  id: string;
  expenseId: string;           // FK to expenses
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

// Derived/computed type for easy display
export interface Balance {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// ============================================================================
// NUDGES / NOTIFICATIONS
// ============================================================================

export type NudgeTone = 'polite' | 'funny' | 'passive_aggressive' | 'urgent';

export interface Nudge {
  id: string;
  householdId: string;
  createdBy: string;           // User ID
  targetUserId: string | null; // null = anonymous/general
  message: string;
  tone: NudgeTone;
  isRead: boolean;
  createdAt: Date;
}

// ============================================================================
// HOUSE BOARD (Posts, Polls, Reactions)
// ============================================================================

export type BoardPostType = 'note' | 'announcement' | 'poll';

export interface BoardPost {
  id: string;
  householdId: string;
  authorId: string;            // User ID
  type: BoardPostType;
  content: string;
  isPinned: boolean;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  postId: string;              // FK to board_posts
  text: string;                // "Tacos", "Pizza"
  sortOrder: number;
}

export interface PollVote {
  postId: string;
  optionId: string;
  userId: string;
  // PK: (postId, userId) - one vote per user
}

export interface PostReaction {
  postId: string;
  userId: string;
  emoji: string;               // 🔥, 😋, etc.
  // PK: (postId, userId, emoji)
}

// ============================================================================
// ACTIVITY LOG (for Quick Log feature)
// ============================================================================

export type ActivityCategory = 'cooked' | 'cleaned' | 'shopped' | 'fixed' | 'package' | 'other';

export interface ActivityLog {
  id: string;
  householdId: string;
  userId: string;
  category: ActivityCategory;
  details: string;
  pointsEarned: number;
  createdAt: Date;
}

// ============================================================================
// UI / APP TYPES
// ============================================================================

export type TabName = 'home' | 'chores' | 'expenses' | 'profile';

export interface LeaderboardEntry {
  userId: string;
  points: number;
  completedChores: number;
  bonusChores: number;
}

// ============================================================================
// DEPRECATED / BACKWARD COMPAT
// ============================================================================

// Old Nudge type field - keep for migration but prefer 'tone'
export type LegacyNudgeType = 'gentle' | 'reminder' | 'urgent';
