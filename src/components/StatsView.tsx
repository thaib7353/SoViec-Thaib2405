import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  AlertCircle,
  ListTodo,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Category, Task } from '../types';
import { audioManager } from '../utils/audioAlarm';
import { getTodayString } from '../utils/storage';

interface StatsViewProps {
  tasks: Task[];
  categories: Category[];
  onOpenNewTask?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  tasks, 
  categories,
  onOpenNewTask 
}) => {
  const today = getTodayString();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.filter((t) => !t.completed).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
  const hasTasks = total > 0;
  const completionRate = hasTasks ? Math.round((completed / total) * 100) : 0;

  // Tính chuỗi ngày thực tế từ dữ liệu hoàn thành thật của người dùng
  const realStreak = useMemo(() => {
    const completedDates = new Set<string>();
    // Thuật toán Streak: Chỉ tính trên ngày hoàn thành thực tế completedAt (Không dùng dueDate)
    tasks.forEach((t) => {
      if (t.completed && t.completedAt) {
        completedDates.add(t.completedAt.split('T')[0]);
      }
    });

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date();
    
    // Kiểm tra xem hôm nay đã hoàn thành việc nào chưa
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let currentStr = formatDate(checkDate);
    
    // Nếu hôm nay chưa có việc nào xong, kiểm tra ngày hôm qua để duy trì chuỗi
    if (!completedDates.has(currentStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      currentStr = formatDate(checkDate);
      if (!completedDates.has(currentStr)) {
        return 0;
      }
    }

    // Đếm ngược từng ngày liên tiếp có việc hoàn thành
    while (completedDates.has(currentStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      currentStr = formatDate(checkDate);
    }

    return streak;
  }, [tasks]);

  // Bộ định cỡ chữ động theo số lượng chữ số để chống tràn
  const getNumberFontSize = (num: number) => {
    if (num >= 10000) return 'text-lg sm:text-xl';
    if (num >= 1000) return 'text-xl sm:text-2xl';
    return 'text-2xl sm:text-3xl';
  };

  // Mini Pomodoro / Focus Timer (25 phút)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    if (isTimerRunning && pomodoroSeconds > 0) {
      timer = window.setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      audioManager.playSuccessChime();
      alert('Hoàn thành phiên tập trung 25 phút! Hãy nghỉ ngơi 5 phút.');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, pomodoroSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setPomodoroSeconds(25 * 60);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 bg-slate-50 dark:bg-slate-950">
      {/* Thẻ Thống Kê Chính */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Thống kê hiệu suất</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu thực tế được tính toán từ danh sách công việc của bạn
          </p>
        </div>

        {/* Bố cục 2 Cột × 2 Hàng (Đồng đều chiều rộng và chiều cao) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ô 1: Tổng công việc (Màu trung tính) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between min-h-[96px] transition-colors">
            <div className="flex items-center justify-between gap-1 text-slate-600 dark:text-slate-400">
              <span className="text-xs font-semibold leading-tight">
                Tổng công việc
              </span>
              <ListTodo className="w-4 h-4 shrink-0 opacity-70" />
            </div>
            <div className="mt-2">
              <span className={`${getNumberFontSize(total)} font-bold tabular-nums text-slate-900 dark:text-white block truncate tracking-tight`}>
                {total}
              </span>
            </div>
          </div>

          {/* Ô 2: Đã hoàn thành (Màu xanh lá) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 flex flex-col justify-between min-h-[96px] transition-colors">
            <div className="flex items-center justify-between gap-1 text-emerald-800 dark:text-emerald-300">
              <span className="text-xs font-semibold leading-tight">
                Đã hoàn thành
              </span>
              <CheckCircle2 className="w-4 h-4 shrink-0 opacity-80" />
            </div>
            <div className="mt-2">
              <span className={`${getNumberFontSize(completed)} font-bold tabular-nums text-emerald-700 dark:text-emerald-400 block truncate tracking-tight`}>
                {completed}
              </span>
            </div>
          </div>

          {/* Ô 3: Đang chờ làm (Màu xanh dương) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-800/60 flex flex-col justify-between min-h-[96px] transition-colors">
            <div className="flex items-center justify-between gap-1 text-blue-800 dark:text-blue-300">
              <span className="text-xs font-semibold leading-tight">
                Đang chờ làm
              </span>
              <Clock className="w-4 h-4 shrink-0 opacity-80" />
            </div>
            <div className="mt-2">
              <span className={`${getNumberFontSize(pending)} font-bold tabular-nums text-blue-700 dark:text-blue-400 block truncate tracking-tight`}>
                {pending}
              </span>
            </div>
          </div>

          {/* Ô 4: Việc quá hạn (Màu cam/đỏ dịu, không gắt) */}
          <div className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[96px] transition-colors ${
            overdue > 0 
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-800/60 text-rose-800 dark:text-rose-300' 
              : 'bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
          }`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold leading-tight">
                Việc quá hạn
              </span>
              <AlertCircle className={`w-4 h-4 shrink-0 ${overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'opacity-70'}`} />
            </div>
            <div className="mt-2">
              <span className={`${getNumberFontSize(overdue)} font-bold tabular-nums block truncate tracking-tight ${
                overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}>
                {overdue}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh Tỷ Lệ Hoàn Thành */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2 font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              Tỷ lệ hoàn thành công việc
            </span>
            <span className="text-blue-600 dark:text-blue-400 tabular-nums">
              {hasTasks ? `${completionRate}%` : 'Chưa có việc'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            {hasTasks ? (
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            ) : (
              <div className="h-full bg-transparent" />
            )}
          </div>

          {!hasTasks && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
              Chưa có công việc nào để tính tỷ lệ. Hãy tạo công việc đầu tiên để ghi nhận tiến độ!
            </p>
          )}
        </div>
      </div>

      {/* Thành Phần Chuỗi Ngày Riêng Biệt (Không gộp bừa vào header) */}
      <div className={`rounded-3xl p-4 border transition-all flex items-center justify-between gap-3 ${
        realStreak > 0
          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            realStreak > 0
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <Flame className={`w-5 h-5 ${realStreak > 0 ? 'fill-current animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {realStreak > 0 ? `Chuỗi liên tiếp: ${realStreak} ngày` : 'Chuỗi ngày rèn luyện: 0 ngày'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {realStreak > 0 
                ? 'Tuyệt vời! Bạn đang duy trì tiến độ hoàn thành việc mỗi ngày.'
                : 'Hoàn thành ít nhất một việc hôm nay để khởi động chuỗi ngày!'}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State Banner khi hoàn toàn chưa có công việc */}
      {!hasTasks && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
            <ListTodo className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có dữ liệu thống kê
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Toàn bộ số liệu sẽ được cập nhật tự động ngay khi bạn tạo và hoàn thành các công việc đầu tiên.
          </p>
          {onOpenNewTask && (
            <button
              onClick={onOpenNewTask}
              className="mt-3.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo công việc đầu tiên</span>
            </button>
          )}
        </div>
      )}

      {/* Phân bổ theo danh mục */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Phân bổ theo danh mục</span>
        </h3>

        {!hasTasks ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Chưa có công việc nào trong các danh mục.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const catTasks = tasks.filter((t) => t.categoryId === cat.id);
              const catCompleted = catTasks.filter((t) => t.completed).length;
              const percentage = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0;

              if (catTasks.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {catCompleted}/{catTasks.length} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: cat.color 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Focus Timer (Pomodoro 25 phút) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Đồng hồ Tập trung (Focus 25)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-xs">
          Rèn luyện sự tập trung hoàn thành công việc không bị xao nhãng
        </p>

        {/* Màn hình hiển thị số đếm ngược điện tử */}
        <div className="text-4xl font-extrabold font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-nums my-1">
          {formatTimer(pomodoroSeconds)}
        </div>

        {/* Nút điều khiển Timer */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isTimerRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isTimerRunning ? 'Tạm dừng' : 'Bắt đầu tập trung'}</span>
          </button>

          <button
            onClick={resetTimer}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Đặt lại 25 phút"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
