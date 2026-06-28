const R = 6371000 // earth radius (m)

/** 2 点間の大円距離 (m)。 */
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Place 座標を Transit API の routable な "geo:lat,lon" 参照に変換。 */
export function geoRef(p: { lat: number; lon: number }): string {
  return `geo:${p.lat},${p.lon}`
}
