/**
 * Shared by api/assist.js (server) and the tests. Nothing here touches the
 * network, so every rule about what an AI event plan may show is testable.
 *
 * The rule that matters most: no URL the model writes ever reaches the page.
 * Links come only from Google Search grounding metadata, which records the
 * pages the search actually returned, and each example is linked only to the
 * sources Gemini attached to that part of its answer.
 */

export const PLAN_SIZES = ['Under 25 people', '25 to 100 people', '100 to 500 people', 'More than 500 people']
export const PLAN_BUDGETS = ['Free or almost free', 'Under $500', '$500 to $5,000', 'More than $5,000']
export const PLAN_SEASONS = ['Not sure yet', 'Spring', 'Summer', 'Fall', 'Winter']

const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const pick = (value, allowed) => (allowed.includes(value) ? value : '')

/** Validates the resident's form input. Returns null when the idea is missing. */
export function normalizePlanInput(input = {}) {
  const idea = clean(input.idea, 240)
  if (!idea) return null
  return {
    idea,
    audience: clean(input.audience, 120),
    size: pick(input.size, PLAN_SIZES),
    budget: pick(input.budget, PLAN_BUDGETS),
    season: pick(input.season, PLAN_SEASONS),
    goal: clean(input.goal, 240),
  }
}

/** Turns validated input into the message sent to the model. */
export function describePlanRequest(plan) {
  return [
    `Event idea: ${plan.idea}`,
    plan.audience && `Who it is for: ${plan.audience}`,
    plan.size && `Expected size: ${plan.size}`,
    plan.budget && `Budget: ${plan.budget}`,
    plan.season && plan.season !== 'Not sure yet' && `Season: ${plan.season}`,
    plan.goal && `What success looks like: ${plan.goal}`,
  ].filter(Boolean).join('\n')
}

export function hostOf(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return ''
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

/** Pulls the JSON object out of a reply that may carry fences or stray prose. */
export function parseJsonReply(text) {
  const raw = String(text || '')
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

/**
 * One entry per grounding chunk, index-aligned with the metadata so supports
 * can point at them. Unusable chunks stay as null to keep the indexes right.
 */
export function chunkSources(metadata) {
  const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : []
  return chunks.map((chunk) => {
    const web = chunk?.web
    if (!web?.uri || !hostOf(web.uri)) return null
    const label = clean(web.title, 80) || hostOf(web.uri)
    return { url: String(web.uri).slice(0, 600), label }
  })
}

const byteLength = (text) => new TextEncoder().encode(text).length

/**
 * Finds which grounding chunks back each example. Gemini reports supports as
 * byte ranges of its reply, so each example's name marks where its slice of the
 * reply starts, and the next example (or the steps) marks where it ends.
 */
export function citeExamples(replyText, names, metadata, sources) {
  const supports = Array.isArray(metadata?.groundingSupports) ? metadata.groundingSupports : []
  const text = String(replyText || '')
  const starts = []
  let cursor = 0
  for (const name of names) {
    const at = name ? text.indexOf(name, cursor) : -1
    starts.push(at)
    if (at >= 0) cursor = at + name.length
  }
  const stepsAt = text.indexOf('"steps"', Math.max(0, ...starts))

  return starts.map((start, index) => {
    if (start < 0) return []
    const nextStart = starts.slice(index + 1).find((value) => value > start)
    const end = nextStart ?? (stepsAt > start ? stepsAt : text.length)
    const from = byteLength(text.slice(0, start))
    const to = byteLength(text.slice(0, end))
    const seen = new Set()
    const cited = []
    for (const support of supports) {
      const segment = support?.segment || {}
      const segStart = Number(segment.startIndex || 0)
      const segEnd = Number(segment.endIndex || 0)
      if (segEnd <= from || segStart >= to) continue
      for (const chunkIndex of support.groundingChunkIndices || []) {
        const source = sources[chunkIndex]
        if (source && !seen.has(source.url)) {
          seen.add(source.url)
          cited.push(source)
        }
      }
    }
    return cited.slice(0, 3)
  })
}

/**
 * The only shape the browser ever receives. Examples are kept only when the
 * reply was grounded in search, so an ungrounded answer cannot describe events
 * that may not exist.
 */
export function sanitizePlan({ reply, replyText, metadata, categories }) {
  const sources = chunkSources(metadata)
  const allSources = []
  const seen = new Set()
  for (const source of sources) {
    if (source && !seen.has(source.url)) {
      seen.add(source.url)
      allSources.push(source)
    }
  }
  const grounded = allSources.length > 0

  const rawExamples = grounded && Array.isArray(reply?.examples) ? reply.examples.slice(0, 3) : []
  const names = rawExamples.map((example) => clean(example?.name, 90))
  const citations = citeExamples(replyText, names, metadata, sources)
  const examples = rawExamples
    .map((example, index) => ({
      name: names[index],
      place: clean(example?.place, 80),
      why: (Array.isArray(example?.why) ? example.why : []).map((item) => clean(item, 160)).filter(Boolean).slice(0, 3),
      sources: citations[index] || [],
    }))
    .filter((example) => example.name && example.why.length)

  const steps = (Array.isArray(reply?.steps) ? reply.steps : [])
    .map((step) => ({ title: clean(step?.title, 70), detail: clean(step?.detail, 260) }))
    .filter((step) => step.title)
    .slice(0, 7)

  const draft = {
    title: clean(reply?.draft?.title, 80),
    category: pick(reply?.draft?.category, categories),
    description: clean(reply?.draft?.description, 400),
  }

  return {
    summary: clean(reply?.summary, 300),
    examples,
    steps,
    draft,
    sources: allSources.slice(0, 8),
    grounded,
  }
}
