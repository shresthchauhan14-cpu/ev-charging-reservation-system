# VoltReserve — EV Charging Reservation and Real-Time Availability System

**Institution:** IILM University, Greater Noida  
**Department:** Computer Science and Engineering  
**Degree:** B.Tech Computer Science and Engineering  
**Project Phase:** Phase I — Functional Prototype & Concurrency Engine  

---

## 1. Project Overview

**VoltReserve** is a full-stack EV charging reservation platform engineered to solve real-world electric vehicle charging congestion, peak-hour queue uncertainty, and slot scheduling contention. Unlike superficial UI mockups, VoltReserve integrates:
1. **Persistent PostgreSQL 16 Database**: Full 3NF relational schema storing stations, dispensers, users, vehicles, reservations, and audit logs.
2. **PostgreSQL-Enforced Concurrency Control**: Prevents double-booking via half-open interval overlap detection (`newStart < existingEnd AND newEnd > existingStart`) inside ACID transactions.
3. **Intelligent Waiting-List Reallocation Algorithm**: Evaluates queued drivers when slots become available, using a multi-criteria priority formulation:
   $$P_i = 0.50 \cdot U_i + 0.30 \cdot T_i + 0.20 \cdot R_i$$
4. **Dual-Mode Database Adapter**: Seamlessly runs against an external PostgreSQL server or uses the built-in embedded PostgreSQL 16 engine (`@electric-sql/pglite`), guaranteeing zero-config local execution on any presentation workstation.

---

## 2. Core Features

- **Public Station Discovery**: Search Greater Noida hubs (Knowledge Park III, Pari Chowk, Sector Alpha-1, Yamuna Expressway Supercharger) with connector filters (CCS2, Type 2, GB/T) and power ratings.
- **Interval-Specific Availability Calculation**: Real-time query comparing operational dispensers against confirmed bookings.
- **ACID Reservation Booking**: Step-by-step reservation generation producing verifiable booking references (`EV-IILM-...`).
- **Cancellation & Slot Release**: Cancelling or forfeiting a booking immediately returns the interval to availability and triggers smart queue reallocation.
- **Check-In Grace Period (15 Mins)**: Drivers scan a digital QR pass at the hub; unfulfilled reservations can be marked `NO_SHOW` and reallocated.
- **Smart Waiting List & Simulator**: Live priority queue ranking drivers by battery SOC urgency ($U_i$), elapsed wait time ($T_i$), and reliability ($R_i$), with an interactive viva demonstration simulator.
- **Administrator Control Console**: Real-time infrastructure telemetry, station and dispenser provisioning, no-show disputes, and single-click database resets.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, React Router v7, Lucide Icons.
- **Backend**: Node.js, Express 5, TypeScript, Zod Schema Validation, Helmet, CORS, Cookie-Parser.
- **Security**: Bcrypt password hashing (cost factor 10), JWT Bearer tokens, HttpOnly cookies, RBAC (`USER`, `ADMIN`).
- **Database**: PostgreSQL 16 (Dual-mode: External `pg.Pool` or embedded `@electric-sql/pglite` persistent engine).
- **Testing**: Vitest, Supertest, automated concurrency race-condition testing suite.

---

## 4. Repository Structure

```
protype/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/common/  # Navbar, Footer, AcademicBanner, Modal
│   │   ├── context/            # AuthContext (login, logout, demoSwitch)
│   │   ├── pages/              # Landing, FindStations, Details, Dashboard,
│   │   │                       # MyBookings, WaitingList, Admin, Auth, HowItWorks
│   │   ├── services/           # Centralized API Client (api.ts)
│   │   └── types/              # Shared TypeScript Interfaces
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend API Application
│   ├── src/
│   │   ├── database/           # db.ts (dual-mode adapter), migrate.ts, seed.ts
│   │   ├── middleware/         # auth.ts (JWT/RBAC), validation.ts (Zod)
│   │   ├── modules/            # Domain modules: auth, stations, reservations,
│   │   │                       # waiting-list, admin, users
│   │   ├── app.ts              # Express application setup & middleware
│   │   └── server.ts           # Server bootstrap & graceful shutdown
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/             # 001_initial_schema.sql (PostgreSQL 16 DDL)
│   ├── seeds/                  # Seed data definitions
│   └── pgdata/                 # Persistent PostgreSQL 16 data files
├── tests/
│   ├── unit/                   # Priority algorithm mathematical tests
│   └── integration/            # API integration & PostgreSQL concurrency tests
├── docs/                       # Comprehensive Architecture & Algorithm Docs
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── BOOKING_CONCURRENCY.md
│   ├── WAITING_LIST_ALGORITHM.md
│   ├── API.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
├── .env.example                # Documented configuration template
├── package.json                # Root npm workspace orchestrator
└── README.md
```

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher (v24 LTS recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: (Optional) If you have a local PostgreSQL server, configure `DATABASE_URL`. If not, the application automatically uses its built-in embedded PostgreSQL 16 engine!

---

## 6. Local Setup and Execution

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Apply Database Migrations
```bash
npm run migrate
```
*Applies `database/migrations/001_initial_schema.sql` creating all 10 relational tables, foreign keys, and indexes.*

### Step 3: Populate Demonstration Seed Data
```bash
npm run seed
```
*Seeds Greater Noida stations, test vehicles, confirmed bookings, and pre-calculated waiting list entries.*

### Step 4: Run Development Servers
```bash
npm run dev
```
*Starts both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) concurrently.*

