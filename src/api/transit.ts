import type { Place, JourneyResult, RawSegment, Mode } from '../domain/types'

const BASE = 'https://api.transit.ls8h.com'
const KNOWN_MODES: Mode[] = [
  'rail',
  'subway',
  'tram',
  'bus',
  'ferry',
  'air',
  'walk',
  'transfer',
]

function toMode(m: unknown): Mode {
  return KNOWN_MODES.includes(m as Mode) ? (m as Mode) : 'rail'
}

export function parsePlaces(raw: any): Place[] {
  return (raw?.places ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    kind: p.kind ?? 'place',
    lat: p.lat,
    lon: p.lon,
  }))
}

export function parseJourneys(raw: any): JourneyResult[] {
  return (raw?.journeys ?? []).map((j: any) => ({
    durationSecs: j.durationSecs,
    transferCount: j.transferCount ?? 0,
    segments: (j.legs ?? [])
      .filter((l: any) => l.kind === 'transit')
      .map(
        (l: any): RawSegment => ({
          mode: toMode(l.mode),
          routeName: l.routeName,
          durationSecs: Math.max(0, (l.arrivalSecs ?? 0) - (l.departureSecs ?? 0)),
        }),
      ),
  }))
}

export async function suggestPlaces(q: string, limit = 8): Promise<Place[]> {
  if (!q.trim()) return []
  const url = `${BASE}/api/v1/places/suggest?q=${encodeURIComponent(q)}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`suggest failed: ${res.status}`)
  return parsePlaces(await res.json())
}

export async function fetchJourneys(
  from: string,
  to: string,
  date?: string,
  time?: string,
): Promise<JourneyResult[]> {
  const params = new URLSearchParams({ from, to })
  if (date) params.set('date', date)
  if (time) params.set('time', time)
  const res = await fetch(`${BASE}/api/v1/plan?${params}`)
  if (!res.ok) throw new Error(`plan failed: ${res.status}`)
  return parseJourneys(await res.json())
}
