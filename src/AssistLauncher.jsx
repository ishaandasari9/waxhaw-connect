import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarPlus, MessageCircle, X } from 'lucide-react'
import AssistPanel from './AssistPanel.jsx'

/**
 * A native <dialog> opened with showModal() gives focus trapping, Escape to
 * close, an inert page behind it and focus returned to the button, without any
 * of that being hand-rolled. The panel stays mounted, so a resident who closes
 * the drawer to read a listing finds their question and results still there.
 */
export default function AssistLauncher({ copy, renderResource, raised = false }) {
  const dialogRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  const show = () => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    dialog.querySelector('textarea')?.focus()
    setOpen(true)
  }

  const hide = () => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.close === 'function') dialog.close()
    else dialog.removeAttribute('open')
  }

  /* Following a result link changes the route, so the drawer gets out of the way. */
  useEffect(() => { hide() }, [pathname])

  /* Clicks on the backdrop land on the dialog element itself. */
  const onDialogClick = (event) => {
    if (event.target === dialogRef.current) hide()
  }

  return (
    <>
      <button
        type="button"
        className={`assist-launcher ${raised ? 'assist-launcher--raised' : ''}`}
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle aria-hidden="true" />
        <span>{copy.needHelp}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="assist-drawer"
        aria-labelledby="assist-drawer-heading"
        onClose={() => setOpen(false)}
        onClick={onDialogClick}
      >
        <div className="assist-drawer__inner">
          <div className="assist-drawer__top">
            <span>{copy.communityHelper}</span>
            <button type="button" className="icon-button" onClick={hide} aria-label={copy.closeHelper}>
              <X />
            </button>
          </div>

          <AssistPanel copy={copy.panel} renderResource={renderResource} variant="drawer" headingId="assist-drawer-heading" />

          <div className="assist-drawer__plan">
            <CalendarPlus aria-hidden="true" />
            <div>
              <strong>{copy.planningTitle}</strong>
              <p>{copy.planningIntro}</p>
              <Link className="text-link" to="/events/plan">{copy.openPlanner}</Link>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
