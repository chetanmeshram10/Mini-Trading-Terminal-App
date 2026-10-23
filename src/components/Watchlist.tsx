import { memo, useEffect, useRef, useState } from 'react'
import { useTerminal } from '../store/useTerminal'
import { feed } from '../lib/priceFeed'

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-6 w-12 shrink-0" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * 48).toFixed(1)},${(23 - ((v - min) / range) * 22).toFixed(1)}`)
    .join(' ')
  const up = data[data.length - 1] >= data[0]
  return (
    <svg width="48" height="24" viewBox="0 0 48 24" className="shrink-0" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={up ? '#34d399' : '#fb7185'}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const Row = memo(function Row({ symbol }: { symbol: string }) {
  const tick = useTerminal((s) => s.prices[symbol])
  const selected = useTerminal((s) => s.selected === symbol)
  const select = useTerminal((s) => s.select)
  const remove = useTerminal((s) => s.removeSymbol)
  const prev = useRef<number | undefined>(undefined)
  const [flash, setFlash] = useState('')
  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {
    if (!tick) return
    setHistory((h) => [...h.slice(-29), tick.price])
    const p = prev.current
    prev.current = tick.price
    if (p === undefined || p === tick.price) return
    setFlash(tick.price > p ? 'bg-emerald-500/20' : 'bg-rose-500/20')
    const t = setTimeout(() => setFlash(''), 300)
    return () => clearTimeout(t)
  }, [tick])

  const up = (tick?.changePct ?? 0) >= 0
  const base = symbol.replace(/USDT$/, '')

  return (
    <li
      onClick={() => select(symbol)}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors duration-300 ${flash} ${
        selected ? 'border-blue-500/50 bg-blue-500/10' : 'border-transparent hover:bg-slate-800/60'
      }`}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
        {base.slice(0, 3)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{base}<span className="text-slate-500">/USDT</span></p>
        <p className={`num text-xs ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {tick ? `${up ? '▲ +' : '▼ '}${tick.changePct.toFixed(2)}%` : '—'}
        </p>
      </div>
      <Spark data={history} />
      <p className="num w-20 text-right text-sm font-medium">
        {tick ? tick.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '…'}
      </p>
      <button
        aria-label={`Remove ${symbol}`}
        className="text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); remove(symbol); feed.unsubscribe(symbol) }}
      >✕</button>
    </li>
  )
})

export function Watchlist() {
  const watchlist = useTerminal((s) => s.watchlist)
  const add = useTerminal((s) => s.addSymbol)
  const [input, setInput] = useState('')

  const submit = () => {
    const s = input.trim().toUpperCase()
    if (!/^[A-Z0-9]{5,12}$/.test(s)) return
    add(s); feed.subscribe(s); setInput('')
  }

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Watchlist</h2>
      <div className="mb-3 flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add symbol, e.g. XRPUSDT"
          className="w-full rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        />
        <button onClick={submit} className="rounded-lg bg-blue-600 px-3 text-sm font-medium hover:bg-blue-500">Add</button>
      </div>
      <ul className="space-y-1">{watchlist.map((s) => <Row key={s} symbol={s} />)}</ul>
    </section>
  )
}