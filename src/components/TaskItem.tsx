import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Bell, 
  MoreVertical, 
  CheckSquare, 
  Trash2, 
  Edit3, 
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, PriorityLevel, Task } from '../types';
import { audioManager } from '../utils/audioAlarm';
import { triggerVibration } from '../utils/notifications';
import { getTodayString } from '../utils/storage';

interface TaskItemProps {
  task: Task;
  category?: Category;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTriggerAlarmNow: (task: Task) => void;
}

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; border: string }> = {
  p1: { label: 'Cao', color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500' },
  p2: { label: 'T.Bình', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  p3: { label: 'Thấp', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  none: { label: '', color: 'text-slate-400', border: 'border-slate-300 dark:border-slate-700' },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
  onTriggerAlarmNow,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const today = getTodayString();
  const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
  const isDueToday = task.dueDate === today;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerVibration([50]);
    if (!task.completed) {
      audioManager.playSuccessChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2563EB', '#3B82F6', '#60A5FA', '#10B981'],
        disableForReducedMotion: true,
      });
    }
    onToggleComplete(task.id);
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    if (dateStr === today) return 'Hôm nay';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomStr) return 'Ngày mai';

    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <div 
      onClick={() => onEdit(task)}
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3.5 transition-all shadow-2xs hover:shadow-sm cursor-pointer select-none ${
        task.completed 
          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-75' 
          : isOverdue 
            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10' 
            : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Touch-Friendly Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          aria-label={task.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
          className={`mt-0.5 min-w-[22px] min-h-[22px] w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
            task.completed
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : `${PRIORITY_CONFIG[task.priority].border} hover:bg-slate-100 dark:hover:bg-slate-800`
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Core Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-medium leading-snug truncate ${
              task.completed 
                ? 'line-through text-slate-400 dark:text-slate-500' 
                : 'text-slate-900 dark:text-slate-100 font-semibold'
            }`}>
              {task.title}
            </h3>

            {/* Quick 3-Dots Menu Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Tùy chọn thao tác"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Context Dropdown */}
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }} 
                  />
                  <div className="absolute right-0 top-8 z-40 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onTriggerAlarmNow(task);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Thử chuông ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit(task);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa công việc</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Preview (if any) */}
          {task.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {task.notes}
            </p>
          )}

          {/* Metadata Row: Due Date, Time, Reminder, Subtasks, Category */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {/* Due Date & Time */}
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 font-medium ${
                isOverdue 
                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                  : isDueToday 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate(task.dueDate)}</span>
                {task.dueTime && (
                  <>
                    <Clock className="w-3 h-3 ml-0.5" />
                    <span>{task.dueTime}</span>
                  </>
                )}
              </span>
            )}

            {/* Reminder Bell Indicator */}
            {task.reminder?.enabled && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400" title="Báo thức liên tục bật">
                <Bell className="w-3 h-3 fill-amber-500/20" />
                <span>Báo thức</span>
              </span>
            )}

            {/* Subtasks Progress */}
            {task.subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <CheckSquare className="w-3 h-3" />
                <span>{completedSubtasks}/{task.subtasks.length}</span>
              </span>
            )}

            {/* Category Tag */}
            {category && (
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: category.color }} 
                />
                <span>{category.name}</span>
              </span>
            )}

            {/* Priority Indicator Label if P1 or P2 */}
            {task.priority === 'p1' && (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Ưu tiên cao
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
