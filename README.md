# Waxhaw Connect

Waxhaw Connect is a production-ready React community resource website designed for the 2026-2027 FBLA Website Design topic. It helps Waxhaw, North Carolina residents find trustworthy services, programs, events and urgent support in one inclusive experience.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the six Firebase values
npm run dev
```

Build and verify the production bundle:

```bash
npm test
npm run build
```

The site runs without `.env.local`. Browsing, search, filters, the guided finder, saved plans and accessibility controls all work with no backend at all. Only accounts and community event posting need the Firebase values, and without them the interface says accounts are unavailable rather than failing.

## Deploy

The project is configured for Vercel as a Vite single-page application. Connect the GitHub repository in Vercel and use the detected defaults:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` sends direct visits to React routes through `index.html`, so pages such as `/resources`, `/events`, and `/finder` continue to work after a refresh.

Set the six `VITE_FIREBASE_*` variables from `.env.example` in Vercel under Settings, Environment Variables, for Production, Preview and Development. Vite inlines them at build time, so a deployment made before they were set will not pick them up. Redeploy after changing them.

Firestore rules live in `firestore.rules` and are published separately in the Firebase console. Changing that file does not change the live rules until it is published.

## Architecture

The front end is a single-page React application with no server of its own. Resource and event reference data ships as static modules in `src/data.js`, which keeps the directory fast and available offline. Two things need to outlive a single browser, and only those use a backend:

| Concern | Where it lives | Why |
| --- | --- | --- |
| Resource directory, official events | `src/data.js`, bundled | Editorially reviewed, changes rarely, must work offline |
| Saved plan, language, accessibility prefs | `localStorage` | Personal to one device, no account required, no reason to collect it |
| Resident accounts | Firebase Authentication | A password store is not something a student project should build |
| Profiles and event interests | Firestore `profiles/{uid}` | Must follow the resident across devices |
| Community-posted events | Firestore `communityEvents` | Must be visible to every visitor, not just the author |

`src/firebase.js` loads the Firebase SDK on demand rather than bundling it into the first paint. A resident looking for urgent help should not wait on roughly 600KB of authentication and database code, so the initial bundle stays near 365KB and the rest arrives only when someone signs in or opens the calendar.

`src/backend.js` is the only module that talks to Firebase. Every operation returns `{ ok, error }` and translates Firebase error codes into plain language a resident can act on, which is also why those translations are unit tested.

### Data model

```
profiles/{uid}
  name         string
  interests    string[]      event categories the resident chose
  personalized boolean       whether the feed reorders by interest
  createdAt    timestamp

communityEvents/{autoId}
  title, description, location, accessibility, sourceUrl   strings
  date         string        YYYY-MM-DD
  time         string        display range
  category     string        one of the nine event interests
  organizerId  string        author uid, enforced by rules
  organizer    string        display name shown on the listing
  submittedAt  timestamp
```

### Security model

Firebase web API keys are public by design and appear in the client bundle. Access is controlled by `firestore.rules`, not by hiding keys:

- A profile is readable and writable only by the resident it belongs to.
- Community events are readable by everyone, including signed-out visitors, because residents browse the calendar without an account.
- An event can only be created with `organizerId` equal to the author's own uid, and only edited or deleted by that author.
- Field types and lengths are validated in the rules, not only in the form, so the limits hold even if someone bypasses the interface.
- Every other path is closed.

## Standout functionality

- Natural-language resource search with practical synonym matching
- Filters for topic, audience and cost
- A private three-step guided resource finder
- Local device saving and a printable personal action plan
- Side-by-side comparison for up to three resources
- English and Spanish discovery content
- Text-size, high-contrast and reduced-motion controls
- Live open/closed indicators when reliable hours are available
- Event filtering and downloadable calendar files
- Resident accounts backed by Firebase Authentication, with editable event interests that follow the account across devices
- Explainable event recommendations based only on interests residents choose
- Community event posting that publishes to a shared calendar every visitor sees, with clear source labels and author-only removal
- Source-verification dates and direct original-source links
- Urgent-help pathway separated from everyday services
- Offline app-shell caching for unreliable conference internet

## Design rationale

The visual direction is a light "town commons" rather than a conventional government portal. Warm parchment, forest green and clay create local character while retaining accessible contrast. The hand-built townscape makes Waxhaw recognizable without using copyrighted photography or official municipal branding. A dominant search field serves residents who know what they need, while the guided finder supports people who do not know program terminology.

The interface targets WCAG 2.2 Level AA practices: semantic landmarks, a skip link, visible keyboard focus, labeled fields, 44-pixel touch targets, non-color status labels, scalable text, reduced motion, screen-reader status announcements and responsive reflow.

## Privacy choices

Personalization uses only the event categories a resident explicitly selects, and every recommendation states its reason in plain language. The site does not infer sensitive traits, does not track residents across other websites, and deliberately ships without analytics. Saved plans and accessibility preferences never leave the device, because there is no reason to collect them.

## Naming

The site name and tagline live in `src/siteConfig.js`. Renaming the site means editing that file plus two static files that cannot read JavaScript: the title and description in `index.html`, and `name` in `public/manifest.webmanifest`.

## Rubric alignment

- **Planning and implementation:** Product strategy is documented in `PRODUCT.md`; architecture, data model, security model and design rationale are documented here.
- **Content and relevance:** Seventeen researched resources span essential needs, families, health, older adults, education, transportation, housing, work and community life.
- **UX and accessibility:** The design system, accessibility controls and responsive layouts support different ages, abilities and devices.
- **Research:** Every listing identifies its source, verification date and original URL.
- **Compatibility:** The interface was visually and functionally tested at 1440px desktop, 768px tablet and 390px mobile widths.
- **Interactivity:** Search, filters, guided matching, saving, comparison, translation, accessibility preferences and event downloads work with no backend and no account. Accounts and community posting add a real authenticated layer on top of that, and degrade to read-only when the backend cannot be reached.
- **Consistency:** Reusable navigation, typography, controls, metadata, verification patterns and page layouts are shared across every route.
- **Metrics:** The About page proposes completion rate, search success, time-to-resource, guided-finder completion and accessibility task success.

## Data note

The directory was reviewed on September 11, 2026 using official Town of Waxhaw, Union County, school-system and provider sources. Community information changes. The interface intentionally tells users to confirm current hours, eligibility and availability with each provider.

## Moderation note

Community-submitted events publish immediately and are labeled as resident submissions, separate from verified official listings. Authors can remove their own posts. There is no moderation queue yet, which is the right next step before any real public launch.
