import { describe, it, expect } from 'vitest'
import { applyFill } from './trading'

describe('applyFill', () => {
  it('opens a long position', () => {
    const r = applyFill('BTCUSDT', undefined, 'BUY', 1, 100)
    expect(r.position).toEqual({ symbol: 'BTCUSDT', qty: 1, avgPrice: 100 })
  })
  it('averages when adding', () => {
    const r = applyFill('BTCUSDT', { symbol: 'BTCUSDT', qty: 1, avgPrice: 100 }, 'BUY', 1, 200)
    expect(r.position?.avgPrice).toBe(150)
  })
  it('realizes P&L on partial close', () => {
    const r = applyFill('BTCUSDT', { symbol: 'BTCUSDT', qty: 2, avgPrice: 100 }, 'SELL', 1, 130)
    expect(r.realized).toBe(30)
    expect(r.position?.qty).toBe(1)
  })
  it('closes fully', () => {
    const r = applyFill('BTCUSDT', { symbol: 'BTCUSDT', qty: 1, avgPrice: 100 }, 'SELL', 1, 90)
    expect(r.position).toBeNull()
    expect(r.realized).toBe(-10)
  })
  it('flips long to short', () => {
    const r = applyFill('BTCUSDT', { symbol: 'BTCUSDT', qty: 1, avgPrice: 100 }, 'SELL', 3, 110)
    expect(r.position).toEqual({ symbol: 'BTCUSDT', qty: -2, avgPrice: 110 })
    expect(r.realized).toBe(10)
  })
})