export type Status = 'connecting' | 'live' | 'reconnecting' | 'demo'
export type Side = 'BUY' | 'SELL'

export interface Tick { symbol: string; price: number; open: number; changePct: number }
export interface Position { symbol: string; qty: number; avgPrice: number } // qty < 0 = short
export interface Order { id: string; symbol: string; side: Side; qty: number; price: number; time: number }