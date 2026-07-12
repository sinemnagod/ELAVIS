# EVALIS Dashboard Feature Backlog

This file turns the latest project scan and dashboard sketch into an implementation backlog. Every item here is intended to be implemented.

## Dashboard Sketch Direction

The dashboard should move toward a dense, ownership-focused cockpit rather than a loose collection of separate pages.

## Dashboard Design System Direction

These design references apply only to the dashboard and admin/dashboard-style surfaces. They must not change the public marketing website, which should stay cinematic and dark.

### Visual style

- Use a soft neumorphic dashboard style.
- Prefer low-contrast raised panels, inset wells, pill controls, and circular icon buttons.
- Use subtle paired shadows instead of heavy dark card shadows.
- Keep corners rounded but controlled:
  - Main dashboard panels: 24px to 32px radius.
  - Small metric cards: 18px to 24px radius.
  - Icon buttons and toggles: circular or pill-shaped.
- Use calm, quiet surfaces with restrained borders.
- Keep accent color usage focused on state, progress, and primary actions.
- Avoid noisy gradients, decorative blobs, and marketing-style hero composition inside dashboards.
- Icons should be simple line icons or compact filled symbols, not emoji.

### Light theme tokens

Use the light neumorphic reference as the default direction for light dashboard mode.

- Surface background: `#ECF0F3`.
- Raised shadow pair:
  - dark shadow: `18px 18px 30px #D1D9E6`.
  - light shadow: `-18px -18px 30px #FFFFFF`.
- Smaller raised components can use reduced shadows, such as `8px 8px 18px` and `-8px -8px 18px`.
- Inset panels should use the same color pair reversed with `inset`.
- Text should be slate/charcoal, not pure black except for high-emphasis values.
- Borders should be very subtle or removed when shadow depth is enough.

### Dark theme tokens

Create a dark equivalent rather than copying the light shadows directly.

- Surface background should remain dashboard-dark, around `#070b10` or `#0a0f18`.
- Raised shadow pair:
  - dark shadow: positive offset using near-black, for example `18px 18px 30px rgba(0, 0, 0, 0.45)`.
  - light edge: negative offset using white or slate at very low opacity, for example `-18px -18px 30px rgba(255, 255, 255, 0.04)`.
- Inset panels should use:
  - `inset 8px 8px 18px rgba(0, 0, 0, 0.45)`.
  - `inset -8px -8px 18px rgba(255, 255, 255, 0.035)`.
- Keep dark dashboard text readable with slate-100/slate-300 levels.
- Use EVALIS green accent for active states, progress, and selected controls.
- Do not make dark mode look like pure black cards; keep soft depth and raised modules.

### Component patterns to implement

- Dashboard shell:
  - Soft raised sidebar.
  - Soft raised top utility bar.
  - Inset active nav item.
  - Circular bottom utility buttons for settings/logout when appropriate.
- Metric cards:
  - Raised card shell.
  - Small circular icon button or badge.
  - Large numeric value.
  - Tiny uppercase label.
- Chart cards:
  - Raised outer shell.
  - Inset plotting area.
  - Soft bars/lines with strong enough contrast in both themes.
- Circular gauges:
  - Use inset circular wells for battery, income/energy, or temperature-style gauges.
  - Use a clear progress arc or tick marks.
- List rows:
  - Use raised pill rows.
  - Include icon/avatar on the left, compact text in the center, arrow/action on the right.
- Search/action bars:
  - Use long raised or inset pill containers.
  - Keep icon buttons circular.
- Toggles:
  - Use small pill toggles with clear active state.
- Favorites:
  - Favorite station controls should be compact star/icon buttons.
  - Active favorite should use accent fill or accent ring.

### Dashboard-only implementation requirement

- Add dashboard-scoped CSS utilities or tokens in `src/styles/globals.css`.
- Scope them under dashboard wrappers, for example `.dashboard-light-theme`, `.dashboard-dark-theme`, or dashboard-specific utility classes.
- Avoid global changes that alter public pages.
- Existing dashboard pages should migrate from sharp/dark glass cards to the shared soft dashboard components gradually.
- Admin pages can use the same tokens only if they remain readable and operational.
- Every redesigned dashboard surface must be checked in both light and dark theme.

