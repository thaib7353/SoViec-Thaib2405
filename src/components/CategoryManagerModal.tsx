import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Briefcase, 
  User, 
  GraduationCap, 
  ShoppingCart, 
  Heart, 
  Home, 
  Star, 
  Coffee, 
  Plane,
  FolderKanban,
  Inbox
} from 'lucide-react';
import { Category, Task } from '../types';

interface CategoryManagerModalProps {
  categories: Category[];
  tasks: Task[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onSelectCategoryFilter: (categoryId: string | null) => void;
  selectedCategoryFilter: string | null;
  onClose: () => void;
}

const AVAILABLE_COLORS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#64748B', // Slate
];

const AVAILABLE_ICONS = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'User', icon: User },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Heart', icon: Heart },
  { name: 'Home', icon: Home },
  { name: 'Star', icon: Star },
  { name: 'Coffee', icon: Coffee },
  { name: 'Plane', icon: Plane },
  { name: 'FolderKanban', icon: FolderKanban },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  tasks,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCategoryFilter,
  selectedCategoryFilter,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState('FolderKanban');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setIsAdding(false);
  };

  const getTaskCount = (catId: string) => {
    const active = tasks.filter((t) => t.categoryId === catId && !t.completed).length;
    const completed = tasks.filter((t) => t.categoryId === catId && t.completed).length;
    return { active, completed };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quản lý danh mục
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick filter by all categories */}
          <button
            onClick={() => {
              onSelectCategoryFilter(null);
              onClose();
            }}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
              selectedCategoryFilter === null
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-700 dark:text-blue-300 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block">Tất cả danh mục</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tasks.filter((t) => !t.completed).length} việc chưa hoàn thành
                </span>
              </div>
            </div>
            {selectedCategoryFilter === null && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Categories List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block px-1">
              Danh sách danh mục hiện có ({categories.length})
            </span>
            {categories.map((cat) => {
              const { active, completed } = getTaskCount(cat.id);
              const isSelected = selectedCategoryFilter === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategoryFilter(cat.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1 text-left cursor-pointer min-w-0"
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {active} đang làm · {completed} đã xong
                      </span>
                    </div>
                  </button>

                  {/* Actions for custom categories */}
                  {!cat.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xóa danh mục "${cat.name}"? Các công việc sẽ chuyển về Hộp thư.`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Category Form / Button */}
          {isAdding ? (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                Tạo danh mục mới
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Dự án A, Thể thao..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  autoFocus
                />
              </div>

              {/* Color selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Màu sắc
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-6 h-6 rounded-full shrink-0 transition-transform cursor-pointer ${
                        newCatColor === color ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
