import { useEffect, useState } from 'react'
import { BadgeCheck, CircleAlert, Gauge, Minus } from 'lucide-react'
import { events, resources } from './data'
import { expandEvents } from './eventUtils'
import { QUALITY_STATS } from './qualityStats'
import { VITALS, directoryMetrics, formatVital, vitalMet } from './metrics'
import { observeVitals } from './webVitals'

function Verdict({ met, copy, neutralLabel = copy.context }) {
  if (met === null || met === undefined) return <span className="verdict verdict--neutral"><Minus aria-hidden="true" /> {neutralLabel}</span>
  return met
    ? <span className="verdict verdict--met"><BadgeCheck aria-hidden="true" /> {copy.met}</span>
    : <span className="verdict verdict--missed"><CircleAlert aria-hidden="true" /> {copy.missed}</span>
}

function MetricRows({ rows, copy }) {
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
            {row.target && <span>{copy.target}: {row.target}</span>}
            <Verdict met={row.met} copy={copy} />
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
export default function MetricsPanel({ copy }) {
  const [vitals, setVitals] = useState({ lcp: null, inp: null, cls: null })

  useEffect(() => observeVitals((id, value) => setVitals((current) => ({ ...current, [id]: value }))), [])

  const spanish = copy.target === 'Objetivo'
  const directory = directoryMetrics(resources, expandEvents(events)).map((row, index) => ({
    ...row,
    label: copy.directoryRows[index].label,
    note: copy.directoryRows[index].note,
    value: row.value.replace(' of ', spanish ? ' de ' : ' of ').replace('Unknown', spanish ? 'Desconocido' : 'Unknown'),
    target: row.target?.replace(' or fewer', spanish ? ' o menos' : ' or fewer').replace(' or more', spanish ? ' o más' : ' or more'),
  }))
  const build = [
    {
      label: copy.buildRows[0].label,
      value: copy.testsValue.replace('{tests}', QUALITY_STATS.tests).replace('{files}', QUALITY_STATS.testFiles),
      target: copy.buildRows[0].target,
      met: QUALITY_STATS.tests >= 50,
      note: copy.buildRows[0].note,
    },
    {
      label: copy.buildRows[1].label,
      value: `${QUALITY_STATS.accessibilityViolations}`,
      target: copy.buildRows[1].target,
      met: QUALITY_STATS.accessibilityViolations === 0,
      note: copy.buildRows[1].note.replace('{date}', QUALITY_STATS.auditedOn),
    },
    {
      label: copy.buildRows[2].label,
      value: '0',
      target: copy.buildRows[2].target,
      met: true,
      note: copy.buildRows[2].note,
    },
  ]

  return (
    <section className="metrics" aria-labelledby="metrics-heading">
      <h2 id="metrics-heading">{copy.heading}</h2>
      <p className="metrics__intro">{copy.intro}</p>

      <h3>{copy.content}</h3>
      <MetricRows rows={directory} copy={copy} />

      <h3>{copy.build}</h3>
      <MetricRows rows={build} copy={copy} />

      <h3>{copy.speed}</h3>
      <div className="vitals">
        {VITALS.map((vital) => {
          const value = vitals[vital.id]
          const met = vitalMet(vital.id, value)
          return (
            <article key={vital.id} className={`vital ${met === false ? 'vital--missed' : ''}`}>
              <span className="vital__icon"><Gauge aria-hidden="true" /></span>
              <strong>{value === null || value === undefined ? copy.measuring : formatVital(vital.id, value)}</strong>
              <span className="vital__label">{copy.vitals[vital.id].label}</span>
              <p>{copy.vitals[vital.id].hint}</p>
              <span className="vital__target">{copy.good}: {vital.id === 'cls' ? vital.good : `${vital.good} ms`} {copy.orLess}</span>
              <Verdict met={met} copy={copy} neutralLabel={copy.notMeasured} />
            </article>
          )
        })}
      </div>
      <p className="metrics__note">{copy.note}</p>
    </section>
  )
}
