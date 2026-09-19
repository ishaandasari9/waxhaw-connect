/**
 * Measures the three Core Web Vitals on the visitor's own device using browser
 * APIs only. Nothing is sent anywhere, so the About page can show real numbers
 * without an analytics service, a cookie banner or a record of anyone's visit.
 */
export function observeVitals(onChange) {
  if (typeof PerformanceObserver === 'undefined') return () => {}
  const observers = []
  const watch = (type, handle, options = {}) => {
    try {
      const observer = new PerformanceObserver((list) => handle(list.getEntries()))
      observer.observe({ type, buffered: true, ...options })
      observers.push(observer)
    } catch {
      /* An older browser may not support this entry type; the rest still work. */
    }
  }

  watch('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1]
    if (last) onChange('lcp', last.startTime)
  })

  let shift = 0
  watch('layout-shift', (entries) => {
    for (const entry of entries) if (!entry.hadRecentInput) shift += entry.value
    onChange('cls', shift)
  })

  let slowest = 0
  watch('event', (entries) => {
    for (const entry of entries) {
      if (entry.interactionId && entry.duration > slowest) {
        slowest = entry.duration
        onChange('inp', slowest)
      }
    }
  }, { durationThreshold: 16 })

  return () => observers.forEach((observer) => observer.disconnect())
}
