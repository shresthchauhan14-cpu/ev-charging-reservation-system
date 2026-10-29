-- EV Charging Reservation and Real-Time Availability System
-- PostgreSQL 16 Normalized Database Schema
-- Migration 001: Initial Schema Definition

-- Drop tables if resetting (clean order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS cancellation_and_no_show_records CASCADE;
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS waiting_list_entries CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS charging_points CASCADE;
DROP TABLE IF EXISTS charging_stations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_number VARCHAR(50),
    vehicle_name VARCHAR(100) NOT NULL,
    battery_capacity_kwh NUMERIC(6, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Charging Stations Table
CREATE TABLE charging_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Greater Noida',
    state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    operating_status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL' CHECK (operating_status IN ('OPERATIONAL', 'MAINTENANCE', 'DECOMMISSIONED')),
    opening_time TIME NOT NULL DEFAULT '06:00:00',
    closing_time TIME NOT NULL DEFAULT '23:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Charging Points Table
CREATE TABLE charging_points (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    point_code VARCHAR(50) NOT NULL,
    connector_type VARCHAR(20) NOT NULL CHECK (connector_type IN ('CCS2', 'TYPE2', 'GBT')),
    power_kw NUMERIC(6, 2) NOT NULL CHECK (power_kw > 0),
    price_per_kwh NUMERIC(6, 2) NOT NULL DEFAULT 16.50,
    operational_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (operational_status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, point_code)
);

-- 5. Reservations Table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    charging_point_id INTEGER NOT NULL REFERENCES charging_points(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    cancellation_reason TEXT,
    estimated_energy_kwh NUMERIC(6, 2),
    estimated_cost NUMERIC(8, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

-- 6. Waiting List Entries Table
CREATE TABLE waiting_list_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    charging_point_id INTEGER NOT NULL REFERENCES charging_points(id) ON DELETE CASCADE,
    requested_start_time TIMESTAMPTZ NOT NULL,
    requested_end_time TIMESTAMPTZ NOT NULL,
    state_of_charge_percent NUMERIC(5, 2) NOT NULL CHECK (state_of_charge_percent >= 0 AND state_of_charge_percent <= 100),
    waiting_since TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reliability_score NUMERIC(4, 3) NOT NULL DEFAULT 1.000 CHECK (reliability_score >= 0 AND reliability_score <= 1.0),
    priority_score NUMERIC(6, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'ALLOCATED', 'EXPIRED', 'CANCELLED')),
    allocated_reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (requested_end_time > requested_start_time)
);

-- 7. Charging Sessions Table
CREATE TABLE charging_sessions (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    actual_start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actual_end_time TIMESTAMPTZ,
    energy_delivered_kwh NUMERIC(6, 2) DEFAULT 0.00,
    total_cost NUMERIC(8, 2) DEFAULT 0.00,
    session_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (session_status IN ('ACTIVE', 'COMPLETED', 'INTERRUPTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cancellation and No-Show Records Table
CREATE TABLE cancellation_and_no_show_records (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'NO_SHOW_SYSTEM')),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    administrative_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Query Indexes
CREATE INDEX idx_reservations_point_time ON reservations(charging_point_id, start_time, end_time, status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_ref ON reservations(booking_reference);
CREATE INDEX idx_waiting_list_point ON waiting_list_entries(charging_point_id, status);
CREATE INDEX idx_waiting_list_user ON waiting_list_entries(user_id);
CREATE INDEX idx_charging_points_station ON charging_points(station_id);
CREATE INDEX idx_stations_city ON charging_stations(city);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

