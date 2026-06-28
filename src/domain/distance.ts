import type { Mode, RawSegment, Segment } from './types'
import { haversineM } from '../utils/geo'

/** 公称速度 (m/s)。Phase 2 で実データに合わせ調整可能。 */
export const SPEED: Record<Mode, number> = {
  rail: 12,
  subway: 9,
  tram: 6,
  bus: 6,
  ferry: 8,
  air: 200,
  walk: 1.3,
  transfer: 1.0,
}

const DETOUR = 1.2 // 直線距離 -> 経路距離の補正係数

/**
 * 各 segment の距離を導出する（API は距離を返さないため）。
 * 生距離 = durationSecs × 速度。区間両端の haversine×DETOUR が生距離合計を
 * 上回る場合は、速度比を保ったまま全体を地理距離へスケールアップする。
 */
export function deriveSegmentDistances(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  segments: RawSegment[],
): Segment[] {
  const raw = segments.map((s) => Math.max(0, s.durationSecs) * SPEED[s.mode])
  const rawSum = raw.reduce((a, b) => a + b, 0)
  const geo = haversineM(from.lat, from.lon, to.lat, to.lon) * DETOUR
  const scale = rawSum > 0 && geo > rawSum ? geo / rawSum : 1

  return segments.map((s, i) => ({
    mode: s.mode,
    routeName: s.routeName,
    durationSecs: s.durationSecs,
    distanceM: rawSum > 0 ? raw[i] * scale : geo / segments.length,
  }))
}
