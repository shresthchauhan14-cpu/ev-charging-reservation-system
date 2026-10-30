-- ==============================================================================
-- VoltReserve: EV Charging Reservation and Real-Time Availability System
-- Supabase Cloud PostgreSQL Migration & Schema
-- Migration: 20261030000001_initial_supabase_schema.sql
-- Academic Context: IILM University, Greater Noida - B.Tech CSE Major Project
-- ==============================================================================

-- 1. Extensions Required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Profiles Table (Bridged to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'DRIVER' CHECK (role IN ('DRIVER', 'ADMIN', 'SUPER_ADMIN')),
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_number TEXT,
    vehicle_name TEXT NOT NULL,
    battery_capacity_kwh NUMERIC(6, 2) DEFAULT 40.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);

-- 4. Charging Stations Table
CREATE TABLE IF NOT EXISTS public.charging_stations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Greater Noida',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    postal_code TEXT,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    operating_status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (operating_status IN ('OPERATIONAL', 'MAINTENANCE', 'DECOMMISSIONED')),
    opening_time TIME NOT NULL DEFAULT '06:00:00',
    closing_time TIME NOT NULL DEFAULT '23:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stations_city ON public.charging_stations(city);
CREATE INDEX IF NOT EXISTS idx_stations_status ON public.charging_stations(operating_status);

-- 5. Charging Points Table
CREATE TABLE IF NOT EXISTS public.charging_points (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    station_id BIGINT NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
    point_code TEXT NOT NULL,
    connector_type TEXT NOT NULL CHECK (connector_type IN ('CCS2', 'TYPE2', 'GBT')),
    power_kw NUMERIC(6, 2) NOT NULL CHECK (power_kw > 0),
    price_per_kwh NUMERIC(6, 2) NOT NULL DEFAULT 16.50,
    operational_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (operational_status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, point_code)
);

CREATE INDEX IF NOT EXISTS idx_points_station ON public.charging_points(station_id);
CREATE INDEX IF NOT EXISTS idx_points_operational ON public.charging_points(operational_status);

-- 6. Reservations Table (With Strict Database-Enforced Overlap Exclusion Constraint)
CREATE TABLE IF NOT EXISTS public.reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    vehicle_id BIGINT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    charging_point_id BIGINT NOT NULL REFERENCES public.charging_points(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    cancellation_reason TEXT,
    estimated_energy_kwh NUMERIC(6, 2),
    estimated_cost NUMERIC(8, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time),
    -- Concurrency & Double-Booking Protection: PostgreSQL Exclusion Constraint
    CONSTRAINT no_overlapping_reservations 
    EXCLUDE USING gist (
        charging_point_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_point_time ON public.reservations(charging_point_id, start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_ref ON public.reservations(booking_reference);

-- 7. Waiting List Entries Table (Multi-Criteria Priority Formulation: P_i = 0.50*U_i + 0.30*T_i + 0.20*R_i)
CREATE TABLE IF NOT EXISTS public.waiting_list_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    charging_point_id BIGINT NOT NULL REFERENCES public.charging_points(id) ON DELETE CASCADE,
    requested_start_time TIMESTAMPTZ NOT NULL,
    requested_end_time TIMESTAMPTZ NOT NULL,
    state_of_charge_percent NUMERIC(5, 2) NOT NULL CHECK (state_of_charge_percent >= 0 AND state_of_charge_percent <= 100),
    waiting_since TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reliability_score NUMERIC(4, 3) NOT NULL DEFAULT 1.000 CHECK (reliability_score >= 0 AND reliability_score <= 1.0),
    priority_score NUMERIC(6, 4) NOT NULL DEFAULT 0.0000,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'ALLOCATED', 'EXPIRED', 'CANCELLED')),
    allocated_reservation_id BIGINT REFERENCES public.reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (requested_end_time > requested_start_time)
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_point ON public.waiting_list_entries(charging_point_id, status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_user ON public.waiting_list_entries(user_id);

-- 8. Charging Sessions Table
CREATE TABLE IF NOT EXISTS public.charging_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    actual_start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actual_end_time TIMESTAMPTZ,
    energy_delivered_kwh NUMERIC(6, 2) DEFAULT 0.00,
    total_cost NUMERIC(8, 2) DEFAULT 0.00,
    session_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (session_status IN ('ACTIVE', 'COMPLETED', 'INTERRUPTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cancellation and No-Show Records Table
CREATE TABLE IF NOT EXISTS public.cancellation_and_no_show_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'NO_SHOW_SYSTEM')),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    administrative_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 12. Helper Functions & Triggers
-- ==============================================================================

-- Admin Role Verification Function (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to Automatically Create Profile on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'DRIVER' -- All public registrations default to DRIVER role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to Maintain Updated_at Timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_reservations_timestamp BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_stations_timestamp BEFORE UPDATE ON public.charging_stations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_points_timestamp BEFORE UPDATE ON public.charging_points FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 13. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS across all tables
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

-- Profiles Policies
CREATE POLICY "Public profiles can be read by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile basic information"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Vehicles Policies
CREATE POLICY "Users can view and manage their own vehicles"
    ON public.vehicles FOR ALL
    USING (auth.uid() = user_id OR public.is_admin());

-- Charging Stations Policies (Public Read, Admin Write)
CREATE POLICY "Charging stations are publicly viewable"
    ON public.charging_stations FOR SELECT
    USING (true);

CREATE POLICY "Charging stations can be modified by admins only"
    ON public.charging_stations FOR ALL
    USING (public.is_admin());

-- Charging Points Policies (Public Read, Admin Write)
CREATE POLICY "Charging points are publicly viewable"
    ON public.charging_points FOR SELECT
    USING (true);

CREATE POLICY "Charging points can be modified by admins only"
    ON public.charging_points FOR ALL
    USING (public.is_admin());

-- Reservations Policies (Owner Access, Admin Oversight)
CREATE POLICY "Users can view their own reservations"
    ON public.reservations FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can cancel or modify their own active reservations"
    ON public.reservations FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

-- Waiting List Policies
CREATE POLICY "Users can view their own waiting list entries"
    ON public.waiting_list_entries FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can join waiting lists"
    ON public.waiting_list_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can cancel their own waiting list entries"
    ON public.waiting_list_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

-- ==============================================================================
-- 14. Realtime Publications
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.charging_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.charging_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_list_entries;
