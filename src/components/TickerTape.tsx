import { useTerminal } from '../store/useTerminal'

export function TickerTape() {
  const watchlist = useTerminal((s) => s.watchlist)
  const prices = useTerminal((s) => s.prices)

  const items = watchlist.flatMap((s) => (prices[s] ? [prices[s]] : []))
  if (!items.length) return <div className="h-9 border-b border-slate-800/80" />

  // 4 identical copies; the CSS animation shifts by 25% for a seamless loop
  const strip = (copy: number) => (
    <div key={copy} className="flex">
      {items.map((t) => {
        const up = t.changePct >= 0
        return (
          <span key={`${copy}-${t.symbol}`} className="num flex items-center gap-2 px-6 text-xs">
            <span className="font-sans font-semibold text-slate-300">{t.symbol.replace(/USDT$/, '')}</span>
            <span className="text-slate-200">{t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
            <span className={up ? 'text-emerald-400' : 'text-rose-400'}>
              {up ? '▲' : '▼'} {Math.abs(t.changePct).toFixed(2)}%
            </span>
          </span>
        )
      })}
    </div>
  )

  return (
    <div className="overflow-hidden border-b border-slate-800/80 bg-slate-950/60 py-2" aria-hidden="true">
      <div className="marquee flex w-max">{[0, 1, 2, 3].map(strip)}</div>
    </div>
  )
}