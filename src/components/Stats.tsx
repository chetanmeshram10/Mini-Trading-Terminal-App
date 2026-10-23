import { useTerminal } from '../store/useTerminal'
import { unrealizedPnl } from '../lib/trading'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { delay } from '../lib/motion'

const fmt = (n: number) =>
  (n > 0.005 ? '+' : '') + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const color = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-slate-200')

function Stat({ label, value, pnl, ms }: { label: string; value: number; pnl?: boolean; ms: number }) {
  const v = useAnimatedNumber(value)
  return (
    <div className="card lift reveal px-4 py-3" style={delay(ms)}>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`num mt-1 text-xl font-semibold ${pnl ? color(value) : 'text-slate-100'}`}>
        {pnl ? fmt(v) : Math.round(v)}
      </p>
    </div>
  )
}

export function Stats() {
  const positions = useTerminal((s) => s.positions)
  const prices = useTerminal((s) => s.prices)
  const realized = useTerminal((s) => s.realizedPnl)
  const orderCount = useTerminal((s) => s.orders.length)

  const list = Object.values(positions)
  const unrealized = list.reduce((sum, p) => sum + unrealizedPnl(p, prices[p.symbol]?.price ?? p.avgPrice), 0)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Realized P&L" value={realized} pnl ms={150} />
      <Stat label="Unrealized P&L" value={unrealized} pnl ms={230} />
      <Stat label="Open positions" value={list.length} ms={310} />
      <Stat label="Orders placed" value={orderCount} ms={390} />
    </div>
  )
}