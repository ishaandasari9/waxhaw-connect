# Waxhaw Connect

Waxhaw Connect is a production-ready React community resource website designed for the 2026-2027 FBLA Website Design topic. It helps Waxhaw, North Carolina residents find trustworthy services, programs, events and urgent support in one inclusive experience.

## Run locally

```bash
npm install
npm run dev
```

Build and verify the production bundle:

```bash
npm test
npm run build
```

## Deploy

The project is configured for Vercel as a Vite single-page application. Connect the GitHub repository in Vercel and use the detected defaults:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` sends direct visits to React routes through `index.html`, so pages such as `/resources`, `/events`, and `/finder` continue to work after a refresh.

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
- Source-verification dates and direct original-source links
- Urgent-help pathway separated from everyday services
- Offline app-shell caching for unreliable conference internet

## Design rationale

The visual direction is a light “town commons” rather than a conventional government portal. Warm parchment, forest green and clay create local character while retaining accessible contrast. The hand-built townscape makes Waxhaw recognizable without using copyrighted photography or official municipal branding. A dominant search field serves residents who know what they need, while the guided finder supports people who do not know program terminology.

The interface targets WCAG 2.2 Level AA practices: semantic landmarks, a skip link, visible keyboard focus, labeled fields, 44-pixel touch targets, non-color status labels, scalable text, reduced motion, screen-reader status announcements and responsive reflow.

## Rubric alignment

- **Planning and implementation:** Product strategy is documented in `PRODUCT.md`; design rationale and implementation choices are documented here.
- **Content and relevance:** Seventeen researched resources span essential needs, families, health, older adults, education, transportation, housing, work and community life.
- **UX and accessibility:** The design system, accessibility controls and responsive layouts support different ages, abilities and devices.
- **Research:** Every listing identifies its source, verification date and original URL.
- **Compatibility:** The interface was visually and functionally tested at 1440px desktop, 768px tablet and 390px mobile widths.
- **Interactivity:** Search, filters, guided matching, saving, comparison, translation, accessibility preferences and event downloads work without a backend.
- **Consistency:** Reusable navigation, typography, controls, metadata, verification patterns and page layouts are shared across every route.
- **Metrics:** The About page proposes completion rate, search success, time-to-resource, guided-finder completion and accessibility task success.

## Data note

The directory was reviewed on September 11, 2026 using official Town of Waxhaw, Union County, school-system and provider sources. Community information changes. The interface intentionally tells users to confirm current hours, eligibility and availability with each provider.
