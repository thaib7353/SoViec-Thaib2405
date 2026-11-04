import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  Bell, 
  Smartphone, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Play, 
  Vibrate, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AppSettings, Task } from '../types';
import { audioManager } from '../utils/audioAlarm';
import { checkNotificationPermission, requestNotificationPermission, showTaskNotification, triggerVibration } from '../utils/notifications';
import { downloadBackupFile, restoreBackupData } from '../utils/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onRefreshData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onRefreshData,
  onClose,
}) => {
  const [permission, setPermission] = useState(checkNotificationPermission());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTestRingtone = () => {
    audioManager.previewRingtone(settings.ringtone, settings.volume);
    if (settings.vibrationEnabled) {
      triggerVibration([200, 100, 200]);
    }
  };

  const handleRequestNotification = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setStatusMessage('Đã cấp quyền thông báo thành công!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleTestNotification = () => {
    const mockTask: Task = {
      id: 'test-alarm',
      title: 'Kiểm tra thông báo & chuông báo thức',
      notes: 'Hệ thống thông báo và chuông reo của Sổ Việc đang hoạt động chuẩn xác!',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: null,
      dueTime: 'Hiện tại',
      priority: 'p1',
      categoryId: 'work',
      subtasks: [],
      reminder: { enabled: true },
    };

    showTaskNotification(mockTask);
    audioManager.previewRingtone(settings.ringtone, settings.volume);
    setStatusMessage('Đã gửi thông báo thử nghiệm và phát chuông!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupData(content);
      if (res.success) {
        setStatusMessage(res.message);
        onRefreshData();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cài đặt & Âm thanh
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {statusMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Sound & Ringtone Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-900 dark:text-white block">
              Chuông báo & Âm lượng
            </span>

            {/* Sound toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Bật âm thanh báo thức
                </span>
                <span className="text-slate-500 text-[11px]">
                  Phát chuông liên tục khi đến giờ hẹn
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Ringtone Selector */}
            {settings.soundEnabled && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Giai điệu chuông báo thức
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gentle_chime', label: 'Chuông êm dịu (Chime)' },
                    { id: 'digital_pulse', label: 'Điện tử (Digital Pulse)' },
                    { id: 'radar_beep', label: 'Sóng Radar (Radar)' },
                    { id: 'zen_bell', label: 'Chuông thiền (Zen Bell)' },
                  ].map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, ringtone: rt.id as any })}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        settings.ringtone === rt.id
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate">{rt.label}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestRingtone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Nghe thử chuông</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Sử dụng Web Audio API
                  </span>
                </div>
              </div>
            )}

            {/* Vibration toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Rung điện thoại khi báo thức
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Hỗ trợ trên thiết bị Android
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Android Notifications Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white block">
                Thông báo Android (Heads-up)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                Kênh ưu tiên cao (High)
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Kênh thông báo <code className="text-blue-600 dark:text-blue-400 font-mono">soviec_reminders</code> hiển thị dạng pop-up nổi trên màn hình với 2 nút hành động: <strong>✓ Hoàn thành</strong> và <strong>⏰ Hoãn 10 phút</strong>.
            </p>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Trạng thái quyền:
                </span>
                <span className={`text-[11px] font-bold ${
                  permission === 'granted' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : permission === 'denied' 
                      ? 'text-rose-600 dark:text-rose-400' 
                      : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {permission === 'granted' ? '✓ Đã cấp quyền' : permission === 'denied' ? '✗ Bị từ chối' : 'Chưa cấp quyền'}
                </span>
              </div>

              {permission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Cấp quyền
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>Gửi thử thông báo Heads-up mẫu</span>
            </button>
          </div>

          {/* Data Backup & Restore Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-900 dark:text-white block">
              Sao lưu & Bảo vệ dữ liệu
            </span>

            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Dữ liệu được lưu trữ an toàn trong bộ nhớ máy của bạn. Bạn có thể xuất file sao lưu để chuyển dữ liệu sang thiết bị khác bất cứ lúc nào.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={downloadBackupFile}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Sao lưu (.json)</span>
              </button>

              <label className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Khôi phục tệp</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Đặt lại toàn bộ ứng dụng về trạng thái cài đặt mới (Danh sách công việc sẽ được làm trống)?')) {
                  onResetData();
                  setStatusMessage('Đã đưa ứng dụng về trạng thái mới sạch sẽ!');
                  setTimeout(() => setStatusMessage(null), 3000);
                }
              }}
              className="w-full py-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại ứng dụng về trạng thái mới (Trống)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Sổ Việc Android · v1.0.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
