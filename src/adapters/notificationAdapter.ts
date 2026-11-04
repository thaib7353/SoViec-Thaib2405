import { LocalNotifications, Channel, ActionPerformed } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';
import { Task } from '../types';

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt';

export type NotificationActionType = 'complete' | 'snooze';

export type NotificationActionHandler = (actionId: NotificationActionType, taskId: string) => void;

/**
 * Chuyển đổi mã định danh Task (string) sang số nguyên dương 32-bit an toàn
 * để tương thích với Notification ID trên Android NotificationManager
 */
export function taskIdToNotificationId(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647 || 1;
}

export const NOTIFICATION_CHANNEL_ID = 'soviec_reminders';
export const NOTIFICATION_ACTION_TYPE_ID = 'TASK_REMINDER_ACTIONS';

export interface INotificationAdapter {
  init(): Promise<void>;
  checkPermission(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  scheduleTaskReminder(task: Task, triggerAt?: Date): Promise<boolean>;
  cancelTaskReminder(taskId: string): Promise<void>;
  showInstantReminder(task: Task): Promise<boolean>;
  onActionPerformed(handler: NotificationActionHandler): () => void;
  getPermissionGuide(): { title: string; steps: string[] };
}

class WebNotificationAdapter implements INotificationAdapter {
  private actionHandlers: Set<NotificationActionHandler> = new Set();
  private scheduledTimers: Map<string, number> = new Map();

  async init(): Promise<void> {
    // Web Preview khởi tạo hoàn tất
  }

