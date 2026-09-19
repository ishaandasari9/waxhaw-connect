import { describe, expect, it } from 'vitest'
import { events, resources } from './data'
import { daysSince, directoryMetrics, formatVital, lastReviewed, vitalMet } from './metrics'

const now = new Date('2026-09-18T15:00:00Z')
const rowFor = (rows, text) => rows.find((row) => row.label.includes(text))

describe('directory metrics', () => {
  const rows = directoryMetrics(resources, events, now)

  it('reports figures for the real directory rather than placeholders', () => {
    expect(rowFor(rows, 'original source').value).toBe(`100% (${resources.length} of ${resources.length})`)
    expect(rowFor(rows, 'English and Spanish').value).toContain('100%')
    expect(rows.every((row) => row.note.length > 20)).toBe(true)
  })

  it('counts a stale listing as unverified instead of rounding up', () => {
    const stale = [{ ...resources[0], verified: 'January 2, 2026' }, resources[1]]
    const freshness = rowFor(directoryMetrics(stale, events, now), 'verified in the last')
    expect(freshness.value).toBe('50% (1 of 2)')
    expect(freshness.met).toBe(false)
  })

  it('marks a target as missed when the calendar is thin', () => {
    const upcoming = rowFor(rows, 'Upcoming events')
    expect(upcoming.met).toBe(false)
    expect(rowFor(directoryMetrics(resources, Array.from({ length: 9 }, (_, index) => ({ id: index, date: '2026-12-01' })), now), 'Upcoming events').met).toBe(true)
  })

  it('leaves context-only figures without a pass or fail', () => {
    expect(rowFor(rows, 'travel to').met).toBeNull()
  })

  it('never claims a confidential shelter is somewhere a resident can travel', () => {
    const shelterOnly = resources.filter((item) => item.confidentialLocation)
    expect(rowFor(directoryMetrics(shelterOnly, events, now), 'travel to').value).toBe('0 of 1')
  })

  it('handles an unparseable or missing review date', () => {
    expect(daysSince('not a date')).toBeNull()
    expect(lastReviewed([{ verified: 'nonsense' }])).toBeNull()
    expect(rowFor(directoryMetrics([{ verified: 'nonsense' }], [], now), 'Days since').value).toBe('Unknown')
  })
})

describe('web vitals display', () => {
  it('shows seconds for slow paints and milliseconds for quick ones', () => {
    expect(formatVital('lcp', 1840)).toBe('1.84 s')
    expect(formatVital('inp', 96)).toBe('96 ms')
    expect(formatVital('cls', 0.0421)).toBe('0.042')
    expect(formatVital('inp', null)).toBe('Measuring')
  })

  it('judges each vital against its published threshold', () => {
    expect(vitalMet('lcp', 2400)).toBe(true)
    expect(vitalMet('lcp', 2600)).toBe(false)
    expect(vitalMet('cls', 0.05)).toBe(true)
    expect(vitalMet('inp', null)).toBeNull()
  })
})
