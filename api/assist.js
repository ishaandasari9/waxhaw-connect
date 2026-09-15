import { resources, categories } from '../src/data.js'

/**
 * The model never writes resource details. It receives a compact index and
 * returns ids only, which the client renders from data.js. A fabricated phone
 * number is therefore not unlikely, it is impossible: no field the model emits
 * ever reaches the page as prose about a service.
 */

const MODEL = 'gemini-2.5-flash-lite'
const MAX_QUESTION = 300
const MAX_PASTE = 2000
const MAX_MATCHES = 4
const TIMEOUT_MS = 9000

/* Best-effort burst protection. Serverless instances are recycled, so this is a
   speed bump against a single abusive client, not a real quota. Vercel Firewall
   is the durable answer if this ever gets real traffic. */
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 25
const hits = new Map()

function overLimit(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 500) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

/* Only the fields needed to choose. Descriptions, phone numbers and hours are
   deliberately withheld so the model cannot quote them back. */
const index = resources.map((resource) => ({
  id: resource.id,
  name: resource.name,
  category: resource.category,
  audiences: resource.audiences,
  keywords: resource.keywords,
}))

const validIds = new Set(resources.map((resource) => resource.id))
const categoryIds = categories.map((category) => category.id)

const FIND_SYSTEM = `You match a resident's plain-language situation to entries in a fixed directory of community resources for Waxhaw, North Carolina.

Directory (JSON):
${JSON.stringify(index)}

Rules:
- Reply with JSON only. No prose, no markdown fences.
- Shape: {"matches":[{"id":"<id>","reason":"<max 12 words>"}],"note":"<max 20 words, or empty>"}
- Every id must be copied exactly from the directory above. Never invent one.
- Return at most ${MAX_MATCHES} matches, best first. Return an empty array if nothing fits.
- "reason" explains why this resource suits the situation described. It must not state hours, cost, phone numbers, eligibility rules or any other detail, because you do not have those and the page shows them from verified records.
- "note" is optional context for the resident, such as suggesting they start with one entry. Never put resource details in it.`

const EXTRACT_SYSTEM = `You extract community event details from text a resident pasted, such as a flyer or an email.

Reply with JSON only. No prose, no markdown fences.
Shape: {"fields":{"title":"","date":"","time":"","location":"","category":"","description":""},"missing":["field names you could not find"]}

Rules:
- "date" must be YYYY-MM-DD, or empty if the text does not state an unambiguous calendar date. Never guess a year and never resolve relative dates like "next Friday".
- "time" is a plain string as written, or empty.
- "category" must be one of: ${categoryIds.join(', ')}, or empty.
- "description" is at most two sentences drawn from the text. Do not invent details.
- Leave a field empty rather than guessing, and list it in "missing".`

async function callModel(system, userText) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 600,
        },
      }),
    })
    if (!response.ok) return null
    const payload = await response.json()
    const parts = payload.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) return null
    const text = parts.map((part) => part.text || '').join('')
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (error) {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false })
  }
  if (!process.env.GEMINI_API_KEY) return res.status(200).json({ ok: false })

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (overLimit(ip)) return res.status(429).json({ ok: false })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const mode = body.mode === 'extract' ? 'extract' : 'find'
  const input = String(body.input || '').slice(0, mode === 'extract' ? MAX_PASTE : MAX_QUESTION).trim()
  if (!input) return res.status(400).json({ ok: false })

  if (mode === 'find') {
    const result = await callModel(FIND_SYSTEM, input)
    if (!result || !Array.isArray(result.matches)) return res.status(200).json({ ok: false })

    /* Second gate. Anything the model returned that is not a real id is dropped
       here, so a hallucinated id can never reach the page. */
    const seen = new Set()
    const matches = result.matches
      .filter((match) => match && validIds.has(match.id) && !seen.has(match.id) && seen.add(match.id))
      .slice(0, MAX_MATCHES)
      .map((match) => ({ id: match.id, reason: String(match.reason || '').slice(0, 90) }))

    return res.status(200).json({ ok: true, matches, note: String(result.note || '').slice(0, 140) })
  }

  const result = await callModel(EXTRACT_SYSTEM, input)
  if (!result || !result.fields) return res.status(200).json({ ok: false })

  const fields = result.fields
  const category = categoryIds.includes(fields.category) ? fields.category : ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(fields.date || '') ? fields.date : ''

  return res.status(200).json({
    ok: true,
    fields: {
      title: String(fields.title || '').slice(0, 120),
      date,
      time: String(fields.time || '').slice(0, 40),
      location: String(fields.location || '').slice(0, 120),
      category,
      description: String(fields.description || '').slice(0, 400),
    },
    missing: Array.isArray(result.missing) ? result.missing.slice(0, 6) : [],
  })
}
