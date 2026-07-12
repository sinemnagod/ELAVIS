# EVALIS Implementation Plan

This file is the steady, review-controlled build checklist for the EVALIS project. It assumes the project will be built from scratch in this repository and should be used as the main implementation tracker while building with Antigravity.

## Working Rules

- [ ] Treat this file as the source of truth for build order.
- [ ] Complete phases from top to bottom unless a dependency forces a small adjustment.
- [ ] Do not skip review gates.
- [ ] Do not begin the next phase until the current phase gate is satisfied.
- [ ] Keep the public site fixed in a premium dark style.
- [ ] Keep light/dark theme support limited to dashboards only.
- [ ] Keep all data mock-only and JSON-driven.
- [ ] Persist important user actions in `localStorage`.
- [ ] Preserve bilingual support for English and Turkish from the beginning of app foundations.
- [ ] Keep all major flows connected so public actions can appear in dashboard and admin views.

## Phase 1: Project Setup

### App bootstrap

- [x] Initialize a React project with Vite.
- [x] Configure TypeScript.
- [x] Confirm the app runs locally.
- [x] Clean default starter content.
- [x] Create a minimal root app entry.

### Core dependencies

- [x] Install and configure Tailwind CSS.
- [x] Add PostCSS and Tailwind config files if needed.
- [x] Install React Router.
- [x] Install Leaflet.
- [x] Install React-Leaflet or the selected React map binding.
- [x] Add Leaflet stylesheet support to the app.

### Initial architecture

- [x] Create `src/app`.
- [x] Create `src/pages/public`.
- [x] Create `src/pages/dashboard`.
- [x] Create `src/pages/admin`.
- [x] Create `src/components/common`.
- [x] Create `src/components/public`.
- [x] Create `src/components/dashboard`.
- [x] Create `src/components/admin`.
- [x] Create `src/layouts`.
- [x] Create `src/data`.
- [x] Create `src/i18n`.
- [x] Create `src/hooks`.
- [x] Create `src/lib`.
- [x] Create `src/styles`.

### App shell and utilities

- [x] Create a shared router entry point.
- [x] Create a base app layout strategy.
- [x] Add a global stylesheet entry.
- [x] Add a base design token strategy for colors and spacing.
- [x] Create empty JSON placeholders for major data sources.
- [x] Create a base i18n utility scaffold.
- [x] Create a base theme utility scaffold for dashboards.
- [x] Create a base persistence utility scaffold for `localStorage`.

### Phase 1 gate

- [x] Do not continue until the app boots successfully, routing is connected, dependencies are installed, and the base folder structure exists.

## Phase 2: Data and App Foundations

### Mock data design

- [ ] Define the shape for vehicles data.
- [ ] Define the shape for stations data.
- [ ] Define the shape for products data.
- [ ] Define the shape for users data.
- [ ] Define the shape for charging sessions data.
- [ ] Define the shape for orders data.
- [ ] Define the shape for test drive bookings data.
- [ ] Define the shape for notifications data.

### Initial mock datasets

- [ ] Add Vector vehicle data.
- [ ] Add Cloud vehicle data.
- [ ] Add Bullet vehicle data.
- [ ] Add Istanbul charging station seed data.
- [ ] Add initial shop product seed data.
- [ ] Add demo customer user data.
- [ ] Add demo admin user data.
- [ ] Add example charging session entries.
- [ ] Add example order entries.
- [ ] Add example test drive entries.
- [ ] Add example notification entries.

### Localization foundation

- [ ] Create English translation file.
- [ ] Create Turkish translation file.
- [ ] Add shared labels for navigation.
- [ ] Add shared labels for buttons and CTAs.
- [ ] Add shared labels for forms.
- [ ] Add shared labels for dashboard UI.
- [ ] Add shared labels for admin UI.

### Persistence and auth helpers

- [ ] Create `localStorage` read helper.
- [ ] Create `localStorage` write helper.
- [ ] Create `localStorage` remove helper.
- [ ] Create a session storage key strategy.
- [ ] Create a cart storage key strategy.
- [ ] Create an orders storage key strategy.
- [ ] Create a test drives storage key strategy.
- [ ] Create a language storage key strategy.
- [ ] Create a dashboard theme storage key strategy.
- [ ] Create mock role detection logic by email.
- [ ] Create mock session hydration logic.

### Phase 2 gate