### Primary layout

- Keep a persistent left sidebar with EVALIS branding.
- Sidebar navigation should include:
  - Dashboard
  - Home Charging
  - Charge Stations
  - Charging History
  - Notifications
  - Support
  - Settings
  - My Vehicles section
  - User profile block with name, surname, and email
- Add a main top strip with:
  - Greeting, such as "Good Morning"
  - Find Charging Station action
  - Weather widget
  - Date/time widget
- Use the center area as the primary vehicle cockpit.
- Use the right area for charts and nearby stations.

### Main dashboard content

- Add a large "My Vehicle" panel.
- Show a vehicle silhouette/image.
- Show gear/drive state, for example Park.
- Show battery percentage.
- Show estimated range in kilometers.
- Show plate/license plate status.
- Add tire pressure/status card.
- Add battery level/health card.
- Add vehicle data card with average consumption.
- Add total distance card.
- Add an interactive vehicle crosshair/locator-style widget if useful.

### Right-side content

- Add a charge history chart.
- Add a small current battery/state label near the chart.
- Add nearby stations list.
- Each nearby station item should include:
  - Station name or short code
  - Distance
  - Availability or connector info
  - Favorite star
  - Arrow/action to open station details
- Add "see more" action that routes to the full stations map.

## Must Add

### 1. Expose hidden dashboard routes

Several dashboard pages already exist in routing, but are missing from the sidebar.

- Add sidebar links for:
  - Schedules
  - Energy
  - Notifications
- Make labels bilingual.
- Keep the sidebar usable when collapsed.
- Ensure active states work for each route.

Relevant files:

- `src/layouts/DashboardLayout.tsx`
- `src/app/router.tsx`

### 2. Favorite charging stations

Add favorite station support as a first-class dashboard feature.

- Add per-user favorite station persistence.
- Suggested storage key: `evalis.favoriteStations.${userId}`.
- Add a reusable helper or storage key for favorite stations.
- Add favorite toggle buttons to station cards.
- Add favorite star controls to station map popups.
- Sort or filter favorite stations in the stations page.
- Show favorite/nearby stations on the dashboard overview.
- Keep favorite state after refresh.
- Make favorite labels and toasts bilingual.

Relevant files:

- `src/pages/dashboard/Stations.tsx`
- `src/pages/dashboard/DashboardOverview.tsx`
- `src/lib/storage.ts`
- `src/types/index.ts`

### 3. Scheduled charging improvements

Scheduled charging already exists, but it should be connected to vehicles and dashboard UX.

- Add `ChargingSchedule` type to `src/types/index.ts`.
- Add `storageKeys.schedules`.
- Include these schedule fields:
  - `id`
  - `userId`
  - `vehicleId`
  - optional `stationId`
  - `departureTime`
  - repeat days
  - charge target percentage
  - precondition cabin boolean
  - active boolean
  - created date
- Add vehicle selector to schedule creation.
- Add optional station selector or "home charging" mode.
- Add edit support, not only create/delete.
- Add next scheduled charge summary to dashboard overview.
- Add enable/disable toggle from overview.
- Persist schedules per user.
- Translate all schedule UI labels.

Relevant files:

- `src/pages/dashboard/ChargingSchedules.tsx`
- `src/pages/dashboard/DashboardOverview.tsx`
- `src/lib/storage.ts`
- `src/types/index.ts`

### 4. Connect live charging to session history

The live charging page currently simulates charging only in component state. It should create mock session data.

- Starting charge creates an active `ChargingSession`.
- Stopping charge completes that session.
- Session should include:
  - user
  - vehicle
  - station
  - started time
  - ended time
  - energy delivered
  - cost
  - status
- Update `evalis.sessions` in localStorage.
- Charging history should show newly completed sessions.
- Admin sessions should show customer-created sessions.
- Generate a notification when charging completes.

Relevant files:

- `src/pages/dashboard/ChargingDashboard.tsx`
- `src/pages/dashboard/ChargingHistory.tsx`
- `src/pages/admin/AdminSessions.tsx`
- `src/data/sessions.json`
- `src/types/index.ts`

### 5. Dashboard overview redesign

Redesign the overview to match the sketch.

