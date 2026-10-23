import type { Position, Side } from '../types'

export function applyFill(
  symbol: string, pos: Position | undefined, side: Side, qty: number, price: number,
): { position: Position | null; realized: number } {
  const delta = side === 'BUY' ? qty : -qty
  if (!pos || pos.qty === 0) return { position: { symbol, qty: delta, avgPrice: price }, realized: 0 }

  // Adding to the same direction: weighted average price
  if (Math.sign(pos.qty) === Math.sign(delta)) {
    const total = pos.qty + delta
    const avg = (pos.avgPrice * Math.abs(pos.qty) + price * Math.abs(delta)) / Math.abs(total)
    return { position: { symbol, qty: total, avgPrice: avg }, realized: 0 }
  }

  // Reducing / closing / flipping
  const closed = Math.min(Math.abs(pos.qty), Math.abs(delta))
  const realized = closed * (price - pos.avgPrice) * Math.sign(pos.qty)
  const newQty = pos.qty + delta
  if (Math.abs(newQty) < 1e-12) return { position: null, realized }
  if (Math.sign(newQty) === Math.sign(pos.qty)) return { position: { ...pos, qty: newQty }, realized }
  return { position: { symbol, qty: newQty, avgPrice: price }, realized } // flipped
}

export const unrealizedPnl = (pos: Position, price: number) => (price - pos.avgPrice) * pos.qty