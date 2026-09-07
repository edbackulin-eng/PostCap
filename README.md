# PostCap

A full-stack point-of-sale (POS) system for coffee shops — order taking, recipe-based inventory, shift management and fiscal-compliant receipts.

> **Status:** paused / work in progress. Core POS, inventory and payment flows are implemented; some features are still being finished.

---

## Overview

PostCap is a POS system built for small coffee shops. Cashiers take orders through a fast till interface, while owners manage the menu, staff, stock and shifts from an admin panel. The system tracks inventory down to the ingredient level — every sale automatically deducts the ingredients used — and integrates a payment gateway and a fiscalization service for legally compliant electronic receipts.

## Features

- **Point of sale** — fast cashier interface for taking and processing orders
- **Recipe-based inventory** — each product has a recipe; ingredient stock is deducted automatically on every sale through stock-movement tracking (12-table relational schema)
- **Role-based access** — PIN-based authentication for admin and cashier roles
- **Shift & cash management** — open/close shifts and track cash flow
- **Payments** — payment gateway integration (WayForPay) for subscription billing
- **Fiscalization** — integration with a fiscal service (Checkbox) for compliant electronic receipts
- **Admin panel** — manage menu, products, recipes, staff and reports

## Tech Stack

- **Frontend:** React 19 (Vite)
- **Backend:** Node.js, Express 5, REST API
- **ORM / Database:** Prisma over PostgreSQL
- **Auth:** PIN-based role authentication (admin / cashier)
- **Integrations:** WayForPay (payments), Checkbox (fiscalization)

## Architecture

```
backend/    Express 5 + Prisma REST API (PostgreSQL, 12-table schema)
frontend/   React 19 (Vite) cashier & admin UI
landing/    Static landing page
```

The database can be populated with seed data (coffee, tea, desserts, cocktails categories and products) via the seed scripts in `backend/prisma/`.

## Getting Started

```bash
# Backend
cd backend
npm install
cp .env.example .env       # fill in your own keys (DB, WayForPay, Checkbox)
npx prisma migrate dev
npm run seed               # optional: populate demo data
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Security

All secrets (database URL, payment and fiscalization keys) are provided through environment variables and are never committed to the repository.

---

Built by [Eduard Bakulin](https://github.com/edbackulin-eng) · Full Stack Developer
