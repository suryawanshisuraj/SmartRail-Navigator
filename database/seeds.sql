-- ==============================================================================
-- SmartRail Navigator - Mumbai Central Line Stations Dataset (CSMT to Kalyan)
-- 26 Suburban Stations with Actual Platform Counts and Interchanges
-- ==============================================================================

-- 1. All 26 Mumbai Central Line Stations
INSERT INTO stations (id, name, city, state)
VALUES
(1, 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', 'Mumbai', 'Maharashtra'),
(2, 'Masjid Bunder', 'Mumbai', 'Maharashtra'),
(3, 'Sandhurst Road', 'Mumbai', 'Maharashtra'),
(4, 'Byculla', 'Mumbai', 'Maharashtra'),
(5, 'Chinchpokli', 'Mumbai', 'Maharashtra'),
(6, 'Currey Road', 'Mumbai', 'Maharashtra'),
(7, 'Parel (Prabhadevi Connection)', 'Mumbai', 'Maharashtra'),
(8, 'Dadar Central (Western Line Interchange)', 'Mumbai', 'Maharashtra'),
(9, 'Matunga', 'Mumbai', 'Maharashtra'),
(10, 'Sion', 'Mumbai', 'Maharashtra'),
(11, 'Kurla Junction (Harbour Line Interchange)', 'Mumbai', 'Maharashtra'),
(12, 'Vidyavihar', 'Mumbai', 'Maharashtra'),
(13, 'Ghatkopar (Metro Line 1 Interchange)', 'Mumbai', 'Maharashtra'),
(14, 'Vikhroli', 'Mumbai', 'Maharashtra'),
(15, 'Kanjurmarg', 'Mumbai', 'Maharashtra'),
(16, 'Bhandup', 'Mumbai', 'Maharashtra'),
(17, 'Nahur', 'Mumbai', 'Maharashtra'),
(18, 'Mulund', 'Mumbai', 'Maharashtra'),
(19, 'Thane (Trans-Harbour Interchange)', 'Thane', 'Maharashtra'),
(20, 'Kalva', 'Thane', 'Maharashtra'),
(21, 'Mumbra', 'Thane', 'Maharashtra'),
(22, 'Diva Junction (Vasai-Roha Corridor)', 'Thane', 'Maharashtra'),
(23, 'Kopar', 'Thane', 'Maharashtra'),
(24, 'Dombivli', 'Dombivli', 'Maharashtra'),
(25, 'Thakurli', 'Thane', 'Maharashtra'),
(26, 'Kalyan Junction (Kasara/Karjat Divergence)', 'Kalyan', 'Maharashtra')
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Platforms Seed for CSMT (18 Platforms)
INSERT INTO platforms (id, station_id, platform_number, node_id, status)
VALUES
(1, 1, '1', 'NODE_CSMT_PLT_1', 'ACTIVE'),
(2, 1, '2', 'NODE_CSMT_PLT_2', 'ACTIVE'),
(3, 1, '3', 'NODE_CSMT_PLT_3', 'ACTIVE'),
(4, 1, '4', 'NODE_CSMT_PLT_4', 'ACTIVE'),
(5, 1, '5', 'NODE_CSMT_PLT_5', 'ACTIVE'),
(6, 1, '6', 'NODE_CSMT_PLT_6', 'ACTIVE'),
(7, 1, '7', 'NODE_CSMT_PLT_7', 'ACTIVE'),
(8, 1, '8', 'NODE_CSMT_PLT_8', 'ACTIVE'),
(9, 1, '9', 'NODE_CSMT_PLT_9', 'ACTIVE'),
(10, 1, '10', 'NODE_CSMT_PLT_10', 'ACTIVE'),
(11, 1, '11', 'NODE_CSMT_PLT_11', 'ACTIVE'),
(12, 1, '12', 'NODE_CSMT_PLT_12', 'ACTIVE'),
(13, 1, '13', 'NODE_CSMT_PLT_13', 'ACTIVE'),
(14, 1, '14', 'NODE_CSMT_PLT_14', 'ACTIVE'),
(15, 1, '15', 'NODE_CSMT_PLT_15', 'ACTIVE'),
(16, 1, '16', 'NODE_CSMT_PLT_16', 'ACTIVE'),
(17, 1, '17', 'NODE_CSMT_PLT_17', 'ACTIVE'),
(18, 1, '18', 'NODE_CSMT_PLT_18', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Platforms Seed for Dadar (8 Platforms)
INSERT INTO platforms (id, station_id, platform_number, node_id, status)
VALUES
(19, 8, '1', 'NODE_DADAR_PLT_1', 'ACTIVE'),
(20, 8, '2', 'NODE_DADAR_PLT_2', 'ACTIVE'),
(21, 8, '3', 'NODE_DADAR_PLT_3', 'ACTIVE'),
(22, 8, '4', 'NODE_DADAR_PLT_4', 'ACTIVE'),
(23, 8, '5', 'NODE_DADAR_PLT_5', 'ACTIVE'),
(24, 8, '6', 'NODE_DADAR_PLT_6', 'ACTIVE'),
(25, 8, '7', 'NODE_DADAR_PLT_7', 'ACTIVE'),
(26, 8, '8', 'NODE_DADAR_PLT_8', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Platforms Seed for Thane (10 Platforms)
INSERT INTO platforms (id, station_id, platform_number, node_id, status)
VALUES
(27, 19, '1', 'NODE_THANE_PLT_1', 'ACTIVE'),
(28, 19, '2', 'NODE_THANE_PLT_2', 'ACTIVE'),
(29, 19, '3', 'NODE_THANE_PLT_3', 'ACTIVE'),
(30, 19, '4', 'NODE_THANE_PLT_4', 'ACTIVE'),
(31, 19, '5', 'NODE_THANE_PLT_5', 'ACTIVE'),
(32, 19, '6', 'NODE_THANE_PLT_6', 'ACTIVE'),
(33, 19, '7', 'NODE_THANE_PLT_7', 'ACTIVE'),
(34, 19, '8', 'NODE_THANE_PLT_8', 'ACTIVE'),
(35, 19, '9', 'NODE_THANE_PLT_9', 'ACTIVE'),
(36, 19, '10', 'NODE_THANE_PLT_10', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
