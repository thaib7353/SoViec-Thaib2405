import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  FolderKanban, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  AlertCircle,
  Bell,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppSettings, Category, PriorityLevel, Task, ViewTab } from './types';
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_SETTINGS, 
  getCurrentTimeString, 
  getDefaultTasks, 
  getTodayString, 
  getTomorrowString, 
  loadCategories, 
  loadSettings, 
  loadTasks, 
  saveCategories, 
  saveSettings, 
  saveTasks 
} from './utils/storage';
import { storageAdapter } from './adapters/storageAdapter';
import { notificationAdapter } from './adapters/notificationAdapter';
import { audioManager } from './utils/audioAlarm';
import { showTaskNotification, triggerVibration } from './utils/notifications';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useOnlineStatus } from './hooks/useOnlineStatus';

import { AndroidFrame } from './components/AndroidFrame';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { TaskItem } from './components/TaskItem';
import { TaskEditorModal } from './components/TaskEditorModal';
import { AlarmModal } from './components/AlarmModal';
import { CalendarView } from './components/CalendarView';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ApkExportModal } from './components/ApkExportModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsView } from './components/StatsView';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentTab, setCurrentTab] = useState<ViewTab>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialTaskDate, setInitialTaskDate] = useState<string | null>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Active ringing alarm
  const [ringingTask, setRingingTask] = useState<Task | null>(null);

  // Completed section accordion toggle
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  // Quick add input state
  const [quickTitle, setQuickTitle] = useState('');

  const { isInstallable, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Khởi tạo chuyển đổi dữ liệu an toàn sang Android Preferences khi chạy Native
  useEffect(() => {
    storageAdapter.initStorageMigration();
  }, []);

  // Save changes automatically (Lưu đồng thời vào LocalStorage và Android SharedPreferences)
  useEffect(() => {
    storageAdapter.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storageAdapter.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storageAdapter.saveSettings(settings);
  }, [settings]);

  // Sync theme with HTML class
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Toggle Theme helper
  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Toggle View Mode helper (phone frame vs fullscreen)
  const handleToggleViewMode = () => {
    setSettings((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'phone' ? 'fullscreen' : 'phone',
    }));
  };

  // Background Alarm Checker: checks every 10 seconds for tasks due with reminder enabled
  useEffect(() => {
    const checkAlarms = () => {
      if (ringingTask) return; // Already ringing

      const today = getTodayString();
      const nowTime = getCurrentTimeString();
      const nowIso = new Date().toISOString();

      tasks.forEach((t) => {
        if (t.completed || !t.reminder.enabled) return;

        let shouldTrigger = false;

        // Check if snoozedUntil has elapsed
        if (t.reminder.snoozedUntil) {
          if (new Date(t.reminder.snoozedUntil) <= new Date()) {
            shouldTrigger = true;
          }
        } else if (!t.reminder.alarmTriggered && t.dueDate && t.dueTime) {
          // Check standard due date & time match
          if (t.dueDate === today && t.dueTime <= nowTime) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          // Start the alarm!
          if (settings.soundEnabled) {
            audioManager.startContinuousAlarm(settings.ringtone, settings.volume);
          }
          if (settings.vibrationEnabled) {
            triggerVibration([500, 200, 500, 200, 800]);
          }

          showTaskNotification(t, (action) => {
            if (action === 'complete') {
              handleToggleComplete(t.id);
            } else {
              handleSnooze(t.id, 5);
            }
          });

          setRingingTask(t);

          // Update task flag
          setTasks((prev) =>
            prev.map((item) =>
              item.id === t.id
                ? {
                    ...item,
                    reminder: {
                      ...item.reminder,
                      alarmTriggered: true,
                      snoozedUntil: null,
                    },
                  }
                : item
            )
          );
        }
      });
    };

    const interval = setInterval(checkAlarms, 10000);
    checkAlarms(); // Check immediately on mount
    return () => clearInterval(interval);
  }, [tasks, ringingTask, settings]);

  // Manually test alarm sound on a specific task
  const handleTriggerAlarmNow = useCallback((task: Task) => {
    if (settings.soundEnabled) {
      audioManager.startContinuousAlarm(settings.ringtone, settings.volume);
    }
    if (settings.vibrationEnabled) {
      triggerVibration([500, 200, 500, 200, 800]);
    }
    showTaskNotification(task);
    setRingingTask(task);
  }, [settings]);

  // Alarm action: Dismiss
  const handleDismissAlarm = useCallback(() => {
    audioManager.stopAlarm();
    setRingingTask(null);
  }, []);

  // Alarm action: Snooze
  const handleSnooze = useCallback((taskId: string, minutes: number = 10) => {
    audioManager.stopAlarm();
    setRingingTask(null);
    const snoozeDateObj = new Date(Date.now() + minutes * 60 * 1000);
    const snoozeDate = snoozeDateObj.toISOString();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            reminder: {
              ...t.reminder,
              alarmTriggered: false,
              snoozedUntil: snoozeDate,
            },
          };
          notificationAdapter.scheduleTaskReminder(updated, snoozeDateObj);
          return updated;
        }
        return t;
      })
    );
  }, []);

  // Task CRUD handlers
  const handleToggleComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newCompleted = !t.completed;
          const updated = {
            ...t,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
            reminder: {
              ...t.reminder,
              alarmTriggered: newCompleted ? false : t.reminder.alarmTriggered,
            },
          };
          if (newCompleted) {
            notificationAdapter.cancelTaskReminder(taskId);
          } else if (updated.reminder?.enabled) {
            notificationAdapter.scheduleTaskReminder(updated);
          }
          return updated;
        }
        return t;
      })
    );
  }, []);

  // Giai đoạn 2A: Khởi tạo Notification Channel, Heads-up Notification, xin quyền và đồng bộ lịch nhắc
  useEffect(() => {
    notificationAdapter.init().then(() => {
      // Tự động kiểm tra và yêu cầu quyền POST_NOTIFICATIONS trên Android 13+ khi mở app
      notificationAdapter.checkPermission().then((status) => {
        if (status === 'prompt') {
          notificationAdapter.requestPermission();
        }
      });

      // Đăng ký lịch nhắc nhở vào Android AlarmManager cho các việc chưa hoàn thành
      tasks.forEach((t) => {
        if (!t.completed && t.reminder?.enabled) {
          notificationAdapter.scheduleTaskReminder(t);
        }
      });
    });

    const unsubscribe = notificationAdapter.onActionPerformed((actionId, taskId) => {
      if (actionId === 'complete') {
        handleToggleComplete(taskId);
        handleDismissAlarm();
      } else if (actionId === 'snooze') {
        handleSnooze(taskId, 10); // Hoãn 10 phút theo yêu cầu Giai đoạn 2A
      }
    });

    return () => {
      unsubscribe();
    };
  }, [handleToggleComplete, handleDismissAlarm, handleSnooze]);

  const handleSaveTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskData.id) {
            const updated = {
              ...t,
              ...taskData,
            };
            if (updated.reminder?.enabled && !updated.completed) {
              notificationAdapter.scheduleTaskReminder(updated);
            } else {
              notificationAdapter.cancelTaskReminder(updated.id);
            }
            return updated;
          }
          return t;
        })
      );
    } else {
      // Create new
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        ...taskData,
      };
      if (newTask.reminder?.enabled && !newTask.completed) {
        notificationAdapter.scheduleTaskReminder(newTask);
      }
      setTasks((prev) => [newTask, ...prev]);
    }
    setEditingTask(null);
    setIsEditorOpen(false);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    notificationAdapter.cancelTaskReminder(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (editingTask?.id === taskId) {
      setEditingTask(null);
      setIsEditorOpen(false);
    }
    if (ringingTask?.id === taskId) {
      handleDismissAlarm();
    }
  }, [editingTask, ringingTask, handleDismissAlarm]);

  // Quick Add task from input bar
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const today = getTodayString();
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: quickTitle.trim(),
      notes: '',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: currentTab === 'upcoming' ? getTomorrowString() : today,
      dueTime: '17:00',
      priority: priorityFilter !== 'all' ? priorityFilter : 'p2',
      categoryId: selectedCategoryFilter || 'work',
      subtasks: [],
      reminder: {
        enabled: true,
        alarmTriggered: false,
        snoozedUntil: null,
      },
    };

    notificationAdapter.scheduleTaskReminder(newTask);
    setTasks((prev) => [newTask, ...prev]);
    setQuickTitle('');
  };

  // Category handlers
  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      ...catData,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    // Move tasks in deleted category to 'inbox'
    setTasks((prev) =>
      prev.map((t) => (t.categoryId === catId ? { ...t, categoryId: 'inbox' } : t))
    );
    if (selectedCategoryFilter === catId) {
      setSelectedCategoryFilter(null);
    }
  };

  // Reset data to defaults
  const handleResetData = () => {
    const defaults = getDefaultTasks();
    setTasks(defaults);
    setCategories(DEFAULT_CATEGORIES);
    saveTasks(defaults);
    saveCategories(DEFAULT_CATEGORIES);
  };

  // Filter tasks based on search, priority, category
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = t.notes.toLowerCase().includes(q);
        const matchesSubtasks = t.subtasks.some((s) => s.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNotes && !matchesSubtasks) return false;
      }
      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }
      // Category
      if (selectedCategoryFilter && t.categoryId !== selectedCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, selectedCategoryFilter]);

  const todayStr = getTodayString();
  const tomorrowStr = getTomorrowString();

  // Tasks grouped for Today view
  const todayTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.completed && (t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr)));
  }, [filteredTasks, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.completed);
  }, [filteredTasks]);

  // Tasks grouped for Upcoming view
  const upcomingTomorrowTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.completed && t.dueDate === tomorrowStr);
  }, [filteredTasks, tomorrowStr]);

  const upcomingFutureTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.completed && t.dueDate && t.dueDate > tomorrowStr);
  }, [filteredTasks, tomorrowStr]);

  const upcomingNoDateTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.completed && !t.dueDate);
  }, [filteredTasks]);

  // Render main content area based on current tab
  const renderContent = () => {
    if (currentTab === 'calendar') {
      return (
        <CalendarView
          tasks={filteredTasks}
          categories={categories}
          onToggleComplete={handleToggleComplete}
          onEditTask={(task) => {
            setEditingTask(task);
            setIsEditorOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onTriggerAlarmNow={handleTriggerAlarmNow}
          onAddNewTaskForDate={(dateStr) => {
            setEditingTask(null);
            setInitialTaskDate(dateStr);
            setIsEditorOpen(true);
          }}
        />
      );
    }

    if (currentTab === 'stats') {
      return (
        <StatsView 
          tasks={tasks} 
          categories={categories} 
          onOpenNewTask={() => {
            setEditingTask(null);
            setInitialTaskDate(todayStr);
            setIsEditorOpen(true);
          }}
        />
      );
    }

    if (currentTab === 'categories') {
      return (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-40 space-y-3 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Danh mục công việc
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lọc công việc theo từng khía cạnh cuộc sống
              </p>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Quản lý</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const catTasks = tasks.filter((t) => t.categoryId === cat.id);
              const activeCount = catTasks.filter((t) => !t.completed).length;
              const isSelected = selectedCategoryFilter === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryFilter(isSelected ? null : cat.id);
                    setCurrentTab('all');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeCount} việc
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {catTasks.length} tổng số việc
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Task List views: Today, Upcoming, All, Completed
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-40 space-y-4 bg-slate-50 dark:bg-slate-950">
        {/* Active Category Filter Banner (if selected) */}
        {selectedCategoryFilter && (
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-900 dark:text-blue-300">
                Đang lọc theo danh mục:
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-400">
                {categories.find((c) => c.id === selectedCategoryFilter)?.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Bỏ lọc
            </button>
          </div>
        )}

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickAdd} className="relative flex items-center">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="+ Thêm nhanh công việc rồi nhấn Enter..."
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="absolute right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer"
            title="Thêm công việc"
          >
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* View Mode: Today */}
        {currentTab === 'today' && (
          <div className="space-y-4">
            {/* Overdue alert if any */}
            {todayTasks.filter((t) => t.dueDate && t.dueDate < todayStr).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Quá hạn cần hoàn thành gấp</span>
                </div>
                <div className="space-y-2">
                  {todayTasks
                    .filter((t) => t.dueDate && t.dueDate < todayStr)
                    .map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        category={categories.find((c) => c.id === task.categoryId)}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setIsEditorOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onTriggerAlarmNow={handleTriggerAlarmNow}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Tasks Due Today */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                <span>Hôm nay ({todayTasks.filter((t) => t.dueDate === todayStr).length})</span>
                <span className="text-[11px]">{todayStr}</span>
              </div>

              {todayTasks.filter((t) => t.dueDate === todayStr).length === 0 && todayTasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {tasks.length === 0 ? 'Chưa có công việc nào' : 'Tất cả công việc hôm nay đã xong!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    {tasks.length === 0 
                      ? 'Nhập vào ô ở trên hoặc bấm nút dấu cộng (+) để bắt đầu lên lịch công việc đầu tiên!'
                      : 'Hãy nghỉ ngơi hoặc bấm dấu (+) để thêm việc cần hoàn thành.'}
                  </p>
                </div>
              ) : (
                todayTasks
                  .filter((t) => t.dueDate === todayStr)
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      category={categories.find((c) => c.id === task.categoryId)}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteTask}
                      onTriggerAlarmNow={handleTriggerAlarmNow}
                    />
                  ))
              )}
            </div>

            {/* Accordion for Completed Tasks */}
            {completedTodayTasks.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompletedSection(!showCompletedSection)}
                  className="flex items-center justify-between w-full p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Đã hoàn thành ({completedTodayTasks.length})</span>
                  </span>
                  {showCompletedSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showCompletedSection && (
                  <div className="space-y-2 mt-2 pl-1">
                    {completedTodayTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        category={categories.find((c) => c.id === task.categoryId)}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setIsEditorOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onTriggerAlarmNow={handleTriggerAlarmNow}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Mode: Upcoming */}
        {currentTab === 'upcoming' && (
          <div className="space-y-4">
            {/* Tomorrow */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block px-1">
                Ngày mai ({upcomingTomorrowTasks.length})
              </span>
              {upcomingTomorrowTasks.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Chưa có công việc nào lên lịch cho ngày mai
                </div>
              ) : (
                upcomingTomorrowTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    category={categories.find((c) => c.id === task.categoryId)}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsEditorOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onTriggerAlarmNow={handleTriggerAlarmNow}
                  />
                ))
              )}
            </div>

            {/* Next 7 days & Future */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block px-1">
                Trong tương lai ({upcomingFutureTasks.length})
              </span>
              {upcomingFutureTasks.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Chưa có công việc tương lai
                </div>
              ) : (
                upcomingFutureTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    category={categories.find((c) => c.id === task.categoryId)}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsEditorOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onTriggerAlarmNow={handleTriggerAlarmNow}
                  />
                ))
              )}
            </div>

            {/* No Date */}
            {upcomingNoDateTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block px-1">
                  Chưa đặt ngày ({upcomingNoDateTasks.length})
                </span>
                {upcomingNoDateTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    category={categories.find((c) => c.id === task.categoryId)}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsEditorOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onTriggerAlarmNow={handleTriggerAlarmNow}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Mode: All Tasks */}
        {currentTab === 'all' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Tất cả công việc ({filteredTasks.length})</span>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {tasks.length === 0 ? 'Chưa có công việc nào trong danh sách' : 'Không tìm thấy công việc phù hợp'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {tasks.length === 0 
                    ? 'Bấm nút dấu cộng (+) ở góc dưới bên phải để bắt đầu thêm công việc.' 
                    : 'Thử xóa bộ lọc tìm kiếm hoặc thay đổi mức độ ưu tiên.'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  category={categories.find((c) => c.id === task.categoryId)}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsEditorOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onTriggerAlarmNow={handleTriggerAlarmNow}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AndroidFrame
      viewMode={settings.viewMode}
      onToggleViewMode={handleToggleViewMode}
    >
      {/* Offline Status Badge */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-[11px] font-semibold py-1 px-4 text-center shrink-0">
          Đang chạy chế độ Ngoại tuyến (Offline). Dữ liệu được lưu trong bộ nhớ máy.
        </div>
      )}

      {/* Main App Top Bar */}
      <TopBar
        currentTab={currentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isInstallable={isInstallable}
        onInstallApp={install}
      />

      {/* Main Content Area */}
      {renderContent()}

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewTask={() => {
          setEditingTask(null);
          setInitialTaskDate(todayStr);
          setIsEditorOpen(true);
        }}
        todayCount={todayTasks.length}
      />

      {/* Task Editor Bottom Sheet / Modal */}
      {isEditorOpen && (
        <TaskEditorModal
          task={editingTask}
          categories={categories}
          initialDate={initialTaskDate}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Ringing Alarm Modal */}
      {ringingTask && (
        <AlarmModal
          task={ringingTask}
          onDismiss={handleDismissAlarm}
          onSnooze={(mins) => handleSnooze(ringingTask.id, mins)}
          onComplete={() => {
            handleToggleComplete(ringingTask.id);
            handleDismissAlarm();
          }}
        />
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          tasks={tasks}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onSelectCategoryFilter={setSelectedCategoryFilter}
          selectedCategoryFilter={selectedCategoryFilter}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}

      {/* APK & Android Installation Modal */}
      {isApkModalOpen && (
        <ApkExportModal onClose={() => setIsApkModalOpen(false)} />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onResetData={handleResetData}
          onRefreshData={() => setTasks(loadTasks())}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </AndroidFrame>
  );
}
