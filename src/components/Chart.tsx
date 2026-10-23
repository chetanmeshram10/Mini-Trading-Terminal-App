import { useEffect, useRef, useState } from 'react'
import { createChart, type UTCTimestamp } from 'lightweight-charts'

const INTERVALS = ['1m', '5m', '1h'] as const
const REST = 'https://data-api.binance.vision/api/v3/klines'
const WS = 'wss://data-stream.binance.vision/ws'

export function Chart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [iv, setIv] = useState<(typeof INTERVALS)[number]>('1m')
    const [errorKey, setErrorKey] = useState('')
    const error = errorKey === `${symbol}-${iv}`

  useEffect(() => {
    const chart = createChart(container.current!, {
      autoSize: true,
      layout: { background: { color: 'rgba(0,0,0,0)' }, textColor: '#94a3b8', fontFamily: 'JetBrains Mono' },
      grid: { vertLines: { color: 'rgba(148,163,184,0.06)' }, horzLines: { color: 'rgba(148,163,184,0.06)' } },
      timeScale: { timeVisible: true, borderColor: 'rgba(148,163,184,0.15)' },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.15)' },
    })
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    let ws: WebSocket | undefined
    let cancelled = false

    fetch(`${REST}?symbol=${symbol}&interval=${iv}&limit=500`)
      .then((r) => { if (!r.ok) throw new Error('bad response'); return r.json() })
      .then((rows: string[][]) => {
        if (cancelled) return
        series.setData(rows.map((r) => ({
          time: (Number(r[0]) / 1000) as UTCTimestamp,
          open: +r[1], high: +r[2], low: +r[3], close: +r[4],
        })))
        ws = new WebSocket(`${WS}/${symbol.toLowerCase()}@kline_${iv}`)
        ws.onmessage = (e) => {
          const k = JSON.parse(e.data).k
          series.update({ time: (k.t / 1000) as UTCTimestamp, open: +k.o, high: +k.h, low: +k.l, close: +k.c })
        }
      })
      .catch(() => { if (!cancelled) setErrorKey(`${symbol}-${iv}`) })

    return () => { cancelled = true; ws?.close(); chart.remove() }
  }, [symbol, iv])

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{symbol} <span className="ml-1 text-xs font-normal text-slate-500">candles</span></h2>
        <div className="flex gap-1 rounded-lg bg-slate-900/80 p-1 text-xs">
          {INTERVALS.map((i) => (
            <button key={i} onClick={() => setIv(i)}
              className={`rounded-md px-2.5 py-1 ${i === iv ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{i}</button>
          ))}
        </div>
      </div>
      <div className="relative">
        <div ref={container} className="h-80 w-full" />
        {error && (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-500">
            Chart data is unreachable from this network.<br />Watchlist and trading still work with demo prices.
          </div>
        )}
      </div>
    </section>
  )
}