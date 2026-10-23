import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, Position, Side, Status, Tick } from '../types'
import { applyFill } from '../lib/trading'

interface State {
  watchlist: string[]
  selected: string
  prices: Record<string, Tick>
  status: Status
  positions: Record<string, Position>
  orders: Order[]
  realizedPnl: number
  addSymbol: (s: string) => void
  removeSymbol: (s: string) => void
  select: (s: string) => void
  applyTicks: (ticks: Tick[]) => void
  setStatus: (s: Status) => void
  placeOrder: (symbol: string, side: Side, qty: number) => string | null // returns error msg
}

export const useTerminal = create<State>()(
  persist(
    (set, get) => ({
      watchlist: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
      selected: 'BTCUSDT',
      prices: {},
      status: 'connecting',
      positions: {},
      orders: [],
      realizedPnl: 0,

      addSymbol: (s) => set((st) => (st.watchlist.includes(s) ? st : { watchlist: [...st.watchlist, s] })),
      removeSymbol: (s) => set((st) => ({ watchlist: st.watchlist.filter((x) => x !== s) })),
      select: (s) => set({ selected: s }),
      setStatus: (status) => set({ status }),

      applyTicks: (ticks) =>
        set((st) => {
          const prices = { ...st.prices }
          for (const t of ticks) prices[t.symbol] = t
          return { prices }
        }),

      placeOrder: (symbol, side, qty) => {
        if (!Number.isFinite(qty) || qty <= 0) return 'Enter a valid quantity'
        const tick = get().prices[symbol]
        if (!tick) return 'No live price yet'
        const st = get()
        const { position, realized } = applyFill(symbol, st.positions[symbol], side, qty, tick.price)
        const positions = { ...st.positions }
        if (position) positions[symbol] = position
        else delete positions[symbol]
        const order: Order = { id: crypto.randomUUID(), symbol, side, qty, price: tick.price, time: Date.now() }
        set({ positions, realizedPnl: st.realizedPnl + realized, orders: [order, ...st.orders].slice(0, 50) })
        return null
      },
    }),
    {
      name: 'mini-terminal',
      partialize: (s) => ({
        watchlist: s.watchlist, selected: s.selected,
        positions: s.positions, orders: s.orders, realizedPnl: s.realizedPnl,
      }),
    },
  ),
)