  async checkPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) return 'denied';
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') return 'granted';
      if (res === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'denied';
    }
  }

  async scheduleTaskReminder(task: Task, triggerAt?: Date): Promise<boolean> {
    this.cancelTaskReminder(task.id);
    if (task.completed || !task.reminder?.enabled) return false;

    let targetTime: number | null = null;
    if (triggerAt) {
      targetTime = triggerAt.getTime();
    } else if (task.reminder.snoozedUntil) {
      targetTime = new Date(task.reminder.snoozedUntil).getTime();
    } else if (task.dueDate && task.dueTime) {
      const parsed = new Date(`${task.dueDate}T${task.dueTime}:00`);
      if (!isNaN(parsed.getTime())) {
        targetTime = parsed.getTime();
      }
    }

    if (!targetTime) return false;

    const delay = targetTime - Date.now();
    if (delay <= 0) {
      return false;
    }

    if (delay < 86400000) {
      const timer = window.setTimeout(() => {
        this.showInstantReminder(task);
      }, delay);
      this.scheduledTimers.set(task.id, timer);
    }

    return true;
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    const timer = this.scheduledTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTimers.delete(taskId);
    }
  }

  async showInstantReminder(task: Task): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const title = `⏰ Nhắc việc: ${task.title}`;
      const body = task.notes ? task.notes : (task.dueTime ? `Đến giờ thực hiện: ${task.dueTime}` : 'Công việc cần hoàn thành');
      const notification = new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `task-${task.id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        this.actionHandlers.forEach((handler) => handler('snooze', task.id));
      };

      return true;
    } catch {
      return false;
    }
  }

  onActionPerformed(handler: NotificationActionHandler): () => void {
    this.actionHandlers.add(handler);
    return () => {
      this.actionHandlers.delete(handler);
    };
  }

  getPermissionGuide() {
    return {
      title: 'Bật thông báo trên trình duyệt (Web)',
      steps: [
        'Nhấn vào biểu tượng ổ khóa hoặc cài đặt trên thanh địa chỉ trình duyệt.',
        'Tìm mục "Thông báo" (Notifications).',
        'Chuyển trạng thái sang "Cho phép" (Allow).',
        'Tải lại trang ứng dụng.',
      ],
    };
  }
}

class CapacitorNotificationAdapter implements INotificationAdapter {
  private isInitialized = false;
  private actionHandlers: Set<NotificationActionHandler> = new Set();

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Tạo NotificationChannel trên Android (Importance 5 = IMPORTANCE_HIGH cho Heads-up notification)
      const channel: Channel = {
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Nhắc việc Sổ Việc',
        description: 'Kênh phát thông báo nhắc việc Heads-up và chuông báo của ứng dụng Sổ Việc',
        importance: 5, // IMPORTANCE_HIGH: Pop-up / banner trên màn hình Android
        visibility: 1, // VISIBILITY_PUBLIC: Hiển thị trên màn hình khóa
        vibration: true,
        lights: true,
        lightColor: '#2563eb',
      };
      await LocalNotifications.createChannel(channel);

      // 2. Đăng ký Action Types: Nút "✓ Hoàn thành" và "⏰ Hoãn 10 phút"
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: NOTIFICATION_ACTION_TYPE_ID,
            actions: [
              {
                id: 'complete',
                title: '✓ Hoàn thành',
              },
              {
                id: 'snooze',
                title: '⏰ Hoãn 10 phút',
              },
            ],
          },
        ],
      });

      // 3. Lắng nghe hành động khi người dùng bấm nút trên thông báo Heads-up
      await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: ActionPerformed) => {
        const actionId = notificationAction.actionId === 'complete' ? 'complete' : 'snooze';
        const taskId = notificationAction.notification?.extra?.taskId;
        if (taskId) {
          this.actionHandlers.forEach((handler) => handler(actionId, taskId));
        }
      });

      this.isInitialized = true;
    } catch (err) {
      console.warn('Lỗi khi khởi tạo NotificationChannel / ActionTypes:', err);
    }
  }

  async checkPermission(): Promise<NotificationPermissionState> {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'denied';
    }
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    try {
      const status = await LocalNotifications.requestPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'denied';
    }
  }

  async scheduleTaskReminder(task: Task, triggerAt?: Date): Promise<boolean> {
    await this.init();
    if (task.completed || !task.reminder?.enabled) {
      await this.cancelTaskReminder(task.id);
      return false;
    }

    let targetDate: Date | null = null;
    if (triggerAt) {
      targetDate = triggerAt;
    } else if (task.reminder.snoozedUntil) {
      targetDate = new Date(task.reminder.snoozedUntil);
    } else if (task.dueDate && task.dueTime) {
      const parsed = new Date(`${task.dueDate}T${task.dueTime}:00`);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    if (!targetDate) return false;

    // Nếu thời gian đã quá 2 phút trong quá khứ và không phải trigger trực tiếp, bỏ qua
    if (targetDate.getTime() < Date.now() - 120000 && !triggerAt) {
      return false;
    }

    const scheduleTime = targetDate.getTime() <= Date.now() 
      ? new Date(Date.now() + 500) 
      : targetDate;

    const notifId = taskIdToNotificationId(task.id);
    const bodyText = task.notes ? task.notes : (task.dueTime ? `Đến giờ thực hiện: ${task.dueTime}` : 'Công việc cần hoàn thành');

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: `⏰ Nhắc việc: ${task.title}`,
            body: bodyText,
            channelId: NOTIFICATION_CHANNEL_ID,
            actionTypeId: NOTIFICATION_ACTION_TYPE_ID,
            schedule: {
              at: scheduleTime,
              allowWhileIdle: true,
            },
            extra: {
              taskId: task.id,
              title: task.title,
            },
            autoCancel: true,
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Lỗi schedule notification:', err);
      return false;
    }
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    try {
      const notifId = taskIdToNotificationId(taskId);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
    } catch (err) {
      console.warn('Lỗi cancel notification:', err);
    }
  }

  async showInstantReminder(task: Task): Promise<boolean> {
    return this.scheduleTaskReminder(task, new Date(Date.now() + 500));
  }

  onActionPerformed(handler: NotificationActionHandler): () => void {
    this.actionHandlers.add(handler);
    return () => {
      this.actionHandlers.delete(handler);
    };
  }

  getPermissionGuide() {
    return {
      title: 'Bật thông báo ứng dụng trên Android (Heads-up Notification)',
      steps: [
        'Mở mục "Cài đặt" (Settings) trên điện thoại Android.',
        'Chọn "Ứng dụng" -> Tìm và chọn "Sổ Việc".',
        'Chọn mục "Thông báo" (Notifications).',
        'Bật công tắc "Tất cả thông báo của Sổ Việc".',
        'Bật thêm mục "Hiển thị dạng biểu ngữ / Pop-up trên màn hình" (Heads-up) để nhận thông báo nổi.',
      ],
    };
  }
}

export const notificationAdapter: INotificationAdapter = isNativePlatform()
  ? new CapacitorNotificationAdapter()
  : new WebNotificationAdapter();
