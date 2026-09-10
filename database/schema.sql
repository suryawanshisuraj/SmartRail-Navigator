-- ==============================================================================
-- SmartRail Navigator Database Schema (PostgreSQL)
-- 12-Table Schema for Indoor Railway Station Navigation
-- ==============================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'KIOSK')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Stations
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Floors
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_floors_station ON floors(station_id);

-- 4. Navigation Nodes (Waypoints inside station)
CREATE TABLE IF NOT EXISTS navigation_nodes (
    id VARCHAR(50) PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'ENTRANCE', 'PLATFORM', 'RESTROOM', 'FOOD_COURT', 'LIFT', 'STAIRS', 'ESCALATOR', 'TICKET_COUNTER', 'EMERGENCY_EXIT', 'CORRIDOR'
    x INT NOT NULL,
    y INT NOT NULL,
    accessible BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_nodes_floor ON navigation_nodes(floor_id);

-- 5. Navigation Edges (Walkways connecting nodes)
CREATE TABLE IF NOT EXISTS navigation_edges (
    id SERIAL PRIMARY KEY,
    from_node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    to_node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    distance INT NOT NULL, -- distance in meters
    estimated_time INT NOT NULL, -- time in seconds
    accessible BOOLEAN DEFAULT TRUE,
    blocked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_edges_from ON navigation_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to ON navigation_edges(to_node_id);

-- 6. Facilities
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'RESTROOM', 'FOOD_COURT', 'WAITING_ROOM', 'CLOAK_ROOM', 'MEDICAL', 'POLICE'
    node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    description TEXT,
    accessible BOOLEAN DEFAULT TRUE
);

-- 7. QR Locations (Physical QR codes placed across station)
CREATE TABLE IF NOT EXISTS qr_locations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'QR_MAIN_ENTRANCE', 'QR_PLATFORM_1'
    node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL
);

-- 8. Platforms
CREATE TABLE IF NOT EXISTS platforms (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    platform_number VARCHAR(10) NOT NULL,
    node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- 9. Station Updates
CREATE TABLE IF NOT EXISTS station_updates (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'PLATFORM_CHANGE', 'LIFT_MAINTENANCE', 'PATH_BLOCKED', 'ANNOUNCEMENT'
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Crowd Status
CREATE TABLE IF NOT EXISTS crowd_status (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL,
    level VARCHAR(20) DEFAULT 'LOW' CHECK (level IN ('LOW', 'MODERATE', 'HIGH')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Emergency Locations
CREATE TABLE IF NOT EXISTS emergency_locations (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'FIRE_EXIT', 'MEDICAL_ROOM', 'POLICE_HELP_DESK'
    node_id VARCHAR(50) NOT NULL REFERENCES navigation_nodes(id) ON DELETE CASCADE
);

-- 12. Route History
CREATE TABLE IF NOT EXISTS route_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    start_node VARCHAR(50) NOT NULL,
    destination_node VARCHAR(50) NOT NULL,
    route_type VARCHAR(20) NOT NULL,
    distance INT NOT NULL,
    estimated_time INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
