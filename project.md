# EVALIS Project Specification

This document defines the detailed product structure for the EVALIS course project. It is intended to guide Antigravity when building the application from scratch.

## Product Summary

EVALIS is a frontend-only EV ecosystem web app for a fictional electric vehicle brand. The product combines:

- a premium public website
- a customer dashboard for vehicle owners
- an admin dashboard for platform management

There is no backend. All data is mock data stored in JSON files. User interactions should persist in `localStorage`.

## Main Build Objective

Create a polished, multi-route React application that feels like a believable EV brand platform. The experience should combine:

- luxury automotive marketing
- charging station management
- ownership tools
- mock e-commerce
- test drive booking

## App Structure

The application should be divided into three major sections:

### 1. Public Website

Purpose:

- brand presentation
- vehicle discovery
- charging product browsing
- test drive conversion
- customer access entry point
- faq

Suggested routes:

- `/`
- `/vehicles`
- `/vehicles/vector`
- `/vehicles/cloud`
- `/vehicles/bullet`
- `/charging`
- `/shop`
- `/checkout`
- `/profile`
- `/faq`

Special UI:

- login modal or popup accessible from the header
- product detail modals inside the shop page
- cart popup accessible globally from shop flow
- language switcher in the header
- faq page symbol in the header

### 2. Customer Dashboard

Purpose:

- let a customer manage their EVALIS vehicles and charging activity

Suggested route prefix:

- `/dashboard`

Suggested customer routes:

- `/dashboard`
- `/dashboard/vehicles`
- `/dashboard/vehicles/:vehicleId`
- `/dashboard/charging`
- `/dashboard/stations`
- `/dashboard/history`
- `/dashboard/schedules`
- `/dashboard/energy`
- `/dashboard/notifications`
- `/dashboard/settings`

### 3. Admin Dashboard

Purpose:

- let an admin manage the entire mock ecosystem

Suggested route prefix:

- `/admin`

Suggested admin routes:

- `/admin`
- `/admin/users`
- `/admin/vehicles`
- `/admin/stations`
- `/admin/sessions`
- `/admin/products`
- `/admin/orders`
- `/admin/test-drives`
- `/admin/analytics`
- `/admin/settings`

## Design System Direction

### Public Website Style

The public site should feel:

- cinematic
- premium
- dark
- minimal
- image-led
- high contrast

Visual cues:

- large hero sections
- big vehicle photography
- bold headlines
- elegant spacing
- thin-line dividers
- subtle glowing EV-green accents
- strong black, charcoal, graphite, silver, and white palette

### Dashboard Style

The dashboards should feel:

- modern
- clean
- data-rich
- easy to scan
- premium but practical

Dashboard-specific rules:

- support both light and dark theme
- theme toggle only exists in dashboards
- maintain the same layout and component language across both themes

## Localization

The app must support:

- English
- Turkish

Localization rules:

- the globe icon in the header opens the language selector
- English pricing uses `$`
- Turkish pricing uses `₺`
- all map, station, and location context should center around Istanbul
- all major UI labels should come from translation files rather than hardcoded text

Suggested translation structure:

- `en`
- `tr`

## Authentication Logic

Authentication is fully mocked.

Requirements:

- login happens through a modal or popup on the public website
- no real password validation is required
- login behavior is based on demo user role
- session persists in `localStorage`

Suggested role routing:

- customer email logs into customer dashboard
- admin email logs into admin dashboard

Suggested example users:

- `customer@evalis.com`
- `admin@evalis.com`

## Public Website Page Requirements

### Home Page

Purpose:

- introduce the EVALIS brand
- show the three vehicle models
- promote charging ecosystem and accessories
- guide users toward vehicle pages, test drive, and shop

Required sections:

- premium hero section
- headline and brand statement
- featured vehicle lineup cards
- featured charging and accessory products
- charging ecosystem highlight
- call-to-action blocks
- footer

Possible CTA buttons:

- Explore Vehicles
- Book a Test Drive
- Shop Accessories
- Log In

### Vehicles Listing Page

Purpose:

- show all available vehicles in one place

Required content:

- Vector
- Cloud
- Bullet

Each vehicle card should include:

- image
- name
- category
- short tagline
- key specs
- button or link to detail page

### Vehicle Detail Pages

