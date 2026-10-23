import { useState } from 'react'
import { useTerminal } from '../store/useTerminal'
import type { Side } from '../types'

const QUICK = [0.01, 0.1, 1]

export function OrderForm() {
  const symbol = useTerminal((s) => s.selected)
  const price = useTerminal((s) => s.prices[symbol]?.price)
  const placeOrder = useTerminal((s) => s.placeOrder)
  const [side, setSide] = useState<Side>('BUY')
  const [qty, setQty] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string; id: number } | null>(null)

  const q = parseFloat(qty)
  const notional = price && q > 0 ? price * q : null

  const submit = () => {
    const err = placeOrder(symbol, side, q)
    if (err) {
      setMsg({ ok: false, text: err, id: Date.now() })
      return
    }
    setMsg({
      ok: true,
      text: `Filled: ${side} ${q} ${symbol} @ ${price?.toLocaleString()}`,
      id: Date.now(),
    })
    setQty('')
  }

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Paper order · Market
      </h2>

      <p className="mb-3 text-sm text-slate-300">
        {symbol}{' '}
        <span className="num ml-1 font-semibold text-white">{price?.toLocaleString() ?? '…'}</span>
      </p>

      <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-900/80 p-1 text-sm font-semibold">
        {(['BUY', 'SELL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-md py-1.5 transition ${
              side === s
                ? s === 'BUY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
                : 'text-slate-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <input
        type="number"
        min="0"
        step="any"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Quantity"
        className="num w-full rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
      />

      <div className="mt-2 flex items-center gap-2">
        {QUICK.map((v) => (
          <button
            key={v}
            onClick={() => setQty(String(v))}
            className="num rounded-md border border-slate-700/60 px-2 py-0.5 text-xs text-slate-400 hover:text-white"
          >
            {v}
          </button>
        ))}
        {notional && (
          <span className="num ml-auto text-xs text-slate-500">
            ≈ ${notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {msg && (
        <p
          key={msg.id}
          role="alert"
          className={`pop mt-3 text-xs ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {msg.text}
        </p>
      )}

      <button
        onClick={submit}
        className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold ${
          side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
        }`}
      >
        {side} {symbol.replace(/USDT$/, '')}
      </button>
    </section>
  )
}