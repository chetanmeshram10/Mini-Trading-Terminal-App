import { useState } from 'react'
import { useTerminal } from '../store/useTerminal'
import { unrealizedPnl } from '../lib/trading'

const pnlColor = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-slate-300')
const th = 'pb-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500'

export function Positions() {
  const positions = useTerminal((s) => s.positions)
  const prices = useTerminal((s) => s.prices)
  const orders = useTerminal((s) => s.orders)
  const [tab, setTab] = useState<'positions' | 'orders'>('positions')
  const list = Object.values(positions)

  return (
    <section className="card p-4">
      <div className="mb-3 flex gap-4 text-sm">
        {(['positions', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`border-b-2 pb-1 font-semibold capitalize ${tab === t ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'positions' ? (
        <table className="w-full text-sm">
          <thead><tr><th className={th}>Symbol</th><th className={th}>Qty</th><th className={th}>Avg</th><th className={th}>LTP</th><th className={`${th} text-right`}>P&amp;L</th></tr></thead>
          <tbody>
            {list.map((p) => {
              const ltp = prices[p.symbol]?.price ?? p.avgPrice
              const pnl = unrealizedPnl(p, ltp)
              return (
                <tr key={p.symbol} className="num border-t border-slate-800">
                  <td className="py-2 font-sans font-semibold">{p.symbol}</td>
                  <td className={p.qty < 0 ? 'text-rose-400' : ''}>{p.qty}</td>
                  <td>{p.avgPrice.toFixed(2)}</td><td>{ltp.toFixed(2)}</td>
                  <td className={`text-right ${pnlColor(pnl)}`}>{pnl.toFixed(2)}</td>
                </tr>
              )
            })}
            {!list.length && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No open positions. Place a paper order to get started.</td></tr>}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-sm">
          <thead><tr><th className={th}>Time</th><th className={th}>Side</th><th className={th}>Symbol</th><th className={th}>Qty</th><th className={`${th} text-right`}>Price</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="num border-t border-slate-800">
                <td className="py-2">{new Date(o.time).toLocaleTimeString()}</td>
                <td className={o.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{o.side}</td>
                <td className="font-sans">{o.symbol}</td><td>{o.qty}</td>
                <td className="text-right">{o.price.toFixed(2)}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No orders yet</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  )
}