import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { originFromCoords, originFromZip } from './distance.js'

export const DistanceContext = createContext({ origin: null })

const ZIP_KEY = 'waxhaw-distance-zip'

/**
 * A typed ZIP is remembered on this device so distances survive a reload.
 * Device coordinates are not: they live in memory for this visit only.
 */
export function useDistanceState() {
  const [zip, setZipValue] = useState(() => {
    try { return localStorage.getItem(ZIP_KEY) || '' } catch { return '' }
  })
  const [deviceOrigin, setDeviceOrigin] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    try {
      if (zip) localStorage.setItem(ZIP_KEY, zip)
      else localStorage.removeItem(ZIP_KEY)
    } catch { /* storage can be unavailable */ }
  }, [zip])

  const setZip = useCallback((value) => {
    const trimmed = String(value || '').trim()
    if (!/^\d{5}$/.test(trimmed)) return { ok: false, error: 'Enter a 5-digit ZIP code, like 28173.' }
    if (!originFromZip(trimmed)) return { ok: false, error: 'Distances are available across Charlotte, Waxhaw and nearby communities.' }
    setDeviceOrigin(null)
    setZipValue(trimmed)
    return { ok: true }
  }, [])

  const locateDevice = useCallback(() => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ ok: false, code: 0 })
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const origin = originFromCoords(position.coords.latitude, position.coords.longitude)
        if (!origin) return resolve({ ok: false, code: 2 })
        setDeviceOrigin(origin)
        setZipValue('')
        resolve({ ok: true })
      },
      (error) => {
        setLocating(false)
        resolve({ ok: false, code: error.code })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }), [])

  const clearOrigin = useCallback(() => {
    setDeviceOrigin(null)
    setZipValue('')
  }, [])

  const origin = deviceOrigin || originFromZip(zip)

  return useMemo(
    () => ({ origin, setZip, locateDevice, clearOrigin, locating }),
    [origin?.lat, origin?.lng, origin?.source, setZip, locateDevice, clearOrigin, locating],
  )
}
