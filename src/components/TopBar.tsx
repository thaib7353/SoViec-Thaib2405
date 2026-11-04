import React from 'react';
import { 
  CheckCircle2, 
  Search, 
  Sun, 
  Moon, 
  Download, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { PriorityLevel, ViewTab } from '../types';

interface TopBarProps {
  currentTab: ViewTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: PriorityLevel | 'all';
  onPriorityFilterChange: (p: PriorityLevel | 'all') => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onOpenApkModal: () => void;
  onOpenSettings: () => void;
  isInstallable: boolean;
  onInstallApp: () => void;
}

const TAB_TITLES: Record<ViewTab, string> = {
  today: 'Hôm nay',
  upcoming: 'Sắp tới',
  all: 'Tất cả công việc',
  completed: 'Đã hoàn thành',
  calendar: 'Lịch biểu',
  categories: 'Danh mục',
  stats: 'Thống kê & Tập trung',
  settings: 'Cài đặt',
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  theme,
  onToggleTheme,
  onOpenApkModal,
  onOpenSettings,
  isInstallable,
  onInstallApp,
}) => {
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 transition-colors">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Zone 1: Brand & View Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate tracking-tight">
              {TAB_TITLES[currentTab]}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Sổ Việc Android
            </p>
          </div>
        </div>

        {/* Zone 2 & 3: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              showSearch || searchQuery 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Tìm kiếm công việc"
            aria-label="Tìm kiếm công việc"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Android APK / PWA Export CTA */}
          <button
            onClick={isInstallable ? onInstallApp : onOpenApkModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Cài đặt lên Android hoặc xuất file APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Cài APK</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Chuyển chế độ giao diện"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cài đặt âm thanh & dữ liệu"
            aria-label="Cài đặt"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Search & Priority Filter Strip */}
      {showSearch && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo tên hoặc ghi chú..."
              className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Ưu tiên:</span>
            <button
              onClick={() => onPriorityFilterChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                priorityFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => onPriorityFilterChange('p1')}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                priorityFilter === 'p1'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Cao (P1)
            </button>
            <button
              onClick={() => onPriorityFilterChange('p2')}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                priorityFilter === 'p2'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Trung bình (P2)
            </button>
            <button
              onClick={() => onPriorityFilterChange('p3')}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                priorityFilter === 'p3'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-blue-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Thấp (P3)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