There are three dedicated detail pages:

- Vector
- Cloud
- Bullet

Each page should follow the same structure with model-specific content.

Required content:

- hero image
- model name
- category label
- short positioning statement
- CTA to test drive
- CTA to configure or explore
- quick specs row
- image gallery or visual feature section
- feature highlights
- tabs or segmented sections

Suggested content sections:

- Overview
- Design
- Performance
- Technology
- Charging
- Safety
- Specs

Vehicle identity:

- Vector -> luxury electric sedan
- Cloud -> electric SUV
- Bullet -> electric motorcycle

### Charging Page

Purpose:

- explain charging products and charging ecosystem

Suggested sections:

- home charging overview
- public charging station coverage
- smart charging benefits
- charging speed explanation
- compatible accessories
- charging-related CTA

### Test Drive Page

Purpose:

- allow a visitor to simulate booking a test drive

Required form inputs:

- selected vehicle
- date
- time
- location
- first name
- last name
- email
- phone number

Required UI:

- vehicle preview
- location/map section
- booking summary
- submit button
- success confirmation state

Behavior:

- booking is stored in `localStorage`
- booking may also append to a mock test drive collection for admin visibility

### Shop Page

Purpose:

- let users browse EVALIS accessories and charging products

Rules:

- no standalone product detail pages
- product detail opens in a modal
- cart opens in a popup or side panel

Required features:

- product grid
- category filter
- sort control
- search input
- add to cart action
- product quick view
- cart item quantity editing
- cart subtotal

Initial known products:

- Home Charger
- Charging Cable
- Key Card
- Floor Mat
- Tire Set

The shop data structure must support more categories and products later.

### Checkout Page

Purpose:

- simulate an e-commerce checkout experience

Required sections:

- order summary
- shipping or billing form
- payment card area
- animated card-style payment interaction
- place order button
- fake order success confirmation

Behavior:

- order is stored in `localStorage`
- cart clears after successful checkout
- order appears in profile or dashboard history

### Profile Page

Purpose:

- give the logged-in user a public-facing account view outside the dashboards if needed

Suggested content:

- profile info
- recent orders
- booked test drives
- saved preferences
- language preference

### Login Popup

Purpose:

- serve as the entry point to customer or admin areas

Required behavior:

- modal layout
- email input
- password input
- remember me checkbox
- fake social login buttons are allowed visually but do not need real functionality
- role-based redirect on submit

## Customer Dashboard Requirements

The customer dashboard should use the visual language from the provided reference screens and combine the strongest ideas from them.

### Primary Dashboard Layout

Core layout:

- left sidebar navigation
- top utility bar
- greeting section
- overview cards
- quick actions
- charging insights
- map and station list
- current charging state
- recent session list

### Customer Dashboard Features

Required modules:

- My Vehicles
- Vehicle cards with battery, range, and connection state
- Current charge status
- Energy overview chart
- Charging history
- Nearby charging stations
- Smart charging recommendation
- Quick actions
- Notifications
- Schedules
- Rewards or sustainability summary
- Settings

Suggested quick actions:

- Start Charging
- Stop Charging
- Schedule Charging
- Pre-condition Vehicle
- Find Charging Station

### Customer Theme Behavior

Requirements:

- light theme
- dark theme
- toggle persists in `localStorage`
- toggle only affects dashboard area

### Customer Map Behavior

Use a real interactive map.

Requirements:

- Istanbul-centered map
- mock station markers
- station cards linked to map content
- fake availability values
- fake charger speed values
- optional Tesla-like station density feel

### Customer Data Views

Suggested dashboard widgets:

- battery percentage
- estimated range
- current charging power
- time remaining
- total monthly energy
- monthly cost
- savings recommendation
- recent sessions
- station availability

## Admin Dashboard Requirements

The admin area should feel operational and structured, not marketing-focused.

### Admin Dashboard Overview

Required overview content:

- total users
- total vehicles
- total stations
- total sessions
- total products
- total orders
- pending test drive requests
- revenue or mock sales summary

### Admin Management Sections

#### Users

Support:

- list view
- search
- filter by role
- status badges
- profile summary modal

#### Vehicles

Support:

- list of all vehicles in the system
- ownership assignment
- battery or status mock state
- edit-style modal or drawer

