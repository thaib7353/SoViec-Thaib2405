import { isNativePlatform } from './platform';

/**
 * Android Exact Alarm Policy Assessment (Chính sách Báo thức chính xác trên Android):
 * 
 * 1. USE_EXACT_ALARM:
 *    - Google Play áp dụng chính sách kiểm duyệt rất nghiêm ngặt (chỉ cấp cho app có chức năng cốt lõi là Đồng hồ báo thức chính, Timer đếm ngược).
 *    - Nếu ứng dụng quản lý công việc (To-Do app) khai báo USE_EXACT_ALARM mà không thuộc danh mục đặc quyền, bản dựng sẽ bị Google Play từ chối (Policy Rejection).
 * 
 * 2. SCHEDULE_EXACT_ALARM (Giải pháp chuẩn & an toàn):
 *    - Áp dụng từ Android 12 (API level 31) trở lên.
 *    - Ứng dụng khai báo quyền SCHEDULE_EXACT_ALARM trong AndroidManifest.xml.
 *    - Trên Android 13+, quyền này có thể yêu cầu người dùng xác nhận trong mục "Báo thức & lời nhắc" (Alarms & reminders) trong Cài đặt hệ thống nếu bị tắt.
 * 
 * 3. USE_FULL_SCREEN_INTENT:
 *    - Từ Android 14 (API 34), Full-screen intent để bật sáng toàn màn hình khóa bị giới hạn.
 *    - Khuyên dùng: Heads-up Notification với IMPORTANCE_HIGH và âm thanh chuông liên tục, đây là phương án được Google Play khuyến khích và không bị từ chối phát hành.
 */

export interface IAlarmAdapter {
  isExactAlarmSupported(): boolean;
  checkExactAlarmPermission(): Promise<{ allowed: boolean; details: string }>;
  getPolicyNotice(): string;
  getAlarmPermissionGuide(): { title: string; steps: string[] };
}

class WebAlarmAdapter implements IAlarmAdapter {
  isExactAlarmSupported(): boolean {
    // Trình duyệt Web chỉ chạy báo thức qua Web Audio API khi tab đang hoạt động
    return false;
  }

  async checkExactAlarmPermission(): Promise<{ allowed: boolean; details: string }> {
    return {
      allowed: true,
      details: 'Đang chạy trên Web Preview. Báo thức hoạt động khi ứng dụng đang mở.',
    };
  }

  getPolicyNotice(): string {
    return 'Trên bản xem trước Web, trình duyệt chỉ cho phép phát âm thanh khi có tương tác của người dùng. Trên APK Android thực tế, hệ thống sẽ sử dụng Android AlarmManager.';
  }

  getAlarmPermissionGuide() {
    return {
      title: 'Hướng dẫn báo thức trên trình duyệt Web',
      steps: [
        'Giữ tab ứng dụng Sổ Việc luôn mở hoặc chạy nền trên trình duyệt.',
        'Nhấn vào nút "Nghe thử chuông" trong Cài đặt một lần để mở khóa quyền âm thanh trình duyệt.',
      ],
    };
  }
}

class CapacitorAlarmAdapter implements IAlarmAdapter {
  isExactAlarmSupported(): boolean {
    return true;
  }

  async checkExactAlarmPermission(): Promise<{ allowed: boolean; details: string }> {
    // Trong Giai đoạn 1: Chuẩn bị giao diện kiểm tra
    // Giai đoạn 2 sẽ gọi trực tiếp Android AlarmManager.canScheduleExactAlarms() qua Plugin Native
    return {
      allowed: true,
      details: 'Sử dụng quyền SCHEDULE_EXACT_ALARM tuân thủ chính sách Google Play Store.',
    };
  }

  getPolicyNotice(): string {
    return 'Ứng dụng tuân thủ chính sách Android 12+ (API 31+): Sử dụng quyền SCHEDULE_EXACT_ALARM kết hợp NotificationChannel mức ưu tiên HIGH, đảm bảo đánh thức đúng giờ mà không vi phạm chính sách Google Play.';
  }

  getAlarmPermissionGuide() {
    return {
      title: 'Cho phép báo thức chính xác trên Android (Alarms & Reminders)',
      steps: [
        'Mở "Cài đặt" (Settings) của điện thoại Android.',
        'Vào mục "Ứng dụng" (Apps) -> "Quyền truy cập đặc biệt" (Special app access).',
        'Chọn "Báo thức và lời nhắc" (Alarms & reminders).',
        'Tìm "Sổ Việc" và gạt bật cho phép ứng dụng đặt báo thức chính xác.',
      ],
    };
  }
}

export const alarmAdapter: IAlarmAdapter = isNativePlatform()
  ? new CapacitorAlarmAdapter()
  : new WebAlarmAdapter();
