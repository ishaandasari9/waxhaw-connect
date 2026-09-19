# Waxhaw Connect progress

Last updated: September 18, 2026 (chunk 3)
Base commit for chunk 1: `eeeab23` (Planner: free-tier search model and fallback)
Tests: 72 passing. axe (WCAG 2.2 AA): 0 violations on every page, light and dark, desktop and phone.

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

## Before the March competition

- [ ] Add more real community events. The five town meetings renew themselves, but festivals and one-off events need adding by hand, and anything dated in 2026 will have passed.
- [ ] Re-run `npm run geocode` so the two new addresses (Waxhaw Downtown Park and Town Hall) get exact coordinates.
- [ ] Check the library address question below.

## Your to-dos (no Claude usage needed)

- [x] Apply the patches and push to `main`
- [x] Confirm `GEMINI_API_KEY` is set in Vercel, redeploy, and run one real event plan.
- [ ] Run `npm run stats` after adding tests so the About page figure stays current.
- [x] **Planner examples**: solved with a hand-researched playbook (`src/eventPlaybook.js`), so no billing and no live search. The AI picks from the list by id; an id it invents is dropped before the page renders.
- [x] Run `npm run geocode` and commit `src/places.js`
- [ ] Fix the library address. The site uses 1515 Cuthbertson Rd, but the library's own page says 1720.
  - [ ] Update both the resource and the library board event in `src/data.js`.
  - [ ] Rerun `npm run geocode`.

## Fix list (from the audit)

| # | Issue | Size | Status |
|---|---|---|---|
| 1 | Past events still show on the calendar (the Sept 15 meeting is at the top) | S | Done (chunk 1) |
| 2 | Only 4 official events | M (research) | Done (chunk 5) |
| 3 | `.ics` files are missing UID and DTSTAMP, ignore the start time, and don't escape commas | S | Done (chunk 1) |
| 4 | The post form's minimum date uses UTC, so same-day events are blocked after 8pm Eastern | S | Done (chunk 1) |
| 5 | The paste-a-flyer parser is built but not connected to the post form | S | Done (chunk 1) |
| 6 | Spanish is only partly translated, and dates are hardcoded to `en-US` | L | Done |
| 7 | Community posts have no report or moderation option | M | Done (chunk 7) |
| 8 | Fonts load from Google, `oklch()` colors have no fallbacks, and the manifest has no icons | M | Done (chunk 3) |
| 9 | The Firebase bundle (556 kB) loads on every page | S | Done (chunk 3) |
| 10 | Metrics has no targets or measurement (weakest rubric item, about 3/5) | M | Done (chunk 4) |

## Chunk plan (one chunk per session)

1. ~~**Quick fixes:** #1, #3, #4, #5~~ Done Sept 18, along with the planner's source note and a bug where the flyer parser checked event categories against the resource list.
2. ~~**Moderation:** #7~~ Done Sept 18. Residents can report a neighbor-posted listing; three different people hide it from the public calendar.
3. ~~**Performance and offline:** #8 and #9~~ Done Sept 18. Fonts are bundled, every color has a hex fallback, the app has real icons, and Firebase waits for an idle moment.
4. ~~**Metrics:** #10~~ Done Sept 18. The About page now computes its own figures, reports test and accessibility results, and measures Core Web Vitals on the reader's device. The one target currently missed is the number of upcoming events, which chunk 5 fixes.
5. ~~**Content:** #2~~ Done Sept 19. Added Movie In The Park plus five recurring town meetings taken from the published schedule, so the calendar refills itself instead of emptying as events pass. The directory gaps (legal aid, newcomer and language support, volunteering, faith and civic groups, pets) are still open and are research, not code.
6. ~~**Spanish:** #6~~ Done Sept 18, with Codex doing the bulk and the urgent, sign-in and About pages finished afterwards.
7. **Backlog features, if time allows:**
   - More playbook entries. Six is enough to cover common ideas; add one whenever you find a well-documented event.
   - A "Report outdated info" button on each resource
   - An "I'm going" RSVP count on events
   - A map view (the distance data now makes this easy)
   - A volunteer board

## Starting the next session

Open the chat in the FBLA project, say "continue from PROGRESS.md, chunk N", and attach this file (or paste it) along with any patches you haven't pushed yet. After each chunk, update the Status column and the Done list.
