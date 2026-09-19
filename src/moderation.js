/**
 * Community moderation, kept as pure functions so the rules are testable and
 * identical everywhere they are applied.
 *
 * A neighbor-posted listing goes live immediately, which is what makes the
 * calendar useful. The safeguard is that residents can report one, and a
 * listing disappears from the public calendar once a few different people do.
 * One person cannot bury someone else's event, and nobody can report twice.
 */

export const REPORT_THRESHOLD = 3

export function reportCount(eventItem) {
  return Array.isArray(eventItem?.reportedBy) ? eventItem.reportedBy.length : 0
}

export function hasReported(eventItem, viewerId) {
  return Boolean(viewerId) && Array.isArray(eventItem?.reportedBy) && eventItem.reportedBy.includes(viewerId)
}

export function isOwner(eventItem, viewerId) {
  return Boolean(viewerId) && eventItem?.organizerId === viewerId
}

/** Hidden from the public calendar, though still visible to whoever posted it. */
export function isHidden(eventItem) {
  return Boolean(eventItem?.communitySubmitted) && reportCount(eventItem) >= REPORT_THRESHOLD
}

/**
 * Returns why the report control is unavailable, or '' when it can be used.
 * Official listings are not reportable: they link to the organization that
 * published them, and a resident disputing one should go to that source.
 */
export function reportBlockedReason(eventItem, viewerId) {
  if (!eventItem?.communitySubmitted) return 'official'
  if (!viewerId) return 'signedOut'
  if (isOwner(eventItem, viewerId)) return 'own'
  if (hasReported(eventItem, viewerId)) return 'already'
  return ''
}

export function canReport(eventItem, viewerId) {
  return reportBlockedReason(eventItem, viewerId) === ''
}

/** The calendar a resident sees: everything except listings others have buried. */
export function visibleEvents(eventItems, viewerId) {
  return eventItems.filter((eventItem) => !isHidden(eventItem) || isOwner(eventItem, viewerId))
}
