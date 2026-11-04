export type PriorityLevel = 'p1' | 'p2' | 'p3' | 'none';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  dueDate: string | null; // Format YYYY-MM-DD
  dueTime: string | null; // Format HH:mm
  priority: PriorityLevel;
  categoryId: string;
  subtasks: Subtask[];
  reminder: {
    enabled: boolean;
    alarmTriggered?: boolean;
    snoozedUntil?: string | null; // ISO string
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem?: boolean;
}

export type ViewTab = 'today' | 'upcoming' | 'all' | 'completed' | 'calendar' | 'categories' | 'stats' | 'settings';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ringtone: 'gentle_chime' | 'digital_pulse' | 'radar_beep' | 'zen_bell';
  volume: number;
  viewMode: 'phone' | 'fullscreen';
  autoSnoozeMinutes: number;
}
