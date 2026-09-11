import { describe, expect, it } from 'vitest'
import { getRecommendationReason, rankEventsForUser } from './eventUtils'

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
