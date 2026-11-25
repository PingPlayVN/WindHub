import { motion } from 'framer-motion';
import { CheckSquare, LayoutGrid, List } from 'lucide-react';
import SortDropdown from '@/components/ui/SortDropdown';
import SearchBar from '@/components/os/SearchBar';
import { SPRING_OS_SNAPPY } from '@/design-system/motion';

export default function FileManagerToolbar({
  TABS,
  activeTab,
  handleTabChange,
  searchTerm,
  setSearchTerm,
  effectiveSort,
  handleLocalSortChange,
  viewMode,
  setViewMode,
  isSelectionMode,
  toggleSelectionMode,
}) {
  return (
    <div className="flex w-full flex-col gap-2.5 lg:flex-row lg:items-center">
      {/* Space Tabs */}
      <div
        role="tablist"
        aria-label="Phân loại không gian tệp"
        className="os-sunken grid w-full shrink-0 grid-cols-4 rounded-[var(--radius-md)] p-1 lg:flex lg:w-auto"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab)}
              className={`os-focus-ring relative min-w-0 flex-1 rounded-[var(--radius-sm)] px-2 sm:px-3.5 py-2 text-center text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'text-[var(--os-accent)]'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  transition={SPRING_OS_SNAPPY}
                  className="pointer-events-none absolute inset-0 rounded-[var(--radius-sm)] border border-[var(--os-accent-border)] bg-[var(--os-surface-1)] shadow-[var(--os-shadow-xs)]"
                />
              )}
              <span className="relative z-10 truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search, Sort & View Controls */}
      <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center min-w-0">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm tệp hoặc thư mục..."
          ariaLabel="Tìm kiếm tệp tin"
          className="w-full sm:flex-1 min-w-0"
        />

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 shrink-0">
          <SortDropdown
            value={effectiveSort}
            onChange={(newValue) => handleLocalSortChange(newValue)}
          />

          <div className="os-sunken flex shrink-0 items-center gap-0.5 rounded-[var(--radius-md)] p-1">
            <button
              type="button"
              onClick={toggleSelectionMode}
              title={isSelectionMode ? 'Thoát chế độ chọn nhiều' : 'Chọn nhiều tệp'}
              className={`os-focus-ring inline-flex h-8.5 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-bold cursor-pointer transition-all ${
                isSelectionMode
                  ? 'bg-[var(--os-accent)] text-[var(--os-accent-fg)] shadow-xs'
                  : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-1)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <CheckSquare size={15} />
              <span>{isSelectionMode ? 'Xong' : 'Chọn'}</span>
            </button>

            <span className="mx-0.5 h-4 w-px bg-[var(--os-border-default)]" aria-hidden="true" />

            <button
              type="button"
              aria-label="Hiển thị dạng lưới"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`os-focus-ring flex size-8.5 items-center justify-center rounded-[var(--radius-sm)] cursor-pointer transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-2xs'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <LayoutGrid size={16} />
            </button>

            <button
              type="button"
              aria-label="Hiển thị dạng danh sách"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`os-focus-ring flex size-8.5 items-center justify-center rounded-[var(--radius-sm)] cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-2xs'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