#### Stations

Support:

- list of charging stations
- map association
- availability count
- power rating
- active or inactive state

#### Sessions

Support:

- charging session records
- filtering by user, station, or vehicle
- status display
- energy and cost columns

#### Products

Support:

- product list
- category
- price
- stock mock value
- create, update, delete as simulated frontend actions

#### Orders

Support:

- order list
- order status
- customer info
- purchased products
- order total

#### Test Drives

Support:

- booking list
- model requested
- date and location
- customer contact info
- booking status

#### Analytics

Support:

- summary cards
- charts
- usage trends
- order trends
- charging activity trends

## Data Model Requirements

All data should come from JSON files and hydrate app state on startup.

Suggested data files:

- `vehicles.json`
- `stations.json`
- `products.json`
- `users.json`
- `sessions.json`
- `orders.json`
- `testDrives.json`
- `notifications.json`
- `translations-en.json`
- `translations-tr.json`

Suggested entity shapes:

### Vehicle

- `id`
- `slug`
- `name`
- `type`
- `tagline`
- `description`
- `range`
- `topSpeed`
- `power`
- `acceleration`
- `seats` if applicable
- `weight` if applicable
- `batteryPercent`
- `status`
- `heroImage`
- `gallery`
- `features`
- `specs`

### Product

- `id`
- `slug`
- `name`
- `category`
- `priceUSD`
- `priceTRY`
- `shortDescription`
- `fullDescription`
- `image`
- `stock`
- `featured`

### Station

- `id`
- `name`
- `latitude`
- `longitude`
- `power`
- `availablePorts`
- `totalPorts`
- `distance`
- `status`
- `type`

### User

- `id`
- `role`
- `name`
- `email`
- `phone`
- `avatar`
- `preferredLanguage`
- `ownedVehicleIds`

### Charging Session

- `id`
- `userId`
- `vehicleId`
- `stationId`
- `energyKWh`
- `cost`
- `status`
- `startedAt`
- `endedAt`

### Order

- `id`
- `userId`
- `items`
- `subtotal`
- `currency`
- `status`
- `createdAt`

### Test Drive

- `id`
- `userId` or guest details
- `vehicleId`
- `date`
- `time`
- `location`
- `firstName`
- `lastName`
- `email`
- `phone`
- `status`

## Local Storage Requirements

Use `localStorage` for app interactivity and session persistence.

Suggested stored items:

- auth session
- selected language
- dashboard theme
- cart
- orders
- test drive bookings
- notification read state
- preferred vehicle or filters

## Key User Flows

### Visitor Flow

1. Visitor lands on home page
2. Visitor explores vehicles
3. Visitor opens vehicle detail page
4. Visitor books a test drive or browses shop
5. Visitor logs in through modal if needed

### Customer Flow

1. Customer logs in with demo account
2. Customer is redirected to `/dashboard`
3. Customer views vehicles and charging state
4. Customer checks map and nearby stations
5. Customer schedules charging or reviews history
6. Customer shops and simulates checkout

### Admin Flow

1. Admin logs in with demo account
2. Admin is redirected to `/admin`
3. Admin reviews platform summary
4. Admin manages users, products, stations, orders, and test drive records

## Component Priorities

Antigravity should prioritize reusable components for:

- header
- footer
- sidebar
- vehicle card
- product card
- modal
- cart panel
- metric card
- chart card
- map section
- table
- status badge
- language switcher
- theme toggle

## Implementation Priorities

Build in this order:

1. routing and layouts
2. shared mock data layer
3. public pages
4. login logic
5. customer dashboard
6. admin dashboard
7. localization
8. theme toggle for dashboards
9. cart, checkout, and order simulation
10. local persistence polish

## Important Constraints

- no backend
- no real payments
- no real authentication
- no separate product detail pages
- all important actions must feel interactive even if mocked
- images will be added manually later by the project owner
- responsive polish can be secondary to delivering the core desktop experience

## Success Criteria

The project is successful if the final app:

- looks premium and coherent
- clearly reflects the EVALIS brand
- includes the full required page set
- supports both Turkish and English
- supports customer and admin role flows
- supports dashboard light and dark themes
- uses real map rendering with mock station data
- persists mock interactions in `localStorage`
- feels complete enough to demo confidently as a course project
