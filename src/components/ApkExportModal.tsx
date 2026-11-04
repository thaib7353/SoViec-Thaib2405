import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkExportModalProps {
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ onClose }) => {
  const { isInstallable, install, isInstalled } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCapacitor, setCopiedCapacitor] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://so-viec.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const capacitorCommands = `npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Sổ Việc" "com.soviec.app" --web-dir dist
npx cap add android
npx cap open android`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopiedCapacitor(true);
    setTimeout(() => setCopiedCapacitor(false), 2000);
  };

  const handleDownloadCapacitorConfig = () => {
    const config = {
      appId: 'com.soviec.app',
      appName: 'Sổ Việc',
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https',
      },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cài đặt & Xuất APK Android
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chạy ứng dụng Sổ Việc thực sự trên điện thoại Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Method 1: Instant PWA/WebAPK Install (Fastest, Recommended) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                  1
                </span>
                <span className="font-bold text-sm text-blue-950 dark:text-blue-100">
                  Cài đặt trực tiếp lên điện thoại (Khuyên dùng)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                Nhanh nhất
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Android hỗ trợ công nghệ <strong>WebAPK</strong> của Google. Khi cài đặt, điện thoại sẽ tự động biên dịch và tạo ứng dụng độc lập trong danh sách ứng dụng Android (có icon riêng, không có thanh địa chỉ duyệt web, chuông báo thức và hoạt động offline 100%).
            </p>

            {isInstalled ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ứng dụng đã được cài đặt và đang chạy ở chế độ độc lập!</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>BẤM ĐỂ CÀI ĐẶT NGAY LÊN THIẾT BỊ NÀY</span>
              </button>
            ) : (
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-blue-900 dark:text-blue-300">
                  Cách cài đặt từ Chrome trên điện thoại:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Mở liên kết ứng dụng này bằng trình duyệt Chrome trên Android.</li>
                  <li>Nhấn vào biểu tượng <strong>3 dấu chấm (⋮)</strong> ở góc trên bên phải.</li>
                  <li>Chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào Màn hình chính&quot;</strong>.</li>
                </ol>
              </div>
            )}

            {/* Quick URL Copy Box */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 select-all truncate"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Đã chép' : 'Chép Link'}</span>
              </button>
            </div>
          </div>

          {/* Method 2: PWABuilder (One-Click APK generator) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold flex items-center justify-center text-[11px]">
                  2
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Tạo file APK trực tiếp qua PWABuilder
                </span>
              </div>
              <span className="text-slate-500 font-medium text-[10px]">Miễn phí</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              PWABuilder (công cụ mã nguồn mở của Microsoft) cho phép bạn biến web app thành file <strong>.APK cài đặt trực tiếp</strong> hoặc xuất file <strong>.AAB</strong> để xuất bản lên Google Play Store mà không cần máy tính cấu hình mạnh.
            </p>

            <div className="flex items-center gap-2">
              <a
                href="https://www.pwabuilder.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Mở PWABuilder.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (Dán liên kết ứng dụng vừa chép vào ô kiểm tra)
              </span>
            </div>
          </div>

          {/* Method 3: Native Android Project with Capacitor */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold flex items-center justify-center text-[11px]">
                  3
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Đóng gói bằng Capacitor & Android Studio
                </span>
              </div>
              <span className="text-slate-500 font-medium text-[10px]">Dành cho lập trình viên</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              Chạy các lệnh sau trong thư mục mã nguồn để tự động tạo dự án Android Studio hoàn chỉnh và build ra file APK:
            </p>

            <div className="relative">
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {capacitorCommands}
              </pre>
              <button
                onClick={handleCopyCommands}
                className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCapacitor ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCapacitor ? 'Đã sao chép' : 'Sao chép lệnh'}</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                onClick={handleDownloadCapacitorConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp capacitor.config.json</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            Đã hiểu, đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
