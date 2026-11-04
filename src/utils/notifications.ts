/**
 * Android & Web Notification API + Vibration API utilities
 */

import { Task } from '../types';
import { notificationAdapter } from '../adapters/notificationAdapter';
import { isNativePlatform } from '../adapters/platform';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const result = await notificationAdapter.requestPermission();
  return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'default';
}

export function checkNotificationPermission(): NotificationPermission {
  if (isNativePlatform()) {
    // Trên Native, ta kiểm tra thông qua adapter bất đồng bộ, mặc định trả về granted nếu được cấp
    return 'granted';
  }
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export function triggerVibration(pattern: number[] = [400, 250, 400, 250, 600]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function stopVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}

export function showTaskNotification(
  task: Task, 
  onAction?: (action: 'complete' | 'snooze' | 'tap') => void
) {
  triggerVibration([500, 250, 500, 250, 800]);

  // Luôn kích hoạt thông báo qua notificationAdapter (Heads-up trên Android với nút thao tác)
  notificationAdapter.showInstantReminder(task);

  if (onAction) {
    const unsub = notificationAdapter.onActionPerformed((actionId, taskId) => {
      if (taskId === task.id) {
        onAction(actionId);
        unsub();
      }
    });
  }

  // Web Notification fallback nếu chạy trên trình duyệt thường
  if (!isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
    const title = `⏰ Nhắc việc: ${task.title}`;
    const options: NotificationOptions = {
      body: task.notes ? task.notes : `Đã đến giờ thực hiện: ${task.dueTime || 'Hôm nay'}`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `task-${task.id}`,
      requireInteraction: true,
      silent: false,
    };

    try {
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onAction) onAction('snooze');
      };

      return notification;
    } catch {
      return null;
    }
  }

  return null;
}
