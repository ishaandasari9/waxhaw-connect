import { ZIP_CENTROIDS } from './zipCentroids.js'
import { GEOCODED } from './places.js'

/**
 * Where a listing is, and how precisely we know it.
 *
 *   precision 'address'  street address geocoded by the U.S. Census Bureau
 *   precision 'zip'      only a ZIP code is known, so the point is its center
 *
 * Listings with a confidential location never get a point, a distance or a
 * directions link, whatever their location text says.
 */

const EARTH_RADIUS_MILES = 3958.8

export function milesBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

/* Towns served by a single ZIP code, for listings that publish only a town. */
const SINGLE_ZIP_TOWNS = { 'waxhaw, nc': '28173' }

export function zipFromText(text) {
  const value = String(text || '')
  const town = SINGLE_ZIP_TOWNS[value.trim().toLowerCase()]
  if (town) return town
  const match = value.match(/\b(?:NC|SC)\s+(\d{5})\b/) || value.match(/,\s*(\d{5})(?:-\d{4})?\s*$/)
  return match ? match[1] : ''
}

export function zipPoint(zip) {
  const row = ZIP_CENTROIDS[zip]
  return row ? { lat: row[0], lng: row[1], label: row[2], zip } : null
}

/** A street address starts with a house number, e.g. "1515 Cuthbertson Road". */
export function hasStreetAddress(text) {
  return /^\d+\s+\S+/.test(String(text || '').trim())
}

/** Works for resources (location) and events (address, falling back to location). */
export function placeFor(item, geocoded = GEOCODED) {
  if (!item || item.confidentialLocation) return null
  const text = item.address || item.location || ''
  const exact = geocoded[text]
  if (exact && Number.isFinite(exact.lat) && Number.isFinite(exact.lng)) {
    return { lat: exact.lat, lng: exact.lng, precision: 'address', zip: zipFromText(text) }
  }
  const zip = zipFromText(text)
  const point = zipPoint(zip)
  return point ? { lat: point.lat, lng: point.lng, precision: 'zip', zip } : null
}

/** Street addresses only, so "Serves Union County" never becomes a bogus route. */
export function directionsUrl(item) {
  if (!item || item.confidentialLocation) return ''
  const text = item.address || item.location || ''
  if (!hasStreetAddress(text)) return ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(text)}`
}

/**
 * Plain-language distance. A figure is shown to a tenth of a mile only when
 * both ends are real points: a device location and a geocoded address.
 * Anything involving a ZIP center is rounded and marked "about".
 */
export function describeDistance(origin, place) {
  if (!origin || !place) return null
  if (origin.source === 'zip' && place.precision === 'zip' && origin.zip === place.zip) {
    return { miles: 0, text: 'In your ZIP code', spoken: 'In your ZIP code', exact: false }
  }
  const miles = milesBetween(origin, place)
  const exact = origin.source === 'device' && place.precision === 'address'
  if (exact) {
    const text = miles < 0.1 ? 'Under 0.1 mi' : `${miles.toFixed(1)} mi`
    return { miles, text, spoken: `${text.replace('mi', 'miles')} away`, exact }
  }
  const rounded = Math.max(1, Math.round(miles))
  return { miles, text: `About ${rounded} mi`, spoken: `About ${rounded} ${rounded === 1 ? 'mile' : 'miles'} away`, exact }
}

/**
 * Sorts nearest first and optionally keeps only places within a radius.
 * Listings with no fixed place (countywide, statewide, phone services and
 * confidential locations) are never dropped by a radius, because they serve a
 * resident wherever they are. They follow the located ones in original order.
 */
export function arrangeByDistance(items, origin, { sort = false, within = 0, getPlace = placeFor } = {}) {
  if (!origin) return items
  const located = []
  const unlocated = []
  items.forEach((item, index) => {
    const distance = describeDistance(origin, getPlace(item))
    if (!distance) unlocated.push({ item, index })
    else if (!within || distance.miles <= within) located.push({ item, index, miles: distance.miles })
  })
  if (!sort) {
    const keep = new Set([...located, ...unlocated].map((entry) => entry.index))
    return items.filter((_, index) => keep.has(index))
  }
  located.sort((a, b) => a.miles - b.miles || a.index - b.index)
  return [...located, ...unlocated].map((entry) => entry.item)
}

/** Validates a typed ZIP and turns it into an origin. */
export function originFromZip(value) {
  const zip = String(value || '').trim()
  if (!/^\d{5}$/.test(zip)) return null
  const point = zipPoint(zip)
  return point ? { ...point, source: 'zip' } : null
}

/**
 * Device coordinates are rounded to about 100 meters before anything uses
 * them, and are kept only in memory for this visit.
 */
export function originFromCoords(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const round = (value) => Math.round(value * 1000) / 1000
  return { lat: round(latitude), lng: round(longitude), source: 'device', label: 'your current location' }
}

export const WAXHAW_CENTER = zipPoint('28173')
