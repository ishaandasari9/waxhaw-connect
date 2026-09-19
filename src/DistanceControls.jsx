import { useContext, useId, useState } from 'react'
import { LocateFixed, MapPin, Navigation, X } from 'lucide-react'
import { describeDistance, directionsUrl, placeFor } from './distance.js'
import { DistanceContext } from './distanceContext.js'

const DEFAULT_LABELS = {
  directions: 'Get directions', newTab: ' (opens in a new tab)', distanceExact: 'Straight-line distance from your location', distanceZip: 'Approximate straight-line distance based on ZIP code',
  error1: 'Location access is off for this site. Enter a ZIP code instead.', error2: 'Your device could not find its location. Enter a ZIP code instead.', error3: 'Finding your location took too long. Try again or enter a ZIP code.', unavailable: 'Location is not available on this device. Enter a ZIP code instead.',
  distancesFrom: 'Distances from', currentLocation: 'your current location', change: 'Change', stop: 'Stop showing distances', howFar: 'How far away is it?', zip: 'ZIP code', show: 'Show distances', or: 'or', locating: 'Locating', useLocation: 'Use my location', cancel: 'Cancel', hint: 'Your location stays in this browser. Distances are straight-line, not driving.', sort: 'Sort', nearest: 'Nearest first', within: 'Within', anyDistance: 'Any distance', miles: 'miles',
}

/**
 * Asks where to measure from. Nothing is requested until the resident acts,
 * and the page says plainly where that information goes.
 */
export function LocationPicker({ compact = false, labels = DEFAULT_LABELS }) {
  const { origin, setZip, locateDevice, clearOrigin, locating } = useContext(DistanceContext)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const inputId = useId()
  const errorId = useId()

  const submit = (event) => {
    event.preventDefault()
    const result = setZip(value)
    if (!result.ok) return setError(result.error)
    setError('')
    setEditing(false)
    setValue('')
  }

  const locate = async () => {
    setError('')
    const result = await locateDevice()
    if (!result.ok) setError(labels[`error${result.code}`] || labels.unavailable)
    else setEditing(false)
  }

  if (origin && !editing) {
    const from = origin.source === 'zip' ? `${labels.zip} ${origin.zip} (${origin.label})` : labels.currentLocation
    return (
      <div className={`location-picker location-picker--set ${compact ? 'location-picker--compact' : ''}`}>
        <MapPin aria-hidden="true" />
        <p><span>{labels.distancesFrom}</span> <strong>{from}</strong></p>
        <button type="button" className="text-button" onClick={() => setEditing(true)}>{labels.change}</button>
        <button type="button" className="icon-button icon-button--small" onClick={clearOrigin} aria-label={labels.stop}><X /></button>
      </div>
    )
  }

  return (
    <form className={`location-picker ${compact ? 'location-picker--compact' : ''}`} onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{labels.howFar}</label>
      <div className="location-picker__row">
        <input
          id={inputId}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder={labels.zip}
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
        />
        <button className="button button--secondary" type="submit">{labels.show}</button>
        <span className="location-picker__or">{labels.or}</span>
        <button className="button button--secondary" type="button" onClick={locate} disabled={locating}>
          <LocateFixed /> {locating ? labels.locating : labels.useLocation}
        </button>
        {editing && <button type="button" className="text-button" onClick={() => { setEditing(false); setError('') }}>{labels.cancel}</button>}
      </div>
      {error
        ? <p id={errorId} className="location-picker__error" role="alert">{error}</p>
        : <p className="location-picker__hint">{labels.hint}</p>}
    </form>
  )
}

/** A small "3.2 mi" chip, or nothing when there is no origin or no fixed place. */
export function DistanceTag({ item, labels = DEFAULT_LABELS }) {
  const { origin } = useContext(DistanceContext)
  const distance = describeDistance(origin, placeFor(item))
  if (!distance) return null
  const title = distance.exact
    ? labels.distanceExact
    : labels.distanceZip
  return (
    <span className="distance-tag" title={title}>
      <Navigation aria-hidden="true" />
      <span aria-hidden="true">{distance.text}</span>
      <span className="visually-hidden">{distance.spoken}</span>
    </span>
  )
}

export function DirectionsLink({ item, className = 'button button--secondary', labels = DEFAULT_LABELS }) {
  const url = directionsUrl(item)
  if (!url) return null
  return (
    <a className={className} href={url} target="_blank" rel="noreferrer">
      <Navigation /> {labels.directions}<span className="visually-hidden">{labels.newTab}</span>
    </a>
  )
}

/** Sort and radius controls. Only shown once there is something to measure from. */
export function DistanceOptions({ sort, onSort, within, onWithin, showWithin = true, defaultLabel = 'Best match', labels = DEFAULT_LABELS }) {
  const { origin } = useContext(DistanceContext)
  const sortId = useId()
  const withinId = useId()
  if (!origin) return null
  return (
    <div className="distance-options">
      <label htmlFor={sortId}>{labels.sort}</label>
      <select id={sortId} value={sort ? 'near' : 'default'} onChange={(event) => onSort(event.target.value === 'near')}>
        <option value="default">{defaultLabel}</option>
        <option value="near">{labels.nearest}</option>
      </select>
      {showWithin && (
        <>
          <label htmlFor={withinId}>{labels.within}</label>
          <select id={withinId} value={within} onChange={(event) => onWithin(Number(event.target.value))}>
            <option value={0}>{labels.anyDistance}</option>
            <option value={5}>5 {labels.miles}</option>
            <option value={10}>10 {labels.miles}</option>
            <option value={25}>25 {labels.miles}</option>
          </select>
        </>
      )}
    </div>
  )
}
