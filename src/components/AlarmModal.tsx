import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Clock, 
  Volume2, 
  VolumeX, 
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { audioManager } from '../utils/audioAlarm';
import { stopVibration, triggerVibration } from '../utils/notifications';

interface AlarmModalProps {
  task: Task;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  task,
  onDismiss,
  onSnooze,
  onComplete,
}) => {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    if (isMuted) {
      audioManager.startContinuousAlarm('gentle_chime', 0.8);
      triggerVibration([300, 200, 300]);
      setIsMuted(false);
    } else {
      audioManager.stopAlarm();
      stopVibration();
      setIsMuted(true);
    }
  };

  const handleCompleteAction = () => {
    audioManager.stopAlarm();
    stopVibration();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B'],
    });
    onComplete();
  };

  const handleSnoozeAction = (mins: number) => {
    audioManager.stopAlarm();
    stopVibration();
    onSnooze(mins);
  };

  const handleDismissAction = () => {
    audioManager.stopAlarm();
    stopVibration();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Glow Rings behind Bell */}
        <div className="relative mb-5 mt-2">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <div className="absolute -inset-2 rounded-full bg-blue-400/10 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 relative z-10">
            <Bell className="w-10 h-10 animate-bounce stroke-[2.2]" />
          </div>
        </div>

        {/* Alarm Banner Text */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>BÁO THỨC ĐANG REO</span>
        </div>

        {/* Task Title */}
        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug px-2 mb-1.5">
          {task.title}
        </h2>

        {/* Task Notes */}
        {task.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 px-4 mb-3">
            {task.notes}
          </p>
        )}

        {/* Due Time indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Thời hạn: {task.dueTime || 'Hôm nay'}</span>
          {task.dueDate && <span>({task.dueDate})</span>}
        </div>

        {/* Snooze Options Popup / Accordion */}
        {showSnoozeOptions ? (
          <div className="w-full bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 space-y-2 animate-in zoom-in-95 duration-150">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Chọn thời gian hoãn báo thức:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSnoozeAction(5)}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 font-medium text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Hoãn 5 phút
              </button>
              <button
                type="button"
                onClick={() => handleSnoozeAction(10)}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 font-medium text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Hoãn 10 phút
              </button>
              <button
                type="button"
                onClick={() => handleSnoozeAction(15)}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 font-medium text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Hoãn 15 phút
              </button>
              <button
                type="button"
                onClick={() => handleSnoozeAction(60)}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 font-medium text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Hoãn 1 giờ
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleSnoozeAction(1440)}
              className="w-full py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-400 font-medium text-xs text-slate-800 dark:text-slate-200 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Hoãn đến ngày mai (09:00)</span>
            </button>
          </div>
        ) : null}

        {/* 3 Main Action Buttons */}
        <div className="w-full space-y-2.5">
          {/* Primary Action: Complete */}
          <button
            type="button"
            onClick={handleCompleteAction}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Đã hoàn thành công việc</span>
          </button>

          {/* Secondary Action: Snooze */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
              className="py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-semibold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>{showSnoozeOptions ? 'Đóng tùy chọn' : 'Hoãn báo thức'}</span>
            </button>

            {/* Dismiss Alarm Button */}
            <button
              type="button"
              onClick={handleDismissAction}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <span>Tắt chuông</span>
            </button>
          </div>
        </div>

        {/* Mute toggle button at bottom */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="mt-4 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              <span>Âm thanh đang tắt (Bấm để bật lại)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Đang phát chuông liên tục (Bấm để tạm ngắt)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
