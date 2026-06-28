export type Mode =
  | 'rail'
  | 'subway'
  | 'tram'
  | 'bus'
  | 'ferry'
  | 'air'
  | 'walk'
  | 'transfer'

export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  kind: string
}

export interface Stop {
  id: string
  place: Place
  purposeTag?: string
  dwellMins: number
}

export interface Segment {
  mode: Mode
  routeName?: string
  durationSecs: number
  distanceM: number
}

export interface Leg {
  fromStopId: string
  toStopId: string
  segments: Segment[]
  durationSecs: number
  transferCount: number
  distanceM: number
  co2g?: number // ferry/air など係数未定の区間を含むと undefined
}

export interface Plan {
  id: string
  title: string
  date: string // YYYYMMDD
  stops: Stop[]
}

/** API パース後の中間表現（距離・CO2 計算前）。 */
export interface RawSegment {
  mode: Mode
  routeName?: string
  durationSecs: number
}

export interface JourneyResult {
  durationSecs: number
  transferCount: number
  segments: RawSegment[]
}
