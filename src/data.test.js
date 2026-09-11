import { describe, expect, it } from 'vitest'
import { categories, events, resources } from './data'

describe('community resource data', () => {
  it('uses unique, valid identifiers', () => {
    const ids = resources.map((resource) => resource.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z0-9-]+$/.test(id))).toBe(true)
  })

  it('connects every resource to a visible category and authoritative source', () => {
    const categoryIds = new Set(categories.map((category) => category.id))
    for (const resource of resources) {
      expect(categoryIds.has(resource.category)).toBe(true)
      expect(resource.source).toBeTruthy()
      expect(resource.sourceUrl.startsWith('https://')).toBe(true)
      expect(resource.verified).toBe('September 11, 2026')
    }
  })

  it('includes inclusive bilingual descriptions and practical contact details', () => {
    for (const resource of resources) {
      expect(resource.description.length).toBeGreaterThan(40)
      expect(resource.descriptionEs.length).toBeGreaterThan(40)
      expect(resource.phone).toBeTruthy()
      expect(resource.audiences.length).toBeGreaterThan(0)
    }
  })

  it('keeps event links traceable and dates valid', () => {
    for (const event of events) {
      expect(Number.isNaN(Date.parse(`${event.date}T12:00:00`))).toBe(false)
      expect(event.sourceUrl.startsWith('https://')).toBe(true)
      expect(event.location).toBeTruthy()
    }
  })
})
