import { create } from 'zustand'

export const useVocabStore = create((set) => ({
  session: null,

  startSession: (session) => set({ session }),

  clearSession: () => set({ session: null }),

  updateSession: (patch) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...patch } : null,
    })),
}))
