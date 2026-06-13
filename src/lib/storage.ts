import type { UserProfile, FoodLogEntry } from '../types';

const PROFILE_KEY = 'nutrisnap_profile';
const LOGS_KEY = 'nutrisnap_logs';

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getFoodLogs(): FoodLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as FoodLogEntry[] : [];
  } catch {
    return [];
  }
}

export function saveFoodLogs(logs: FoodLogEntry[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function addFoodLog(entry: FoodLogEntry): void {
  const logs = getFoodLogs();
  logs.push(entry);
  saveFoodLogs(logs);
}

export function updateFoodLog(id: string, updates: Partial<FoodLogEntry>): void {
  const logs = getFoodLogs();
  const idx = logs.findIndex((l) => l.id === id);
  if (idx === -1) return;
  logs[idx] = { ...logs[idx], ...updates };
  saveFoodLogs(logs);
}

export function deleteFoodLog(id: string): void {
  const logs = getFoodLogs().filter((l) => l.id !== id);
  saveFoodLogs(logs);
}

export function resetAllData(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LOGS_KEY);
}
