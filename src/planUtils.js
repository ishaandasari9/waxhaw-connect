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
export function describePlanRequest(plan, language) {
  return [
    language === 'es' && 'Write the summary, steps and draft in Spanish.',
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
 * The only shape the browser ever receives. The model chooses which researched
 * examples fit, by id; it never writes the examples themselves. An id it
 * invents is dropped here, so a reader only ever sees entries from the
 * hand-checked playbook.
 */
export function sanitizePlan({ reply, categories, allowedExamples = [] }) {
  const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
  const seen = new Set()
  const exampleIds = (Array.isArray(reply?.exampleIds) ? reply.exampleIds : [])
    .filter((id) => allowedExamples.includes(id) && !seen.has(id) && seen.add(id))
    .slice(0, 3)

  const steps = (Array.isArray(reply?.steps) ? reply.steps : [])
    .map((step) => ({ title: clean(step?.title, 70), detail: clean(step?.detail, 260) }))
    .filter((step) => step.title)
    .slice(0, 7)

  const draft = {
    title: clean(reply?.draft?.title, 80),
    category: categories.includes(reply?.draft?.category) ? reply.draft.category : '',
    description: clean(reply?.draft?.description, 400),
  }

  return { summary: clean(reply?.summary, 300), exampleIds, steps, draft }
}
