# Autonomous Overnight Engineering Progress Log

**Project Name:** EV Charging Reservation and Real-Time Availability System  
**Institution:** IILM University, Greater Noida  
**Department:** Department of Computer Science and Engineering  
**Degree:** B.Tech CSE Major Project (Phase I)  
**Repository:** [https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system](https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system)  
**Deployed Frontend:** [https://client-ochre-gamma-55.vercel.app](https://client-ochre-gamma-55.vercel.app)  
**Last Updated:** 2026-10-30T01:07:00+05:30  

---

## 1. Executive Baseline & Initial Inspection

- **Working Directory:** `D:\shresth\MAIN\protype`
- **Monorepo Structure:** Root workspace coordinating `client/` (React 19 + TypeScript + Vite + Tailwind CSS) and `server/` (Node.js + Express 5 + TypeScript + PostgreSQL 16 dual-mode adapter).
- **Accounts Inspected:**
  - **GitHub:** Logged in as `shresthchauhan14-cpu` (`shresthchauhan14@gmail.com`) via keyring. Verified with `gh auth status` (`exit code 0`).
  - **Vercel CLI:** Logged in as `upscpanda2310-8573` (Team `upsc-panda`). Verified with `npx vercel whoami` (`exit code 0`).
- **Initial Verification State:**
  - Repository branch `main` created.
  - Previous builds had module resolution warnings in TypeScript client configurations.
  - Vitest parallel workers were competing for embedded SQLite/PGlite locks on initial setup.

---

## 2. Engineering Milestones & Fixes Applied

### Milestone 1: PostgreSQL DDL & Migration Multi-Statement Execution
- **Issue:** PGlite driver failed with `42601 cannot insert multiple commands into a prepared statement` when applying multi-table DDL schemas.
- **Root Cause:** Parameterized queries in PGlite cannot span multiple statements.
- **Remediation:** Extended `DatabaseAdapter` in [`server/src/database/db.ts`](file:///d:/shreshth/MAIN/protype/server/src/database/db.ts) with direct `exec(sql)` calling `pgliteInstance.exec()`.
- **Verification:** Ran `npm run migrate --workspace=server` -> Created 10 relational tables, foreign keys, and indexes (`exit code 0`).

### Milestone 2: Automated Concurrency Overlap Protection
- **Requirement:** Prevent concurrent race conditions when two drivers attempt to book the same charger at overlapping times.
- **Implementation:** Wrapped booking logic in PostgreSQL ACID serializable transactions using half-open interval overlap testing:
  $$\text{new\_start} < \text{existing\_end} \quad\land\quad \text{new\_end} > \text{existing\_start}$$
- **Automated Test:** [`tests/integration/concurrency-booking.test.ts`](file:///d:/shreshth/MAIN/protype/tests/integration/concurrency-booking.test.ts) initiates simultaneous `Promise.all` reservation requests for identical time intervals.
- **Result:** First request succeeds (`201 Created`), second request receives immediate database conflict (`409 Conflict`).

### Milestone 3: Security & Authorization (RBAC and IDOR/BOLA Prevention)
- **Implementation:** Added token-based and cookie-based authentication guards, role-based access control (`USER` vs `ADMIN`), and ownership verification.
- **Automated Test Suite:** Created [`tests/integration/security-and-authorization.test.ts`](file:///d:/shreshth/MAIN/protype/tests/integration/security-and-authorization.test.ts) testing:
  - Unauthenticated access rejection (`401`).
  - IDOR/BOLA read blocking on reservations owned by other users (`403`).
  - IDOR/BOLA cancellation protection (`403`).
  - Normal user rejection from administrative dashboard (`403`).
  - Administrator access granting (`200`).
- **Result:** 6/6 security tests passed with zero leaks.

### Milestone 4: Multi-Criteria Priority Waiting-List Engine
- **Formula:**
  $$P_i = 0.50 \cdot U_i + 0.30 \cdot T_i + 0.20 \cdot R_i$$
- **Automated Tests:** [`tests/unit/priority-algorithm.test.ts`](file:///d:/shreshth/MAIN/protype/tests/unit/priority-algorithm.test.ts) (5 tests):
  - Urgency calculation from battery SOC ($1 - \text{SOC}/100$).
  - Elapsed wait time saturation at 60 minutes ($\min(t_{\text{wait}}/60, 1.0)$).
  - Out-of-bounds SOC clamping.
  - Weight normalization verification ($\sum w = 1.0$).
  - FIFO tie-breaking preservation.
- **Result:** 5/5 unit tests passed (`exit code 0`).

### Milestone 5: API Route Aliasing & Production Compatibility
- **Action:** Added unversioned route aliases (`/api/stations`, `/api/auth`, `/api/reservations`, etc.) alongside versioned `/api/v1/*` routes in [`server/src/app.ts`](file:///d:/shreshth/MAIN/protype/server/src/app.ts).
- **Verification:** Verified live response via `curl.exe http://localhost:5000/api/stations` returning 4 Greater Noida hubs (`exit code 0`).

### Milestone 6: GitHub Remote Repository Publication
- **Action:** Created public GitHub repository and pushed full commit history.
- **Command:** `gh repo create shresthchauhan14-cpu/ev-charging-reservation-system --public --source=. --remote=origin --push`
- **Result:** Remote URL established: `https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system`.

### Milestone 7: Production Vercel Deployment
- **Action:** Configured [`client/vercel.json`](file:///d:/shreshth/MAIN/protype/client/vercel.json) with SPA rewrites (`/(.*) -> /index.html`) and deployed using Vercel CLI.
- **Command:** `npx vercel deploy --prod --yes`
- **Deployment URL:** `https://client-lq050b9bt-upsc-panda.vercel.app`
- **Production Alias:** `https://client-ochre-gamma-55.vercel.app`
- **Live Verification:** Queried via `curl.exe -s -I https://client-ochre-gamma-55.vercel.app` -> returned `HTTP/1.1 200 OK` from Vercel edge CDN.
- **Deep Routing Verification:** Queried `https://client-ochre-gamma-55.vercel.app/find-stations` -> returned `HTTP/1.1 200 OK` serving `index.html`.
- **Asset Bundle Verification:** Queried JavaScript chunk `https://client-ochre-gamma-55.vercel.app/assets/index-poY0BzQc.js` -> returned `HTTP/1.1 200 OK` (420,948 bytes).

---

## 3. Comprehensive Command Execution Summary

| Command | Working Directory | Target | Exit Code | Verified Output Summary |
|---|---|---|---|---|
| `npm run build` | `server/` | TypeScript Compilation | `0` | Clean compilation to `server/dist/` |
| `npm run build` | `client/` | Vite Production Bundle | `0` | Generated `dist/index.html` (854 B) and JS chunks |
| `npm run migrate` | `server/` | Database Migrations | `0` | Applied `001_initial_schema.sql` (10 tables) |
| `npm run seed` | `server/` | Database Seeding | `0` | Seeded 4 Greater Noida stations & test data |
| `npm test` | `server/` | Automated Test Suite | `0` | 18 passed across 4 files (duration: 15.53s) |
| `node dist/server.js` | `server/` | API Server Startup | `0` | Port 5000 listening, PGlite persistent engine ready |
| `curl /api/health` | Root | Health & Metadata | `0` | Status UP, database CONNECTED |
| `curl /api/stations` | Root | Station Data Retrieval | `0` | Returned 4 Greater Noida hubs with connectors |
| `vite preview` | `client/` | Frontend Server | `0` | Port 4173 serving production HTML |
| `npx vercel deploy --prod` | `client/` | Vercel Deployment | `0` | Live on `https://client-ochre-gamma-55.vercel.app` |

---

## 4. Current State & Autonomous Readiness

- **Working Tree:** Clean; all code staged, committed, and synced to GitHub remote.
- **Local Application:** Ready for live viva demonstration (`npm run dev:server` + `npm run dev:client`).
- **Cloud Application:** Live and accessible at `https://client-ochre-gamma-55.vercel.app`.
- **Database Durability:** Persistent embedded PostgreSQL 16 engine stored in `./database/pgdata/`. Can immediately switch to managed PostgreSQL by supplying `DATABASE_URL`.
