import { AppSettings, Category, Task } from '../types';

const TASKS_KEY = 'soviec_tasks_v1';
const CATEGORIES_KEY = 'soviec_categories_v1';
const SETTINGS_KEY = 'soviec_settings_v1';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'inbox', name: 'Hộp thư', color: '#64748B', icon: 'Inbox', isSystem: true },
  { id: 'work', name: 'Công việc', color: '#2563EB', icon: 'Briefcase' },
  { id: 'personal', name: 'Cá nhân', color: '#10B981', icon: 'User' },
  { id: 'study', name: 'Học tập', color: '#8B5CF6', icon: 'GraduationCap' },
  { id: 'shopping', name: 'Mua sắm', color: '#F59E0B', icon: 'ShoppingCart' },
  { id: 'health', name: 'Sức khỏe', color: '#EC4899', icon: 'Heart' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  soundEnabled: true,
  vibrationEnabled: true,
  ringtone: 'gentle_chime',
  volume: 0.8,
  viewMode: 'phone',
  autoSnoozeMinutes: 5,
};

// Helpers for formatted dates
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Chữ ký xác thực chính xác các công việc demo do hệ thống tạo ban đầu (Đối soát cả ID lẫn tiêu đề)
const SYSTEM_DEMO_SIGNATURES: Record<string, string> = {
  'task-1': 'Hoàn thiện kế hoạch dự án tuần mới',
  'task-2': 'Mua thực phẩm và đồ dùng gia đình',
  'task-3': 'Chạy bộ 5km & hít thở ngoài trời',
  'task-4': 'Đọc 2 chương sách Kỹ năng quản trị',
  'task-5': 'Cài đặt và làm quen ứng dụng Sổ Việc',
};

const DEMO_CLEANED_FLAG = 'soviec_demo_cleaned_v1';

export function getDefaultTasks(): Task[] {
  // Trạng thái cài đặt mới mặc định hoàn toàn trống (Không tạo dữ liệu mẫu/demo)
  return [];
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_CLEANED_FLAG, 'true');
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Nếu đã hoàn tất dọn dẹp một lần trước đó, bảo toàn 100% dữ liệu (bao gồm dữ liệu khôi phục từ file JSON)
    const isCleaned = localStorage.getItem(DEMO_CLEANED_FLAG) === 'true';
    if (isCleaned) {
      return parsed;
    }

    // Chỉ lọc bỏ bản ghi nếu trùng khớp CHÍNH XÁC cả ID lẫn tiêu đề mẫu của hệ thống
    const userOnlyTasks: Task[] = parsed.filter((t: Task) => {
      if (!t || typeof t.id !== 'string') return true;
      const expectedTitle = SYSTEM_DEMO_SIGNATURES[t.id];
      // Nếu ID trùng và tiêu đề trùng khớp tiêu đề mẫu -> bản ghi demo cần loại bỏ
      if (expectedTitle && t.title === expectedTitle) {
        return false;
      }
      return true;
    });

    // Đánh dấu cờ đã hoàn tất dọn dẹp để không bao giờ can thiệp vào dữ liệu sau này
    localStorage.setItem(DEMO_CLEANED_FLAG, 'true');

    if (userOnlyTasks.length !== parsed.length) {
      saveTasks(userOnlyTasks);
    }

    return userOnlyTasks;
  } catch (err) {
    console.error('Lỗi khi tải công việc từ LocalStorage', err);
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err);
  }
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load categories', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function exportBackupData(): string {
  const data = {
    appName: 'Sổ Việc',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    tasks: loadTasks(),
    categories: loadCategories(),
    settings: loadSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(): void {
  const dataStr = exportBackupData();
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = getTodayString();
  a.href = url;
  a.download = `so-viec-sao-luu-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreBackupData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tasks || !Array.isArray(data.tasks)) {
      return { success: false, message: 'Tệp sao lưu không đúng định dạng Sổ Việc.' };
    }
    // Bảo vệ tuyệt đối: Đánh dấu cờ dọn dẹp để không bao giờ can thiệp vào các task được khôi phục
    localStorage.setItem(DEMO_CLEANED_FLAG, 'true');
    saveTasks(data.tasks);
    if (data.categories && Array.isArray(data.categories)) {
      saveCategories(data.categories);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return { success: true, message: `Đã khôi phục thành công ${data.tasks.length} công việc!` };
  } catch {
    return { success: false, message: 'Tệp tải lên không phải là JSON hợp lệ.' };
  }
}
