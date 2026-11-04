import { Preferences } from '@capacitor/preferences';
import { AppSettings, Category, Task } from '../types';
import { 
  loadTasks as loadLocalStorageTasks, 
  saveTasks as saveLocalStorageTasks,
  loadCategories as loadLocalStorageCategories,
  saveCategories as saveLocalStorageCategories,
  loadSettings as loadLocalStorageSettings,
  saveSettings as saveLocalStorageSettings,
  exportBackupData,
  downloadBackupFile,
  restoreBackupData
} from '../utils/storage';
import { isNativePlatform } from './platform';

const TASKS_KEY = 'soviec_tasks_v1';
const CATEGORIES_KEY = 'soviec_categories_v1';
const SETTINGS_KEY = 'soviec_settings_v1';

export class StorageAdapter {
  // Đồng bộ hai chiều giữa LocalStorage và Capacitor Preferences (SharedPreferences trên Android)
  async initStorageMigration(): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      // Kiểm tra xem đã có dữ liệu trong Preferences chưa
      const { value: nativeTasks } = await Preferences.get({ key: TASKS_KEY });
      const localTasks = loadLocalStorageTasks();

      // Nếu đã có dữ liệu native nhưng chứa demo tasks cũ, đồng bộ lại danh sách sạch
      if (nativeTasks) {
        try {
          const parsedNative = JSON.parse(nativeTasks);
          if (Array.isArray(parsedNative)) {
            const cleanNative = parsedNative.filter((t: Task) => !['task-1', 'task-2', 'task-3', 'task-4', 'task-5'].includes(t.id));
            if (cleanNative.length !== parsedNative.length) {
              await Preferences.set({ key: TASKS_KEY, value: JSON.stringify(cleanNative) });
            }
          }
        } catch {}
      } else if (localTasks.length > 0) {
        // Sao lưu an toàn dữ liệu LocalStorage sang Android SharedPreferences
        await Preferences.set({ key: TASKS_KEY, value: JSON.stringify(localTasks) });
        await Preferences.set({ key: CATEGORIES_KEY, value: JSON.stringify(loadLocalStorageCategories()) });
        await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(loadLocalStorageSettings()) });
        console.log('[StorageAdapter] Đã di chuyển an toàn dữ liệu LocalStorage sang Android Preferences.');
      }
    } catch (err) {
      console.warn('[StorageAdapter] Lỗi kiểm tra bộ nhớ Native, tiếp tục dùng LocalStorage an toàn:', err);
    }
  }

  loadTasks(): Task[] {
    return loadLocalStorageTasks();
  }

  saveTasks(tasks: Task[]): void {
    // 1. Luôn lưu vào LocalStorage để đảm bảo bản Web Preview và tương thích ngược không bị gián đoạn
    saveLocalStorageTasks(tasks);

    // 2. Nếu trên Android Native, lưu đồng thời vào Android SharedPreferences để chống mất dữ liệu khi dọn rác
    if (isNativePlatform()) {
      Preferences.set({ key: TASKS_KEY, value: JSON.stringify(tasks) }).catch(() => {});
    }
  }

  loadCategories(): Category[] {
    return loadLocalStorageCategories();
  }

  saveCategories(categories: Category[]): void {
    saveLocalStorageCategories(categories);
    if (isNativePlatform()) {
      Preferences.set({ key: CATEGORIES_KEY, value: JSON.stringify(categories) }).catch(() => {});
    }
  }

  loadSettings(): AppSettings {
    return loadLocalStorageSettings();
  }

  saveSettings(settings: AppSettings): void {
    saveLocalStorageSettings(settings);
    if (isNativePlatform()) {
      Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) }).catch(() => {});
    }
  }

  exportBackup(): string {
    return exportBackupData();
  }

  downloadBackup(): void {
    downloadBackupFile();
  }

  restoreBackup(jsonString: string) {
    return restoreBackupData(jsonString);
  }
}

export const storageAdapter = new StorageAdapter();
