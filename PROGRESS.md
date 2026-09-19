# Waxhaw Connect progress

Last updated: September 18, 2026 (chunk 3)
Base commit for chunk 1: `eeeab23` (Planner: free-tier search model and fallback)
Tests: 51 passing. axe (WCAG 2.2 AA): 0 violations on every page, light and dark, desktop and phone.

## Done

- [x] **Site audit** (Sept 16). Findings are listed under "Fix list" below.
- [x] **Floating helper on every page.** A "Need help?" button opens a drawer with the resource matcher and links to the event planner. The inline panel on the Resources page was removed.
- [x] **Event planner** (`/events/plan`).
  - Gemini with Google Search grounding finds similar events in other towns and explains why they worked.
  - It then builds a step-by-step plan for Waxhaw, and "Post this event" prefills the post form.
  - Links come only from search metadata, never from model-written URLs.
  - Limited to 8 plans per hour per visitor.
- [x] **Dark mode.**
  - Choices are Device, Light and Dark, with a toggle in the top bar.
  - A pre-paint script prevents a white flash, and printouts always stay light.
  - High contrast also works in dark mode.
- [x] **Distance.**
  - Residents enter a ZIP code or use their device location, and distances appear on resources, events, the compare tray, the saved plan and the finder.
  - Includes nearest-first sorting, a 5, 10 or 25 mile filter, and directions links.
  - The confidential shelter never gets a location.

Patch files, applied in this order: `waxhaw-assistant-and-planner.patch`, `waxhaw-dark-mode.patch`, `waxhaw-distance.patch`. `waxhaw-all-changes.patch` combines all three.

## Your to-dos (no Claude usage needed)

- [x] Apply the patches and push to `main`
- [x] Confirm `GEMINI_API_KEY` is set in Vercel, redeploy, and run one real event plan.
- [ ] **Decide how the planner gets its examples.** Live search returns 429 on a free-tier key, and Google has retired the 2.5 models (which had free search) for new accounts. The planner falls back to a plan with no examples. Either turn on billing in Google AI Studio and set `PLAN_MODEL=gemini-3.5-flash-lite` in Vercel, or switch to a hand-researched list of real events the AI picks from.
- [x] Run `npm run geocode` and commit `src/places.js`
- [ ] Fix the library address. The site uses 1515 Cuthbertson Rd, but the library's own page says 1720.
  - [ ] Update both the resource and the library board event in `src/data.js`.
  - [ ] Rerun `npm run geocode`.

## Fix list (from the audit)

| # | Issue | Size | Status |
|---|---|---|---|
| 1 | Past events still show on the calendar (the Sept 15 meeting is at the top) | S | Done (chunk 1) |
| 2 | Only 4 official events | M (research) | Open |
| 3 | `.ics` files are missing UID and DTSTAMP, ignore the start time, and don't escape commas | S | Done (chunk 1) |
| 4 | The post form's minimum date uses UTC, so same-day events are blocked after 8pm Eastern | S | Done (chunk 1) |
| 5 | The paste-a-flyer parser is built but not connected to the post form | S | Done (chunk 1) |
| 6 | Spanish is only partly translated, and dates are hardcoded to `en-US` | L | Open |
| 7 | Community posts have no report or moderation option | M | Open |
| 8 | Fonts load from Google, `oklch()` colors have no fallbacks, and the manifest has no icons | M | Done (chunk 3) |
| 9 | The Firebase bundle (556 kB) loads on every page | S | Done (chunk 3) |
| 10 | Metrics has no targets or measurement (weakest rubric item, about 3/5) | M | Open |

## Chunk plan (one chunk per session)

1. ~~**Quick fixes:** #1, #3, #4, #5~~ Done Sept 18, along with the planner's source note and a bug where the flyer parser checked event categories against the resource list.
2. **Moderation:** #7. Adds a report button, hides a post after a few reports, and updates `firestore.rules`.
3. ~~**Performance and offline:** #8 and #9~~ Done Sept 18. Fonts are bundled, every color has a hex fallback, the app has real icons, and Firebase waits for an idle moment.
4. **Metrics:** #10. Adds numeric targets, Core Web Vitals and a measured-vs-planned table on the About page.
5. **Content:** #2 plus the directory gaps (legal aid, newcomer and language support, volunteering, faith and civic groups, pets)
6. **Spanish:** #6
7. **Backlog features, if time allows:**
   - A "Report outdated info" button on each resource
   - An "I'm going" RSVP count on events
   - A map view (the distance data now makes this easy)
   - A volunteer board

## Starting the next session

Open the chat in the FBLA project, say "continue from PROGRESS.md, chunk N", and attach this file (or paste it) along with any patches you haven't pushed yet. After each chunk, update the Status column and the Done list.
