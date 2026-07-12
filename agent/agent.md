# EVALIS Agent Instructions

This file is written for Antigravity or any builder agent responsible for implementing the EVALIS project.

The goal is not just to generate a working React app. The goal is to generate a believable, polished EV brand platform that matches the provided references and respects the course-project constraints.

## Mission

Build a frontend-only React application for EVALIS that includes:

- a premium public marketing website
- a customer dashboard for vehicle owners
- an admin dashboard for administrators

The final result should feel intentional, premium, and demo-ready. Avoid generic boilerplate decisions when the brand or UX direction is already clear from the documentation and image references.

## Non-Negotiable Constraints

- There is no backend
- All data must come from local JSON files
- All interactive state should be handled on the frontend
- Important user actions must persist in `localStorage`
- The website stays in a fixed premium dark style
- Only the dashboards support light and dark theme toggle
- The shop must use product modals, not separate product pages
- The map must be a real interactive map, not a fake screenshot
- The app must support both Turkish and English
- Images will be placed manually later by the project owner

## Primary Build Philosophy

When making implementation decisions, optimize for:

1. visual coherence
2. believable product behavior
3. reusable architecture
4. smooth mock interactions
5. easy editing for a student project

Do not optimize first for:

- backend scalability
- enterprise security
- real payment processing
- real authentication
- overly complex state machines

## Product Interpretation Rules

### Public Website

Treat the public site as a luxury EV brand experience.

It should feel:

- sleek
- dark
- cinematic
- spacious
- premium

Avoid:

- template-like startup landing page patterns
- bright SaaS styling
- dashboard-style density on the public pages
- playful or overly colorful e-commerce vibes

### Dashboards

Treat the dashboards as ownership and operations tools layered on top of the same EV ecosystem.

They should feel:

- clean
- high-end
- efficient
- practical
- easy to scan

Both light and dark dashboard themes must feel intentionally designed, not like one theme was auto-inverted from the other.

## Recommended Technical Stack

Unless the surrounding environment already forces a different setup, prefer:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Leaflet for maps

If localization is implemented with a lightweight custom solution, keep it simple and JSON-driven. Do not introduce unnecessary infrastructure just to support two languages.

## Recommended Project Structure

Use a clean modular structure. A suggested layout:

- `src/app`
- `src/pages/public`
- `src/pages/dashboard`
- `src/pages/admin`
- `src/components/common`
- `src/components/public`
- `src/components/dashboard`
- `src/components/admin`
- `src/layouts`
- `src/data`
- `src/i18n`
- `src/lib`
- `src/hooks`
- `src/store` if needed
- `src/styles`

Keep mock data and persistent state logic easy to find and edit.

## Routing Guidance

Use route groups that clearly separate:

- public website routes
- customer dashboard routes
- admin dashboard routes

Suggested route strategy:

- public pages under `/`
- customer dashboard under `/dashboard`
- admin dashboard under `/admin`

Use route guards based on mock auth role stored in `localStorage`.

## State Management Guidance

Keep state management as simple as possible while still feeling robust.

Preferred approach:

- local component state where enough
- shared context or lightweight store only where genuinely helpful
- local JSON as seed data
- `localStorage` hydration for persistence

Persist at minimum:

- auth session
- cart
- orders
- test drive bookings
- language choice
- dashboard theme
- relevant dashboard preferences

## Data Handling Rules

Mock data must feel realistic and connected across the app.

Examples:

- vehicles shown on the public website should also appear in dashboard ownership data
- shop products should also appear in admin product management
- test drives created by public users should also appear in admin test drive lists
- customer orders should appear in checkout results, profile views, and admin order management

Do not create isolated mock sections that contradict one another.

## UI Behavior Rules

### Login

- login should happen in a modal or popup
- demo login is role-based by email
- remember session in `localStorage`
- redirect customer users to `/dashboard`
- redirect admin users to `/admin`

### Shop

- product cards open detail modals
- add-to-cart works from card or modal
- cart uses popup, drawer, or side panel
- checkout is fully simulated
- payment interaction should feel dynamic and premium
- order confirmation should feel like a real completion state even though it is mocked

### Test Drive