---

## 7. Pre-Configured Demonstration Credentials

The database includes pre-configured accounts for seamless presentation:

| Role | Name | Email | Password | Pre-Assigned Vehicle |
|---|---|---|---|---|
| **Driver (User)** | Rahul Sharma | `rahul.sharma@example.com` | `User@12345` | Tata Nexon EV (40.5 kWh) |
| **Driver (User)** | Priya Verma | `priya.verma@example.com` | `User@12345` | MG ZS EV (50.3 kWh) |
| **Driver (User)** | Amit Singh | `amit.singh@example.com` | `User@12345` | Hyundai Ioniq 5 (72.6 kWh) |
| **Admin** | Dr. A. Sharma | `admin@iilm.edu` | `Admin@12345` | System Administrator |

*Tip: The top navigation bar includes **One-Click Viva Demo Buttons** ("Driver" and "Admin") to instantly switch roles without typing.*

---

## 8. Automated Testing

Run the comprehensive automated test suite executing directly against PostgreSQL:
```bash
npm run test --workspace=server
```

**Results (18/18 Tests Passing across 4 Test Suites):**
- **Priority Algorithm Unit Tests (5/5)**: Multi-criteria priority formulation $P_i = 0.50U_i + 0.30T_i + 0.20R_i$, wait time saturation, and out-of-bounds SOC clamping.
- **Authentication & API Integration Tests (5/5)**: Health checks, academic metadata, JWT generation, invalid credentials rejection, and station discovery.
- **PostgreSQL Concurrency Tests (2/2)**: Real-time interval collision prevention verifying that two simultaneous conflicting reservation requests for the same dispenser resolve deterministically with `201 Created` and `409 Conflict`.
- **Security & Authorization Tests (6/6)**: Unauthenticated access prevention, user ownership verification, IDOR/BOLA read and cancellation protection, and admin dashboard role enforcement.

---

## 9. Production Builds & Live Deployment

```bash
# Build both frontend and backend
npm run build
```
- Server output: `server/dist/`
- Client output: `client/dist/`

### Live Production Deployment
- **Personal Production URL (Vercel):** [https://ev-charging-reservation-system-opal.vercel.app](https://ev-charging-reservation-system-opal.vercel.app)
- **Preserved Alias:** [https://ev-charging-reservation-system.vercel.app](https://ev-charging-reservation-system.vercel.app)
- **GitHub Repository:** [https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system](https://github.com/shresthchauhan14-cpu/ev-charging-reservation-system)

---

## 10. Security Notes & Academic Limitations

1. **Academic Scope**: This is a Phase-I research and functional prototype. Hardware IoT connectivity (OCPP protocol) and physical energy metering are simulated via database records.
2. **PostgreSQL Security**: SQL queries utilize parameterized placeholders (`$1, $2`) to eliminate SQL injection vulnerabilities.
3. **Session Security**: JWT tokens are signed using a 256-bit secret and stored in HttpOnly cookies with SameSite protection.
4. **IDOR & BOLA Protection**: Strict user-ownership validation on reservation lookup and cancellation routes.
5. **Data Reset**: Administrators can restore clean demonstration data at any time via the Admin Console or by executing `npm run seed`.

---

## 11. Institutional Attribution

**Academic Institution:** IILM University, Greater Noida  
**Department:** Department of Computer Science & Engineering  
**Degree:** Bachelor of Technology (B.Tech) in Computer Science and Engineering  
**Academic Year:** 2026
