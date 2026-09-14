const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * The directory, guided finder, saved plan and accessibility controls never need
 * the backend. Accounts and community event posting do. When the keys are absent
 * the site stays fully usable in read-only mode instead of failing to render,
 * which also keeps the offline demo working.
 */
export const isBackendConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let servicesPromise = null

/**
 * Firebase is loaded on demand rather than bundled into the first paint. The
 * resource directory is the critical path for someone looking for urgent help,
 * so roughly 600KB of authentication and database code should not block it.
 * Resolves to null whenever accounts are unavailable; every caller handles that.
 */
export function getServices() {
  if (!isBackendConfigured) return Promise.resolve(null)
  if (!servicesPromise) {
    servicesPromise = (async () => {
      const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = initializeApp(config)
      return { auth: getAuth(app), db: getFirestore(app) }
    })().catch((error) => {
      console.error('Firebase failed to initialize. Running without accounts.', error)
      servicesPromise = null
      return null
    })
  }
  return servicesPromise
}
