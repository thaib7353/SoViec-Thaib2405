import { isNativePlatform } from './platform';

export interface CalendarEventPayload {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  allDay?: boolean;
}

export interface ICalendarAdapter {
  isCalendarSyncSupported(): boolean;
  checkCalendarPermission(): Promise<{ read: boolean; write: boolean }>;
  requestCalendarPermission(): Promise<{ read: boolean; write: boolean }>;
  getCalendarGuide(): { title: string; steps: string[] };
}

class WebCalendarAdapter implements ICalendarAdapter {
  isCalendarSyncSupported(): boolean {
    // Trình duyệt web không thể đọc/ghi trực tiếp vào Android CalendarProvider
    return false;
  }

  async checkCalendarPermission(): Promise<{ read: boolean; write: boolean }> {
    return { read: false, write: false };
  }

  async requestCalendarPermission(): Promise<{ read: boolean; write: boolean }> {
    return { read: false, write: false };
  }

  getCalendarGuide() {
    return {
      title: 'Đồng bộ lịch trên Web Preview',
      steps: [
        'Môi trường Web Preview bị giới hạn bởi Sandbox bảo mật của trình duyệt nên không thể can thiệp trực tiếp vào ứng dụng Lịch của hệ điều hành.',
        'Để đồng bộ hai chiều trực tiếp với Google Calendar/Samsung Calendar của máy, hãy cài đặt bản dựng APK trên điện thoại.',
      ],
    };
  }
}

class CapacitorCalendarAdapter implements ICalendarAdapter {
  isCalendarSyncSupported(): boolean {
    return true;
  }

  async checkCalendarPermission(): Promise<{ read: boolean; write: boolean }> {
    // Trong Giai đoạn 1: Chuẩn bị interface
    // Giai đoạn 3 sẽ kết nối trực tiếp với android.permission.READ_CALENDAR và WRITE_CALENDAR
    return { read: false, write: false };
  }

  async requestCalendarPermission(): Promise<{ read: boolean; write: boolean }> {
    // Giai đoạn 3 sẽ gọi yêu cầu quyền Runtime Permission từ người dùng
    return { read: true, write: true };
  }

  getCalendarGuide() {
    return {
      title: 'Cấp quyền Lịch hệ thống trên Android (Calendar Provider)',
      steps: [
        'Khi mở tính năng Đồng bộ lịch lần đầu, hộp thoại hệ thống Android sẽ xuất hiện.',
        'Chọn "Cho phép" (Allow) để ứng dụng có thể đọc các sự kiện hiện có và tạo công việc mới vào Lịch.',
        'Bạn cũng có thể vào Cài đặt -> Ứng dụng -> Sổ Việc -> Quyền (Permissions) -> Lịch (Calendar) để bật lại bất cứ lúc nào.',
      ],
    };
  }
}

export const calendarAdapter: ICalendarAdapter = isNativePlatform()
  ? new CapacitorCalendarAdapter()
  : new WebCalendarAdapter();
