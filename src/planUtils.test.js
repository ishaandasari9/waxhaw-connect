import { describe, expect, it } from 'vitest'
import { eventInterests } from './eventUtils'
import { eventPlaybook, playbookEntry, playbookIds } from './eventPlaybook'
import { describePlanRequest, hostOf, normalizePlanInput, parseJsonReply, sanitizePlan } from './planUtils'

const reply = {
  summary: 'All three lean on free entry and local partners.',
  exampleIds: ['matthews-alive', 'davidson-farmers-market'],
  steps: [{ title: 'Pick a date', detail: 'Avoid weekends nearby towns have already booked.' }],
  draft: { title: 'Waxhaw Makers Morning', category: 'Festival', description: 'Local makers and food.' },
}

describe('event planner input', () => {
  it('requires an idea and drops values outside the allowed lists', () => {
    expect(normalizePlanInput({ idea: '   ' })).toBeNull()
    const plan = normalizePlanInput({ idea: 'Farmers market', size: '9000 people', budget: 'Under $500' })
    expect(plan.size).toBe('')
    expect(describePlanRequest(plan)).toContain('Budget: Under $500')
  })

  it('asks for Spanish only when the resident is reading Spanish', () => {
    const plan = normalizePlanInput({ idea: 'Mercado' })
    expect(describePlanRequest(plan, 'es')).toContain('in Spanish')
    expect(describePlanRequest(plan, 'en')).not.toContain('in Spanish')
  })
})

describe('the researched playbook', () => {
  it('gives every entry a real source link and bilingual reasons', () => {
    for (const entry of eventPlaybook) {
      expect(hostOf(entry.source.url)).toBeTruthy()
      expect(entry.source.url.startsWith('https://')).toBe(true)
      expect(entry.why.length).toBeGreaterThanOrEqual(3)
      expect(entry.whyEs.length).toBe(entry.why.length)
      expect(entry.tags.length).toBeGreaterThan(2)
      expect(entry.place).toMatch(/Count(y|ies)/)
    }
    expect(new Set(playbookIds).size).toBe(eventPlaybook.length)
  })
})

describe('event planner output', () => {
  it('parses JSON wrapped in fences or prose', () => {
    expect(parseJsonReply('Here you go ```json {"a":1} ```')).toEqual({ a: 1 })
    expect(parseJsonReply('no json here')).toBeNull()
  })

  it('keeps only ids that exist in the playbook', () => {
    const plan = sanitizePlan({
      reply: { ...reply, exampleIds: ['matthews-alive', 'a-festival-i-made-up', 'matthews-alive'] },
      categories: eventInterests,
      allowedExamples: playbookIds,
    })
    expect(plan.exampleIds).toEqual(['matthews-alive'])
    expect(playbookEntry('a-festival-i-made-up')).toBeNull()
  })

  it('never carries example text written by the model', () => {
    const plan = sanitizePlan({
      reply: { ...reply, examples: [{ name: 'Totally Invented Fest', place: 'Nowhere, NC' }] },
      categories: eventInterests,
      allowedExamples: playbookIds,
    })
    expect(JSON.stringify(plan)).not.toContain('Invented')
    expect(plan.examples).toBeUndefined()
    expect(plan.exampleIds).toEqual(['matthews-alive', 'davidson-farmers-market'])
  })

  it('caps the examples and trims the plan to usable pieces', () => {
    const plan = sanitizePlan({
      reply: { ...reply, exampleIds: playbookIds, steps: Array.from({ length: 12 }, (_, i) => ({ title: `Step ${i}`, detail: 'x' })) },
      categories: eventInterests,
      allowedExamples: playbookIds,
    })
    expect(plan.exampleIds).toHaveLength(3)
    expect(plan.steps).toHaveLength(7)
  })

  it('rejects a draft category the calendar does not use', () => {
    const plan = sanitizePlan({ reply: { ...reply, draft: { ...reply.draft, category: 'Rave' } }, categories: eventInterests, allowedExamples: playbookIds })
    expect(plan.draft.category).toBe('')
    expect(plan.draft.title).toBe('Waxhaw Makers Morning')
  })
})
