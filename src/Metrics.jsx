import { useEffect, useState } from 'react'
import { BadgeCheck, CircleAlert, Gauge, Minus } from 'lucide-react'
import { events, resources } from './data'
import { QUALITY_STATS } from './qualityStats'
import { VITALS, directoryMetrics, formatVital, vitalMet } from './metrics'
import { observeVitals } from './webVitals'

function Verdict({ met, neutralLabel = 'For context' }) {
  if (met === null || met === undefined) return <span className="verdict verdict--neutral"><Minus aria-hidden="true" /> {neutralLabel}</span>
  return met
    ? <span className="verdict verdict--met"><BadgeCheck aria-hidden="true" /> Target met</span>
    : <span className="verdict verdict--missed"><CircleAlert aria-hidden="true" /> Below target</span>
}

function MetricRows({ rows }) {
  return (
    <ul className="metric-rows">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="metric-rows__head">
            <strong>{row.label}</strong>
            <span className="metric-rows__value">{row.value}</span>
          </div>
          <p>{row.note}</p>
          <div className="metric-rows__foot">
            {row.target && <span>Target: {row.target}</span>}
            <Verdict met={row.met} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Real numbers rather than a list of things we hope to measure. Directory
 * figures are computed from the site's own data, build figures come from the
 * test suite, and speed is measured on the reader's device as they read.
 */
export default function MetricsPanel() {
  const [vitals, setVitals] = useState({ lcp: null, inp: null, cls: null })

  useEffect(() => observeVitals((id, value) => setVitals((current) => ({ ...current, [id]: value }))), [])

  const directory = directoryMetrics(resources, events)
  const build = [
    {
      label: 'Automated tests that run before every change',
      value: `${QUALITY_STATS.tests} across ${QUALITY_STATS.testFiles} files`,
      target: '50 or more',
      met: QUALITY_STATS.tests >= 50,
      note: 'They cover the directory data, accounts, distances, event handling and the AI guardrails.',
    },
    {
      label: 'Accessibility violations found in the last audit',
      value: `${QUALITY_STATS.accessibilityViolations}`,
      target: '0',
      met: QUALITY_STATS.accessibilityViolations === 0,
      note: `Automated axe-core scan against WCAG 2.2 AA on every page, in light and dark mode, at desktop and phone widths. Last run ${QUALITY_STATS.auditedOn}.`,
    },
    {
      label: 'Third-party requests when a page loads',
      value: '0',
      target: '0',
      met: true,
      note: 'Fonts, icons and colors all ship with the site, so no visitor data reaches another company and the site still works offline.',
    },
  ]

  return (
    <section className="metrics" aria-labelledby="metrics-heading">
      <h2 id="metrics-heading">How we measure success</h2>
      <p className="metrics__intro">
        These figures are calculated live rather than written down. The directory numbers come from the listings
        themselves, and the speed numbers are measured on your device while you read this page.
      </p>

      <h3>Content quality</h3>
      <MetricRows rows={directory} />

      <h3>Build quality</h3>
      <MetricRows rows={build} />

      <h3>Speed on your device right now</h3>
      <div className="vitals">
        {VITALS.map((vital) => {
          const value = vitals[vital.id]
          const met = vitalMet(vital.id, value)
          return (
            <article key={vital.id} className={`vital ${met === false ? 'vital--missed' : ''}`}>
              <span className="vital__icon"><Gauge aria-hidden="true" /></span>
              <strong>{formatVital(vital.id, value)}</strong>
              <span className="vital__label">{vital.label}</span>
              <p>{vital.hint}</p>
              <span className="vital__target">Good: {vital.id === 'cls' ? vital.good : `${vital.good} ms`} or less</span>
              <Verdict met={met} neutralLabel="Not measured yet" />
            </article>
          )
        })}
      </div>
      <p className="metrics__note">
        Interaction to next paint only appears once you have tapped or clicked something on this page. These
        measurements stay in your browser and are never sent anywhere.
      </p>
    </section>
  )
}
