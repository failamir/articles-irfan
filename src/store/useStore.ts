import { create } from 'zustand'

interface AppState {
  // Global app state
  isMobile: boolean
  setIsMobile: (isMobile: boolean) => void

  // Modal state
  modalPostId: number | null
  setModalPostId: (id: number | null) => void

  // Expansion states
  latestExpanded: boolean
  setLatestExpanded: (expanded: boolean) => void

  categoryExpanded: Record<string, boolean>
  setCategoryExpanded: (categoryId: string, expanded: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),

  modalPostId: null,
  setModalPostId: (modalPostId) => set({ modalPostId }),

  latestExpanded: false,
  setLatestExpanded: (latestExpanded) => set({ latestExpanded }),

  categoryExpanded: {},
  setCategoryExpanded: (categoryId, expanded) =>
    set((state) => ({
      categoryExpanded: {
        ...state.categoryExpanded,
        [categoryId]: expanded,
      },
    })),
}))