- form submission should validate basic required fields
- successful booking should show a clear confirmation state
- booking should be persisted locally

### Dashboard Theme

- theme toggle exists only inside dashboards
- selected dashboard theme persists
- website theme must remain fixed and not inherit dashboard mode

### Language

- language switching should be obvious and reliable
- all major navigation and action text should change with language
- currency display should also follow language

## Map Guidance

Use a real map component centered on Istanbul.

Map expectations:

- multiple mock charging station markers
- visual distinction between station types if practical
- station list and map should feel related
- clicking a station in one place should help reveal it in the other if feasible

Do not use a static image in place of the map.

## Public Page Implementation Guidance

### Home Page

Build a strong hero first. The home page should immediately communicate:

- EVALIS is premium
- EVALIS has multiple vehicle types
- EVALIS includes both vehicles and charging ecosystem products

The vehicle lineup and accessories section should be visually important, because they are central in the references.

### Vehicle Detail Pages

Use a repeatable detail-page template so the three vehicle pages stay consistent.

Each page should still feel distinct through:

- copy
- specs
- imagery
- feature highlights

### Charging Page

This page should bridge the brand and dashboard worlds. It should explain the charging ecosystem clearly and also help the app feel like more than a simple car brochure.

### Shop and Checkout

These pages should feel premium, not like a generic ecommerce template. Even though products are mocked, the UI should still create confidence and polish.

## Dashboard Implementation Guidance

### Customer Dashboard

Use the reference dashboards as direct inspiration for:

- sidebar structure
- greeting header
- vehicle overview cards
- charging stats
- station map
- quick actions
- recent session lists

Prefer one coherent final dashboard design rather than copying every variation literally. Synthesize the best parts.

### Admin Dashboard

The admin area should feel more operational and table-driven than the customer area, but it should still belong to the same product family.

Use:

- summary cards
- clean management tables
- modals or drawers for item detail
- filters and status badges

Do not make admin pages visually dull or disconnected from the rest of the product.

## Visual Quality Guardrails

Avoid these common mistakes:

- overusing default gray cards everywhere
- inconsistent spacing between sections
- using unrelated fonts across sections
- weak hierarchy in hero sections
- bright accent colors that break the EVALIS mood
- generic placeholder copy that does not sound like a real EV brand
- making the admin dashboard look like a different project

## Content Guardrails

Use believable EV-style content:

- realistic range values
- realistic charging power values
- realistic charging session labels
- realistic station names and availability

Do not use obviously random placeholder content if it can be avoided.

Keep all model naming aligned with the approved lineup:

- Vector
- Cloud
- Bullet

## Accessibility and UX Guardrails

Even though this is a course project, basic UX quality still matters.

Requirements:

- clear navigation
- visible hover and focus states
- readable contrast in both dashboard themes
- obvious CTA buttons
- forms with labels
- feedback after important actions

## Responsiveness Guidance

Desktop-first is acceptable. Do not block the project waiting for perfect mobile adaptation.

Priority order:

1. strong desktop experience
2. acceptable tablet behavior
3. later mobile refinement if time allows

If time is limited, preserve layout integrity over squeezing every section into a perfect mobile-first system.

## Suggested Build Order

Implement in this order:

1. project setup and routing
2. shared layouts
3. mock data foundation
4. public homepage
5. vehicle detail pages
6. charging page
7. shop page and product modal flow
8. checkout simulation
9. login modal and mock auth redirect
10. customer dashboard
11. admin dashboard
12. localization
13. dashboard theme toggle
14. persistence polish

## Definition Of Done

The implementation is ready when:

- all required routes exist
- the public site feels premium and coherent
- the dashboards work in both light and dark mode
- the role-based login flow works
- the map is interactive and uses mock station data
- products support modal detail and cart flow
- checkout produces a fake but convincing success path
- all important mock actions persist in `localStorage`
- English and Turkish both work
- the overall app feels presentable for a course demo

## Final Instruction To The Builder

Do not build the easiest possible version of this app. Build the clearest, most coherent version that still respects the project time limit and frontend-only constraint.

When in doubt:

- choose consistency over novelty
- choose polish over unnecessary feature sprawl
- choose believable mock behavior over empty static screens
- choose reusable structure over one-off page hacks
