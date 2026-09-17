import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarPlus, CircleAlert, ExternalLink, Info, MapPin, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import PageHero from './PageHero.jsx'
import { planEvent } from './assist.js'
import { PLAN_BUDGETS, PLAN_SEASONS, PLAN_SIZES } from './planUtils.js'

export const PLAN_DRAFT_KEY = 'waxhaw-plan-draft'

const EMPTY = { idea: '', audience: '', size: '', budget: '', season: 'Not sure yet', goal: '' }

const FAILURE_COPY = {
  limit: 'You have made several plans in the last hour. Wait a little while, then try again.',
  offline: 'The planner needs an internet connection to look up other events. Reconnect and try again.',
  error: 'The planner could not build a plan this time. Try again, or describe your event in a different way.',
}

export default function EventPlannerPage() {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ status: 'idle', plan: null, reason: '' })
  const resultsRef = useRef(null)
  const navigate = useNavigate()

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    if (!form.idea.trim()) return
    setState({ status: 'loading', plan: null, reason: '' })
    const result = await planEvent(form)
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

  return (
    <>
      <PageHero
        eyebrow="Event planner"
        title="Plan an event people will show up for"
        intro="Describe what you have in mind. We look up similar events in other towns, show why they worked, and turn that into a plan for Waxhaw."
        compact
      />

      <section className="section planner">
        <form className="planner-form" onSubmit={submit}>
          <label className="planner-form__idea">
            What kind of event do you want to host?
            <textarea
              required
              rows={3}
              maxLength={240}
              value={form.idea}
              onChange={update('idea')}
              placeholder="A Saturday morning makers market with local food trucks and live music"
            />
          </label>

          <div className="planner-form__grid">
            <label>
              <span>Who is it for? <span className="optional">(optional)</span></span>
              <input maxLength={120} value={form.audience} onChange={update('audience')} placeholder="Families with young kids" />
            </label>
            <label>
              Expected size
              <select value={form.size} onChange={update('size')}>
                <option value="">Not sure yet</option>
                {PLAN_SIZES.map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
            <label>
              Budget
              <select value={form.budget} onChange={update('budget')}>
                <option value="">Not sure yet</option>
                {PLAN_BUDGETS.map((budget) => <option key={budget}>{budget}</option>)}
              </select>
            </label>
            <label>
              Season
              <select value={form.season} onChange={update('season')}>
                {PLAN_SEASONS.map((season) => <option key={season}>{season}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>What would make it a success? <span className="optional">(optional)</span></span>
            <input maxLength={240} value={form.goal} onChange={update('goal')} placeholder="Neighbors meet each other and local vendors make sales" />
          </label>

          <div className="planner-form__actions">
            <button className="button button--primary" disabled={busy}>
              <Search /> {busy ? 'Looking up similar events' : 'Build my plan'}
            </button>
            {state.status !== 'idle' && !busy && (
              <button type="button" className="button button--secondary" onClick={startOver}>
                <RotateCcw /> Start over
              </button>
            )}
          </div>
          <p className="planner-form__hint">
            <Info aria-hidden="true" /> Takes about 15 seconds. Don't include names, phone numbers or addresses.
          </p>
        </form>

        <div className="planner-output" ref={resultsRef} tabIndex={-1} aria-live="polite" aria-busy={busy}>
          {state.status === 'idle' && (
            <div className="planner-idle">
              <h2>How the planner works</h2>
              <ol>
                <li><strong>Describe your event.</strong> A sentence is enough. Size and budget sharpen the advice.</li>
                <li><strong>See what worked elsewhere.</strong> A live search finds similar events in other towns, with links to where each detail came from.</li>
                <li><strong>Get a plan for Waxhaw.</strong> Steps in order, then one click to start your calendar listing.</li>
              </ol>
            </div>
          )}

          {busy && (
            <div className="planner-loading" role="status">
              <span className="planner-loading__bar" aria-hidden="true" />
              <p>Searching for similar events and reading what made them work.</p>
            </div>
          )}

          {state.status === 'failed' && (
            <p className="form-error" role="alert"><CircleAlert /> {FAILURE_COPY[state.reason] || FAILURE_COPY.error}</p>
          )}

          {state.status === 'done' && plan && (
            <>
              <h2 className="visually-hidden">Your event plan</h2>
              {plan.summary && <p className="planner-summary">{plan.summary}</p>}

              <section className="planner-block" aria-labelledby="planner-examples">
                <h3 id="planner-examples">What worked elsewhere</h3>
                {plan.examples.length ? (
                  <div className="planner-examples">
                    {plan.examples.map((example) => (
                      <article key={example.name} className="planner-example">
                        <h4>{example.name}</h4>
                        {example.place && <p className="planner-example__place"><MapPin aria-hidden="true" /> {example.place}</p>}
                        <ul>
                          {example.why.map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                        {example.sources.length > 0 && (
                          <p className="planner-example__sources">
                            Source{example.sources.length > 1 ? 's' : ''}:{' '}
                            {example.sources.map((source, index) => (
                              <span key={source.url}>
                                {index > 0 && ', '}
                                <a href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink aria-hidden="true" /></a>
                              </span>
                            ))}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="planner-note">
                    {plan.grounded
                      ? 'The search did not turn up events close enough to yours to compare. The plan below is still built for your idea.'
                      : 'We could not confirm real examples with a live search this time, so none are shown. The plan below is still built for your idea.'}
                  </p>
                )}
              </section>

              <section className="planner-block" aria-labelledby="planner-steps">
                <h3 id="planner-steps">Your plan for Waxhaw</h3>
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
                  These ideas are AI-generated from public web pages. Confirm permits, venues and costs with the{' '}
                  <a href="https://www.waxhaw.com/" target="_blank" rel="noreferrer">Town of Waxhaw</a> before you book anything.
                </p>
              </div>

              <div className="planner-actions">
                <button type="button" className="button button--primary" onClick={postFromPlan}>
                  <CalendarPlus /> Post this event
                </button>
                <Link className="text-link" to="/events">Back to the calendar <ArrowRight /></Link>
              </div>

              {plan.sources.length > 0 && (
                <details className="planner-sources">
                  <summary>Every page the search used ({plan.sources.length})</summary>
                  <ul>
                    {plan.sources.map((source) => (
                      <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink aria-hidden="true" /></a></li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
