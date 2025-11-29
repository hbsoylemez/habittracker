export type HabitCategory = 'Health' | 'Finance' | 'Productivity' | 'Mindfulness' | 'Other';

export type HabitType = 'boolean' | 'numeric';

export interface LogEntry {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  type: HabitType;
  goal: number;
  unit: string;
  logs: Record<string, number>; // Map of date string to value
  createdAt: string;
  streak: number;
}

export interface InsightResponse {
  title: string;
  message: string;
  recommendation: string;
}

export const CATEGORIES: HabitCategory[] = ['Health', 'Finance', 'Productivity', 'Mindfulness', 'Other'];
