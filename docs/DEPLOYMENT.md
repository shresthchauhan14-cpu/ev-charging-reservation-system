# Deployment Guide

## Production & Local Deployment Instructions
**Project:** EV Charging Reservation and Real-Time Availability System  
**Institution:** IILM University, Greater Noida  

---

### Local Development Setup

#### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

#### Step 1: Clone and Install
```bash
git clone <repository-url>
cd protype
npm install
```

#### Step 2: Database Migration & Seeding
```bash
# Applies SQL DDL migrations
npm run migrate

# Populates Greater Noida stations and evaluation records
npm run seed
```

#### Step 3: Start Services
```bash
# Starts both Express backend (port 5000) and Vite frontend (port 5173) concurrently
npm run dev
```

Visit the application in your browser:
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

---

### Production Deployment Strategy

#### 1. Backend Service (Render / Railway / DigitalOcean / AWS EC2)
- Build command: `npm run build --workspace=server`
- Start command: `node server/dist/server.js`
- Required Environment Variables:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require`
  - `JWT_SECRET=<strong-random-64-char-string>`
  - `COOKIE_SECRET=<strong-random-64-char-string>`
  - `CLIENT_ORIGIN=https://<your-frontend-domain>`

#### 2. Frontend Hosting (Vercel / Netlify / Cloudflare Pages)
- Build command: `npm run build --workspace=client`
- Output directory: `client/dist`
- Proxy API requests `/api/*` to the deployed backend service URL.

#### 3. Managed PostgreSQL 16 (AWS RDS / Supabase / Neon)
- Provision PostgreSQL 16 instance.
- Execute migrations: `npm run migrate --workspace=server` with `DATABASE_URL` configured.

