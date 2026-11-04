import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Bell, 
  Plus, 
  Trash2, 
  Check, 
  CheckSquare
} from 'lucide-react';
import { Category, PriorityLevel, Subtask, Task } from '../types';
import { getCurrentTimeString, getTodayString, getTomorrowString } from '../utils/storage';

interface TaskEditorModalProps {
  task: Task | null; // null means new task
  categories: Category[];
  initialDate?: string | null;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  task,
  categories,
  initialDate,
  onSave,
  onDelete,
  onClose,
}) => {
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [priority, setPriority] = useState<PriorityLevel>(task?.priority || 'none');
  const [categoryId, setCategoryId] = useState<string>(task?.categoryId || categories[0]?.id || 'work');
  const [dueDate, setDueDate] = useState<string | null>(task ? task.dueDate : (initialDate || today));
  const [dueTime, setDueTime] = useState<string | null>(task?.dueTime || '09:00');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(task ? task.reminder.enabled : true);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [error, setError] = useState('');

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
      return;
    }

    onSave({
      id: task?.id,
      title: title.trim(),
      notes: notes.trim(),
      completed: task ? task.completed : false,
      completedAt: task?.completedAt,
      dueDate,
      dueTime: dueDate ? dueTime : null,
      priority,
      categoryId,
      subtasks,
      reminder: {
        enabled: Boolean(reminderEnabled && dueDate),
        alarmTriggered: false,
        snoozedUntil: null,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in fade-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {task ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: Nộp báo cáo tài chính quý..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              autoFocus
            />
          </div>

          {/* Notes textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú chi tiết
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thêm hướng dẫn, địa điểm hoặc link tài liệu..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mức độ ưu tiên
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPriority('p1')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  priority === 'p1'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Cao (P1)</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('p2')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  priority === 'p2'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>T.Bình (P2)</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('p3')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  priority === 'p3'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Thấp (P3)</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('none')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  priority === 'none'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Không</span>
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Danh mục phân loại
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Thời hạn hoàn thành</span>
              </span>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDueDate(today)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    dueDate === today 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(tomorrow)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    dueDate === tomorrow 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Ngày mai
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate(null)}
                    className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Xóa ngày
                  </button>
                )}
              </div>
            </div>

            {/* Custom Date & Time Inputs */}
            {dueDate && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Giờ đến hạn
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={dueTime || ''}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Continuous Alarm Switch */}
            {dueDate && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Chuông báo thức liên tục
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Reo chuông và rung cho đến khi tắt hoặc hoãn
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Danh sách bước con (Checklist)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length}
              </span>
            </div>

            {/* Existing subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        st.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-400 hover:border-blue-500'
                      }`}
                    >
                      {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className={`flex-1 truncate ${st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new subtask */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Thêm bước thực hiện..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 rounded-b-3xl">
          {task && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa công việc này?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="p-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Xóa công việc"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{task ? 'Lưu thay đổi' : 'Tạo công việc'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
