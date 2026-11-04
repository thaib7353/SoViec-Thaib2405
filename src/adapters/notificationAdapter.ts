import { LocalNotifications, Channel, ActionPerformed } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';
import { Task } from '../types';

export type NotificationActionType = 'complete' | 'snooze' | 'tap';
export type NotificationPermissionState = 'granted' | 'denied' | 'prompt';
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

// Channel ID mới v2 để áp dụng mức ưu tiên tối đa (IMPORTANCE_MAX) trên Android OS
export const NOTIFICATION_CHANNEL_ID = 'soviec_reminders_v2';
export const NOTIFICATION_ACTION_TYPE_ID = 'SOVIEC_TASK_ACTIONS';

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

/**
 * Adapter xử lý thông báo trên môi trường Web Browser / PWA
 */
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
        this.actionHandlers.forEach((handler) => handler('tap', task.id));
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

/**
 * Adapter xử lý thông báo Native trên Android qua Capacitor LocalNotifications & AlarmManager
 * - Hỗ trợ Notification Channel chuẩn IMPORTANCE_HIGH (Heads-up pop-up banner)
 * - Tự động thiết lập smallIcon hợp lệ (ic_stat_soviec) để Android luôn hiển thị trên thanh trạng thái
 * - Tự động thiết lập foreground: true để NotificationCompat.Builder kích hoạt PRIORITY_HIGH
 * - Hỗ trợ nút hành động tương tác: "✓ Hoàn thành" và "⏰ Hoãn 10 phút"
 * - Xử lý sự kiện 'tap' để mở đúng công việc khi người dùng nhấn vào thông báo
 * - Hoạt động ngay cả khi ứng dụng ở Background hoặc đã đóng hoàn toàn (qua AlarmManager)
 */
class CapacitorNotificationAdapter implements INotificationAdapter {
  private isInitialized = false;
  private actionHandlers: Set<NotificationActionHandler> = new Set();

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Dọn dẹp channel cũ nếu có để đảm bảo Android áp dụng cấu hình Heads-up mới
      try {
        await LocalNotifications.deleteChannel({ id: 'soviec_reminders' });
      } catch {}

      // 2. Tạo NotificationChannel trên Android với mức ưu tiên tối đa (Importance 5 = IMPORTANCE_MAX)
      const channel: Channel = {
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Nhắc việc & Chuông báo Sổ Việc',
        description: 'Hiển thị biểu ngữ thông báo Heads-up trên màn hình và chuông báo nhắc nhở công việc',
        importance: 5, // IMPORTANCE_HIGH / MAX: Bắt buộc để Android hiển thị pop-up / banner nổi
        visibility: 1, // VISIBILITY_PUBLIC: Hiển thị đầy đủ nội dung trên màn hình khóa
        vibration: true,
        lights: true,
        lightColor: '#2563EB',
      };
      await LocalNotifications.createChannel(channel);

      // 3. Đăng ký Action Types: Nút "✓ Hoàn thành" và "⏰ Hoãn 10 phút"
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

      // 4. Lắng nghe hành động khi người dùng bấm nút trên thông báo Heads-up hoặc nhấn vào thông báo
      await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: ActionPerformed) => {
        let actionId: NotificationActionType = 'tap';
        if (notificationAction.actionId === 'complete') {
          actionId = 'complete';
        } else if (notificationAction.actionId === 'snooze') {
          actionId = 'snooze';
        } else {
          actionId = 'tap'; // Nhấn trực tiếp vào thân thông báo
        }

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

    // Tự động kiểm tra quyền thông báo trên Android (POST_NOTIFICATIONS)
    const permStatus = await this.checkPermission();
    if (permStatus === 'prompt') {
      await this.requestPermission();
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
    const largeBodyText = task.notes 
      ? `${task.notes}\nĐến giờ: ${task.dueTime || 'Hôm nay'}` 
      : `Đến giờ thực hiện công việc: ${task.dueTime || 'Hôm nay'}`;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: `⏰ Nhắc việc: ${task.title}`,
            body: bodyText,
            largeBody: largeBodyText,
            summaryText: 'Sổ Việc Android',
            channelId: NOTIFICATION_CHANNEL_ID,
            // SmallIcon BẮT BUỘC hợp lệ để Android hiển thị icon trên thanh trạng thái và bảng thông báo
            smallIcon: 'ic_stat_soviec',
            iconColor: '#2563EB',
            actionTypeId: NOTIFICATION_ACTION_TYPE_ID,
            schedule: {
              at: scheduleTime,
              allowWhileIdle: true, // Kích hoạt AlarmManager.RTC_WAKEUP ngay cả khi thiết bị ở chế độ Doze / Sleep
            },
            extra: {
              taskId: task.id,
              title: task.title,
            },
            autoCancel: true,
            ongoing: false,
            // BẮT BUỘC để LocalNotificationManager.kt gán:
            // mBuilder.setPriority(NotificationCompat.PRIORITY_HIGH)
            // Giúp Android hiển thị Heads-up notification dạng biểu ngữ nổi trên màn hình!
            foreground: true,
          } as any,
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
      title: 'Bật thông báo và báo thức chính xác trên Android',
      steps: [
        'Mở "Cài đặt" trên điện thoại -> Chọn "Ứng dụng" -> "Sổ Việc".',
        'Vào mục "Thông báo": Bật "Tất cả thông báo" và cho phép "Hiển thị biểu ngữ nổi (Heads-up / Pop-up)".',
        'Vào mục "Quyền nâng cao" (hoặc "Truy cập đặc biệt"): Bật quyền "Báo thức và lời nhắc" (Alarms & Reminders) để kích hoạt báo thức chính xác.',
        'Vào mục "Pin / Tiết kiệm pin": Chọn "Không hạn chế" (Unrestricted) để Android không tự động tắt chuông khi màn hình khóa.',
      ],
    };
  }
}

export const notificationAdapter: INotificationAdapter = isNativePlatform()
  ? new CapacitorNotificationAdapter()
  : new WebNotificationAdapter();
