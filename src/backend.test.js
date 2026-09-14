import { describe, expect, it } from 'vitest'
import { toCommunityEvent, translateAuthError } from './backend'

describe('translateAuthError', () => {
  it('explains a duplicate signup in plain language and suggests the next step', () => {
    expect(translateAuthError('auth/email-already-in-use')).toMatch(/already exists/i)
    expect(translateAuthError('auth/email-already-in-use')).toMatch(/signing in/i)
  })

  it('does not reveal whether an email exists when credentials fail', () => {
    const wrongPassword = translateAuthError('auth/wrong-password')
    expect(translateAuthError('auth/user-not-found')).toBe(wrongPassword)
  })

  it('separates a network failure from a credential failure', () => {
    expect(translateAuthError('auth/network-request-failed')).toMatch(/connection/i)
  })

  it('never leaks a raw Firebase code to a resident', () => {
    const codes = [
      'auth/email-already-in-use', 'auth/invalid-email', 'auth/weak-password',
      'auth/invalid-credential', 'auth/too-many-requests', 'auth/network-request-failed',
      'permission-denied', 'unavailable', undefined, 'auth/internal-error',
    ]
    codes.forEach((code) => {
      const message = translateAuthError(code)
      expect(message).not.toMatch(/auth\/|permission-denied|unavailable/)
      expect(message.endsWith('.')).toBe(true)
    })
  })
})

describe('toCommunityEvent', () => {
  const stored = {
    title: 'Neighborhood garden workshop',
    date: '2026-10-04',
    time: '10:00 AM-12:00 PM',
    location: 'Waxhaw Community Garden',
    category: 'Learning',
    description: 'Build a raised bed and take seedlings home.',
    accessibility: 'Level gravel paths, seating available.',
    sourceUrl: 'https://example.org/garden',
    organizer: 'Jordan Lee',
    organizerId: 'uid-123',
  }

  it('matches the shape the event list already renders', () => {
    const event = toCommunityEvent('doc-1', stored)
    expect(event).toMatchObject({ id: 'doc-1', ...stored, communitySubmitted: true })
  })

  it('always marks the listing as community submitted so the label cannot be lost', () => {
    expect(toCommunityEvent('doc-2', {}).communitySubmitted).toBe(true)
  })

  it('fills gaps rather than rendering blank fields', () => {
    const event = toCommunityEvent('doc-3', { title: 'Cleanup day', date: '2026-11-01' })
    expect(event.accessibility).toMatch(/contact the organizer/i)
    expect(event.organizer).toBeTruthy()
    expect(event.category).toBeTruthy()
  })

  it('converts a Firestore timestamp into an ISO string', () => {
    const submittedAt = { toDate: () => new Date('2026-09-14T15:04:05Z') }
    expect(toCommunityEvent('doc-4', { ...stored, submittedAt }).submittedAt).toBe('2026-09-14T15:04:05.000Z')
  })

  it('leaves an already serialized timestamp alone', () => {
    expect(toCommunityEvent('doc-5', { ...stored, submittedAt: '2026-09-14T15:04:05.000Z' }).submittedAt)
      .toBe('2026-09-14T15:04:05.000Z')
  })
})
