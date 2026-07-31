# Admin Page Refactor — Design

**Status:** Approved
**Date:** 2026-07-31
**Sub-project 1 of 2** (this one, then Square payments as a separate spec/plan)

## Context

`AdminPanel.tsx` (952 lines) is currently a single modal component with four
tabs (Users, Decks, i18n, Object Storage) implemented as inline conditional
blocks. It's opened via a button in `App.tsx`'s header, only rendered for
`profile?.role === "admin"`. This is no longer enough room to work with —
a fifth section (Square payments / credits management, see follow-up spec)
is coming, and the file is already carrying four unrelated concerns in one
component with no meaningful boundaries between them.

There is currently no routing library in the client — `App.tsx` swaps views
via a plain `useState<"lobby" | "ranked-1v1" | ...>` mode, no URL changes.

## Goal

Turn the admin modal into a proper full-page section of the app with real
URLs, without disturbing how the rest of the app (lobby/game) navigates.

## Design

### 1. Routing

Add `react-router-dom`, scoped narrowly:

- Wrap the app root in `BrowserRouter`.
- Route `/*` → the existing `MainApp` component, completely unchanged
  internally (still its own `useState`-based lobby/game view switching).
- Route `/admin/*` → new `AdminPage`, with its own nested routes.

No other part of the app adopts routing in this pass.

### 2. Layout & sections

`AdminPage` renders a persistent left sidebar (replacing the current tab
button row) with one entry per section, each its own route:

- `/admin/users` (default redirect target for bare `/admin`)
- `/admin/decks`
- `/admin/i18n`
- `/admin/storage`
- `/admin/payments` — **placeholder only in this sub-project**. Route and
  nav entry exist; content is a "coming soon" stub. Full implementation is
  the follow-up Square payments spec.

Each existing tab's JSX and handler functions move out of the monolithic
`AdminPanel.tsx` into their own component file under
`packages/client/src/admin/`:

- `admin/AdminLayout.tsx` — sidebar + route outlet shell
- `admin/UsersSection.tsx`
- `admin/DecksSection.tsx`
- `admin/I18nSection.tsx`
- `admin/StorageSection.tsx`
- `admin/PaymentsSection.tsx` (placeholder)

`AdminPanel.tsx` itself is deleted; the "Admin Console" header button in
`MainApp` becomes a `<Link to="/admin">` instead of a state toggle that
mounts a modal.

### 3. Access control

`AdminPage` (or a wrapping route element) checks `profile?.role === "admin"`
and redirects to `/` if the condition isn't met — including while auth is
still resolving on first load, to avoid a flash of admin content. This is a
real guard at the route level, not just hiding the nav button, since a
direct URL visit would otherwise bypass a button-only check.

## Out of scope (deferred)

- Square payment processing, credits ledger, wager flow — separate spec.
- No changes to lobby/game navigation or state model.
- No visual redesign of the section content itself — this is a structural
  move (modal → routed page, one file → six), not a redesign of what each
  section looks like.

## Testing

- Manual: non-admin user hitting `/admin` directly gets redirected.
- Manual: each sidebar link renders the right section, browser back/forward
  works, direct URL to e.g. `/admin/decks` lands correctly.
- `npx tsc --noEmit` and `npm run build` clean, matching this session's
  established practice of always running a full type-check (Vite's esbuild
  build does not type-check and has already let real bugs through twice).
