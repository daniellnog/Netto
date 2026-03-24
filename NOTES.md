# Netto — Project Notes

## Overview
Personal finance manager with web and mobile support.

## Goals
- Help users track income and expenses across multiple currencies
- Provide clear visual reports and spending limit controls

## Features
- [ ] Dashboard (visual overview of finances)
- [ ] Transactions (log income and expenses)
- [ ] Reports (charts and summaries)
- [ ] Spending Limits (budget control per category)
- [ ] Settings (preferences, currencies, account)

## Tech Stack
- **Frontend:** React Native + Expo (Web + Mobile from a single codebase)
- **Navigation:** Expo Router
- **Backend:** Node.js + Fastify
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** Google OAuth (via Supabase Auth)
- **Currency:** User-defined preferred currency (set in Settings); all values displayed in that currency — no external exchange rate API needed

## Pages
| Route | Component |
|---|---|
| `/` | `Dashboard` |
| `/transactions` | `Transactions` |
| `/reports` | `Reports` |
| `/limits` | `SpendingLimits` |
| `/settings` | `Settings` |

## Conventions
- All code must be written in English
- Language: TypeScript

## Database Conventions

- **delete_user invariant:** Every table that has a `userId` FK (or any direct relation to `User`) **must** have a corresponding `DELETE` in the `delete_user()` SQL function (`packages/database/prisma/migrations/20260324000000_delete_user_function/migration.sql`). When adding a new model to `schema.prisma` with a user relation, update that function before merging — respecting FK dependency order (children before parents, `User` last, `auth.users` after `User`).

## Notes
<!-- Add any decisions, ideas, or open questions here -->
- **2026-03-20:** Currency will be user-defined (set in Settings). No exchange rate API — all values are stored and displayed in the user's chosen currency. Any ISO 4217 currency is allowed (no restricted list for now).
