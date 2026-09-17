import { resources } from './data.js'

/**
 * Everything here runs before and around the network call, so the helper stays
 * useful when the endpoint is missing, rate limited or offline. The guided
 * finder and the directory search remain the primary paths; this is the door
 * for people who describe a situation rather than name a service.
 */

/* Checked locally, before any request. Someone in danger should never wait on
   an API, and the urgent pathway must work with the network down. */
const URGENT_PATTERNS = [
  /\bsuicid/i,
  /\bkill (myself|him|her|them)\b/i,
  /\bhurt(ing)? (myself|me)\b/i,
  /\bend (my|it) (life|all)\b/i,
  /\boverdos/i,
  /\b(he|she|they|someone) (hit|hits|hurt|hurts|beat|beats) (me|us)\b/i,
  /\b(not|n't) safe (at home|here)\b/i,
  /\bdomestic (violence|abuse)\b/i,
  /\bbeing abused\b/i,
  /\bemergency\b/i,
]

export function needsUrgentPath(text) {
  return URGENT_PATTERNS.some((pattern) => pattern.test(text))
}

/* The same matching the directory search uses, so a failed request degrades to
   the behaviour residents already get rather than to nothing. */
export function keywordFallback(query, limit = 4) {
  const words = query.toLowerCase().trim().split(/\s+/).filter((word) => word.length > 2)
  if (!words.length) return []
  return resources
    .map((resource) => {
      const haystack = [
        resource.name,
        resource.description,
        resource.category,
        ...resource.keywords,
        ...resource.audiences,
      ]
        .join(' ')
        .toLowerCase()
      return { resource, score: words.filter((word) => haystack.includes(word)).length }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({ resource: entry.resource, reason: '' }))
}

function byId(id) {
  return resources.find((resource) => resource.id === id)
}

/**
 * Resolves to { source, results, note }. `source` is 'model' or 'fallback', so
 * the interface can tell the resident which one they are looking at instead of
 * silently presenting weaker results as if they were the same thing.
 */
export async function findResources(question) {
  const query = String(question || '').trim().slice(0, 300)
  if (!query) return { source: 'fallback', results: [], note: '' }

  try {
    const response = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'find', input: query }),
    })
    if (!response.ok) throw new Error('assist unavailable')
    const payload = await response.json()
    if (!payload.ok) throw new Error('assist declined')

    /* Third gate, in the browser this time. Only ids that resolve to a real
       record are rendered, whatever came back over the wire. */
    const results = payload.matches
      .map((match) => ({ resource: byId(match.id), reason: match.reason }))
      .filter((entry) => entry.resource)

    if (!results.length) return { source: 'fallback', results: keywordFallback(query), note: '' }
    return { source: 'model', results, note: payload.note || '' }
  } catch (error) {
    return { source: 'fallback', results: keywordFallback(query), note: '' }
  }
}

export async function extractEventFields(pastedText) {
  const input = String(pastedText || '').trim().slice(0, 2000)
  if (!input) return null
  try {
    const response = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'extract', input }),
    })
    if (!response.ok) return null
    const payload = await response.json()
    return payload.ok ? payload : null
  } catch (error) {
    return null
  }
}

/**
 * Resolves to { ok: true, plan } or { ok: false, reason }. `reason` lets the
 * page tell a rate limit apart from a connection problem.
 */
export async function planEvent(input) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, reason: 'offline' }
  try {
    const response = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'plan', input }),
    })
    if (response.status === 429) return { ok: false, reason: 'limit' }
    if (!response.ok) return { ok: false, reason: 'error' }
    const payload = await response.json()
    return payload.ok && payload.plan ? { ok: true, plan: payload.plan } : { ok: false, reason: 'error' }
  } catch (error) {
    return { ok: false, reason: 'offline' }
  }
}
