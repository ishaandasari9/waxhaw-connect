import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, ArrowRight, AlertTriangle } from 'lucide-react'
import { findResources, needsUrgentPath } from './assist.js'

/**
 * Takes a render function rather than importing ResourceCard, so matches are
 * drawn by the same component the directory uses and this file never renders
 * resource details itself.
 */
export default function AssistPanel({ copy, renderResource, variant = 'inline', headingId = 'assist-heading' }) {
  const inDrawer = variant === 'drawer'
  const [question, setQuestion] = useState('')
  const [state, setState] = useState({ status: 'idle', results: [], note: '', source: '' })

  async function submit(event) {
    event.preventDefault()
    const query = question.trim()
    if (!query) return

    if (needsUrgentPath(query)) {
      setState({ status: 'urgent', results: [], note: '', source: '' })
      return
    }

    setState({ status: 'loading', results: [], note: '', source: '' })
    const outcome = await findResources(query)
    setState({
      status: outcome.results.length ? 'done' : 'empty',
      results: outcome.results,
      note: outcome.note,
      source: outcome.source,
    })
  }

  return (
    <section className={inDrawer ? 'assist assist--drawer' : 'assist section'} aria-labelledby={headingId}>
      <div className="assist__intro">
        {!inDrawer && <span className="feature-icon"><MessageCircle /></span>}
        <div>
          <h2 id={headingId}>{copy.heading}</h2>
          <p>{copy.intro}</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <label htmlFor="assist-input">{copy.label}</label>
        <div className="assist__field">
          <textarea
            id="assist-input"
            rows={3}
            maxLength={300}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={copy.placeholder}
          />
          <button className="button button--primary" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? copy.looking : copy.find}
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="assist__hint">{copy.hint}</p>
      </form>

      <div className="assist__status" role="status" aria-live="polite">
        {state.status === 'loading' && copy.loading}
        {state.status === 'done' && (state.results.length === 1 ? copy.oneResult : copy.manyResults.replace('{count}', state.results.length))}
        {state.status === 'empty' && copy.noMatch}
        {state.status === 'urgent' && copy.urgentStatus}
      </div>

      {state.status === 'urgent' && (
        <div className="assist__urgent">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{copy.urgentTitle}</strong>
            <p>{copy.urgentIntro}</p>
            <Link className="button button--primary" to="/urgent">{copy.urgentLink} <ArrowRight size={18} /></Link>
          </div>
        </div>
      )}

      {state.status === 'done' && (
        <div className="assist__results">
          {state.source === 'fallback' && <p className="assist__fallback">{copy.fallback}</p>}
          {state.note && <p className="assist__note">{state.note}</p>}
          <div className="related-grid">
            {state.results.map((entry) => (
              <div key={entry.resource.id} className="assist__match">
                {renderResource(entry.resource)}
                {entry.reason && <p className="assist__reason">{entry.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.status === 'empty' && (
        <div className="empty-state">
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyIntro}</p>
          <Link className="button button--secondary" to="/finder">{copy.finderLink} <ArrowRight size={18} /></Link>
        </div>
      )}
    </section>
  )
}
