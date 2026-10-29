# System Architecture Document

## EV Charging Reservation and Real-Time Availability System
**Institution:** IILM University, Greater Noida  
**Department:** Computer Science and Engineering  
**Degree:** B.Tech CSE  
**Project Phase:** Phase I — Functional Prototype & Database Engine  

---

### 1. High-Level System Architecture

VoltReserve is engineered as a three-tier decoupled client-server architecture with persistent relational database integrity:

```
+-----------------------------------------------------------------------------------+
|                           CLIENT TIER (React 19 + TypeScript)                     |
|  - Modern Tailwind CSS Light Theme                                                |
|  - Real-time Interval Availability Grid                                           |
|  - Interactive Greater Noida Geo-Layout & SVG Map                                  |
|  - Dynamic Smart Waiting List Priority Visualizer                                 |
|  - Administrator Console with Telemetry & Simulated No-Show Dispute Engine        |
+-----------------------------------------------------------------------------------+
                                       |
                                       | HTTPS / JSON REST API (/api/v1)
                                       v
+-----------------------------------------------------------------------------------+
|                       BACKEND TIER (Node.js + Express 5 + TS)                     |
|  - Helmet & CORS Security Headers                                                 |
|  - JWT Authentication + Secure HttpOnly Cookie Sessions                           |
|  - Role-Based Access Control (RBAC: USER, ADMIN)                                  |
|  - Zod Request Schema Validation                                                  |
|  - Half-Open Interval Concurrency Protection Engine                               |
|  - Intelligent Waiting-List Reallocation Engine (P_i = 0.50U_i + 0.30T_i + 0.20R_i)|
+-----------------------------------------------------------------------------------+
                                       |
                                       | SQL Transactions (BEGIN / COMMIT / ROLLBACK)
                                       v
+-----------------------------------------------------------------------------------+
|                     DATABASE TIER (PostgreSQL 16 Engine)                          |
|  - Dual-Mode Adapter: External PostgreSQL Pool + Persistent Embedded PGlite       |
|  - Normalized 3NF Relational Tables with TIMESTAMPTZ                              |
|  - Interval Overlap Locking & Check Constraints                                   |
|  - Audit Log Trail & In-App Notification Center                                   |
+-----------------------------------------------------------------------------------+
```

---

### 2. Domain Modules

1. **Auth & Identity Module (`server/src/modules/auth/`)**:
   - Manages user registration, bcrypt password hashing (salt rounds = 10), JWT token issuance, session verification, and generic authentication error messages to prevent account enumeration.

2. **Stations & Telemetry Module (`server/src/modules/stations/`)**:
   - Coordinates Greater Noida charging stations (Knowledge Park III, Pari Chowk Metro Plaza, Sector Alpha-1, Yamuna Expressway Supercharger).
   - Computes interval-specific availability: queries operational status against overlapping confirmed reservations.

3. **Reservation Engine (`server/src/modules/reservations/`)**:
   - Executes bookings inside serializable database transactions.
   - Enforces the half-open interval overlap check (`newStart < existingEnd AND newEnd > existingStart`).
   - Handles reservation state transitions: `CONFIRMED -> CHECKED_IN -> COMPLETED` or `CANCELLED` / `NO_SHOW`.

4. **Intelligent Waiting-List Engine (`server/src/modules/waiting-list/`)**:
   - Evaluates queued drivers when slots become available.
   - Multi-criteria priority score: battery state-of-charge urgency (50%), waiting time (30%), driver reliability (20%).
   - Atomically creates new confirmed reservations for winning candidates.

5. **Administration & Audit Module (`server/src/modules/admin/`)**:
   - Provides live analytics, operational station provisioning, dispenser status toggles, simulated no-shows past the 15-minute grace period, and demo database reset.

---

### 3. Dual-Mode Database Strategy

To guarantee that the application runs reliably on any faculty workstation or presentation laptop with zero external configuration requirements, the database adapter (`server/src/database/db.ts`) implements dual-mode operation:
- **Mode A (External PostgreSQL Server)**: When `DATABASE_URL` is set to a PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/ev_charging`), the server connects using standard `pg.Pool` connection pooling.
- **Mode B (Embedded PostgreSQL 16 Engine)**: When `DATABASE_URL` is omitted or unavailable, the application initializes `@electric-sql/pglite` directly in Node.js, storing state in `./database/pgdata/`. This is the genuine PostgreSQL 16 C engine compiled to WebAssembly, providing exact SQL compliance, transactions, constraints, and relational integrity.

