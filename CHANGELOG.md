# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(versions not yet tagged in git).

## [Unreleased]

## [2026-04-24]

### Fixed
- **Restored a working baseline after breaking local changes** via commit `6fa1043` ("revert: back to working state before my changes").
  The revert commit brought multiple areas back to the last known good behavior:
  - **Admin auth & sessions** (`api/admin-auth.js`, `src/pages/AdminPage.jsx`)
  - **paycard endpoints** (`api/paycard-init.js`, `api/paycard-webhook.js`)
  - **Checkout / Orders / Secure Reader flows** (`src/pages/CheckoutPage.jsx`, `src/pages/OrdersPage.jsx`, `src/pages/SecureReaderPage.jsx`)
  - **Firebase client & data layer** (`src/services/firebaseApi.js`, `src/services/firebaseClient.js`, `src/context/CatalogContext.jsx`)
  - **SEO/robots, Vercel + Vite configuration** (`src/components/seo/SEO.jsx`, `public/robots.txt`, `vercel.json`, `vite.config.js`)
  - **Firebase RTDB security rules** (`database.rules.json`)

### Security
- **Rollback of permissive or inconsistent Firebase RTDB rules** included in the revert (`database.rules.json`).
  The pre-revert state (uncommitted) likely reintroduced overly broad reads/writes and/or broke least-privilege assumptions.

### Changed
- `bfabf1e`: SEO metadata improvements (canonical URL + OpenGraph locale/site name).
- `5c199bd`: moved `firebase-admin` and `pdfjs-dist` to `devDependencies` for leaner production installs.

## What caused the problem?

The commit message indicates the issue came from **uncommitted "my changes"** that made the project non-functional or unsafe.
Those changes were not preserved as a dedicated commit; instead, commit `6fa1043` re-stabilized the codebase by restoring prior versions across:

- **Authentication/session logic** (admin + reader)
- **Payment webhooks/handlers (paycard)**
- **Core pages and data flows** (checkout, orders, reader)
- **Configuration** (Vite/Vercel/SEO)
- **Database rules** (Realtime Database)

In practice, this kind of "wide blast radius" change set commonly causes breakage through one (or more) of:
- mismatched client/server auth assumptions (client writes without auth while rules require auth)
- breaking API contract changes (payload shape expected by pages/services)
- security-rule changes that block existing reads/writes
- deploy/runtime drift (Vite/Vercel config changes)

## What was reverted?

Because the problematic changes were never committed, the best available record is the **scope of files restored** in `6fa1043`.
That commit effectively **reverted local modifications** touching:

- Serverless API handlers: `api/admin-auth.js`, `api/paycard-init.js`, `api/paycard-webhook.js`
- Security rules: `database.rules.json`
- Frontend: SEO + major pages + data layer
- Deployment/build configuration: `vercel.json`, `vite.config.js`
- Tests: `src/tests/checkoutValidation.test.js`

## How to avoid this in the future

- **Work on a feature branch** for risky changes (auth, payments, rules).
- **Commit small, reviewable steps** (one concern per commit). Avoid mixing rules/auth/UI in one batch.
- **Add a quick safety checklist before committing**:
  - `npm run build`
  - verify admin flow locally (`/api/admin-auth` and admin UI)
  - verify RTDB rules with the Firebase emulator (or at minimum, test reads/writes for a signed-in user)
  - verify payments/webhooks behind a feature flag or in a staging environment
- **Avoid “big-bang” refactors** that touch many unrelated files without intermediate checkpoints.
- **Protect production** with: Preview deployments, basic CI, and mandatory checks for build + lint + tests.

