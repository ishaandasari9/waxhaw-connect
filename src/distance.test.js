import { describe, expect, it, vi } from 'vitest'
import { events, resources } from './data'
import {
  arrangeByDistance, describeDistance, directionsUrl, milesBetween, originFromCoords,
  originFromZip, placeFor, zipFromText,
} from './distance'
import { ZIP_CENTROIDS } from './zipCentroids'
import { addressesToGeocode, buildPlaces, geocodeAddress, renderModule } from '../scripts/geocode-places.mjs'

const byId = (id) => resources.find((resource) => resource.id === id)
const waxhaw = originFromZip('28173')
const monroe = { lat: 35.0178, lng: -80.5372 }

describe('distance math', () => {
  it('measures straight-line miles between two points', () => {
    expect(milesBetween(waxhaw, monroe)).toBeCloseTo(12.5, 0)
    expect(milesBetween(waxhaw, waxhaw)).toBe(0)
  })

  it('reads a ZIP only from the end of an address, never from a house number', () => {
    expect(zipFromText('2330 Concord Avenue, Monroe, NC 28110')).toBe('28110')
    expect(zipFromText('Downtown Waxhaw, NC 28173')).toBe('28173')
    expect(zipFromText('28001 Some Road, Waxhaw')).toBe('')
    expect(zipFromText('Serves Union County')).toBe('')
    expect(zipFromText('Waxhaw, NC')).toBe('28173')
    expect(zipFromText('Waxhaw and Union County locations')).toBe('')
  })

  it('bundles ZIP centers around Waxhaw, including Monroe and south Charlotte', () => {
    for (const zip of ['28173', '28110', '28112', '28104', '28277']) expect(ZIP_CENTROIDS[zip]).toBeTruthy()
    expect(originFromZip('90210')).toBeNull()
    expect(originFromZip('2817')).toBeNull()
  })
})

describe('places', () => {
  it('never locates a confidential shelter', () => {
    const shelter = byId('turning-point')
    expect(shelter.confidentialLocation).toBe(true)
    expect(placeFor(shelter)).toBeNull()
    expect(directionsUrl(shelter)).toBe('')
    expect(placeFor({ ...shelter, location: '1 Main Street, Monroe, NC 28112' })).toBeNull()
  })

  it('prefers a geocoded address over a ZIP center', () => {
    const library = byId('southwest-library')
    const geocoded = { [library.location]: { lat: 34.95, lng: -80.77 } }
    expect(placeFor(library, geocoded)).toMatchObject({ precision: 'address', lat: 34.95 })
    expect(placeFor(library, {})).toMatchObject({ precision: 'zip', zip: '28173' })
  })

  it('gives countywide and statewide services no point and no directions', () => {
    for (const id of ['nc-211', 'union-transportation', 'work-first']) {
      expect(placeFor(byId(id))).toBeNull()
      expect(directionsUrl(byId(id))).toBe('')
    }
  })

  it('uses the event address for official events', () => {
    const concert = events.find((event) => event.id === 'jammin-tracks-sept')
    expect(placeFor(concert, {})).toMatchObject({ zip: '28173' })
    expect(directionsUrl(concert)).toContain(encodeURIComponent('115 McDonald Street'))
  })
})

describe('describing distance', () => {
  const device = originFromCoords(34.92512, -80.72781)

  it('rounds device coordinates before use', () => {
    expect(device).toMatchObject({ lat: 34.925, lng: -80.728, source: 'device' })
  })

  it('shows tenths only when both ends are exact', () => {
    expect(describeDistance(device, { lat: 35.0178, lng: -80.5372, precision: 'address' }).text).toMatch(/^\d+\.\d mi$/)
    expect(describeDistance(device, { lat: 35.0178, lng: -80.5372, precision: 'zip' }).text).toMatch(/^About \d+ mi$/)
    expect(describeDistance(waxhaw, { lat: 35.0178, lng: -80.5372, precision: 'address' }).exact).toBe(false)
  })

  it('does not pretend two places in the same ZIP are a mile apart', () => {
    expect(describeDistance(waxhaw, { ...waxhaw, precision: 'zip', zip: '28173' }).text).toBe('In your ZIP code')
    expect(describeDistance(waxhaw, { lat: 35.0178, lng: -80.5372, precision: 'zip', zip: '28110' }).spoken).toBe('About 13 miles away')
  })

  it('returns nothing without an origin or a place', () => {
    expect(describeDistance(null, { lat: 1, lng: 1, precision: 'zip' })).toBeNull()
    expect(describeDistance(waxhaw, null)).toBeNull()
  })
})

describe('arranging by distance', () => {
  const items = [
    { id: 'county', location: 'Serves Union County' },
    { id: 'monroe', location: '407 North Main Street, Monroe, NC 28112' },
    { id: 'waxhaw', location: '1515 Cuthbertson Road, Waxhaw, NC 28173' },
    { id: 'albemarle', location: '1 Main Street, Albemarle, NC 28001' },
  ]
  const ids = (list) => list.map((item) => item.id)
  const getPlace = (item) => placeFor(item, {})

  it('leaves the order alone without an origin', () => {
    expect(arrangeByDistance(items, null, { sort: true })).toBe(items)
  })

  it('sorts nearest first and keeps unlocated services at the end', () => {
    expect(ids(arrangeByDistance(items, waxhaw, { sort: true, getPlace }))).toEqual(['waxhaw', 'monroe', 'albemarle', 'county'])
  })

  it('applies a radius without dropping countywide services', () => {
    expect(ids(arrangeByDistance(items, waxhaw, { within: 15, getPlace }))).toEqual(['county', 'monroe', 'waxhaw'])
  })
})

describe('geocode script', () => {
  it('only sends street addresses and never a confidential one', () => {
    const addresses = addressesToGeocode([...resources, ...events])
    expect(addresses.length).toBeGreaterThan(0)
    expect(addresses.every((address) => /^\d+ /.test(address))).toBe(true)
    expect(addresses.some((address) => /confidential/i.test(address))).toBe(false)
  })

  it('reads Census coordinates and reports misses', async () => {
    const fetchImpl = vi.fn(async (url) => ({
      ok: true,
      json: async () => (url.includes('Cuthbertson')
        ? { result: { addressMatches: [{ matchedAddress: '1515 CUTHBERTSON RD, WAXHAW, NC, 28173', coordinates: { x: -80.7712345, y: 34.9512345 } }] } }
        : { result: { addressMatches: [] } }),
    }))
    const hit = await geocodeAddress('1515 Cuthbertson Road, Waxhaw, NC 28173', fetchImpl)
    expect(hit.lat).toBeCloseTo(34.951235, 5)
    expect(hit.lng).toBeCloseTo(-80.771234, 5)
    const { places, misses } = await buildPlaces([
      { location: '1515 Cuthbertson Road, Waxhaw, NC 28173' },
      { location: '9 Nowhere Lane, Waxhaw, NC 28173' },
    ], fetchImpl, () => {})
    expect(Object.keys(places)).toEqual(['1515 Cuthbertson Road, Waxhaw, NC 28173'])
    expect(misses).toEqual(['9 Nowhere Lane, Waxhaw, NC 28173'])
    expect(renderModule(places)).toContain('export const GEOCODED')
  })
})
