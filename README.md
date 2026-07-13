# EVALIS

EVALIS is a frontend-only EV brand platform built as a course project. It combines a premium, cinematic public marketing site with a full customer dashboard and an admin back-office — all running on mock data and `localStorage`, with no backend.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@theme` config, custom `dark:` variant tied to the app's own theme toggle rather than OS preference)
- React Router v7 (nested layouts for public site, customer dashboard, admin dashboard)
- React-Leaflet + Leaflet for live map views
- `jspdf` + `jspdf-autotable` for client-side PDF report generation
- Mock/local persistence only — all data lives in JSON files under `src/data` and is read/written through a centralized `storage.ts` helper (`localStorage`), with cross-tab/cross-component sync via custom `window` events

## Running the project

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Features

### Public website

- **Home** — hero, model lineup teaser, bestsellers row with scroll controls, live map of nearby charging stations, brand storytelling sections
- **Vehicle lineup & detail pages** (Vector, Cloud, Bullet) — shared `VehicleDetailView` renders a large hero image, a sticky uncropped detail shot alongside tabbed content (Overview / Design / Performance / Technology / Safety / Specs), and a live specs bar
- **Charging** — public charging info/marketing page with a live charge-time calculator
- **Shop** — category sidebar (categories are admin-manageable), product grid, cart as a pop-up, simulated checkout with a fake order confirmation state
- **Test Drive booking** — clickable vehicle image cards ("select a vehicle to test") instead of a dropdown, showroom selection synced to a live Leaflet map of all showrooms, required-field validation with a clear combined error message, and a booking confirmation summary
- **Login / Signup** — mock authentication with role-based redirect (customer → dashboard, admin → admin dashboard)
- **Profile** — edit name/phone/avatar, view owned vehicles, order history with cancellation requests, and booked test drives (reliably linked to the account via user id, with email fallback for legacy bookings)
- **About / FAQ** page
- Full **English / Turkish** localization, audited end-to-end for parity — every UI string (including map popups, PDF exports, toast notifications, and mock catalog data such as vehicle taglines and product descriptions) switches with the language toggle; English uses `$`, Turkish uses `₺`, and all currency totals are normalized before being summed across records
- All destructive/blocking browser dialogs replaced with themed **toast notifications**, including an interactive confirm/cancel toast for destructive actions

### Customer Dashboard

- **Overview** — owned vehicle switcher, animated top-down vehicle art with a charging-glow pulse when charging, time-of-day-adaptive greeting, live tire pressure widget (2-wheel layout for the motorcycle, 4-wheel for cars), charge history chart, next-scheduled-charge summary, and quick actions
- **My Vehicles** — fleet list, add/release vehicle flow (race-condition-free ownership sync across components)
- **Vehicle Details** — per-vehicle telemetry (tire pressure, consumption, odometer, estimated range) shared with the Overview widget so data never drifts between pages
- **Charging Control** — unified home + station charging experience: live Leaflet map of the station network (ratings, third-party networks, distance, live pricing, get-directions), the vehicle charging animation, and matching cost/time-to-full estimates shared between the vehicle panel and the station list so the numbers can never disagree
- **Session History** — filterable/detailed charging session log, home sessions clearly distinguished from station sessions
- **Schedules** — real automated charging: a background scheduler polls active schedules and actually starts a live charging session (home or station) the moment one comes due, with a notification and a "next scheduled charge" readout
- **Energy** — usage insights, cost/CO2 analytics, home vs. station energy breakdown
- **Notifications** — unread badge in the sidebar, mark-as-read flows
- **Rewards** — loyalty/rewards dashboard
- **Support** — submit a ticket by topic (vehicle / station / account / billing / etc.), issue type, priority, and description; track ticket status and admin replies
- **Settings** — account and app preferences
- **Export Data** — a sidebar action (available from any dashboard page) generates a detailed PDF report of the signed-in user's vehicles, charging history, and support tickets
- Full **light/dark theme toggle** scoped to the dashboard only, built on a custom Tailwind `dark:` variant so it never bleeds into or is overridden by OS-level preference
- Themed scrollbars, keyboard-accessible clickable cards, and aria-labeled icon-only controls throughout

### Admin Dashboard

- **Overview** — platform-wide summary cards, an **Export Data** sidebar action for a snapshot PDF report
- **Users** — full CRUD via inline create/edit panels, email-uniqueness validation, self-delete guard
- **Vehicles (Fleet Info)** — full CRUD via inline panels (battery/status fields intentionally removed from the fleet-editing form), vehicle-ownership approval flow that safely merges a user's existing owned vehicles instead of overwriting them
- **Grid Ports (Stations)** — CRUD/management for the charging network, including network/operator and per-station pricing
- **Sessions** — charging session oversight
- **Products** — full CRUD plus **product category CRUD** (categories used to populate the public shop's sidebar; deletion is blocked while a category is in use)
- **Orders** — order management with a **cancellation approval flow** (customer requests cancellation from Profile → admin approves/rejects)
- **Test Drives** — booking management and confirmation
- **Support** — reply to and resolve customer tickets, with automatic customer-facing notifications
- **Analytics** — full system-wide report: revenue, orders/top products, charging/energy split, fleet ownership by model, test drive and support activity, and user-base breakdown, each with an in-page **Export Data** PDF button
- **Settings** — admin/platform configuration
- Light/dark theme toggle, same as the customer dashboard
- Mobile nav menu with reachable logout

### Cross-cutting architecture

- Centralized `storageKeys` / `userStorageKeys` in `src/lib/storage.ts` for every piece of mock/local data, keeping reads and writes consistent across the whole app
- Custom `window` events (`storage`, `activeVehicleChanged`, `evalis:sessionsUpdated`, `evalis:notificationsUpdated`) keep sibling components in sync without a backend
- `AuthContext` with a `refreshSession()` method so the UI reflects storage mutations made outside the login flow
- `ToastContext` for both fire-and-forget toasts and awaitable confirm/cancel toasts
- Shared `vehicleTelemetry.ts` mock dataset so dashboard widgets never show conflicting numbers for the same vehicle
- Shared `chargingSession.ts` model so a vehicle can only ever be charging in one place (home or station) at a time, with matching cost/time estimates wherever they're shown
- `scheduleRunner.ts` — a small polling engine (mounted in the dashboard layout) that turns configured charge schedules into real, live charging sessions
- `pdfReport.ts` — a shared PDF report toolkit (branded header, stat grids, tables, section titles) reused by every "Export Data" button
- `vehicleTranslations.ts` / `productTranslations.ts` — Turkish translations for the otherwise English-only catalog data in `vehicles.json` / `products.json`, since those files don't carry language variants themselves

## Data Model

All mock content lives in `src/data/*.json` and is seeded into `localStorage` on first load:

- `vehicles.json` — vehicle catalog, specs, images
- `products.json` / `productCategories.json` — shop catalog
- `stations.json` — charging station network (ratings, networks, pricing, amenities)
- `sessions.json` — charging session history
- `orders.json` — shop orders
- `test-drives.json` — test drive bookings
- `users.json` — demo accounts (customer + admin)
- `notifications.json` — dashboard notifications
- `support-tickets.json` — customer support tickets
- `translations-en.json` / `translations-tr.json` — full UI copy for both languages

## Project structure

```
src/
  app/            # router
  components/     # shared UI (public, dashboard, admin, common)
  context/        # Auth, Cart, Toast providers
  data/           # mock JSON data + telemetry + translations
  i18n/           # language context + config
  layouts/        # PublicLayout, DashboardLayout, AdminLayout
  lib/            # storage, mock auth, charging session, scheduler, PDF report helpers
  pages/          # public/, dashboard/, admin/ route pages
  styles/         # Tailwind v4 global theme
  types/          # shared TypeScript types
```

## Demo credentials

- Customer: `customer@evalis.com`
- Admin: `admin@evalis.com`

(any password is accepted — this is a frontend-only mock)