- Build the soft dashboard component classes before the page rewrite.
- Rework overview into:
  - left vehicle cockpit panel
  - right chart/stations column
  - top utility action strip
  - lower stat cards
- Use raised neumorphic shells for main panels.
- Use inset wells for chart areas, gauges, and selected controls.
- Use pill rows for nearby stations and compact action lists.
- Use circular icon buttons for quick actions, favorites, search, and profile utilities.
- Keep it responsive on mobile and desktop.
- Avoid nested cards.
- Use stable dimensions for charts, vehicle panels, and stat cards.
- Preserve dark/light dashboard theme support.
- Avoid emoji controls where icons are more appropriate.
- Make the dashboard feel practical, premium, and data-rich.

Relevant files:

- `src/pages/dashboard/DashboardOverview.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/styles/globals.css`

### 6. Localization cleanup

Many dashboard and admin labels are still hardcoded English.

- Move major dashboard labels into translation files.
- Move admin labels into translation files where practical.
- Translate toasts and validation messages.
- Translate schedule days.
- Translate station status labels.
- Translate chart labels.
- Avoid raw English strings in user-facing UI.

Relevant files:

- `src/data/translations-en.json`
- `src/data/translations-tr.json`
- dashboard pages
- admin pages
- layouts

### 7. Storage contract cleanup

The app uses localStorage well, but some keys are scattered as raw strings.

- Centralize storage keys in `src/lib/storage.ts`.
- Add keys for:
  - stations
  - sessions
  - schedules
  - favorite stations
  - owned vehicles
  - notifications
- Prefer helper functions for per-user keys.
- Keep fallback data compatible with seeded JSON.

Relevant files:

- `src/lib/storage.ts`
- `src/lib/auth.ts`
- dashboard pages
- admin pages

### 8. Update implementation tracker

`implementation-plan.md` is stale.

- Mark completed project phases accurately.
- Add a new dashboard cockpit phase.
- Add a favorite stations phase.
- Add a scheduled charging integration phase.
- Add a localization cleanup phase.
- Add build/QA checklist.

Relevant files:

- `implementation-plan.md`

## Should Add

### 1. Station reservation or queue simulation

- Add "Reserve Port" or "Navigate" action for stations.
- Decrease available ports temporarily when reserved.
- Show reservation state in dashboard and admin.
- Persist reservation to localStorage.

### 2. Vehicle-specific charge settings

- Persist charge limit per vehicle.
- Persist climate/precondition preference per vehicle.
- Keep settings consistent between overview, vehicle details, and charging pages.

### 3. Notification generation

Create notifications for:

- Charging completed
- Schedule created
- Schedule disabled
- Station reserved
- Favorite station becomes unavailable
- Order placed
- Test drive status changed

### 4. Weather/date widgets

Based on the sketch, add lightweight dashboard widgets:

- Date and time
- Istanbul weather mock
- Charging recommendation based on weather/time

Since this is frontend-only, use static/mock weather data unless a backend/API is later introduced.

### 5. Admin dashboard depth

- Add filters to admin sessions.
- Add filters to admin stations.
- Add station reservation visibility.
- Add schedule visibility if schedules become admin-managed.
- Improve analytics with date ranges.

### 6. Route-level code splitting

The production build works, but Vite reports a large JS chunk.

- Lazy-load public, dashboard, and admin route groups.
- Keep initial load lighter.
- Verify all routes still build and navigate correctly.

## Implementation Order

1. Update dashboard sidebar navigation.
2. Add dashboard-only neumorphic design tokens and utility classes for light/dark themes.
3. Add shared storage keys and types for schedules, sessions, favorites, and owned vehicles.
4. Implement favorite charging stations.
5. Redesign dashboard overview according to the sketch and design references.
6. Migrate the key dashboard pages to the same soft component system.
7. Upgrade scheduled charging with vehicle/station connections.
8. Connect live charging to session history.
9. Add notification generation.
10. Clean up localization.
11. Update `implementation-plan.md`.
12. Run build and visual QA in both dashboard themes.

## Build Verification

Current status from project scan:

- `npm run build` passes.
- Vite warns that the main JS chunk is larger than 500 kB.
- No compile-blocking issue was found before creating this backlog.
