import { describe, expect, it } from 'vitest'
import { toCommunityEvent } from './backend'
import {
  REPORT_THRESHOLD, canReport, hasReported, isHidden, isOwner, reportBlockedReason, reportCount, visibleEvents,
} from './moderation'

const community = (extra = {}) => ({ id: 'e1', communitySubmitted: true, organizerId: 'author', ...extra })
const official = { id: 'jam', communitySubmitted: false, organizerId: '' }

describe('report counting', () => {
  it('counts distinct reporters and treats a missing list as zero', () => {
    expect(reportCount(community())).toBe(0)
    expect(reportCount(community({ reportedBy: ['a', 'b'] }))).toBe(2)
    expect(hasReported(community({ reportedBy: ['a'] }), 'a')).toBe(true)
    expect(hasReported(community({ reportedBy: ['a'] }), 'b')).toBe(false)
    expect(hasReported(community({ reportedBy: ['a'] }), '')).toBe(false)
  })

  it('reads reportedBy off a stored document', () => {
    expect(toCommunityEvent('e1', { reportedBy: ['a'] }).reportedBy).toEqual(['a'])
    expect(toCommunityEvent('e1', {}).reportedBy).toEqual([])
    expect(toCommunityEvent('e1', { reportedBy: 'not a list' }).reportedBy).toEqual([])
  })
})

describe('hiding a listing', () => {
  it('takes three different people, not one', () => {
    expect(REPORT_THRESHOLD).toBe(3)
    expect(isHidden(community({ reportedBy: ['a', 'b'] }))).toBe(false)
    expect(isHidden(community({ reportedBy: ['a', 'b', 'c'] }))).toBe(true)
  })

  it('never hides an official listing', () => {
    expect(isHidden({ ...official, reportedBy: ['a', 'b', 'c', 'd'] })).toBe(false)
  })

  it('keeps a hidden listing visible to its author only', () => {
    const buried = community({ id: 'buried', reportedBy: ['a', 'b', 'c'] })
    const fine = community({ id: 'fine' })
    expect(visibleEvents([fine, buried], 'someone').map((item) => item.id)).toEqual(['fine'])
    expect(visibleEvents([fine, buried], 'author').map((item) => item.id)).toEqual(['fine', 'buried'])
    expect(visibleEvents([fine, buried], undefined).map((item) => item.id)).toEqual(['fine'])
  })
})

describe('who may report', () => {
  it('explains each reason the control is unavailable', () => {
    expect(reportBlockedReason(official, 'someone')).toBe('official')
    expect(reportBlockedReason(community(), '')).toBe('signedOut')
    expect(reportBlockedReason(community(), 'author')).toBe('own')
    expect(reportBlockedReason(community({ reportedBy: ['someone'] }), 'someone')).toBe('already')
    expect(reportBlockedReason(community(), 'someone')).toBe('')
  })

  it('allows a signed-in neighbor exactly one report', () => {
    const event = community()
    expect(canReport(event, 'someone')).toBe(true)
    expect(canReport({ ...event, reportedBy: ['someone'] }, 'someone')).toBe(false)
    expect(isOwner(event, 'author')).toBe(true)
    expect(isOwner(event, undefined)).toBe(false)
  })
})
