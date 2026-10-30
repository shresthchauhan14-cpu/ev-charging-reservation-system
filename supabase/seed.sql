-- ==============================================================================
-- VoltReserve: Supabase Initial Seed Data
-- Seed: supabase/seed.sql
-- Stations, Chargers, and Pilot Infrastructure in Greater Noida
-- ==============================================================================

-- 1. Charging Stations
INSERT INTO public.charging_stations (id, name, description, address, city, state, postal_code, latitude, longitude, operating_status, opening_time, closing_time)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Greater Noida EV Hub (Knowledge Park III)', 'High-speed flagship EV charging hub located near academic institutions with lounge and cafeteria.', 'Plot No. 16, Knowledge Park III, Greater Noida', 'Greater Noida', 'Uttar Pradesh', '201310', 28.4612000, 77.4988000, 'OPERATIONAL', '06:00:00', '23:00:00'),
    (2, 'Pari Chowk Fast-Charge Metro Station', '24/7 high-traffic rapid charging terminal integrated with Pari Chowk multimodal transit hub.', 'Metro Station Concourse, Pari Chowk, Greater Noida', 'Greater Noida', 'Uttar Pradesh', '201308', 28.4652000, 77.5108000, 'OPERATIONAL', '00:00:00', '23:59:59'),
    (3, 'Sector Alpha-1 Commercial EcoHub', 'Convenient commercial center charging station equipped with multi-standard AC and DC chargers.', 'Commercial Complex, Sector Alpha-1, Greater Noida', 'Greater Noida', 'Uttar Pradesh', '201308', 28.4821000, 77.5142000, 'OPERATIONAL', '07:00:00', '22:00:00'),
    (4, 'Expwy Plaza Supercharger (Yamuna Expressway)', 'Ultra-fast highway corridor station featuring high-power liquid-cooled CCS2 charging dispensers.', 'Expressway Interchange, Sector 150 / Expressway Plaza, Greater Noida', 'Greater Noida', 'Uttar Pradesh', '201310', 28.4419000, 77.4812000, 'OPERATIONAL', '00:00:00', '23:59:59')
ON CONFLICT (id) DO NOTHING;

-- 2. Charging Points
INSERT INTO public.charging_points (id, station_id, point_code, connector_type, power_kw, price_per_kwh, operational_status)
OVERRIDING SYSTEM VALUE
VALUES
    -- Knowledge Park III
    (1, 1, 'KP3-DC-01', 'CCS2', 60.00, 16.50, 'AVAILABLE'),
    (2, 1, 'KP3-DC-02', 'CCS2', 60.00, 16.50, 'AVAILABLE'),
    (3, 1, 'KP3-AC-03', 'TYPE2', 22.00, 13.00, 'AVAILABLE'),
    (4, 1, 'KP3-GB-04', 'GBT', 30.00, 14.50, 'AVAILABLE'),

    -- Pari Chowk Metro Terminal
    (5, 2, 'PC-DC-01', 'CCS2', 120.00, 18.00, 'AVAILABLE'),
    (6, 2, 'PC-DC-02', 'CCS2', 120.00, 18.00, 'AVAILABLE'),
    (7, 2, 'PC-DC-03', 'CCS2', 60.00, 16.50, 'AVAILABLE'),
    (8, 2, 'PC-AC-04', 'TYPE2', 22.00, 13.00, 'AVAILABLE'),

    -- Sector Alpha-1 EcoHub
    (9, 3, 'A1-DC-01', 'CCS2', 60.00, 15.50, 'AVAILABLE'),
    (10, 3, 'A1-AC-02', 'TYPE2', 22.00, 12.50, 'AVAILABLE'),
    (11, 3, 'A1-GB-03', 'GBT', 30.00, 14.00, 'AVAILABLE'),

    -- Yamuna Expressway Supercharger
    (12, 4, 'EXP-UF-01', 'CCS2', 150.00, 19.50, 'AVAILABLE'),
    (13, 4, 'EXP-UF-02', 'CCS2', 150.00, 19.50, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;
