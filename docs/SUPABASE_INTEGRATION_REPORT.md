# Supabase Backend & Cloud PostgreSQL Integration Report

**Project Name:** EV Charging Reservation and Real-Time Availability System (VoltReserve)  
**Institution:** IILM University, Greater Noida — B.Tech Computer Science and Engineering  
**Date:** October 30, 2026  
**Integration Status:** Complete & Production Ready  

---

## 1. Executive Summary

This report documents the architectural migration and complete integration of **Supabase (Managed PostgreSQL, GoTrue Auth, Realtime WebSocket Engine)** with the existing VoltReserve EV charging platform.

The application operates in an enterprise-grade **dual-mode architecture**:
1. **Cloud Production Mode (Supabase):** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in `.env`, the client connects to Supabase Auth, utilizes Row Level Security (RLS) policies for user data isolation, and subscribes to real-time availability changes over secure WebSockets.
2. **Local / Testing Mode (Embedded PostgreSQL 16 / PGlite):** When offline or executing automated Vitest integration test suites, the platform falls back seamlessly to the embedded PostgreSQL 16 engine with identical relational tables and zero external mock dependencies.

---

## 2. Cloud Database Schema Architecture

The Supabase schema is declared in `supabase/migrations/20261030000001_initial_supabase_schema.sql` and `supabase/seed.sql`.

### 2.1 Installed Extensions
- **`uuid-ossp`**: Native UUID generation for distributed primary keys and audit records.
- **`btree_gist`**: Required for multi-column GiST indexing and exclusion constraints (`EXCLUDE USING gist`) across timestamp ranges.

### 2.2 Relational Entity Model (10 Tables)

| Table Name | Primary Key | Description | Key Constraints / Relationships |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` (UUID references `auth.users`) | Extended user metadata (driver role, phone, preferences) | Auto-synced via `on_auth_user_created` trigger |
| `vehicles` | `id` (UUID) | User registered electric vehicles (battery capacity, connector) | Foreign key to `profiles(id)` |
| `charging_stations` | `id` (SERIAL / BIGINT) | Charging hubs across Greater Noida | Lat/Lng, operational hours, total/available counters |
| `charging_points` | `id` (SERIAL / BIGINT) | Individual dispensers (CCS2, Type 2, GB/T) | Foreign key to `charging_stations(id)`, power rating |
| `reservations` | `id` (SERIAL / BIGINT) | Guaranteed reservation slots with time intervals | **Exclusion constraint (`btree_gist`)** preventing double-booking |
| `waiting_list_entries` | `id` (SERIAL / BIGINT) | Intelligent waiting list queue entries | Weighted priority score: $P = 0.45 \cdot \text{waitingMinutes} + 0.35 \cdot (100 - \text{SOC}) + 0.20 \cdot \text{loyaltyScore}$ |
| `charging_sessions` | `id` (SERIAL / BIGINT) | Active and historical power delivery sessions | Linked to `reservations(id)`, tracks kWh delivered |
| `cancellation_and_no_show_records` | `id` (SERIAL / BIGINT) | Cancellation audit records and slot release audit trail | Triggers automatic waiting-list slot reallocation |
| `notifications` | `id` (SERIAL / BIGINT) | Driver notifications for confirmed slots or reallocation | Foreign key to `profiles(id)` |
| `audit_logs` | `id` (UUID) | Tamper-evident administrative action log | Records actor, IP, target resource, timestamp |

---

## 3. Exclusion Constraints (Double-Booking Prevention)

To guarantee that concurrent reservation requests can **never** overlap for the same charging dispenser at the database engine level, the `reservations` table enforces a PostgreSQL GiST exclusion constraint:

```sql
ALTER TABLE public.reservations
ADD CONSTRAINT no_overlapping_active_reservations
EXCLUDE USING gist (
    charging_point_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'));
```

### Mathematical Guarantee:
- For any two reservations $R_1$ and $R_2$ on charging point $P$:
  $$\text{Interval}(R_1) \cap \text{Interval}(R_2) = \emptyset \quad \forall R_1 \neq R_2 \text{ where } status \in \{\text{'CONFIRMED'}, \text{'CHECKED\_IN'}, \text{'IN\_PROGRESS'}\}$$
- Any overlapping transaction immediately aborts with standard PostgreSQL error code `23P01` (`exclusion_violation`), completely eliminating application-level race conditions.

---

## 4. Row Level Security (RLS) Policy Matrix

Row Level Security is enabled on **all 10 tables**:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_and_no_show_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

### Security Helper Function:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Policy Summary:
1. **Public Catalog (`charging_stations`, `charging_points`):**
   - Read access: `TRUE` (all authenticated drivers and anonymous visitors can discover stations and real-time availability).
   - Write/Update/Delete access: Restricted to `public.is_admin()`.
2. **User Data Isolation (`profiles`, `vehicles`, `reservations`, `waiting_list_entries`, `notifications`):**
   - Read access: `auth.uid() = user_id OR public.is_admin()`.
   - Insert access: Authenticated users can insert records bound to their own `auth.uid()`.
   - Update/Delete access: `auth.uid() = user_id OR public.is_admin()`.
3. **Audit Log & Infrastructure (`audit_logs`, `cancellation_and_no_show_records`):**
   - Read access: Restricted to `public.is_admin()`.
   - Insert access: Automated system triggers and authenticated actions.

---

## 5. Supabase Realtime WebSocket Subscriptions

The frontend client in `client/src/services/supabase.ts` implements real-time channels listening to database row-level changes:

```typescript
export function subscribeToRealtimeAvailability(
  onUpdate: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  return supabase
    .channel('realtime:ev-availability')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_points' }, (payload) => {
      onUpdate({ table: 'charging_points', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
      onUpdate({ table: 'reservations', eventType: payload.eventType, newRecord: payload.new, oldRecord: payload.old });
    })
    .subscribe();
}
```

### Publication Registration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE charging_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE charging_points;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_list_entries;
```

---

## 6. How to Connect to a Live Supabase Project

To attach your Supabase project in production or development:

1. **Create a project at [supabase.com](https://supabase.com).**
2. In the Supabase SQL Editor, run `supabase/migrations/20261030000001_initial_supabase_schema.sql` followed by `supabase/seed.sql`.
3. Go to **Project Settings -> API** in the Supabase Dashboard.
4. Copy the **Project URL** and **anon public key**.
5. Set the environment variables in `client/.env` and Vercel Environment Variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh...your-anon-key
   ```
6. The frontend automatically detects the credentials via `isSupabaseConfigured()` and activates the live Realtime WebSocket engine!
