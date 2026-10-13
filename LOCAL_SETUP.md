# Local Setup — Keys, Passwords & Run Guide

This guide lists **everything you need to configure to run The Inkwell locally**, and
the steps to bring it up. The stack is a Spring Cloud microservice backend (run via
Docker Compose) plus a React/Vite frontend (run with `npm run dev`).

---

## 1. Prerequisites

- Docker + Docker Compose
- Node.js 20+ and npm (for the frontend)
- Ports free on your machine: `5173, 8080, 8087, 8081, 8082, 8084, 8085, 8086, 8088, 8761, 5432, 6379, 9000, 9001, 9092`

---

## 2. Quick start

```bash
# 1) Backend (from OnlineBookStoreBackend/)
cd OnlineBookStoreBackend
cp .env.example .env            # a ready-to-run .env is already provided too
docker compose up --build       # first run also imports the Keycloak realm

# 2) Frontend (from OnlineBookstoreFrontend/online-bookstore/)
cd ../OnlineBookstoreFrontend/online-bookstore
cp .env.example .env            # a ready-to-run .env is already provided too
npm install
npm run dev                     # http://localhost:5173
```

Open **http://localhost:5173**. The homepage now loads **even if Keycloak is still
starting or down** (see §7). Log in with a seeded account from §5.

> First backend startup takes a while: Postgres initializes both databases
> (`bookstore_db`, `keycloak_db`), then Keycloak imports the realm.

---

## 3. Keys & passwords to configure

All backend values live in `OnlineBookStoreBackend/.env` (Docker Compose auto-loads it).
Frontend values live in `OnlineBookstoreFrontend/online-bookstore/.env` (only `VITE_`-prefixed
vars are exposed to the app).

### Required for the core app (already filled with working local defaults)

| Variable | Where | Default | Notes |
|---|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | backend `.env` | `postgres` / `postgres` / `postgres` | Shared by all services + Keycloak |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | backend `.env` | `minioadmin` / `minioadmin` | Object storage for book covers |
| `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` | backend `.env` | `admin` / `admin123` | Keycloak **admin console** login (master realm) |
| `KEYCLOAK_ADMIN_CLIENT_ID` | backend `.env` | `bookstore-backend` | Service-account client the backend uses |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | backend `.env` | `local-dev-backend-secret` | **Must match** the client secret in the realm import (see §4) |
| `APP_FRONTEND_URL` | backend `.env` | `http://localhost:5173` | Used in emails / Stripe redirects |
| `VITE_KEYCLOAK_URL` | frontend `.env` | `http://localhost:8080` | **Must match** backend issuer host (see §7) |
| `VITE_KEYCLOAK_REALM` | frontend `.env` | `bookstore-realm` | |
| `VITE_KEYCLOAK_CLIENT_ID` | frontend `.env` | `bookstore-frontend` | |
| `VITE_API_GATEWAY_URL` | frontend `.env` | `/api` | Keep `/api` so the dev proxy avoids CORS |
| `VITE_API_PROXY_TARGET` | frontend `.env` | `http://localhost:8087` | Where Vite forwards `/api` |

### Optional (leave blank unless you need the feature)

