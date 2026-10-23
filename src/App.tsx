import { useEffect } from 'react'
import { useTerminal } from './store/useTerminal'
import { feed } from './lib/priceFeed'
import { delay } from './lib/motion'
import { Watchlist } from './components/Watchlist'
import { Chart } from './components/Chart'
import { OrderForm } from './components/OrderForm'
import { Positions } from './components/Positions'
import { Stats } from './components/Stats'
import { TickerTape } from './components/TickerTape'

const STATUS = {
  live: { dot: 'bg-emerald-400', text: 'Live · Binance WebSocket', ring: 'border-emerald-500/30 text-emerald-300' },
  connecting: { dot: 'bg-amber-400', text: 'Connecting…', ring: 'border-amber-500/30 text-amber-300' },
  reconnecting: { dot: 'bg-rose-400', text: 'Reconnecting…', ring: 'border-rose-500/30 text-rose-300' },
  demo: { dot: 'bg-amber-400', text: 'Demo data (feed unreachable)', ring: 'border-amber-500/30 text-amber-300' },
} as const

const STACK = ['React 19', 'TypeScript', 'Zustand', 'WebSockets', 'Tailwind v4', 'Vitest', 'Lightweight Charts']

const DECISIONS = [
  ['250 ms tick batching', 'Ticks are buffered and flushed in one store update, so React never re-renders per message.'],
  ['Per-row subscriptions', 'Each watchlist row selects only its own price slice, so a BTC tick never re-renders ETH.'],
  ['Resilient socket', 'Exponential backoff, endpoint rotation, automatic re-subscribe, and a labelled demo fallback.'],
  ['Pure, tested P&L engine', 'Averaging, partial close and long-to-short flips are unit-tested with Vitest.'],
]

export default function App() {
  const status = useTerminal((s) => s.status)
  const selected = useTerminal((s) => s.selected)
  const st = STATUS[status]

  useEffect(() => {
    useTerminal.getState().watchlist.forEach((s) => feed.subscribe(s))
    feed.start()
    return () => feed.stop()
  }, [])

  return (
    <>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <TickerTape />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="reveal flex items-center gap-3" style={delay(0)}>
              <div className="float grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 text-lg font-bold text-slate-900 shadow-lg shadow-blue-500/30">
                M
              </div>
              <h1 className="shimmer text-2xl font-bold tracking-tight">Mini Trading Terminal</h1>
            </div>
            <p className="reveal mt-2 max-w-xl text-sm text-slate-400" style={delay(80)}>
              Real-time watchlist, candlestick charts and paper trading with live P&amp;L, built on streaming market data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STACK.map((t, i) => (
                <span key={t} style={delay(160 + i * 60)}
                  className="reveal rounded-full border border-slate-700/70 bg-slate-900/60 px-2.5 py-0.5 text-xs text-slate-300 transition hover:border-blue-500/60 hover:text-white">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="reveal flex flex-col items-end gap-2" style={delay(200)}>
            <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${st.ring}`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${st.dot}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${st.dot}`} />
              </span>
              {st.text}
            </span>
            <a
              href="https://github.com/chetanmeshram10/Mini-Trading-Terminal-App"
              target="_blank" rel="noreferrer"
              className="text-xs text-slate-400 underline-offset-4 hover:text-white hover:underline"
            >
              View source on GitHub ↗
            </a>
          </div>
        </header>

        <Stats />

        <div className="mt-4 grid gap-4 md:grid-cols-[340px_1fr]">
          <div className="reveal space-y-4" style={delay(450)}>
            <Watchlist />
            <OrderForm />
          </div>
          <div className="reveal space-y-4" style={delay(550)}>
            <Chart symbol={selected} />
            <Positions />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="reveal mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500" style={delay(700)}>
            Engineering decisions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DECISIONS.map(([title, body], i) => (
              <div key={title} className="card lift reveal p-4" style={delay(780 + i * 90)}>
                <p className="text-sm font-semibold text-slate-100">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 pb-4 text-center text-xs text-slate-600">
          Paper trading only. Not financial advice.
        </footer>
      </div>
    </>
  )
}