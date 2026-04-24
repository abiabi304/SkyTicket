'use client'

import { create } from 'zustand'
import type { SeatClass } from '@/lib/types'

interface SearchState {
  from: string
  to: string
  departureDate: Date
  passengers: number
  seatClass: SeatClass
  setFrom: (from: string) => void
  setTo: (to: string) => void
  swapAirports: () => void
  setDepartureDate: (date: Date) => void
  setPassengers: (count: number) => void
  setSeatClass: (seatClass: SeatClass) => void
  reset: () => void
}

const initialState = {
  from: '',
  to: '',
  departureDate: new Date(),
  passengers: 1,
  seatClass: 'economy' as SeatClass,
}

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,
  setFrom: (from) => set({ from }),
  setTo: (to) => set({ to }),
  swapAirports: () =>
    set((state) => ({ from: state.to, to: state.from })),
  setDepartureDate: (departureDate) => set({ departureDate }),
  setPassengers: (passengers) => set({ passengers: Math.min(5, Math.max(1, passengers)) }),
  setSeatClass: (seatClass) => set({ seatClass }),
  reset: () => set(initialState),
}))
