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
