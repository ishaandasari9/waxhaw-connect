import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarPlus, CircleAlert, ExternalLink, Info, MapPin, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import PageHero from './PageHero.jsx'
import { planEvent } from './assist.js'
import { PLAN_BUDGETS, PLAN_SEASONS, PLAN_SIZES } from './planUtils.js'
import { playbookEntry } from './eventPlaybook.js'

export const PLAN_DRAFT_KEY = 'waxhaw-plan-draft'

const EMPTY = { idea: '', audience: '', size: '', budget: '', season: 'Not sure yet', goal: '' }

function selectedExamples(plan) {
  return (plan?.exampleIds || []).map(playbookEntry).filter(Boolean)
}

export default function EventPlannerPage({ language, copy }) {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ status: 'idle', plan: null, reason: '' })
  const resultsRef = useRef(null)
  const navigate = useNavigate()

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!form.idea.trim()) return
    setState({ status: 'loading', plan: null, reason: '' })
    const result = await planEvent(form, language)
    setState(result.ok ? { status: 'done', plan: result.plan, reason: '' } : { status: 'failed', plan: null, reason: result.reason })
    window.requestAnimationFrame(() => resultsRef.current?.focus())
  }

  const startOver = () => {
    setForm(EMPTY)
    setState({ status: 'idle', plan: null, reason: '' })
  }

  const postFromPlan = () => {
    /* Session storage carries the draft through the sign-in redirect if needed. */
    try { sessionStorage.setItem(PLAN_DRAFT_KEY, JSON.stringify(state.plan.draft)) } catch { /* storage can be unavailable */ }
    navigate('/events/new', { state: { prefill: state.plan.draft } })
  }

  const busy = state.status === 'loading'
  const plan = state.plan
  /* Example text comes from the checked playbook, never from the model. */
  const examples = selectedExamples(plan)

  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        compact
      />

      <section className="section planner">
        <form className="planner-form" onSubmit={submit}>
          <label className="planner-form__idea">
            {copy.kind}
            <textarea
              required
              rows={3}
              maxLength={240}
              value={form.idea}
              onChange={update('idea')}
              placeholder={copy.ideaPlaceholder}
            />
          </label>

          <div className="planner-form__grid">
            <label>
              <span>{copy.audience} <span className="optional">{copy.optional}</span></span>
              <input maxLength={120} value={form.audience} onChange={update('audience')} placeholder={copy.audiencePlaceholder} />
            </label>
            <label>
              {copy.size}
              <select value={form.size} onChange={update('size')}>
                <option value="">{copy.unsure}</option>
                {PLAN_SIZES.map((size) => <option key={size} value={size}>{copy.sizes[size]}</option>)}
              </select>
            </label>
            <label>
              {copy.budget}
              <select value={form.budget} onChange={update('budget')}>
                <option value="">{copy.unsure}</option>
                {PLAN_BUDGETS.map((budget) => <option key={budget} value={budget}>{copy.budgets[budget]}</option>)}
              </select>
            </label>
            <label>
              {copy.season}
              <select value={form.season} onChange={update('season')}>
                {PLAN_SEASONS.map((season) => <option key={season} value={season}>{copy.seasons[season]}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>{copy.success} <span className="optional">{copy.optional}</span></span>
            <input maxLength={240} value={form.goal} onChange={update('goal')} placeholder={copy.successPlaceholder} />
          </label>

          <div className="planner-form__actions">
            <button className="button button--primary" disabled={busy}>
              <Search /> {busy ? copy.looking : copy.build}
            </button>
            {state.status !== 'idle' && !busy && (
              <button type="button" className="button button--secondary" onClick={startOver}>
                <RotateCcw /> {copy.startOver}
              </button>
            )}
          </div>
          <p className="planner-form__hint">
            <Info aria-hidden="true" /> {copy.hint}
          </p>
        </form>

        <div className="planner-output" ref={resultsRef} tabIndex={-1} aria-live="polite" aria-busy={busy}>
          {state.status === 'idle' && (
            <div className="planner-idle">
              <h2>{copy.how}</h2>
              <ol>
                <li><strong>{copy.describeTitle}</strong> {copy.describe}</li>
                <li><strong>{copy.elsewhereTitle}</strong> {copy.elsewhere}</li>
                <li><strong>{copy.waxhawTitle}</strong> {copy.waxhaw}</li>
              </ol>
            </div>
          )}

          {busy && (
            <div className="planner-loading" role="status">
              <span className="planner-loading__bar" aria-hidden="true" />
              <p>{copy.searching}</p>
            </div>
          )}

          {state.status === 'failed' && (
            <p className="form-error" role="alert"><CircleAlert /> {copy.failures[state.reason] || copy.failures.error}</p>
          )}

          {state.status === 'done' && plan && (
            <>
              <h2 className="visually-hidden">{copy.planHeading}</h2>
              {plan.summary && <p className="planner-summary">{plan.summary}</p>}

              <section className="planner-block" aria-labelledby="planner-examples">
                <h3 id="planner-examples">{copy.worked}</h3>
                {examples.length ? (
                  <>
                    <p className="planner-note planner-note--verified">{copy.verified}</p>
                    <div className="planner-examples">
                      {examples.map((example) => (
                        <article key={example.id} className="planner-example">
                          <h4>{example.name}</h4>
                          <p className="planner-example__place"><MapPin aria-hidden="true" /> {example.place}</p>
                          <ul>
                            {(language === 'es' ? example.whyEs : example.why).map((reason) => <li key={reason}>{reason}</li>)}
                          </ul>
                          <p className="planner-example__sources">
                            {copy.source}:{' '}
                            <a href={example.source.url} target="_blank" rel="noreferrer">{example.source.label}<ExternalLink aria-hidden="true" /></a>
                          </p>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="planner-note">{copy.noClose}</p>
                )}
              </section>

              <section className="planner-block" aria-labelledby="planner-steps">
                <h3 id="planner-steps">{copy.yourPlan}</h3>
                <ol className="planner-steps">
                  {plan.steps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      {step.detail && <p>{step.detail}</p>}
                    </li>
                  ))}
                </ol>
              </section>

              <div className="planner-check">
                <ShieldCheck aria-hidden="true" />
                <p>
                  {copy.grounded}{' '}
                  {copy.confirm}{' '}
                  <a href="https://www.waxhaw.com/" target="_blank" rel="noreferrer">{copy.town}</a> {copy.confirmEnd}
                </p>
              </div>

              <div className="planner-actions">
                <button type="button" className="button button--primary" onClick={postFromPlan}>
                  <CalendarPlus /> {copy.post}
                </button>
                <Link className="text-link" to="/events">{copy.back} <ArrowRight /></Link>
              </div>

            </>
          )}
        </div>
      </section>
    </>
  )
}
