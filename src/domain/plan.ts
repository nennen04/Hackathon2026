import type { Plan, Stop, Leg, JourneyResult, Place } from './types'
import type { Co2Model } from '../co2/model'
import { deriveSegmentDistances } from './distance'
import { haversineM, geoRef } from '../utils/geo'

let seq = 0
const nextId = () => `id-${seq++}`

export function createPlan(title: string, date: string): Plan {
  return { id: nextId(), title, date, stops: [] }
}

export function addStop(plan: Plan, stop: Stop): Plan {
  return { ...plan, stops: [...plan.stops, stop] }
}

export function removeStop(plan: Plan, stopId: string): Plan {
  return { ...plan, stops: plan.stops.filter((s) => s.id !== stopId) }
}

export function reorderStops(plan: Plan, from: number, to: number): Plan {
  const stops = [...plan.stops]
  const [moved] = stops.splice(from, 1)
  stops.splice(to, 0, moved)
  return { ...plan, stops }
}

type Fetcher = (from: string, to: string) => Promise<JourneyResult[]>

/**
 * 隣接 Stop 間を経路探索して Leg 配列を導出する。
 * 経路が見つからない区間は haversine ベースの徒歩 Leg にフォールバックする。
 * I/O は fetchJourneys に注入し、純粋にテスト可能にしている。
 */
export async function deriveLegs(
  stops: Stop[],
  fetchJourneys: Fetcher,
  co2: Co2Model,
): Promise<Leg[]> {
  const pairs = stops.slice(0, -1).map((a, i) => ({ a, b: stops[i + 1] }))

  return Promise.all(
    pairs.map(async ({ a, b }) => {
      let journeys: JourneyResult[] = []
      try {
        journeys = await fetchJourneys(geoRef(a.place), geoRef(b.place))
      } catch {
        journeys = []
      }
      const j = journeys[0]
      let leg: Leg
      if (j && j.segments.length > 0) {
        const segments = deriveSegmentDistances(a.place, b.place, j.segments)
        const distanceM = segments.reduce((s, x) => s + x.distanceM, 0)
        leg = {
          fromStopId: a.id,
          toStopId: b.id,
          segments,
          durationSecs: j.durationSecs,
          transferCount: j.transferCount,
          distanceM,
        }
      } else {
        const distanceM = haversineM(a.place.lat, a.place.lon, b.place.lat, b.place.lon)
        if (distanceM > 3000) {
          // 3km以上の場合は電車(特急・快速線等)での移動としてシミュレートする（速度: 60km/h = 16.7m/s）
          const durationSecs = Math.round(distanceM / 16.7)
          leg = {
            fromStopId: a.id,
            toStopId: b.id,
            segments: [{ mode: 'rail', routeName: '快速特急・特急等', durationSecs, distanceM }],
            durationSecs,
            transferCount: 0,
            distanceM,
          }
        } else {
          const durationSecs = Math.round(distanceM / 1.3)
          leg = {
            fromStopId: a.id,
            toStopId: b.id,
            segments: [{ mode: 'walk', durationSecs, distanceM }],
            durationSecs,
            transferCount: 0,
            distanceM,
          }
        }
      }
      leg.co2g = co2.estimateLeg(leg)
      return leg
    }),
  )
}

/** 複数 Stop の場所を一括差し替え（id・滞在は維持、純粋・不変）。 */
export function substituteStops(
  plan: Plan,
  swaps: { stopId: string; place: Place }[],
): Plan {
  const byId = new Map(swaps.map((s) => [s.stopId, s.place]))
  const stops = plan.stops.map((s) => {
    const place = byId.get(s.id)
    return place ? { ...s, place } : s
  })
  return { ...plan, stops }
}
