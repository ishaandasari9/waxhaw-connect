import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, ArrowRight, AlertTriangle } from 'lucide-react'
import { findResources, needsUrgentPath } from './assist.js'

/**
 * Takes a render function rather than importing ResourceCard, so matches are
 * drawn by the same component the directory uses and this file never renders
 * resource details itself.
 */
export default function AssistPanel({ renderResource }) {
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
    <section className="assist section" aria-labelledby="assist-heading">
      <div className="assist__intro">
        <span className="feature-icon"><MessageCircle /></span>
        <div>
          <h2 id="assist-heading">Describe your situation</h2>
          <p>If you are not sure what to search for, say what is going on in your own words and we will point you to listings that may fit.</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <label htmlFor="assist-input">What is happening?</label>
        <div className="assist__field">
          <textarea
            id="assist-input"
            rows={3}
            maxLength={300}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: my mother stopped driving and cannot get to her appointments"
          />
          <button className="button button--primary" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Looking' : 'Find listings'}
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="assist__hint">Suggestions come from this site's verified directory. Every detail shown below is from the listing itself.</p>
      </form>

      <div className="assist__status" role="status" aria-live="polite">
        {state.status === 'loading' && 'Looking through the directory.'}
        {state.status === 'done' && `${state.results.length} suggested ${state.results.length === 1 ? 'listing' : 'listings'} below.`}
        {state.status === 'empty' && 'No close match found.'}
        {state.status === 'urgent' && 'Urgent help options shown below.'}
      </div>

      {state.status === 'urgent' && (
        <div className="assist__urgent">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>If someone is in danger, get help now</strong>
            <p>Call 911 for an emergency. Call or text 988 for the Suicide and Crisis Lifeline.</p>
            <Link className="button button--primary" to="/urgent">See urgent help <ArrowRight size={18} /></Link>
          </div>
        </div>
      )}

      {state.status === 'done' && (
        <div className="assist__results">
          {state.source === 'fallback' && <p className="assist__fallback">Showing keyword matches. The guided finder may work better for this.</p>}
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
          <h3>We could not find a close match</h3>
          <p>Try the guided finder, or call NC 211 to speak with a specialist.</p>
          <Link className="button button--secondary" to="/finder">Use guided finder <ArrowRight size={18} /></Link>
        </div>
      )}
    </section>
  )
}
