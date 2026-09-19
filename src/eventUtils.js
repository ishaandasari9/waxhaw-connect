export const eventInterests = [
  'Music',
  'Family',
  'Festival',
  'Civic',
  'Learning',
  'Wellness',
  'Volunteering',
  'Sports',
  'Arts & Culture',
]

export function rankEventsForUser(eventItems, interests = []) {
  const selected = new Set(interests)
  return [...eventItems].sort((a, b) => {
    const scoreDifference = Number(selected.has(b.category)) - Number(selected.has(a.category))
    return scoreDifference || a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
  })
}

export function getRecommendationReason(eventItem, interests = []) {
  return interests.includes(eventItem.category) ? `Because you like ${eventItem.category.toLowerCase()} events` : ''
}

/* ---------- Dates ---------- */

/**
 * Today in the town's own terms. `new Date().toISOString()` is UTC, which
 * after 8pm Eastern is already tomorrow, so it used to block same-day posts
 * and hide same-day events.
 */
export function todayISO(now = new Date(), timeZone = 'America/New_York') {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** An event counts as upcoming for its whole day, not until midnight UTC. */
export function isUpcoming(eventItem, today = todayISO()) {
  return Boolean(eventItem?.date) && eventItem.date >= today
}

export function upcomingEvents(eventItems, today = todayISO()) {
  return eventItems.filter((eventItem) => isUpcoming(eventItem, today))
}

/* ---------- Calendar files ---------- */

/** Minutes the zone is offset from UTC on a given date, e.g. -240 in July. */
function zoneOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date)
  const name = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT+00:00'
  const match = name.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3]))
}

/** "7:00 PM" to minutes after midnight, or null if it isn't a clock time. */
export function parseClockTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/)
  if (!match) return null
  const hour = Number(match[1]) % 12
  const minutes = Number(match[2] || 0)
  if (hour > 11 || minutes > 59) return null
  return (hour + (/[Pp]/.test(match[3]) ? 12 : 0)) * 60 + minutes
}

/** Splits "7:00 PM-9:00 PM" or "10:00 AM - 4:00 PM" into start and end. */
export function parseEventTime(value) {
  const [start, end] = String(value || '').split(/\s*(?:-|–|—|\bto\b)\s*/i)
  const startMinutes = parseClockTime(start)
  if (startMinutes === null) return null
  const endMinutes = parseClockTime(end)
  return { start: startMinutes, end: endMinutes !== null && endMinutes > startMinutes ? endMinutes : startMinutes + 60 }
}

const pad = (value) => String(value).padStart(2, '0')

/** Local wall-clock minutes on a date, written as the UTC stamp calendars expect. */
function utcStamp(dateISO, minutes, timeZone) {
  const [year, month, day] = dateISO.split('-').map(Number)
  const guess = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
  const offset = zoneOffsetMinutes(new Date(guess), timeZone)
  const moment = new Date(guess - offset * 60000)
  return `${moment.getUTCFullYear()}${pad(moment.getUTCMonth() + 1)}${pad(moment.getUTCDate())}T${pad(moment.getUTCHours())}${pad(moment.getUTCMinutes())}00Z`
}

/* Commas, semicolons and backslashes carry meaning in a calendar file. */
function escapeText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/* Calendar files wrap at 75 octets, with continuation lines starting with a space. */
function foldLine(line) {
  const bytes = [...new TextEncoder().encode(line)]
  if (bytes.length <= 75) return line
  const chunks = []
  let index = 0
  while (index < bytes.length) {
    const size = index === 0 ? 75 : 74
    chunks.push(new TextDecoder().decode(new Uint8Array(bytes.slice(index, index + size))))
    index += size
  }
  return chunks.join('\r\n ')
}

/**
 * A calendar file that Outlook, Apple Calendar and Google all accept. The old
 * version skipped UID and DTSTAMP, which the spec requires, and made every
 * event all-day even when a start time was listed.
 */
export function buildIcs(eventItem, { now = new Date(), timeZone = 'America/New_York' } = {}) {
  const times = parseEventTime(eventItem.time)
  const stamp = `${now.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Waxhaw Connect//Community Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventItem.id}@waxhaw-connect.vercel.app`,
    `DTSTAMP:${stamp}`,
  ]
  if (times) {
    lines.push(`DTSTART:${utcStamp(eventItem.date, times.start, timeZone)}`)
    lines.push(`DTEND:${utcStamp(eventItem.date, times.end, timeZone)}`)
  } else {
    const [year, month, day] = eventItem.date.split('-').map(Number)
    const next = new Date(Date.UTC(year, month - 1, day + 1))
    lines.push(`DTSTART;VALUE=DATE:${eventItem.date.replaceAll('-', '')}`)
    lines.push(`DTEND;VALUE=DATE:${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`)
  }
  lines.push(`SUMMARY:${escapeText(eventItem.title)}`)
  if (eventItem.location) lines.push(`LOCATION:${escapeText(eventItem.address || eventItem.location)}`)
  if (eventItem.description) lines.push(`DESCRIPTION:${escapeText(eventItem.description)}`)
  if (eventItem.sourceUrl) lines.push(`URL:${escapeText(eventItem.sourceUrl)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

/**
 * Merges fields read from a pasted flyer into the post-event form. Only fills
 * what it can verify: a known category, a date that is not in the past, and a
 * time it could actually parse. Returns the new form plus what was and was not
 * filled, so the page can tell the resident what still needs checking.
 */
export function applyExtractedFields(form, fields = {}, today = todayISO()) {
  const next = { ...form }
  const filled = []
  const asClock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  const set = (key, value, label = key) => { next[key] = value; filled.push(label) }

  if (fields.title) set('title', String(fields.title).slice(0, 80))
  if (fields.description) set('description', String(fields.description).slice(0, 400))
  if (fields.location) set('location', String(fields.location).slice(0, 120))
  if (eventInterests.includes(fields.category)) set('category', fields.category)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fields.date || '') && fields.date >= today) set('date', fields.date)
  const times = parseEventTime(fields.time)
  if (times) {
    next.startTime = asClock(times.start)
    next.endTime = asClock(times.end)
    filled.push('time')
  }
  const wanted = ['title', 'description', 'location', 'category', 'date', 'time']
  return { form: next, filled, missing: wanted.filter((field) => !filled.includes(field)) }
}
