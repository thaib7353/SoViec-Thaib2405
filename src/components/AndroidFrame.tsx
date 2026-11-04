import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  viewMode: 'phone' | 'fullscreen';
  onToggleViewMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  viewMode,
  onToggleViewMode,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (viewMode === 'fullscreen') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        {/* Quick frame toggle toolbar at very top */}
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium text-blue-600 dark:text-blue-400">Sổ Việc · Chế độ Toàn màn hình</span>
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Chuyển sang khung mô phỏng điện thoại Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xem khung điện thoại Android</span>
          </button>
        </div>
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  // Mobile Android Phone Frame
  return (
    <div className="min-h-screen bg-slate-900/90 dark:bg-black/95 flex flex-col items-center justify-center p-2 sm:p-6 transition-colors">
      {/* Control bar above phone */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-xs text-slate-300 px-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>Mô phỏng Android Phone</span>
        </div>
        <button
          onClick={onToggleViewMode}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition-colors shadow-sm cursor-pointer"
          title="Mở rộng ứng dụng toàn màn hình"
        >
          <Monitor className="w-3.5 h-3.5 text-blue-400" />
          <span>Toàn màn hình</span>
        </button>
      </div>

      {/* Android Device Mockup Frame */}
      <div className="w-full max-w-[412px] h-[870px] max-h-[96vh] bg-slate-950 rounded-[48px] p-3 shadow-2xl ring-1 ring-slate-800 flex flex-col relative overflow-hidden">
        {/* Device Outer Edge Highlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-b-md z-30" />

        {/* Screen Bezel Wrapper */}
        <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-[38px] overflow-hidden flex flex-col border border-slate-800/20 dark:border-slate-800">
          {/* Android Status Bar */}
          <div className="h-9 px-6 bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 select-none shrink-0 z-20 border-b border-slate-100/50 dark:border-slate-800/50">
            {/* Clock */}
            <span className="text-[12px] tracking-tight">{currentTime || '12:00'}</span>

            {/* Camera Punch Hole in center */}
            <div className="w-4 h-4 rounded-full bg-black/90 border border-slate-700/60 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* Android System Icons */}
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="text-[10px] font-bold tracking-tighter">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Actual Application Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* Android Bottom Navigation Pill Bar */}
          <div className="h-5 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 z-20 border-t border-slate-100/30 dark:border-slate-800/30">
            <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