- [ ] Do not continue until the app can read mock JSON data, load base translations, and persist basic state safely.

## Phase 3: Public Website Shell

### Public layout foundation

- [ ] Create the public site layout wrapper.
- [ ] Build the main dark brand background style.
- [ ] Create the public header shell.
- [ ] Create the public footer shell.
- [ ] Add top navigation placeholders.
- [ ] Add the language switch trigger in the header.
- [ ] Add the login trigger in the header.

### Public routes

- [ ] Create `/` route.
- [ ] Create `/vehicles` route.
- [ ] Create `/vehicles/vector` route.
- [ ] Create `/vehicles/cloud` route.
- [ ] Create `/vehicles/bullet` route.
- [ ] Create `/charging` route.
- [ ] Create `/shop` route.
- [ ] Create `/checkout` route.
- [ ] Create `/profile` route.
- [ ] Create a test drive route.

### Page skeletons

- [ ] Add homepage skeleton sections.
- [ ] Add vehicles page skeleton sections.
- [ ] Add charging page skeleton sections.
- [ ] Add shop page skeleton sections.
- [ ] Add checkout page skeleton sections.
- [ ] Add profile page skeleton sections.
- [ ] Add test drive page skeleton sections.

### Navigation wiring

- [ ] Link header navigation to working public routes.
- [ ] Ensure vehicle links route to their correct detail pages.
- [ ] Ensure shop and checkout routes are reachable.
- [ ] Ensure profile route is reachable.
- [ ] Ensure test drive route is reachable.

### Phase 3 gate

- [ ] Do not continue until all public routes exist, the header/footer are wired, and public navigation works end to end.

## Phase 4: Home and Vehicle Experience

### Homepage content

- [ ] Build the premium homepage hero section.
- [ ] Add the main EVALIS brand statement.
- [ ] Add the three-model lineup section.
- [ ] Add featured vehicle cards.
- [ ] Add charging ecosystem highlight section.
- [ ] Add accessories and best-seller section.
- [ ] Add CTA section for exploring vehicles.
- [ ] Add CTA section for booking a test drive.
- [ ] Add CTA section for shopping accessories.

### Vehicles listing page

- [ ] Render all three vehicles from mock data.
- [ ] Show image placeholder support for each vehicle.
- [ ] Show name and category for each vehicle.
- [ ] Show short tagline for each vehicle.
- [ ] Show key specs for each vehicle.
- [ ] Add route link to each vehicle detail page.

### Shared vehicle detail template

- [ ] Build a reusable vehicle detail page structure.
- [ ] Add hero image area.
- [ ] Add model name and category area.
- [ ] Add short positioning statement area.
- [ ] Add primary CTA for test drive.
- [ ] Add secondary CTA for configuration or exploration.
- [ ] Add quick specs row.
- [ ] Add gallery placeholder section.
- [ ] Add feature highlights section.
- [ ] Add tabbed or segmented content sections.

### Individual vehicle pages

- [ ] Implement Vector content.
- [ ] Implement Cloud content.
- [ ] Implement Bullet content.
- [ ] Add realistic specs for each model.
- [ ] Add distinct copy for each model.
- [ ] Add charging-related information for each model.
- [ ] Add safety and technology sections for each model.

### Phase 4 gate

- [ ] Do not continue until the homepage feels premium, the lineup is clear, and all three vehicle pages are coherent and data-driven.

## Phase 5: Test Drive Flow

### Form foundation

- [x] Build the test drive page layout.
- [x] Add vehicle selection input.
- [x] Add date input.
- [x] Add time input.
- [x] Add location input.
- [x] Add first name input.
- [x] Add last name input.
- [x] Add email input.
- [x] Add phone input.

### Booking experience

- [x] Add vehicle preview panel.
- [x] Add booking summary panel.
- [x] Add location and map context area.
- [x] Add required field validation.
- [x] Add submission loading state if desired.
- [x] Add success confirmation state.
- [x] Add reset or follow-up action after success.

### Data handling

- [x] Save submitted test drive bookings to `localStorage`.
- [x] Merge new bookings with seed or existing mock bookings.
- [x] Ensure saved bookings can later appear in the admin dashboard.

### Phase 5 gate

- [x] Do not continue until a visitor can complete the test drive flow and the booking persists locally.

## Phase 6: Shop, Cart, and Checkout

### Shop listing