| Variable | Where | Feature it enables | How to get it |
|---|---|---|---|
| `MAIL_USERNAME` / `MAIL_PASSWORD` | backend `.env` | Register / invite / password-reset emails | Gmail **App Password** (Google account → Security → App passwords), or any SMTP creds |
| `STRIPE_SECRET_KEY` | backend `.env` | Payments / checkout | Stripe Dashboard → Developers → API keys (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | backend `.env` | Stripe webhook verification | `stripe listen` CLI, or Dashboard → Webhooks (`whsec_…`) |
| `STRIPE_CONNECT_CLIENT_ID` | backend `.env` | Store payouts (Stripe Connect) | Stripe → Connect settings (`ca_…`) |
| `STRIPE_PREMIUM_PRICE_ID` | backend `.env` | Premium subscription | Stripe → Products → Price (`price_…`) |
| `VITE_STRIPE_PUBLIC_KEY` | frontend `.env` | Checkout card UI | Stripe → API keys (`pk_test_…`) |

> **Security note:** the defaults above are **local-dev only**. Never reuse
> `local-dev-backend-secret`, `admin123`, or `minioadmin` in any deployed
> environment. `.env` files are gitignored; only the `.env.example` templates are committed.

---

## 4. Keycloak — auto-provisioned realm

On first startup, Compose runs Keycloak with `start-dev --import-realm` and imports
`OnlineBookStoreBackend/keycloak/import/bookstore-realm-realm.json`. You get:

- **Realm:** `bookstore-realm`
- **Client `bookstore-frontend`** — public, PKCE (S256), standard flow
  - Redirect URIs: `http://localhost:5173/*`
  - Web origins: `http://localhost:5173`
- **Client `bookstore-backend`** — confidential, service account enabled
  - Secret: `local-dev-backend-secret` (⇐ keep in sync with `KEYCLOAK_ADMIN_CLIENT_SECRET`)
  - Service account granted `realm-management: realm-admin` so the backend can
    create users, assign roles, and trigger reset-password emails
- **Realm roles:** `ROLE_USER`, `ROLE_ADMIN`, `ROLE_STORE_ADMIN`, `ROLE_WORKER`, `ROLE_EMPLOYEE`

**Admin console:** http://localhost:8080 → login `admin` / `admin123`.

> The import is a **no-op if the realm already exists**. To re-import after editing
> the JSON, wipe Keycloak state first:
> `docker compose down -v` (⚠️ this also clears Postgres + MinIO data), or drop just
> the `keycloak_db` database.

---

## 5. Seeded test users

Created by the realm import so you can log in immediately (no email verification needed):

| Username / email | Password | Roles | Lands on |
|---|---|---|---|
| `admin@bookstore.local` | `Admin123!` | `ROLE_ADMIN`, `ROLE_USER` | `/admin` |
| `user@bookstore.local` | `User123!` | `ROLE_USER` | `/dashboard` |

Store-admin / employee accounts are created through the in-app store-application and
invitation flows (they require email + Stripe to be configured).

---

## 6. Service reference

| Service | URL / Port |
|---|---|
| Frontend (Vite dev) | http://localhost:5173 |
| API Gateway | http://localhost:8087 (frontend calls it via the `/api` proxy) |
| Keycloak | http://localhost:8080 |
| Eureka discovery | http://localhost:8761 |
| MinIO console | http://localhost:9001 (login = `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`) |
| Postgres | localhost:5432 |
| user / store / book / order / payment / notification | 8081 / 8082 / 8084 / 8085 / 8086 / 8088 |

---

## 7. Troubleshooting

**Homepage was blank / redirected away when Keycloak was down.**
Fixed. Keycloak init now uses a silent iframe (`silentCheckSsoRedirectUri` →
`public/silent-check-sso.html`) instead of a top-level redirect, and init failures are
caught. An unreachable Keycloak just means "not logged in" — the public homepage still renders.

**Logged in, but API calls return 401 / "invalid issuer".**
The token's `iss` claim must match the backend `KEYCLOAK_ISSUER_URI`. Both are
`http://localhost:8080/realms/bookstore-realm` by default. If you change
`VITE_KEYCLOAK_URL`, you must change the backend issuer host to match. Inside Docker the
backend fetches signing keys via `http://keycloak:8080` (`KEYCLOAK_JWK_SET_URI`) but still
validates `iss` against `localhost:8080` — this split is intentional; don't "fix" it to match.

**Login redirect fails with "Invalid redirect URI".**
The frontend must run on `http://localhost:5173`. Other ports aren't in the client's
redirect URIs — add them in Keycloak (client `bookstore-frontend`) if you use a different port.

**Backend can't create users / 401 from Keycloak admin API.**
`KEYCLOAK_ADMIN_CLIENT_SECRET` (backend `.env`) must equal the `bookstore-backend`
client secret in the realm import. Defaults already match.

**CORS errors calling the API.**
In local dev, keep `VITE_API_GATEWAY_URL=/api` so the browser talks to the Vite origin and
Vite proxies to the gateway server-side (no CORS). Hitting `http://localhost:8087` directly
from the browser will hit CORS since the gateway has no CORS config.

**Keycloak admin login doesn't work on the newest image.**
The compose sets both legacy (`KEYCLOAK_ADMIN*`) and new (`KC_BOOTSTRAP_ADMIN_*`) vars, so
the admin is created on both old and 26+ images.
