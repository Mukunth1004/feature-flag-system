# Multi-Tenant Feature Flag Management System

A SaaS-style feature flag system with three separate frontends and a Node.js/Express backend.

## Architecture

```
feature-flag-system/
├── backend/              # Node.js + Express + SQLite
│   ├── src/
│   │   ├── index.js      # Entry point
│   │   ├── db.js         # SQLite init & schema
│   │   ├── middleware/
│   │   │   └── auth.js   # JWT auth + role guards
│   │   └── routes/
│   │       ├── superAdmin.js
│   │       ├── admin.js
│   │       └── user.js
│   └── .env.example
└── frontend/
    ├── super-admin/      # App 1 — used by system host
    ├── admin/            # App 2 — used by org admins
    └── user/             # App 3 — used by end users
```

## Tech Stack

| Layer       | Choice                          | Reason                                      |
|-------------|---------------------------------|---------------------------------------------|
| Backend     | Node.js + Express               | Lightweight, fast to scaffold               |
| Database    | SQLite (better-sqlite3)         | Zero-config, file-based, great for this scope |
| Auth        | Custom JWT + bcrypt             | No third-party providers per requirements   |
| Frontend    | Plain HTML/JS                   | No build step, instantly runnable           |

## Setup & Run

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 3. Start the backend

```bash
npm start
# API running at http://localhost:4000
```

### 4. Open the frontends

Open these files directly in your browser (no server needed):

| App         | File                                    |
|-------------|-----------------------------------------|
| Super Admin | `frontend/super-admin/index.html`       |
| Admin       | `frontend/admin/index.html`             |
| User        | `frontend/user/index.html`              |

## Default Super Admin Credentials

```
Email:    superadmin@flagsystem.com
Password: SuperAdmin@123
```

## API Reference

### Super Admin

| Method | Route                           | Description          |
|--------|---------------------------------|----------------------|
| POST   | `/api/super-admin/login`        | Login (static creds) |
| POST   | `/api/super-admin/organizations`| Create organization  |
| GET    | `/api/super-admin/organizations`| List organizations   |

### Admin

| Method | Route                  | Description                  |
|--------|------------------------|------------------------------|
| POST   | `/api/admin/signup`    | Register with organization   |
| POST   | `/api/admin/login`     | Login                        |
| GET    | `/api/admin/flags`     | List org's feature flags     |
| POST   | `/api/admin/flags`     | Create feature flag          |
| PATCH  | `/api/admin/flags/:id` | Enable/disable a flag        |
| DELETE | `/api/admin/flags/:id` | Delete a flag                |

### User

| Method | Route                   | Description                      |
|--------|-------------------------|----------------------------------|
| GET    | `/api/user/organizations`| List orgs (for dropdown)        |
| POST   | `/api/user/check-flag`  | Check if feature is enabled      |

## Data Model

```sql
organizations  (id, name, created_at)
users          (id, email, password_hash, role, org_id, created_at)
feature_flags  (id, key, enabled, org_id, created_at, updated_at)
```

## End-to-End Flow

1. **Super Admin** logs in → creates an organization (e.g. "Acme Corp")
2. **Org Admin** signs up selecting "Acme Corp" → logs in → creates feature flags (e.g. `dark_mode`)
3. **End User** selects "Acme Corp" from dropdown → types `dark_mode` → sees Enabled/Disabled

## Design Decisions

- **SQLite over Postgres/Mongo**: Zero infrastructure overhead for this scope. `better-sqlite3` is synchronous and fast; easy to swap for Postgres by replacing the DB layer.
- **JWT stored in localStorage**: Simple for this scope. In production, httpOnly cookies would be preferred.
- **Feature keys are normalized**: Spaces → underscores, lowercased on write and read. Prevents `Dark Mode` vs `dark_mode` mismatches.
- **Org-scoped uniqueness**: `UNIQUE(key, org_id)` — same key can exist in different orgs independently.
- **Static Super Admin**: No DB row needed; credentials live in `.env`. Keeps the threat surface minimal.