- [x] Render products from JSON.
- [x] Add product card layout.
- [x] Show product image placeholders.
- [x] Show product name and category.
- [x] Show localized pricing.
- [x] Add featured product styling where relevant.

### Shop controls

- [x] Add category filter control.
- [x] Add search input.
- [x] Add sort control.
- [x] Wire filters to the product grid.

### Product detail behavior

- [x] Build product quick-view modal.
- [x] Show expanded product details in the modal.
- [x] Add add-to-cart from product card.
- [x] Add add-to-cart from product modal.

### Cart behavior

- [x] Build cart popup, drawer, or side panel.
- [x] Show cart item list.
- [x] Show item quantity controls.
- [x] Add remove item action.
- [x] Show subtotal.
- [x] Show cart CTA to checkout.
- [x] Persist cart in `localStorage`.

### Checkout flow

- [x] Build checkout page structure.
- [x] Add order summary section.
- [x] Add billing or shipping form.
- [x] Add payment card interaction area.
- [x] Add dynamic card-style payment animation.
- [x] Add submit or place-order action.
- [x] Add fake order confirmation state.
- [x] Save completed order to `localStorage`.
- [x] Clear cart after successful checkout.
- [x] Make completed orders available for profile and admin views.

### Phase 6 gate

- [x] Do not continue until the full shop-to-cart-to-checkout flow works and completed orders persist correctly.

## Phase 7: Login, Session, and Profile

### Login modal

- [x] Build login modal shell.
- [x] Add email field.
- [x] Add password field.
- [x] Add remember-me checkbox.
- [x] Add visual social login buttons if desired.
- [x] Add submit action.

### Mock authentication

- [x] Detect customer role from demo email.
- [x] Detect admin role from demo email.
- [x] Create session object on successful login.
- [x] Persist session data.
- [x] Redirect customer login to `/dashboard`.
- [x] Redirect admin login to `/admin`.
- [x] Add logout behavior.

### Profile page

- [x] Build profile page layout.
- [x] Show logged-in user info.
- [x] Show recent orders.
- [x] Show saved test drive bookings.
- [x] Show language preference.
- [x] Show basic account summary.

### Phase 7 gate

- [x] Do not continue until customer and admin demo logins redirect correctly and profile data reflects persisted activity.

## Phase 8: Customer Dashboard Core

### Layout and navigation

- [x] Build customer dashboard layout.
- [x] Add sidebar navigation.
- [x] Add top utility bar.
- [x] Add greeting header.
- [x] Add route placeholders for dashboard sections.

### Core overview

- [x] Build vehicle overview cards.
- [x] Show battery percentage.
- [x] Show range value.
- [x] Show connection or parked status.
- [x] Show quick vehicle summary.

### Charging modules

- [x] Build current charge module.
- [x] Build quick actions module.
- [x] Build energy overview widget area.
- [x] Build recent sessions widget area.
- [x] Build notification placeholder area.
- [x] Build schedules placeholder area.

### Phase 8 gate

- [x] Do not continue until the customer dashboard is navigable, visually coherent, and useful with mock data.

## Phase 9: Customer Dashboard Advanced

### Map and station system

- [x] Add a real Leaflet map to the dashboard.
- [x] Center the default map view on Istanbul.
- [x] Add mock charging station markers.
- [x] Add station popup or summary behavior.
- [x] Build nearby stations list.
- [x] Show station availability values.
- [x] Show station power values.

### Connected dashboard behavior

- [x] Link station list items to map context where practical.
- [x] Highlight selected station if practical.
- [x] Add smart charging recommendation block.
- [x] Add rewards, savings, or sustainability summary.
- [x] Add theme toggle control for the dashboard.
- [x] Persist dashboard theme in `localStorage`.
- [x] Persist relevant dashboard preferences if implemented.

### Phase 9 gate

- [x] Do not continue until the dashboard includes real charging-station behavior, a real map, and persistent theme support.

## Phase 10: Admin Dashboard

### Admin shell

- [x] Build admin layout.
- [x] Add admin route guard.
- [x] Add admin sidebar or top navigation.
- [x] Add admin overview page.

### Admin overview metrics

- [x] Show total users.
- [x] Show total vehicles.
- [x] Show total stations.
- [x] Show total charging sessions.
- [x] Show total products.
- [x] Show total orders.
- [x] Show pending or recent test drive requests.
- [x] Show mock analytics summary.

