import { describe, expect, it } from 'vitest'
import { applyExtractedFields, buildIcs, getRecommendationReason, isUpcoming, parseEventTime, rankEventsForUser, todayISO, upcomingEvents } from './eventUtils'

const sampleEvents = [
  { id: 'civic', title: 'Town meeting', category: 'Civic', date: '2026-09-12' },
  { id: 'music-later', title: 'Friday concert', category: 'Music', date: '2026-09-20' },
  { id: 'music-sooner', title: 'Tuesday concert', category: 'Music', date: '2026-09-15' },
]

describe('event recommendations', () => {
  it('brings interest matches to the top while keeping matches chronological', () => {
    expect(rankEventsForUser(sampleEvents, ['Music']).map((event) => event.id)).toEqual([
      'music-sooner',
      'music-later',
      'civic',
    ])
  })

  it('keeps the normal chronological order when no interests are selected', () => {
    expect(rankEventsForUser(sampleEvents).map((event) => event.id)).toEqual([
      'civic',
      'music-sooner',
      'music-later',
    ])
  })

  it('explains a recommendation only when its category matches', () => {
    expect(getRecommendationReason(sampleEvents[1], ['Music'])).toBe('Because you like music events')
    expect(getRecommendationReason(sampleEvents[0], ['Music'])).toBe('')
  })
})

describe('local dates', () => {
  it('uses the town\'s date, not UTC, late at night', () => {
    /* 9pm Eastern on Sept 18 is already Sept 19 in UTC. */
    expect(todayISO(new Date('2026-09-19T01:00:00Z'))).toBe('2026-09-18')
    expect(todayISO(new Date('2026-09-18T16:00:00Z'))).toBe('2026-09-18')
  })

  it('keeps an event listed for the whole of its own day', () => {
    const list = [{ id: 'a', date: '2026-09-15' }, { id: 'b', date: '2026-09-18' }, { id: 'c', date: '2026-10-10' }]
    expect(upcomingEvents(list, '2026-09-18').map((item) => item.id)).toEqual(['b', 'c'])
    expect(isUpcoming({ date: '2026-09-18' }, '2026-09-18')).toBe(true)
    expect(isUpcoming({}, '2026-09-18')).toBe(false)
  })
})

describe('event times', () => {
  it('reads single times and ranges, and rejects anything else', () => {
    expect(parseEventTime('7:00 PM-9:00 PM')).toEqual({ start: 19 * 60, end: 21 * 60 })
    expect(parseEventTime('10:00 AM - 4:00 PM')).toEqual({ start: 10 * 60, end: 16 * 60 })
    expect(parseEventTime('5:30 PM')).toEqual({ start: 17 * 60 + 30, end: 18 * 60 + 30 })
    expect(parseEventTime('12:15 AM')).toEqual({ start: 15, end: 75 })
    expect(parseEventTime('All day')).toBeNull()
    expect(parseEventTime('')).toBeNull()
  })
})

describe('calendar files', () => {
  const event = {
    id: 'jam', date: '2026-09-18', time: '7:00 PM-9:00 PM', title: "Jammin' By The Tracks",
    location: 'Community Corner, 115 McDonald Street', description: 'Free concert, bring a chair; all ages.',
  }
  const ics = buildIcs(event, { now: new Date('2026-09-17T12:00:00Z') })

  it('includes the fields calendar apps require', () => {
    expect(ics).toContain('UID:jam@waxhaw-connect.vercel.app')
    expect(ics).toContain('DTSTAMP:20260917T120000Z')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })

  it('converts Eastern clock time to UTC, including daylight saving', () => {
    expect(ics).toContain('DTSTART:20260918T230000Z')
    expect(ics).toContain('DTEND:20260919T010000Z')
    const winter = buildIcs({ ...event, date: '2026-12-13', time: '2:00 PM' })
    expect(winter).toContain('DTSTART:20261213T190000Z')
  })

  it('escapes commas and semicolons instead of splitting the field', () => {
    expect(ics).toContain('DESCRIPTION:Free concert\\, bring a chair\\; all ages.')
  })

  it('falls back to an all-day event when no time is given', () => {
    const allDay = buildIcs({ ...event, time: 'All day' })
    expect(allDay).toContain('DTSTART;VALUE=DATE:20260918')
    expect(allDay).toContain('DTEND;VALUE=DATE:20260919')
  })

  it('keeps every line within the 75-octet limit', () => {
    const long = buildIcs({ ...event, description: 'A very long description. '.repeat(12) })
    for (const line of long.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
})

describe('filling the form from a pasted flyer', () => {
  const blank = { title: '', date: '', startTime: '', endTime: '', location: '', category: 'Family', description: '' }

  it('fills what it can verify and reports the rest', () => {
    const result = applyExtractedFields(blank, {
      title: 'Fall Book Sale', date: '2026-11-07', time: '9:00 AM-1:00 PM',
      location: 'Waxhaw Library', category: 'Learning', description: 'Gently used books.',
    }, '2026-09-18')
    expect(result.form).toMatchObject({ title: 'Fall Book Sale', date: '2026-11-07', startTime: '09:00', endTime: '13:00', category: 'Learning' })
    expect(result.missing).toEqual([])
  })

  it('refuses a past date, an unknown category and an unreadable time', () => {
    const result = applyExtractedFields(blank, {
      title: 'Old Fair', date: '2026-01-02', time: 'sometime next week', category: 'Rave', location: '',
    }, '2026-09-18')
    expect(result.form.date).toBe('')
    expect(result.form.category).toBe('Family')
    expect(result.form.startTime).toBe('')
    expect(result.filled).toEqual(['title'])
    expect(result.missing).toEqual(['description', 'location', 'category', 'date', 'time'])
  })

  it('leaves anything the resident already typed in place when nothing is found', () => {
    const typed = { ...blank, title: 'My event', location: 'My street' }
    expect(applyExtractedFields(typed, {}, '2026-09-18').form).toEqual(typed)
  })
})
