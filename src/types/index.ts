// Core Types for Roommate App

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  householdId: string | null;
  createdAt: Date;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: string[]; // User IDs
  createdAt: Date;
}

export interface Chore {
  id: string;
  householdId: string;
  name: string;
  description: string;
  icon: string;
  room: 'kitchen' | 'living_room' | 'bedroom' | 'bathroom' | 'dining' | 'other';
  frequency: 'daily' | 'weekly' | 'interval';
  interval?: number; // For "Every X days"
  assignedDays?: number[]; // 0-6 for Sunday-Saturday (Weekly)
  pointValue: number;
  createdAt: Date;
}

export interface ChoreAssignment {
  id: string;
  choreId: string;
  assignedTo: string; // User ID
  dueDate: Date;
  completedAt: Date | null;
  completedBy: string | null; // User ID (can be different from assignedTo for bonus)
  isBonus: boolean;
}

export interface Expense {
  id: string;
  householdId: string;
  paidBy: string; // User ID
  amount: number;
  description: string;
  category: 'groceries' | 'utilities' | 'rent' | 'supplies' | 'other';
  splitType: 'equal' | 'custom';
  splits: ExpenseSplit[];
  createdAt: Date;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  paid: boolean;
}

export type NudgeTone = 'polite' | 'funny' | 'passive_aggressive' | 'urgent';

export interface Nudge {
  id: string;
  householdId: string;
  type: 'gentle' | 'reminder' | 'urgent'; // Keeping for backward compatibility, but tone is preferred
  tone?: NudgeTone;
  message: string;
  targetUserId: string | null; // null = anonymous/general
  createdBy: string;
  createdAt: Date;
  read: boolean;
}

export interface Balance {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// UI Types
export type TabName = 'home' | 'chores' | 'expenses' | 'profile';

export interface LeaderboardEntry {
  userId: string;
  points: number;
  completedChores: number;
  bonusChores: number;
}