### Admin management sections

- [x] Build users management view.
- [x] Build vehicles management view.
- [x] Build stations management view.
- [x] Build sessions management view.
- [x] Build products management view.
- [x] Build orders management view.
- [x] Build test drives management view.
- [x] Build analytics view.

### Admin UI behavior

- [x] Add tables where appropriate.
- [x] Add status badges.
- [x] Add basic filters.
- [x] Add search where useful.
- [x] Add modal or drawer detail view for records.
- [x] Ensure public-generated orders appear in admin.
- [x] Ensure public-generated test drive bookings appear in admin.

### Phase 10 gate

- [x] Do not continue until the admin area can view all major mock system activity coherently.

## Phase 11: Localization and Theme Completion

### Localization completion

- [x] Connect English labels across major public pages.
- [x] Connect Turkish labels across major public pages.
- [x] Connect English labels across dashboard pages.
- [x] Connect Turkish labels across dashboard pages.
- [x] Connect English labels across admin pages.
- [x] Connect Turkish labels across admin pages.
- [x] Switch pricing to `$` in English mode.
- [x] Switch pricing to `₺` in Turkish mode.
- [x] Ensure the language trigger updates visible content reliably.

### Theme completion

- [x] Keep the public site fixed in dark mode.
- [x] Ensure the dashboard theme toggle only affects dashboards.
- [x] Verify light dashboard readability.
- [x] Verify dark dashboard readability.
- [x] Verify contrast for buttons, cards, tables, and charts in both themes.

### Phase 11 gate

- [x] Do not continue until bilingual support and dashboard-only theme behavior are complete and consistent.

## Phase 12: Final QA and Demo Polish

### Functional review

- [x] Check all required routes.
- [x] Check route navigation.
- [x] Check role-based redirects.
- [x] Check session persistence.
- [x] Check cart persistence.
- [x] Check order persistence.
- [x] Check test drive persistence.
- [x] Check map rendering.
- [x] Check station marker behavior.
- [x] Check dashboard theme persistence.
- [x] Check language switching.
- [x] Check currency switching.

### Product coherence review

- [x] Replace weak placeholder copy.
- [x] Refine spacing inconsistencies.
- [x] Refine hover states.
- [x] Refine focus states.
- [x] Refine success and feedback states.
- [x] Ensure public site and dashboards still feel like one product family.
- [x] Ensure admin does not feel visually disconnected.

### Demo readiness review

- [x] Confirm public browsing flow works.
- [x] Confirm test drive flow works.
- [x] Confirm shop to checkout flow works.
- [x] Confirm customer dashboard flow works.
- [x] Confirm admin visibility flow works.
- [x] Confirm the app feels ready for a course presentation.

### Phase 12 gate

- [x] Do not continue until the project is stable, coherent, and demo-ready.

## Demo Readiness Checklist

- [x] Visitor can browse home, vehicles, charging, and shop.
- [x] Visitor can open vehicle detail pages for Vector, Cloud, and Bullet.
- [x] Visitor can submit a test drive booking successfully.
- [x] Visitor can add products to cart and complete a fake checkout.
- [x] Customer demo account logs into `/dashboard`.
- [x] Admin demo account logs into `/admin`.
- [x] Dashboard theme toggle persists correctly.
- [x] Language switch changes labels correctly.
- [x] Currency changes with language.
- [x] Istanbul map renders with mock stations.
- [x] Admin sees orders created through public checkout flow.
- [x] Admin sees test drive activity created through public booking flow.

## Known Nice-to-Haves If Time Remains

- [x] Improve tablet responsiveness.
- [x] Improve mobile responsiveness.
- [x] Add richer dashboard charts.
- [x] Add deeper product category expansion.
- [x] Add more refined animations across checkout and dashboard widgets.
- [x] Add richer admin filters and summaries.
- [x] Add saved favorites or wishlist behavior for shop or stations.

## Do Not Cut

- [x] Public site core routes.
- [x] Vehicle detail pages for Vector, Cloud, and Bullet.
- [x] Test drive booking flow.
- [x] Shop, cart, and checkout flow.
- [x] Customer dashboard.
- [x] Admin dashboard.
- [x] English and Turkish support.
- [x] Dashboard-only theme toggle.
- [x] Real Istanbul map with mock station markers.
- [x] `localStorage` persistence for major flows.
