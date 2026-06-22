# Multi-Tenant Feature Flag Management System

A SaaS-style feature flag management system with three separate frontend portals and a Node.js/Express backend. Built as part of a technical assessment for Byepo Technologies.

---

## Live Portals

| Portal | URL | Used By |
|---|---|---|
| Home | `http://localhost:4000` | Navigation hub |
| Super Admin | `http://localhost:4000/super-admin` | Platform owner |
| Admin | `http://localhost:4000/admin` | Organization admins |
| User | `http://localhost:4000/user` | End users |

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Backend | Node.js + Express | Lightweight, fast to scaffold |
| Database | SQLite (better-sqlite3) | Zero config, file-based, no infra needed |
| Auth | Custom JWT + bcrypt | No third-party providers per requirements |
| Frontend | Plain HTML/JS | No build step, instantly runnable |

---

## Project Structure

```
feature-flag-system/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express entry point + static file serving
│   │   ├── db.js                 # SQLite schema + role seeding
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification + role guards
│   │   └── routes/
│   │       ├── superAdmin.js     # Super admin APIs
│   │       ├── admin.js          # Org admin APIs
│   │       └── user.js           # End user APIs
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── super-admin/index.html    # Super Admin portal
    ├── admin/index.html          # Admin portal
    └── user/index.html           # User portal
```

---

## Setup & Run

### 1. Clone the repo

```bash
git clone https://github.com/Mukunth1004/Feature-Flag-System.git
cd Feature-Flag-System/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

```bash
cp .env.example .env
```

The `.env` file must be inside the `backend/` folder. Default values work out of the box:

```env
PORT=4000
SUPER_ADMIN_EMAIL=superadmin@flagsystem.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
JWT_SECRET=byepo_feature_flag_jwt_secret_2024
JWT_EXPIRES_IN=24h
DB_PATH=./data/flags.db
```

### 4. Start the server

```bash
node src/index.js
```

The SQLite database is created automatically on first run at `backend/data/flags.db`.

Open `http://localhost:4000` in your browser.

---

## System Roles

### 1. Super Admin
- Uses static credentials from `.env` (no database row needed)
- Creates and views organizations
- Views live stats: total orgs, admins, users, flags
- Sees per-org counts of admins, users, and flags

### 2. Organization Admin
- Belongs to one organization
- Signs up via the Admin portal (selects their org)
- Full feature flag management: create, enable/disable, rename, delete
- Sees stats dashboard: total flags, enabled, disabled
- Can search/filter flags by key name
- Flag operations are strictly scoped to their own organization

### 3. End User
- Belongs to one organization (signup + login required)
- After login, org is locked to their account
- Checks whether a feature key is enabled or disabled for their org
- No org selection needed — resolved from their JWT token

---

## Data Model

```sql
roles            (id, name)                         -- 'super_admin', 'org_admin', 'end_user'
organizations    (id, name, created_at)
users            (id, email, password_hash, role → roles.name, org_id → organizations.id, created_at)
feature_flags    (id, key, enabled, org_id → organizations.id, created_at, updated_at)
                  UNIQUE(key, org_id)
```

---

## API Reference

### Super Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/super-admin/login` | Public | Login with static credentials |
| POST | `/api/super-admin/organizations` | Super Admin | Create organization |
| GET | `/api/super-admin/organizations` | Super Admin | List orgs with counts |
| GET | `/api/super-admin/stats` | Super Admin | Platform-wide stats |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/signup` | Public | Register as org admin |
| POST | `/api/admin/login` | Public | Login |
| GET | `/api/admin/stats` | Org Admin | Flag stats for own org |
| GET | `/api/admin/flags` | Org Admin | List flags (supports `?search=`) |
| POST | `/api/admin/flags` | Org Admin | Create feature flag |
| PATCH | `/api/admin/flags/:id` | Org Admin | Update flag key and/or enabled state |
| DELETE | `/api/admin/flags/:id` | Org Admin | Delete feature flag |

### User

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/user/organizations` | Public | List orgs (for signup dropdown) |
| POST | `/api/user/signup` | Public | Register as end user |
| POST | `/api/user/login` | Public | Login |
| POST | `/api/user/check-flag` | End User JWT | Check if feature is enabled |

---

## End-to-End Flow

```
1. Super Admin logs in
       → Creates "Acme Corp" organization

2. Org Admin signs up at /admin
       → Selects "Acme Corp", sets email + password
       → Logs in → Creates feature flags (e.g. dark_mode → Enabled)
       → Can rename, toggle, delete flags

3. End User signs up at /user
       → Selects "Acme Corp", sets email + password
       → Logs in → Types "dark_mode" → Sees ✅ Enabled

4. Multi-tenancy in action:
       → Globex Inc has dark_mode = Disabled
       → Acme Corp has dark_mode = Enabled
       → Same key, completely independent states
```

---

## Key Design Decisions

| Decision | Reasoning |
|---|---|
| **SQLite** | Zero infrastructure for this scope. The DB layer is isolated in `db.js` — easy to swap for Postgres by replacing the driver |
| **Roles table** | Separate persistent table satisfies the data requirement and makes role management extensible |
| **JWT with org_id baked in** | Org admin and end user tokens carry `org_id` — all queries use this, making cross-org access structurally impossible |
| **`UNIQUE(key, org_id)`** | Same flag key can exist independently across organizations — core of multi-tenancy |
| **Key normalization** | Keys are lowercased and spaces converted to underscores on write and read — prevents `Dark Mode` vs `dark_mode` mismatches |
| **Static Super Admin** | No DB row needed; credentials live in `.env` — minimal attack surface, simple to rotate |
| **Frontends served from Express** | All three portals served as static files from the same server — no separate file server needed |

---

## Known Trade-offs

- **Open Admin signup:** Any user can currently sign up as an admin for any organization. In production, the Super Admin should create admin accounts, or an approval flow should gate access. This was kept open as the spec mentioned "Admin can sign up" — the fix would be moving admin creation to the Super Admin dashboard.
- **JWT in localStorage:** Simple for this scope. In production, httpOnly cookies would prevent XSS token theft.
- **No pagination:** Flag lists load all records. For large datasets, cursor-based pagination would be added.

---

## Default Credentials

```
Super Admin
  Email:    superadmin@flagsystem.com
  Password: SuperAdmin@123
```
