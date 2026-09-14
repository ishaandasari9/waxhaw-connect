/**
 * Single source of truth for the site's identity.
 *
 * Renaming the site means editing SITE_NAME here, then the two static files that
 * cannot read JavaScript: the <title> and description in index.html, and "name"
 * and "short_name" in public/manifest.webmanifest.
 */
export const SITE_NAME = 'Waxhaw Connect'
export const SITE_TAGLINE = 'People · Resources · A stronger tomorrow'
export const SITE_HOME_TITLE = `${SITE_NAME} | Community resources for every stage of life`

/** Builds a page title, e.g. "Guided resource finder | Waxhaw Connect". */
export const pageTitle = (page) => `${page} | ${SITE_NAME}`
