import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2 
} from 'lucide-react';
import { Category, Task } from '../types';
import { TaskItem } from './TaskItem';
import { getTodayString } from '../utils/storage';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTriggerAlarmNow: (task: Task) => void;
  onAddNewTaskForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  categories,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onTriggerAlarmNow,
  onAddNewTaskForDate,
}) => {
  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setCurrentMonthDate(now);
    setSelectedDate(todayStr);
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Convert Sunday=0 to Monday=0 (Vietnamese calendar starts with Thứ 2)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Days array
  const calendarCells: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const padMonth = month === 0 ? 12 : month;
    const padYear = month === 0 ? year - 1 : year;
    const dateStr = `${padYear}-${String(padMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Next month padding days to fill 35 or 42 grid
  const remainingCells = 35 - calendarCells.length;
  if (remainingCells > 0) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextM = month + 2 > 12 ? 1 : month + 2;
      const nextY = month + 2 > 12 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      calendarCells.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }
  }

  // Tasks mapped by date
  const tasksByDate = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Tasks for selected date
  const selectedDateTasks = tasksByDate[selectedDate] || [];

  const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const formatDisplayDate = (dStr: string) => {
    if (dStr === todayStr) return 'Hôm nay';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Month Header Controller */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
            Tháng {month + 1} năm {year}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Chọn ngày để xem & lên lịch
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayHeaders.map((dh, i) => (
            <div 
              key={dh} 
              className={`text-[11px] font-bold py-1 ${i >= 5 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {dh}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayStr;
            const dayTasks = tasksByDate[cell.dateStr] || [];
            const hasTasks = dayTasks.length > 0;
            const hasOverdueOrP1 = dayTasks.some((t) => !t.completed && t.priority === 'p1');

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`h-11 rounded-xl flex flex-col items-center justify-center p-1 transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : isToday
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800'
                      : cell.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-300 dark:text-slate-700'
                }`}
              >
                <span className="text-xs leading-none">{cell.dayNum}</span>

                {/* Task Dots Marker */}
                {hasTasks && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <span 
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected 
                          ? 'bg-white' 
                          : hasOverdueOrP1 
                            ? 'bg-rose-500' 
                            : 'bg-blue-500'
                      }`} 
                    />
                    {dayTasks.length > 1 && (
                      <span 
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-blue-200' : 'bg-slate-400'
                        }`} 
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Task List Feed */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {formatDisplayDate(selectedDate)}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({selectedDateTasks.length} việc)
            </span>
          </div>

          <button
            onClick={() => onAddNewTaskForDate(selectedDate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm việc</span>
          </button>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Không có việc nào trong ngày này
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Tận hưởng thời gian nghỉ ngơi hoặc bấm Thêm việc để lên kế hoạch trước!
            </p>
            <button
              onClick={() => onAddNewTaskForDate(selectedDate)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              + Tạo công việc cho ngày này
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map((task) => {
              const cat = categories.find((c) => c.id === task.categoryId);
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  category={cat}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onTriggerAlarmNow={onTriggerAlarmNow}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
