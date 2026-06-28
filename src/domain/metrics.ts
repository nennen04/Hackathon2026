import type { Leg } from './types'

export interface PlanMetrics {
  totalCo2g: number
  totalDistanceM: number
  totalDurationSecs: number
  hasUnknownCo2: boolean
}

/** Leg 配列から合計 CO2 / 距離 / 時間を集計する。CO2 不明の区間は合計から除外し flag を立てる。 */
export function computeMetrics(legs: Leg[]): PlanMetrics {
  let totalCo2g = 0
  let totalDistanceM = 0
  let totalDurationSecs = 0
  let hasUnknownCo2 = false
  for (const l of legs) {
    if (l.co2g === undefined) hasUnknownCo2 = true
    else totalCo2g += l.co2g
    totalDistanceM += l.distanceM
    totalDurationSecs += l.durationSecs
  }
  return { totalCo2g, totalDistanceM, totalDurationSecs, hasUnknownCo2 }
}
