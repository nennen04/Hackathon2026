import type { Leg } from '../domain/types'

export interface Co2Model {
  id: string
  /** grams CO2。係数未定の区間を含む場合は undefined。 */
  estimateLeg(leg: Leg): number | undefined
}
