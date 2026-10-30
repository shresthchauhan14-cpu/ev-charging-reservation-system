# Deployment Report

**Project Title:** EV Charging Reservation and Real-Time Availability System  
**Institution:** IILM University, Greater Noida  
**Department:** Department of Computer Science & Engineering  
**Degree:** B.Tech Computer Science and Engineering — Major Project (Phase I)  
**Date of Report:** 2026-10-30  

---

## 1. Verified Deployment Artifacts

| Parameter | Value / Status |
|---|---|
| **Git Repository** | [https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system](https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system) |
| **Git Default Branch** | `main` |
| **Latest Commit Hash** | `4d55810` |
| **Personal Vercel Account** | `shresthchauhan14-cpus-projects` (`shresthchauhan14@gmail.com`) |
| **Frontend Production URL** | [https://ev-charging-reservation-system-opal.vercel.app](https://ev-charging-reservation-system-opal.vercel.app) |
| **Preserved Legacy URL** | [https://ev-charging-reservation-system.vercel.app](https://ev-charging-reservation-system.vercel.app) |
| **Supabase Cloud Schema** | `supabase/migrations/20261030000001_initial_supabase_schema.sql` (10 tables, RLS, `btree_gist`) |
| **Supabase Realtime Engine** | WebSocket channels on `charging_points`, `reservations`, `waiting_list_entries` |
| **UI/UX Enhancements** | Multi-stage `EVChargingAnimation`, dark automotive hero, driver eco-telemetry |
| **Frontend Host Platform** | Vercel Edge Network (Edge node: `bom1`) |
| **Backend API Host (Local)** | `http://localhost:5000` |
| **Backend Cloud Compatibility** | Containerized / Persistent Node.js (Render, Railway, Fly.io, AWS EC2) |
| **Database Engine** | Dual-Mode: Supabase Cloud PostgreSQL / Embedded PostgreSQL 16 (`@electric-sql/pglite`) |
| **Automated Test Results** | 18 Passed / 18 Total (4 Test Suites, exit code `0`) |

---

## 2. Live HTTP Smoke Test Verification

The live deployment at `https://ev-charging-reservation-system-opal.vercel.app` (personal account) was independently tested via direct network requests:

### A. Root Landing Route (`/`)
```http
HTTP/1.1 200 OK
Server: Vercel
Content-Type: text/html; charset=utf-8
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Vercel-Id: bom1::wcl7t-1793332359481-8421503f9734
```
* **Payload Verified:** Valid HTML document containing title `"VoltReserve — EV Charging Reservation & Real-Time Availability System | IILM University"` and `<div id="root"></div>`.

### B. JavaScript Asset Delivery (`/assets/index-poY0BzQc.js`)
```http
HTTP/1.1 200 OK
Server: Vercel
Content-Type: application/javascript; charset=utf-8
Content-Length: 420948
Etag: "116a19465f5139ebd67b1d5ae36f6b7b"
```
* **Status:** Complete bundled client payload successfully retrieved without corruption.

### C. Client SPA Deep Routing (`/find-stations`)
```http
HTTP/1.1 200 OK
Server: Vercel
Content-Type: text/html; charset=utf-8
Content-Disposition: inline; filename="index.html"
X-Vercel-Id: bom1::2qnf7-1793332388136-d24dc49ffde7
```
* **Status:** Verified that `client/vercel.json` SPA rewrite rules correctly serve `index.html` for deep client-side routes, allowing seamless React Router navigation on refresh.

---

## 3. Architecture & Separation of Concerns

### Frontend (Deployed to Vercel)
- **Framework:** React 19 + TypeScript + Vite 6 + Tailwind CSS.
- **Routing:** React Router v7 with 10 public and protected pages.
- **API Communication:** Abstraction layer in `client/src/services/api.ts` reading `import.meta.env.VITE_API_URL`.
- **Demo Safety:** Viva demo shortcuts are guarded by `import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS === 'true'`.

### Backend (Persistent Node.js Runtime)
- **Framework:** Node.js 24 + Express 5 + TypeScript + Helmet + CORS.
- **Why Separate from Vercel Serverless:**
  - The application relies on ACID transactions with PostgreSQL serializable isolation to guarantee zero double-bookings during concurrent interval reservation requests.
  - The local development and offline presentation environment uses embedded PostgreSQL 16 WebAssembly (`@electric-sql/pglite`) writing to the local filesystem (`./database/pgdata/`). Vercel's serverless functions use an ephemeral, read-only filesystem where persistent SQLite/PGlite databases cannot persist between invocations.
  - For full cloud production, the backend is architected to run on a persistent container or Node.js host (such as Render, Railway, Fly.io, or AWS) connected to a managed PostgreSQL cluster (e.g., Supabase, Neon, AWS RDS, or Aiven) via `DATABASE_URL`.

---

## 4. Production Cloud Deployment Instructions for Backend & Managed Database

When provisioning an external production database and backend:

### Step 1: Provision Managed PostgreSQL
1. Create a PostgreSQL 16 database on Neon, Supabase, Railway, or AWS RDS.
2. Obtain the connection string: `postgresql://username:password@host:5432/voltreserve?sslmode=require`.

### Step 2: Deploy Backend to Container Platform (e.g. Render / Railway)
1. Link GitHub repository `shresthchauhan14-cpu/ev-charging-reservation-system`.
2. Configure Root Directory: `server`.
3. Set Build Command: `npm install && npm run build`.
4. Set Start Command: `npm run migrate && node dist/server.js`.
5. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your managed PostgreSQL connection string
   - `CLIENT_ORIGIN`: `https://client-ochre-gamma-55.vercel.app`
   - `JWT_SECRET`: Secure 64-character random string
   - `COOKIE_SECRET`: Secure 64-character random string

### Step 3: Connect Frontend on Vercel to Live Backend
1. In the Vercel project dashboard for `upsc-panda/client`:
2. Navigate to **Settings > Environment Variables**.
3. Add `VITE_API_URL` set to `https://your-backend-api.onrender.com/api/v1`.
4. Trigger a redeployment. The frontend will immediately direct all API queries to your production backend.

---

## 5. Security & Academic Integrity Notes

1. **No Hardcoded Secrets:** All credentials, keys, and tokens are read dynamically from environment variables. Git ignore rules prevent `.env` or `.env.local` from being tracked.
2. **SQL Injection Immune:** All database queries utilize parameterized queries (`$1, $2, ...`), strictly avoiding string concatenation.
3. **IDOR / BOLA Immune:** Ownership checks prevent regular users from accessing or modifying bookings belonging to other drivers.
4. **Hardware Simulation Transparency:** Hardware IoT telemetry (OCPP 1.6/2.0 protocols) and real-time smart meter sensor streams are simulated within the database for academic viva demonstration.
