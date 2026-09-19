import { placeFor } from './distance.js'
import { upcomingEvents } from './eventUtils.js'

/**
 * Every number the About page shows is computed here from the site's own data,
 * so a stale claim is impossible: change the directory and the figure moves.
 * Nothing is typed in by hand except the targets we hold ourselves to.
 */

export const FRESHNESS_DAYS = 90
export const REVIEW_TARGET_DAYS = 30
export const EVENT_TARGET = 8

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0)

export function daysSince(dateText, now = new Date()) {
  const parsed = Date.parse(dateText)
  if (Number.isNaN(parsed)) return null
  return Math.floor((now - parsed) / 86400000)
}

/** The most recent verification date across the directory. */
export function lastReviewed(resourceList) {
  const stamps = resourceList.map((item) => Date.parse(item.verified)).filter((value) => !Number.isNaN(value))
  return stamps.length ? new Date(Math.max(...stamps)) : null
}

/**
 * Returns rows of { label, value, target, met, note }. `met` is null where a
 * figure is context rather than a goal, so the page does not pretend a neutral
 * number is a pass or a failure.
 */
export function directoryMetrics(resourceList, eventList, now = new Date()) {
  const total = resourceList.length
  const sourced = resourceList.filter((item) => item.sourceUrl).length
  const bilingual = resourceList.filter((item) => item.descriptionEs).length
  const fresh = resourceList.filter((item) => {
    const age = daysSince(item.verified, now)
    return age !== null && age <= FRESHNESS_DAYS
  }).length
  const visitable = resourceList.filter((item) => placeFor(item)).length
  const reviewed = lastReviewed(resourceList)
  const reviewAge = reviewed ? daysSince(reviewed.toISOString(), now) : null
  const upcoming = upcomingEvents(eventList).length

  return [
    {
      label: 'Listings with a link to their original source',
      value: `${percent(sourced, total)}% (${sourced} of ${total})`,
      target: '100%',
      met: sourced === total,
      note: 'A resident can check every claim against the organization that made it.',
    },
    {
      label: `Listings verified in the last ${FRESHNESS_DAYS} days`,
      value: `${percent(fresh, total)}% (${fresh} of ${total})`,
      target: '100%',
      met: fresh === total,
      note: 'Hours, eligibility and phone numbers change, so an unchecked listing is a wrong listing.',
    },
    {
      label: 'Listings written in English and Spanish',
      value: `${percent(bilingual, total)}% (${bilingual} of ${total})`,
      target: '100%',
      met: bilingual === total,
      note: 'Union County households speak Spanish at home in meaningful numbers.',
    },
    {
      label: 'Days since the last directory review',
      value: reviewAge === null ? 'Unknown' : `${reviewAge}`,
      target: `${REVIEW_TARGET_DAYS} or fewer`,
      met: reviewAge !== null && reviewAge <= REVIEW_TARGET_DAYS,
      note: 'Measured from the newest verification date in the directory.',
    },
    {
      label: 'Upcoming events on the calendar',
      value: `${upcoming}`,
      target: `${EVENT_TARGET} or more`,
      met: upcoming >= EVENT_TARGET,
      note: 'Past events are removed automatically, so this figure only counts events a resident could still attend.',
    },
    {
      label: 'Listings a resident can travel to',
      value: `${visitable} of ${total}`,
      target: null,
      met: null,
      note: 'The rest are phone, countywide or online services, plus one shelter whose location is confidential.',
    },
  ]
}

/**
 * Thresholds come from Google's Core Web Vitals guidance. The site measures
 * these on the visitor's own device and shows them immediately; nothing is
 * uploaded, stored or tied to a person.
 */
export const VITALS = [
  { id: 'lcp', label: 'Largest contentful paint', good: 2500, unit: 'ms', hint: 'How long until the main content appears.' },
  { id: 'inp', label: 'Interaction to next paint', good: 200, unit: 'ms', hint: 'How quickly the page answers a tap or click.' },
  { id: 'cls', label: 'Cumulative layout shift', good: 0.1, unit: '', hint: 'How much the page moves around while loading.' },
]

export function formatVital(id, value) {
  if (value === null || value === undefined) return 'Measuring'
  if (id === 'cls') return value.toFixed(3)
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`
}

export function vitalMet(id, value) {
  if (value === null || value === undefined) return null
  const vital = VITALS.find((item) => item.id === id)
  return vital ? value <= vital.good : null
}
