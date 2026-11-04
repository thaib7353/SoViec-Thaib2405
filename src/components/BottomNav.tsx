import React from 'react';
import { 
  CheckSquare, 
  CalendarDays, 
  Calendar, 
  FolderKanban, 
  BarChart3,
  Plus
} from 'lucide-react';
import { ViewTab } from '../types';

interface BottomNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenNewTask: () => void;
  todayCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTask,
  todayCount,
}) => {
  const tabs = [
    {
      id: 'today' as ViewTab,
      label: 'Hôm nay',
      icon: CheckSquare,
      badge: todayCount > 0 ? todayCount : null,
    },
    {
      id: 'upcoming' as ViewTab,
      label: 'Sắp tới',
      icon: CalendarDays,
    },
    {
      id: 'calendar' as ViewTab,
      label: 'Lịch',
      icon: Calendar,
    },
    {
      id: 'categories' as ViewTab,
      label: 'Danh mục',
      icon: FolderKanban,
    },
    {
      id: 'stats' as ViewTab,
      label: 'Thống kê',
      icon: BarChart3,
    },
  ];

  return (
    <div className="relative shrink-0 z-30">
      {/* Floating Action Button (FAB) - Nút dấu cộng nổi có khoảng cách an toàn với thanh điều hướng */}
      <div className="absolute bottom-full mb-3.5 right-4 sm:right-6 z-40 pointer-events-auto">
        <button
          onClick={onOpenNewTask}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xl shadow-blue-600/35 flex items-center justify-center transition-all cursor-pointer group border border-white/20 dark:border-blue-400/20"
          title="Tạo công việc mới (Phím tắt: +)"
          aria-label="Thêm công việc mới"
        >
          <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Bottom Bar Container với hỗ trợ Android Safe Area cho phím điều hướng hệ thống / thanh cử chỉ */}
      <nav 
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1 transition-colors"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[46px] min-w-[56px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors relative cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{tab.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
