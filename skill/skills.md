# EVALIS Build Skills

This document defines the working style and execution playbook for Antigravity while building the EVALIS project.

It is not a feature list. It is a practical guide for how to make good implementation choices, preserve quality, and keep the final result coherent under time constraints.

## Core Mindset

Build EVALIS like a polished frontend product demo, not like a disconnected set of pages.

Every implementation choice should support at least one of these goals:

- stronger brand consistency
- smoother user flow
- more believable mock behavior
- easier maintenance for a student project
- faster demo readiness

## Skill 1: Build The Skeleton First

Before polishing visuals, establish a reliable app structure.

Complete these foundations early:

- routing
- layouts
- JSON data files
- shared types
- persistence helpers
- language system
- theme system for dashboards

Do not start by over-designing isolated sections without a shared base.

## Skill 2: Separate The Three Product Modes

Always think of EVALIS as three connected product modes:

- public website
- customer dashboard
- admin dashboard

They should feel related, but they should not behave or look identical.

Implementation rule:

- public pages emphasize emotion, imagery, and brand
- customer dashboard emphasizes ownership, charging, and convenience
- admin dashboard emphasizes control, data, and management

## Skill 3: Reuse Data Across Features

Mock data should be shared across the app so the product feels real.

Examples:

- vehicles on the home page should match vehicles in dashboard cards
- products in the shop should match products in admin management
- test drive bookings should surface in admin records
- orders from checkout should show in profile and admin order views

Avoid fake duplication where two parts of the app describe the same thing differently.

## Skill 4: Use Progressive Fidelity

Build each area in layers:

1. structure
2. content
3. interaction
4. polish

Example:

- create the shop route and layout
- render product cards from JSON
- add modal and cart interactions
- add visual polish and motion

This keeps momentum high and reduces rework.

## Skill 5: Treat Mock Interactions Like Real Product Moments

Even though there is no backend, the app should still feel alive.

Important actions must produce visible results:

- login redirects
- test drive submission confirms success
- add to cart updates cart state
- checkout creates an order
- theme toggle changes dashboard appearance
- language switch updates content
- station interactions affect the map or detail view

Do not leave important buttons as decorative UI.

## Skill 6: Persist What Users Expect To Persist

Use `localStorage` intentionally.

Persist:

- current user session
- selected language
- selected dashboard theme
- cart contents
- orders
- test drive bookings
- notification read state
- any scheduled charging or dashboard preferences if implemented

Do not persist everything blindly. Persist the state that supports continuity.

## Skill 7: Build With Route-Level Clarity

Every route should have a clear job.

Questions to ask while implementing:

- why does this route exist
- what is the primary user action here
- what data does this route need
- what should persist after leaving it

If a page does not have a clear role, simplify it.

## Skill 8: Make Components Pull Their Weight

Create reusable components when they represent repeated UI patterns, not just repeated HTML.

High-value reusable components:

- vehicle card
- product card
- modal
- cart panel
- sidebar
- dashboard stat card
- table
- badge
- section header
- language switcher
- theme toggle

Avoid premature abstraction if a pattern only appears once.

## Skill 9: Keep The Public Site Cinematic

The public website should not drift into dashboard energy.

Focus on:

- large image areas
- strong typography
- restrained copy blocks
- premium spacing
- clear CTA hierarchy

Avoid:

- overly busy grids above the fold
- excessive UI chrome
- generic startup-copy patterns

## Skill 10: Make The Dashboards Trustworthy

The dashboards should feel useful at a glance.

Good dashboard behavior includes:

- quick scanning
- consistent card spacing
- readable values
- obvious status states
- practical navigation
- meaningful quick actions

If a dashboard card looks pretty but does not communicate useful information, simplify it.

## Skill 11: Use Themes Deliberately

The dashboard light and dark themes must both feel designed.

Rules:

- do not simply invert colors
- keep hierarchy readable in both modes
- preserve the EVALIS accent language
- keep interaction states visible in both themes

The public site does not get a theme toggle.

## Skill 12: Localization Must Affect Experience, Not Just Labels

Language support is not just text swapping.

English mode:

- English labels
- `$` prices

Turkish mode:

- Turkish labels
- `₺` prices

Implementation guidance:

- centralize labels in translation files
- avoid hardcoded text inside components when possible
- keep formatting rules consistent across pages

## Skill 13: Map Integration Should Feel Real

The map is one of the features that makes this project feel substantial.

Implementation priorities:

- real interactive map
- Istanbul-centered default position
- mock station markers
- linked station list
- believable station details

Do not replace this with a decorative static image.

## Skill 14: Admin Should Be Structured, Not Neglected

The admin side should not be an afterthought.

A good admin implementation includes:

- clear overview metrics
- useful table layouts
- filterable lists
- status badges
- management actions through modals or drawers

Even with mock data, admin pages should feel operational.

## Skill 15: Timebox Responsibly

If time becomes tight, reduce scope in the correct order.

Safe areas to simplify later:

- advanced animations
- mobile refinement
- extra admin micro-features
- non-essential filters

Do not cut these core expectations:

- required routes
- role-based login flow
- bilingual support
- dashboard themes
- real map
- cart and checkout simulation
- local persistence

## Skill 16: Validate Each Major Flow Before Moving On

Before considering a section complete, manually verify the whole flow.

Minimum flow checks:

- public browsing flow
- login and redirect flow
- test drive booking flow
- shop to cart to checkout flow
- customer dashboard usage flow
- admin management visibility flow

This is more valuable than polishing one screen in isolation.

## Skill 17: Keep Content Believable

Use realistic EV and charging content throughout the product.

This includes:

- sensible battery percentages
- believable range figures
- believable charging power values
- believable station names
- believable recent sessions
- believable product pricing relative to category

The quality of the mock content strongly affects how professional the final demo feels.

## Skill 18: Prefer Cohesion Over Feature Sprawl

If two ideas compete, choose the one that makes the overall product feel more unified.

Examples:

- one strong dashboard system is better than several disconnected widgets
- one polished shop flow is better than many shallow ecommerce extras
- one consistent vehicle page template is better than three unrelated page designs

## Suggested Build Sequence

Follow this execution order:

1. create app shell and route structure
2. add shared layouts and navigation
3. create JSON mock data and types
4. build homepage and public vehicle flow
5. build charging, shop, and checkout flow
6. build login modal and role redirects
7. build customer dashboard
8. build admin dashboard
9. connect localization
10. connect dashboard themes
11. add persistence polish
12. refine visual consistency

## Suggested Review Checklist

Before calling the project complete, review:

- Do all required pages exist
- Does the website feel premium and dark
- Do dashboards support both light and dark mode
- Does language switching work clearly
- Does currency switch with language
- Does login redirect correctly by role
- Does the map render and show mock stations
- Do product modals work
- Does the cart update correctly
- Does checkout create a mock order
- Do test drive submissions persist
- Does admin reflect user-generated mock activity
- Does the app feel coherent across all sections

## Final Working Rule

Build the app so that a course reviewer can understand the product in minutes:

- what EVALIS is
- what vehicles it offers
- how charging works
- how a customer would use the platform
- how an admin would manage the platform

If the app communicates those clearly and elegantly, the implementation is successful.
