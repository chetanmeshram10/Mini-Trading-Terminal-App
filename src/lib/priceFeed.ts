import type { Status, Tick } from '../types'
import { useTerminal } from '../store/useTerminal'

// Tried in rotation on each reconnect attempt
const WS_URLS = [
  'wss://data-stream.binance.vision/stream',
  'wss://stream.binance.com:9443/stream',
]
const SEED: Record<string, number> = { BTCUSDT: 67000, ETHUSDT: 2600, SOLUSDT: 170, BNBUSDT: 600 }

export class PriceFeed {
  private ws: WebSocket | null = null
  private symbols = new Set<string>()
  private buffer = new Map<string, Tick>()
  private last = new Map<string, { price: number; open: number }>()
  private retry = 0
  private closed = true
  private reconnectTimer?: number
  private flushTimer?: number
  private demoTimer?: number
  private onFlush: (ticks: Tick[]) => void
  private onStatus: (s: Status) => void

  constructor(onFlush: (ticks: Tick[]) => void, onStatus: (s: Status) => void) {
    this.onFlush = onFlush
    this.onStatus = onStatus
  }

  start() {
    this.closed = false
    this.connect()
    this.flushTimer = window.setInterval(() => {
      if (!this.buffer.size) return
      this.onFlush([...this.buffer.values()])
      this.buffer.clear()
    }, 250)
  }

  stop() {
    this.closed = true
    clearTimeout(this.reconnectTimer)
    clearInterval(this.flushTimer)
    this.stopDemo()
    this.ws?.close()
  }

  subscribe(symbol: string) {
    this.symbols.add(symbol)
    this.send('SUBSCRIBE', [symbol])
  }

  unsubscribe(symbol: string) {
    this.symbols.delete(symbol)
    this.send('UNSUBSCRIBE', [symbol])
  }

  private connect() {
    this.onStatus(this.demoTimer ? 'demo' : this.retry === 0 ? 'connecting' : 'reconnecting')
    const ws = new WebSocket(WS_URLS[this.retry % WS_URLS.length])
    this.ws = ws

    ws.onopen = () => {
      this.retry = 0
      this.stopDemo()
      this.onStatus('live')
      this.send('SUBSCRIBE', [...this.symbols])
    }

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)?.data
      if (!d || d.e !== '24hrMiniTicker') return
      const price = parseFloat(d.c)
      const open = parseFloat(d.o)
      this.last.set(d.s, { price, open })
      this.buffer.set(d.s, { symbol: d.s, price, open, changePct: ((price - open) / open) * 100 })
    }

    ws.onerror = () => ws.close()

    ws.onclose = () => {
      if (this.closed) return
      const delay = Math.min(1000 * 2 ** this.retry++, 15_000) // 1s, 2s, 4s ... max 15s
      this.reconnectTimer = window.setTimeout(() => this.connect(), delay)
      if (this.retry >= 2) this.startDemo()
      this.onStatus(this.demoTimer ? 'demo' : 'reconnecting')
    }
  }

  // Fallback so the UI is never empty if the exchange is unreachable
  private startDemo() {
    if (this.demoTimer) return
    this.demoTimer = window.setInterval(() => {
      for (const s of this.symbols) {
        const base = this.last.get(s) ?? { price: SEED[s] ?? 100, open: SEED[s] ?? 100 }
        const price = base.price * (1 + (Math.random() - 0.5) * 0.0008)
        this.last.set(s, { price, open: base.open })
        this.buffer.set(s, { symbol: s, price, open: base.open, changePct: ((price - base.open) / base.open) * 100 })
      }
    }, 600)
  }

  private stopDemo() {
    clearInterval(this.demoTimer)
    this.demoTimer = undefined
  }

  private send(method: 'SUBSCRIBE' | 'UNSUBSCRIBE', symbols: string[]) {
    if (!symbols.length || this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      method,
      params: symbols.map((s) => `${s.toLowerCase()}@miniTicker`),
      id: Date.now(),
    }))
  }
}

export const feed = new PriceFeed(
  (ticks) => useTerminal.getState().applyTicks(ticks),
  (s) => useTerminal.getState().setStatus(s),
)