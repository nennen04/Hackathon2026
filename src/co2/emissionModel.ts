import type { Co2Model } from './model'
import { CO2_FACTORS } from './factors'

/** 距離 × 手段別係数で CO2 を算出する Co2Model。 */
export function createEmissionModel(): Co2Model {
  return {
    id: 'distance-factor-v1',
    estimateLeg(leg) {
      let total = 0
      for (const s of leg.segments) {
        const factor = CO2_FACTORS[s.mode]
        if (factor === null) return undefined
        total += (s.distanceM / 1000) * factor
      }
      return total
    },
  }
}
