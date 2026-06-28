import type { Stop, Place } from './types'
import { haversineM } from '../utils/geo'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  proposals?: SwapProposal[]
}

export interface Swap {
  stopId: string
  fromName: string
  toPlace: Place
}

export interface SwapProposal {
  id: string
  swaps: Swap[]
  reason: string
  estDeltaCo2g: number
}

const DETOUR = 1.2
const NOMINAL_FACTOR = 17 // g-CO2/km（概算。実値は適用後の Leg 再導出で確定）

export function totalHaversineM(stops: Stop[]): number {
  let d = 0
  for (let i = 0; i < stops.length - 1; i++) {
    d += haversineM(
      stops[i].place.lat,
      stops[i].place.lon,
      stops[i + 1].place.lat,
      stops[i + 1].place.lon,
    )
  }
  return d
}

/** 提案適用後プラン全体 vs 現プランの総 haversine 差から CO2 削減見込み(g)を概算。負値=削減。 */
export function estimateSwapDeltaCo2(before: Stop[], after: Stop[]): number {
  const d = totalHaversineM(after) - totalHaversineM(before)
  return (d / 1000) * DETOUR * NOMINAL_FACTOR
}

/** 地点名から Stop を解決（完全一致 → 部分一致）。 */
export function matchStop(stops: Stop[], name: string): Stop | undefined {
  return (
    stops.find((s) => s.place.name === name) ??
    stops.find((s) => s.place.name.includes(name) || name.includes(s.place.name))
  )
}
