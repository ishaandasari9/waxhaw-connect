import { describe, expect, it } from 'vitest'
import { eventInterests } from './eventUtils'
import { citeExamples, chunkSources, describePlanRequest, normalizePlanInput, parseJsonReply, sanitizePlan } from './planUtils'

const reply = {
  summary: 'Both events lean on local vendors.',
  examples: [
    { name: 'Apex PeakFest', place: 'Apex, NC', why: ['Downtown street closure', 'Hundreds of local vendors'], url: 'https://made-up.example/peakfest' },
    { name: 'Matthews Alive', place: 'Matthews, NC', why: ['Run by volunteers since the 1990s'] },
  ],
  steps: [{ title: 'Pick a date', detail: 'Avoid conflicts with Autumn Treasures.' }],
  draft: { title: 'Waxhaw Makers Morning', category: 'Festival', description: 'Local makers and food.' },
}
const replyText = JSON.stringify(reply)
const peakAt = new TextEncoder().encode(replyText.slice(0, replyText.indexOf('Apex PeakFest'))).length
const matthewsAt = new TextEncoder().encode(replyText.slice(0, replyText.indexOf('Matthews Alive'))).length

const metadata = {
  groundingChunks: [
    { web: { uri: 'https://vertexaisearch.cloud.google.com/redirect/a', title: 'apexnc.org' } },
    { web: { uri: 'https://vertexaisearch.cloud.google.com/redirect/b', title: 'matthewsalive.org' } },
    { web: { uri: 'javascript:alert(1)', title: 'bad' } },
  ],
  groundingSupports: [
    { segment: { startIndex: peakAt, endIndex: peakAt + 40 }, groundingChunkIndices: [0, 2] },
    { segment: { startIndex: matthewsAt, endIndex: matthewsAt + 30 }, groundingChunkIndices: [1] },
  ],
}

describe('event planner input', () => {
  it('requires an idea and drops values outside the allowed lists', () => {
    expect(normalizePlanInput({ idea: '   ' })).toBeNull()
    const plan = normalizePlanInput({ idea: 'Farmers market', size: '9000 people', budget: 'Under $500' })
    expect(plan.size).toBe('')
    expect(plan.budget).toBe('Under $500')
    expect(describePlanRequest(plan)).toContain('Budget: Under $500')
  })
})

describe('event planner output', () => {
  it('parses JSON wrapped in fences or prose', () => {
    expect(parseJsonReply('Here you go ```json {"a":1} ```')).toEqual({ a: 1 })
    expect(parseJsonReply('no json here')).toBeNull()
  })

  it('keeps only web sources with a real http address', () => {
    const sources = chunkSources(metadata)
    expect(sources[0].label).toBe('apexnc.org')
    expect(sources[2]).toBeNull()
  })

  it('links each example only to the sources that support it', () => {
    const sources = chunkSources(metadata)
    const cited = citeExamples(replyText, ['Apex PeakFest', 'Matthews Alive'], metadata, sources)
    expect(cited[0].map((source) => source.label)).toEqual(['apexnc.org'])
    expect(cited[1].map((source) => source.label)).toEqual(['matthewsalive.org'])
  })

  it('never passes a model-written URL to the page', () => {
    const plan = sanitizePlan({ reply, replyText, metadata, categories: eventInterests })
    expect(JSON.stringify(plan)).not.toContain('made-up.example')
    expect(plan.grounded).toBe(true)
    expect(plan.examples).toHaveLength(2)
    expect(plan.draft.category).toBe('Festival')
  })

  it('drops examples when the answer was not grounded in search', () => {
    const plan = sanitizePlan({ reply, replyText, metadata: null, categories: eventInterests })
    expect(plan.grounded).toBe(false)
    expect(plan.examples).toEqual([])
    expect(plan.steps).toHaveLength(1)
  })

  it('rejects a draft category the calendar does not use', () => {
    const plan = sanitizePlan({ reply: { ...reply, draft: { ...reply.draft, category: 'Rave' } }, replyText, metadata, categories: eventInterests })
    expect(plan.draft.category).toBe('')
  })
})
