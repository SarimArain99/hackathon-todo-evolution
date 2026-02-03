/**
 * Task List State Hook
 *
 * Zustand store for managing task list state:
 * - Sort preferences (persisted to localStorage)
 * - Filter presets
 * - Custom date ranges
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SortField = "due_date" | "priority" | "created_at" | "title";
export type SortOrder = "asc" | "desc";
export type PresetFilter = null | "today" | "this_week" | "this_month";

interface TaskListState {
  sortBy: SortField;
  sortOrder: SortOrder;
  presetFilter: PresetFilter;
  filterStart: string | null;
  filterEnd: string | null;
  setSortBy: (value: SortField) => void;
  setSortOrder: (value: SortOrder) => void;
  setPresetFilter: (value: PresetFilter) => void;
  setCustomDateRange: (start: string | null, end: string | null) => void;
  clearFilters: () => void;
}

export const useTaskList = create<TaskListState>()(
  persist(
    (set) => ({
      sortBy: "created_at",
      sortOrder: "desc",
      presetFilter: null,
      filterStart: null,
      filterEnd: null,
      setSortBy: (value) => set({ sortBy: value }),
      setSortOrder: (value) => set({ sortOrder: value }),
      setPresetFilter: (value) => {
        set({ presetFilter: value, filterStart: null, filterEnd: null });
      },
      setCustomDateRange: (start, end) => {
        set({ filterStart: start, filterEnd: end, presetFilter: null });
      },
      clearFilters: () => {
        set({ presetFilter: null, filterStart: null, filterEnd: null });
      },
    }),
    {
      name: "task-list-storage",
      partialize: (state) => ({
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
