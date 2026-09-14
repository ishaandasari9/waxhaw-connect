import { getServices, isBackendConfigured } from './firebase'

export const PROFILES = 'profiles'
export const COMMUNITY_EVENTS = 'communityEvents'

const OFFLINE_MESSAGE = 'Accounts are unavailable right now. Everything else on this site still works.'

/**
 * Firebase error codes are not written for residents. Every message a person can
 * see is mapped to plain language that says what to do next.
 */
export function translateAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address, like you@example.com.'
    case 'auth/weak-password':
      return 'Choose a password with at least 8 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match an account.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute, then try again.'
    case 'auth/network-request-failed':
      return 'We could not reach the account service. Check your connection and try again.'
    case 'permission-denied':
      return 'You do not have permission to do that.'
    case 'unavailable':
      return 'The community calendar is offline. Official listings are still shown.'
    default:
      return 'Something went wrong on our side. Please try again.'
  }
}

function fail(error) {
  return { ok: false, error: translateAuthError(error?.code) }
}

/**
 * Turns a stored document into the same event shape the rest of the interface
 * already uses, so community listings and official listings render identically.
 */
export function toCommunityEvent(id, data = {}) {
  return {
    id,
    title: data.title || 'Untitled event',
    date: data.date || '',
    time: data.time || '',
    location: data.location || '',
    category: data.category || 'Community',
    description: data.description || '',
    accessibility: data.accessibility || 'Contact the organizer for accessibility details.',
    sourceUrl: data.sourceUrl || '',
    organizer: data.organizer || 'A Waxhaw neighbor',
    organizerId: data.organizerId || '',
    communitySubmitted: true,
    submittedAt: data.submittedAt?.toDate?.().toISOString() || data.submittedAt || '',
  }
}

/**
 * Starts a listener that may not exist yet, because the SDK is still
 * downloading. Callers get an unsubscribe function immediately, and it cancels
 * the pending listener if the component unmounts first.
 */
function deferredSubscription(start) {
  let unsubscribe = null
  let cancelled = false
  start((teardown) => {
    if (cancelled) {
      teardown()
      return
    }
    unsubscribe = teardown
  })
  return () => {
    cancelled = true
    if (unsubscribe) unsubscribe()
  }
}

export function subscribeToAuth(onUser) {
  return deferredSubscription(async (register) => {
    const services = await getServices()
    if (!services) {
      onUser(null)
      return
    }
    const { onAuthStateChanged } = await import('firebase/auth')
    register(onAuthStateChanged(services.auth, (user) => {
      onUser(user ? { uid: user.uid, email: user.email, name: user.displayName || '' } : null)
    }))
  })
}

export async function createAccount({ name, email, password, interests }) {
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore')
    const trimmedName = name.trim()
    const credential = await createUserWithEmailAndPassword(services.auth, email.toLowerCase().trim(), password)
    await updateProfile(credential.user, { displayName: trimmedName })
    await setDoc(doc(services.db, PROFILES, credential.user.uid), {
      name: trimmedName,
      interests,
      personalized: true,
      createdAt: serverTimestamp(),
    })
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function signInWithEmail({ email, password }) {
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    await signInWithEmailAndPassword(services.auth, email.toLowerCase().trim(), password)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function signOutCurrentUser() {
  const services = await getServices()
  if (!services) return { ok: true }
  try {
    const { signOut } = await import('firebase/auth')
    await signOut(services.auth)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function loadProfile(uid) {
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const snapshot = await getDoc(doc(services.db, PROFILES, uid))
    if (!snapshot.exists()) return { ok: true, profile: { name: '', interests: [], personalized: true } }
    const data = snapshot.data()
    return {
      ok: true,
      profile: {
        name: data.name || '',
        interests: Array.isArray(data.interests) ? data.interests : [],
        personalized: data.personalized !== false,
      },
    }
  } catch (error) {
    return fail(error)
  }
}

export async function saveProfile(uid, changes) {
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, PROFILES, uid), { ...changes, updatedAt: serverTimestamp() }, { merge: true })
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/**
 * Live listener so an event posted by one resident appears for everyone else
 * without a page refresh.
 */
export function subscribeToCommunityEvents(onData, onError) {
  return deferredSubscription(async (register) => {
    const services = await getServices()
    if (!services) {
      onData([])
      return
    }
    const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore')
    const listing = query(collection(services.db, COMMUNITY_EVENTS), orderBy('date', 'asc'))
    register(onSnapshot(
      listing,
      (snapshot) => onData(snapshot.docs.map((entry) => toCommunityEvent(entry.id, entry.data()))),
      (error) => {
        console.error('Community events listener failed.', error)
        onData([])
        if (onError) onError(translateAuthError(error?.code))
      },
    ))
  })
}

export async function publishCommunityEvent(user, input) {
  if (!user) return { ok: false, error: 'Sign in before posting an event.' }
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
    const created = await addDoc(collection(services.db, COMMUNITY_EVENTS), {
      ...input,
      organizerId: user.uid || user.id,
      organizer: user.name || 'A Waxhaw neighbor',
      submittedAt: serverTimestamp(),
    })
    return { ok: true, id: created.id }
  } catch (error) {
    return fail(error)
  }
}

export async function removeCommunityEvent(id) {
  const services = await getServices()
  if (!services) return { ok: false, error: OFFLINE_MESSAGE }
  try {
    const { deleteDoc, doc } = await import('firebase/firestore')
    await deleteDoc(doc(services.db, COMMUNITY_EVENTS, id))
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export { isBackendConfigured }
