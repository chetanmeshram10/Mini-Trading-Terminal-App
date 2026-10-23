import type { CSSProperties } from 'react'

// Usage: <div className="reveal" style={delay(200)} />
export const delay = (ms: number): CSSProperties => ({ '--d': `${ms}ms` }) as CSSProperties