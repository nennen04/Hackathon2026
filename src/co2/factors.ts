import type { Mode } from '../domain/types'

/** g-CO2 / km。null は係数未定（ferry/air）。 */
export const CO2_FACTORS: Record<Mode, number | null> = {
  rail: 17,
  subway: 17,
  tram: 17,
  bus: 57,
  walk: 0,
  transfer: 0,
  ferry: null,
  air: null,
}
